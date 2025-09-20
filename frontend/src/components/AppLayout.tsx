import { motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Brain, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

const languages = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'हिंदी' },
  { value: 'tamil', label: 'தமிழ்' },
  { value: 'spanish', label: 'Español' },
  { value: 'french', label: 'Français' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6"
          >
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <SidebarTrigger />
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-foreground truncate max-w-[10rem] sm:max-w-none">AI DocAnalyzer</h1>
                  <p className="hidden sm:block text-xs text-muted-foreground">Intelligent Document Analysis</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden xs:block">
                <Select defaultValue="english">
                  <SelectTrigger className="w-28 sm:w-40">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ThemeToggle />
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}