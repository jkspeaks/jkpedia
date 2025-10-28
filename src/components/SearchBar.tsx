import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  centered?: boolean;
}

export const SearchBar = ({ value, onChange, onSearch, isLoading, centered = false }: SearchBarProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  const containerClass = centered
    ? "flex flex-col items-center justify-center min-h-[60vh] px-6"
    : "w-full py-6 px-6 sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10";

  return (
    <div className={containerClass}>
      <div className={`w-full ${centered ? 'max-w-2xl' : 'max-w-4xl mx-auto'}`}>
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Search for any topic..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="text-lg py-6 px-6 transition-smooth"
          />
          <Button
            onClick={onSearch}
            disabled={isLoading || !value.trim()}
            size="lg"
            className="px-8 transition-smooth"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
