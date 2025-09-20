import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Upload, FileText, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadPageProps {
  onFileUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

const UploadPage = ({ onFileUpload, isUploading = false }: UploadPageProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    try {
      await onFileUpload(file);
      toast({
        title: "Upload successful",
        description: "Your document is being analyzed...",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 sm:p-10 lg:p-12 text-center transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-75"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Processing your document...</h3>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        ) : (
          <>
            <Upload className={cn(
              "mx-auto h-12 w-12 mb-4",
              dragActive ? "text-primary" : "text-muted-foreground"
            )} />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {dragActive ? "Drop your file here" : "Upload Document"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Drag & drop your PDF or Word document, or click to browse
            </p>
            
            <div className="space-y-4">
              <Button 
                variant="default" 
                size="default" 
                disabled={isUploading}
                onClick={() => document.getElementById("file-input")?.click()}
                className="bg-gradient-primary hover:opacity-90"
              >
                <FileText className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default UploadPage;
