import DOMPurify from 'dompurify';

interface ContentDisplayProps {
  title: string;
  content: string;
  attribution: string;
  sources?: Array<{ url: string; title: string }>;
}

export const ContentDisplay = ({ title, content, attribution, sources }: ContentDisplayProps) => {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return (
    <article className="animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8 text-foreground">{title}</h1>
          
          <div 
            className="content-prose text-foreground/90"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          
          {sources && sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Sources
              </h3>
              <ul className="space-y-2">
                {sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline transition-smooth"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <footer className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">{attribution}</p>
          </footer>
        </div>
      </div>
    </article>
  );
};
