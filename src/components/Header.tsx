import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import jkLogo from "@/assets/jk-logo.png";

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header = ({ theme, onToggleTheme }: HeaderProps) => {
  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={jkLogo} 
            alt="JK Logo" 
            className="h-12 w-12 object-contain"
            style={{ filter: theme === 'dark' ? 'invert(1) brightness(1.2)' : 'none' }}
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground font-orbitron tracking-wider">JK-Pedia</h1>
            <p className="text-sm text-muted-foreground mt-1">Wikipedia, Verified</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="transition-smooth hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};
