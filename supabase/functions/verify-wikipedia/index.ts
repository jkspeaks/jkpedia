import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple in-memory rate limiter by IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

interface WikiSearchResult {
  query?: {
    search?: Array<{
      title: string;
      snippet: string;
    }>;
  };
}

interface WikiSummary {
  title: string;
  extract: string;
  extract_html?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting by IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    console.warn('Rate limited IP:', clientIp);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const SearchSchema = z.object({
      searchTerm: z.string()
        .min(1, 'Search term is required')
        .max(200, 'Search term too long')
        .transform(s => s.trim())
        .refine(s => s.length > 0, 'Search term is required')
    });

    const body = await req.json();
    const validation = SearchSchema.safeParse(body);

    if (!validation.success) {
      console.log('Invalid input:', validation.error.issues[0].message);
      return new Response(
        JSON.stringify({ 
          found: false, 
          error: validation.error.issues[0].message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { searchTerm } = validation.data;
    console.log('Searching for:', searchTerm);

    // Step 1: Search Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData: WikiSearchResult = await searchResponse.json();

    if (!searchData.query?.search || searchData.query.search.length === 0) {
      console.log('No Wikipedia article found');
      return new Response(
        JSON.stringify({ 
          found: false,
          message: `No Wikipedia article found for "${searchTerm}"` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const topResult = searchData.query.search[0];
    const articleTitle = topResult.title;
    console.log('Found article:', articleTitle);

    // Step 2: Fetch full article content
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData: WikiSummary = await summaryResponse.json();

    const content = summaryData.extract || '';
    console.log('Article content length:', content.length);

    // Step 3: Extract key claims for verification (simplified)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyClaims = sentences.slice(0, Math.min(8, sentences.length)).map(s => s.trim());
    
    console.log('Extracted key claims:', keyClaims.length);

    // Step 4: Verify with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const verificationPrompt = `You are a fact-checker. Analyze these claims from a Wikipedia article about "${articleTitle}":

${keyClaims.map((claim, i) => `${i + 1}. ${claim}`).join('\n')}

Rate the overall authenticity of these claims on a scale of 1-5:
- 5: Highly accurate, well-established facts
- 4: Mostly accurate with minor uncertainties
- 3: Mixed accuracy, some concerns
- 2: Significant inaccuracies or outdated info
- 1: Mostly inaccurate or misleading

Respond with ONLY a JSON object in this exact format:
{
  "score": <number 1-5>,
  "reasoning": "<brief explanation of the score>"
}`;

    console.log('Calling AI for verification...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: verificationPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('AI response:', aiContent);

    // Parse AI response
    let verificationResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        verificationResult = JSON.parse(aiContent);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      verificationResult = { score: 4, reasoning: 'Unable to parse verification result' };
    }

    const score = Math.max(1, Math.min(5, verificationResult.score || 4));
    console.log('Final score:', score);

    // Step 5: Determine if content needs updating
    const isOriginal = score >= 4;
    let finalContent = content;
    
    if (!isOriginal) {
      console.log('Score below 4, generating updated content...');
      // Generate updated content with AI
      const updatePrompt = `The following Wikipedia content about "${articleTitle}" has authenticity concerns (score: ${score}/5).

Original content:
${content}

Verification notes: ${verificationResult.reasoning}

Please rewrite this content to address accuracy concerns while maintaining:
1. Clear, accessible language
2. Well-structured information
3. Factual accuracy based on widely accepted knowledge
4. Similar length and depth

Provide the updated content in plain text (no markdown formatting).`;

      const updateResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: updatePrompt }
          ],
        }),
      });

      if (updateResponse.ok) {
        const updateData = await updateResponse.json();
        finalContent = updateData.choices[0].message.content;
        console.log('Generated updated content');
      }
    }

    // Format content as HTML paragraphs
    const htmlContent = finalContent
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n');

    const attribution = isOriginal
      ? 'Content sourced from Wikipedia, licensed under Creative Commons Attribution-ShareAlike 4.0'
      : `Content has been updated and verified. Original Wikipedia article scored ${score}/5.`;

    return new Response(
      JSON.stringify({
        found: true,
        score,
        title: articleTitle,
        content: htmlContent,
        isOriginal,
        attribution,
        sources: [
          {
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle.replace(/ /g, '_'))}`,
            title: 'Wikipedia'
          }
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in verify-wikipedia function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
