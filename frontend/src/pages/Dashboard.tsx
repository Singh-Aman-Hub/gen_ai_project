import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import UploadPage from "@/components/UploadPage";
import SummaryView from "@/components/SummaryView";
import Chatbot from "@/components/Chatbot";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  FileText, Settings, History, PieChart, 
  File, FilePlus, FileCheck, AlertTriangle,
  Download, Share2, Trash2, MoreVertical,
  BarChart3, FileBarChart
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import type { DocumentData } from "@/types/documents";
// ...existing code...

export default function Dashboard() {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const scrollToUpload = useCallback(() => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    riskBreakdown: {
      high: 0,
      medium: 0,
      low: 0
    },
    recentDocuments: []
  });

  // Get user_id from localStorage
  const userStr = localStorage.getItem("user");
  let userId: string | null = null;
  if (userStr) {
    try {
      userId = JSON.parse(userStr).id;
    } catch {
      userId = null;
    }
  }

  useEffect(() => {
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      const apiService = (await import("@/services/service")).default;
      try {
        const res = await apiService.getUserDocuments(userId);
        const docs = res.data.documents || [];
        // Deduplicate by doc_name
        const uniqueDocs = Array.from(new Map(docs.map((doc: any) => [doc.doc_name, doc])).values());
        setDocuments(uniqueDocs);
        // Count risk types
        let medium = 0, safe = 0, risky = 0;
        uniqueDocs.forEach((doc: any) => {
          const risks = doc.summary?.risks || [];
          let hasHigh = false, hasMedium = false;
          risks.forEach((risk: any) => {
            if (risk.type === "high") hasHigh = true;
            else if (risk.type === "medium") hasMedium = true;
          });
          if (hasHigh) risky++;
          else if (hasMedium) medium++;
          else safe++;
        });
        setStats({
          totalDocuments: uniqueDocs.length,
          riskBreakdown: { high: risky, medium: medium, low: safe },
          recentDocuments: uniqueDocs.map((doc: any) => ({
            name: doc.doc_name,
            date: doc.upload_date,
            riskLevel: (() => {
              const risks = doc.summary?.risks || [];
              if (risks.some((r: any) => r.type === "high")) return "high";
              if (risks.some((r: any) => r.type === "medium")) return "medium";
              return "low";
            })()
          }))
        });
      } catch (err) {
        // Optionally show error toast
      }
    })();
  }, [userId]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const apiService = (await import("@/services/service")).default;
      const formData = new FormData();
      formData.append("file", file);
    formData.append("user_id", userId);
      const res = await apiService.uploadDocument(formData, true); // true = raw FormData
      if (res?.data?.summary) {
        // Transform risks to match backend requirements
        let summary = { ...res.data.summary };
        if (Array.isArray(summary.risks)) {
          summary.risks = summary.risks.map(riskObj => ({
            title: riskObj.title || riskObj.risk || "",
            why_it_matters: riskObj.why_it_matters || riskObj.explanation || ""
          }));
        }
        setDocumentData({
          fileName: res.data.meta.filename,
          ...summary
        });
        toast({
          title: "Upload successful",
          description: "Your document has been analyzed!",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "No summary returned.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleChatMessage = async (message: string): Promise<string> => {
    setIsChatLoading(true);
    try {
      const apiService = (await import("@/services/service")).default;
      // Always use user.id from localStorage for chat
      let chatUserId = null;
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          chatUserId = JSON.parse(userStr).id;
        } catch {
          chatUserId = null;
        }
      }
      if (!chatUserId) {
        throw new Error("No user ID found. Please login.");
      }
      const res = await apiService.chatWithUser(chatUserId, message);
      return res.data.response || "No response from AI.";
    } catch (error) {
      console.error('Chat error:', error);
      return "Sorry, there was an error processing your request.";
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
     
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen py-8 space-y-12"
      >
        <PageContainer>
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Document Analysis</h1>
            <p className="text-lg text-muted-foreground">
              AI-powered legal document analysis and risk assessment
            </p>
          </div>
        
            
             <Button size="lg" className="gap-2 mr-3" onClick={() => {
  setDocumentData(null);
  scrollToUpload();
}}>
  <FilePlus className="h-5 w-5" />
  New Analysis
</Button>
          <Button size="lg" className="gap-2 mr-3" onClick={() => window.location.href = '/summary'}>
            <FilePlus className="h-5 w-5" />
            Go to Summary
          </Button>

         
         
         
            
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Document Analytics</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-bold flex flex-wrap gap-4 items-center">
                <span className="text-yellow-600">Medium: {stats.riskBreakdown.medium}</span>
                <span className="text-green-600">Safe: {stats.riskBreakdown.low}</span>
                <span className="text-red-600">Risky: {stats.riskBreakdown.high}</span>
                <span className="text-muted-foreground">Total: {stats.totalDocuments}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {stats.recentDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                ) : (
                  stats.recentDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{doc.name}</span>
                      <span className="text-muted-foreground">{doc.date}</span>
                      <span className={
                        doc.riskLevel === "high" ? "text-red-600" :
                        doc.riskLevel === "medium" ? "text-yellow-600" : "text-green-600"
                      }>{doc.riskLevel.charAt(0).toUpperCase() + doc.riskLevel.slice(1)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={documentData ? 'analysis' : 'upload'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {!documentData ? (
              <Card ref={uploadSectionRef}>
                <CardContent className="pt-6">
                  <UploadPage 
                    onFileUpload={handleFileUpload} 
                    isUploading={isUploading} 
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Document Summary</CardTitle>
                  <CardDescription>{documentData.fileName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Summary</h3>
                    <ul className="list-disc ml-6">
                      {documentData.summary?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    <h3 className="font-semibold mt-4">Key Terms</h3>
                    <ul className="list-disc ml-6">
                      {(documentData.key_terms)?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                   {/* <h3 className="font-semibold mt-4">Obligations</h3>
                    <ul className="list-disc ml-6">
                      {documentData.obligations?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                   
                    <h3 className="font-semibold mt-4">Costs and Payments</h3>
                    <ul className="list-disc ml-6">
                      {documentData.costs_and_payments?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                    <h3 className="font-semibold mt-4">Risks</h3>
                    <ul className="list-disc ml-6">
                      {documentData.risks?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                    <h3 className="font-semibold mt-4">Key Terms</h3>
                    <ul className="list-disc ml-6">
                      {documentData.red_flags?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                    <h3 className="font-semibold mt-4">Key Terms</h3>
                    <ul className="list-disc ml-6">
                      {documentData.questions_to_ask?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                    <h3 className="font-semibold mt-4">Key Terms</h3>
                    <ul className="list-disc ml-6">
                      {documentData.negotiation_suggestions?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                    <ul className="decision_assist">
                      {documentData.decision_assist?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul> */}
                    {/* Add more sections as needed, e.g. obligations, risks, etc. */}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
        </PageContainer>
      </motion.main>
    </div>
  );
}
