import { Link } from 'react-router-dom';
import { FileText, Github, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="w-full border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">PatentScope</h1>
            <p className="text-xs text-muted-foreground">Patent Research Tool</p>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            Projects
          </Link>
          <span className="text-sm text-muted-foreground">
            Powered by USPTO PatentsView API
          </span>
        </nav>

        <div className="sm:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
