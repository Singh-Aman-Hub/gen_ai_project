import { FileText, History } from "lucide-react";
import { Badge } from "./ui/badge";

interface RecentActivityProps {
  recentDocuments: Array<{
    name: string;
    date: string;
    riskLevel: 'high' | 'medium' | 'low';
  }>;
}

export function RecentActivity({ recentDocuments }: RecentActivityProps) {
  if (!recentDocuments || recentDocuments.length === 0) {
    return (
      <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <History className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-semibold">No recent activity</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            When you analyze documents, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentDocuments.map((doc, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="flex items-center space-x-4">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{doc.name}</p>
              <p className="text-sm text-muted-foreground">{doc.date}</p>
            </div>
          </div>
          <Badge
            variant={
              doc.riskLevel === 'high'
                ? 'destructive'
                : doc.riskLevel === 'medium'
                ? 'secondary'
                : 'default'
            }
          >
            {doc.riskLevel} risk
          </Badge>
        </div>
      ))}
    </div>
  );
}
