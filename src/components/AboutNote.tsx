import { Card } from "@/components/ui/card";

export const AboutNote = () => {
  return (
    <Card className="max-w-4xl mx-auto px-6 py-8 mt-6 bg-card/50 border-border">
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 className="text-lg font-semibold text-foreground mb-4">About This Site</h3>
        
        <p>
          This site was created purely for educational purposes to demonstrate the capabilities of vibe-coding, 
          developed using Lovable.
        </p>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">How It Works:</h4>
          <p>
            When you enter a search term, the system checks whether a valid Wikipedia entry exists. If found, 
            it retrieves the data and extracts 2-3 key claims from the page. Each claim is then cross-referenced 
            against two or more credible sources for verification. Based on this analysis, claims are classified 
            as verified, partially verified, or unverified/contradicted, and assigned an authenticity score (1-5). 
            This score appears in the top right of the search results.
          </p>
          <p>
            If the authenticity score is 4 or higher, a three-line summary of the Wikipedia page is displayed, 
            along with a link to the original article.
          </p>
        </div>
        
        <div className="space-y-2 pt-2">
          <h4 className="font-semibold text-foreground">Important Note:</h4>
          <p>
            This is a simplified demonstration of vibe-coding's potential and is not intended to serve as a 
            comprehensive fact-checking tool. That said, the underlying code could be expanded to perform more 
            exhaustive verification and even generate additional content similar to Wikipedia for topics where 
            equivalent pages don't yet exist.
          </p>
        </div>
      </div>
    </Card>
  );
};
