export type RiskLevel = 'high' | 'medium' | 'low';

export interface RiskClause {
  text: string;
  type: RiskLevel;
  explanation: string;
  position: number;
}

export interface DocumentData {
  summary: string;
  riskClauses: RiskClause[];
  fileName: string;
}


