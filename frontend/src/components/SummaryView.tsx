import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiService from "@/services/service";
import { FileText, Info, ListChecks, AlertTriangle, BadgeCheck, ScrollText } from "lucide-react";

const SummaryView = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userStr = localStorage.getItem("user");
  let userId = null;
  if (userStr) {
    try {
      userId = JSON.parse(userStr).id;
    } catch {
      userId = null;
    }
  }

  useEffect(() => {
    if (!userId) {
      setError("No user found. Please login.");
      setLoading(false);
      return;
    }
    setLoading(true);
    apiService.getUserDocuments(userId)
      .then(res => {
        setDocuments(res.data.documents || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch documents");
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <div className="p-8 text-center">Loading documents...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!documents.length) {
    return <div className="p-8 text-center">No documents found.</div>;
  }

  // Remove duplicate documents by doc_name
  const uniqueDocuments = Array.from(
    new Map(documents.map(doc => [doc.doc_name, doc])).values()
  );

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {uniqueDocuments.map(doc => (
          <Card
            key={doc.doc_id}
            className={`cursor-pointer border shadow-lg transition-transform duration-150 hover:scale-105 hover:border-primary/70 ${selectedDoc?.doc_id === doc.doc_id ? "border-primary ring-2 ring-primary/30" : "border-muted"}`}
            onClick={() => setSelectedDoc(doc)}
          >
            <CardHeader className="flex flex-col items-center justify-center py-6">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="truncate text-lg font-semibold text-center">{doc.doc_name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {selectedDoc && (
        <Card className="mb-8 shadow-xl border border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Info className="h-6 w-6 text-primary" />
              Summary for {selectedDoc.doc_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <ScrollText className="h-5 w-5 text-muted-foreground" />
                <span>Summary:</span>
              </div>
              <div className="bg-muted/40 rounded p-3 text-sm">{selectedDoc.summary?.summary?.[0]}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <span>Key Terms:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDoc.summary?.key_terms?.map((term, i) => (
                  <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">{term}</span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                <span>Obligations:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-sm mb-1">Landlord</div>
                  <ul className="list-disc ml-6 text-sm">
                    {selectedDoc.summary?.obligations?.landlord?.map((o, i) => <li key={"l"+i}>{o}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Tenant</div>
                  <ul className="list-disc ml-6 text-sm">
                    {selectedDoc.summary?.obligations?.tenant?.map((o, i) => <li key={"t"+i}>{o}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>Risks:</span>
              </div>
              <ul className="list-disc ml-6 text-sm">
                {selectedDoc.summary?.risks?.map((r, i) => <li key={i} className="text-yellow-900">{r.title}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Red Flags:</span>
              </div>
              <ul className="list-disc ml-6 text-sm">
                {selectedDoc.summary?.red_flags?.map((rf, i) => <li key={i} className="text-red-900">{rf}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                <span>Costs & Payments:</span>
              </div>
              <ul className="list-disc ml-6 text-sm">
                {selectedDoc.summary?.costs_and_payments?.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                <span>Negotiation Suggestions:</span>
              </div>
              <ul className="list-disc ml-6 text-sm">
                {selectedDoc.summary?.negotiation_suggestions?.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <Info className="h-5 w-5 text-primary" />
                <span>Decision Assist:</span>
              </div>
              <div className="bg-primary/10 rounded p-3 text-sm font-semibold text-primary">
                {selectedDoc.summary?.decision_assist?.overall_take}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SummaryView;