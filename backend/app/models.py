# backend/app/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class RiskItem(BaseModel):
    title: str
    why_it_matters: str
    where_found: Optional[str] = None
    mitigations: List[str] = []

class DecisionAssist(BaseModel):
    pros: List[str] = []
    cons: List[str] = []
    overall_take: str = ""

class AnalysisReport(BaseModel):
    summary: List[str] = []
    key_terms: List[str] = []
    obligations: Dict[str, List[str]] = {}
    costs_and_payments: List[str] = []
    risks: List[RiskItem] = []
    red_flags: List[str] = []
    questions_to_ask: List[str] = []
    negotiation_suggestions: List[str] = []
    decision_assist: DecisionAssist = Field(default_factory=DecisionAssist)
    clause_hits: Dict[str, List[str]] = {}
    meta: Dict[str, Any] = {}
