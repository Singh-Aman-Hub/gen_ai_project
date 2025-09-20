import { Link } from 'react-router-dom';
import { Brain, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import PageContainer from '@/components/layout/PageContainer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function PublicNavbar() {
  return (
    <nav
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <PageContainer>
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg" aria-hidden>
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">AI DocAnalyzer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <ThemeToggle />
              <Link to="/login" aria-label="Login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup" aria-label="Get Started">
                <Button>Get Started</Button>
              </Link>
            </div>
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
                    <Link to="/login" aria-label="Login" className="block">
                      <Button variant="ghost" className="w-full justify-start">Login</Button>
                    </Link>
                    <Link to="/signup" aria-label="Get Started" className="block">
                      <Button className="w-full justify-start">Get Started</Button>
                    </Link>
                    <div className="pt-2">
                      <ThemeToggle />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </PageContainer>
    </nav>
  );
}


