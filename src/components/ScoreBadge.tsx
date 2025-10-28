import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface ScoreBadgeProps {
  score: number;
}

export const ScoreBadge = ({ score }: ScoreBadgeProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'hsl(var(--success))';
    if (score === 3) return 'hsl(var(--warning))';
    return 'hsl(var(--error))';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <CheckCircle className="h-8 w-8" />;
    if (score === 3) return <AlertTriangle className="h-8 w-8" />;
    return <AlertCircle className="h-8 w-8" />;
  };

  const getScoreLabel = (score: number) => {
    if (score === 5) return 'Excellent';
    if (score === 4) return 'Good';
    if (score === 3) return 'Fair';
    if (score === 2) return 'Poor';
    return 'Unreliable';
  };

  return (
    <div className="flex justify-end mb-6 animate-fade-in">
      <div 
        className="flex items-center gap-3 px-6 py-4 rounded-full border-2 transition-smooth hover:scale-105"
        style={{ 
          borderColor: getScoreColor(score),
          backgroundColor: `${getScoreColor(score)}15`
        }}
      >
        <div style={{ color: getScoreColor(score) }}>
          {getScoreIcon(score)}
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: getScoreColor(score) }}>
            {score}/5
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {getScoreLabel(score)}
          </div>
        </div>
      </div>
    </div>
  );
};
