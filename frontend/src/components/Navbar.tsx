import { FileText, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gradient-primary text-primary-foreground shadow-elevated">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI DocAnalyzer</h1>
              <p className="text-sm text-primary-foreground/80">Intelligent Document Analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Professional Analysis</span>
            <Link to="/policies">
              <button className="ml-4 px-3 py-1 rounded bg-primary/80 text-white text-xs font-semibold hover:bg-primary transition">Policies</button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;