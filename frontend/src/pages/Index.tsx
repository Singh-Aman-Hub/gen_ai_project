import { useState } from "react";
import Navbar from "@/components/Navbar";
import UploadPage from "@/components/UploadPage";
import SummaryView from "@/components/SummaryView";
import Chatbot from "@/components/Chatbot";
import { toast } from "@/hooks/use-toast";
import PageContainer from "@/components/layout/PageContainer";
import type { DocumentData } from "@/types/documents";

// Uses shared DocumentData type

const Index = () => {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleFileUpload = async (file: File, language: string) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      // Mock API call - replace with actual backend endpoint
      const response = await new Promise<DocumentData>((resolve) => {
        setTimeout(() => {
          resolve({
            summary: `This is a comprehensive analysis of ${file.name}. The document contains several important clauses and provisions that require careful consideration. Key findings include contractual obligations, liability limitations, and termination conditions. The analysis has identified potential risks in areas such as data privacy, intellectual property rights, and financial obligations. Notable sections include force majeure clauses, governing law provisions, and dispute resolution mechanisms. Overall assessment indicates moderate risk level with specific areas requiring attention and potential negotiation.`,
            riskClauses: [
              {
                text: "unlimited liability for data breaches",
                type: 'high',
                explanation: "This clause exposes the organization to potentially unlimited financial liability in case of data security incidents, which could result in significant financial losses.",
                position: 1
              },
              {
                text: "automatic renewal without notice period",
                type: 'medium',
                explanation: "The contract automatically renews without adequate notice period, potentially binding the organization to unwanted terms and limiting flexibility.",
                position: 2
              },
              {
                text: "intellectual property ownership clearly defined",
                type: 'low',
                explanation: "This clause provides clear definition of intellectual property ownership, which is beneficial for protecting organizational assets and avoiding disputes.",
                position: 3
              },
              {
                text: "30-day termination clause without cause",
                type: 'medium',
                explanation: "While providing flexibility, the short termination period may not allow sufficient time for transition planning and could impact business continuity.",
                position: 4
              },
              {
                text: "compliance with industry standards required",
                type: 'low',
                explanation: "This requirement ensures adherence to best practices and regulatory compliance, which is generally favorable for risk management.",
                position: 5
              }
            ],
            fileName: file.name
          });
        }, 2000);
      });

      setDocumentData(response);
      toast({
        title: "Analysis Complete",
        description: "Your document has been successfully analyzed!",
      });

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleChatMessage = async (message: string): Promise<string> => {
    setIsChatLoading(true);
    
    try {
      // Mock AI response - replace with actual backend endpoint
      const response = await new Promise<string>((resolve) => {
        setTimeout(() => {
          const responses = [
            `Based on your document analysis, I can help clarify that point. The "${message}" relates to the risk assessment we performed. Would you like me to explain the specific implications?`,
            `That's a great question about your document. The clause you're asking about has been flagged in our analysis. Here's what you should know: this provision could impact your organization's liability exposure.`,
            `I can provide more context on that section. According to our analysis, this clause falls under medium risk category. The key concern is the potential for automatic obligations without proper review periods.`,
            `Your question touches on an important aspect of the contract. This particular provision was identified as requiring attention due to its implications for data governance and compliance requirements.`
          ];
          resolve(responses[Math.floor(Math.random() * responses.length)]);
        }, 1500);
      });

      return response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="py-8">
        <PageContainer>
        {!documentData ? (
          <UploadPage 
            onFileUpload={handleFileUpload} 
            isUploading={isUploading} 
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <SummaryView
                summary={documentData.summary}
                riskClauses={documentData.riskClauses}
                fileName={documentData.fileName}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Chatbot
                  onSendMessage={handleChatMessage}
                  isLoading={isChatLoading}
                />
              </div>
            </div>
          </div>
        )}
        </PageContainer>
      </main>
      
      <footer className="bg-muted mt-20">
        <PageContainer>
          <div className="py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              © 2024 AI DocAnalyzer. Powered by advanced AI technology for intelligent document analysis.
            </p>
          </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
};

export default Index;
