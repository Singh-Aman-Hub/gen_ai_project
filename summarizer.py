# summarizer.py
"""
Combined implementation of all modules from the legal-assistant project.
This file merges analyzer, app, models, prompts, and utils into a single script.
"""

# --- Imports ---
import io, re, json, os, base64
from typing import List, Dict, Any, Optional, Iterable
from pydantic import BaseModel, Field, ValidationError
from pypdf import PdfReader
from docx import Document as DocxDocument
from transformers import pipeline
from openai import OpenAI
import streamlit as st

# --- Prompts ---
SYSTEM_PROMPT = """
You are a legal clarity assistant. Your job is to explain legal documents in plain, neutral language,
flag potentially risky clauses, and suggest practical, non-legal-advice steps the user can take.
Avoid definitive legal conclusions; use careful wording ("may", "could", "appears to").
Tailor explanations for a non-lawyer reader.
"""

USER_TASK_INSTRUCTIONS = """
You will receive: (1) Raw extracted text from a legal document and (2) any known metadata.
Return a structured JSON object with these fields ONLY:
{
  "summary": "5–10 bullet points explaining the agreement in plain English.",
  "key_terms": ["..."],
  "obligations": []
    "you": ["..."],
    "other_party": ["..."]
  },
  "costs_and_payments": ["interest rate, fees, penalties, schedule"],
  "risks": [
    {"title": "...", "why_it_matters": "...", "where_found": "quote or section", "mitigations": ["..."]}
  ],
  "red_flags": ["short list of potentially unfavorable items"],
  "questions_to_ask": ["..."],
  "negotiation_suggestions": ["..."],
  "decision_assist": {
    "pros": ["..."],
    "cons": ["..."],
    "overall_take": "one-paragraph risk-aware take"
  }
}
Use short, readable sentences. If information is missing, say so.
"""

# --- Models ---
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
    clause_hits: Dict[str, List[str]] = {}  # clause name -> examples
    meta: Dict[str, Any] = {}

# --- Utils ---
def chunk_text(text: str, max_tokens: int = 2000) -> List[str]:
    parts = re.split(r'(?<=[\.\!\?])\s+', text)
    chunks = []
    buf = ""
    for p in parts:
        if len(buf) + len(p) > max_tokens:
            if buf.strip():
                chunks.append(buf.strip())
            buf = p
        else:
            buf += (" " if buf else "") + p
    if buf.strip():
        chunks.append(buf.strip())
    return chunks

def score_risk(clause_hits) -> int:
    weights = {
        "Arbitration / Class Action Waiver": 12,
        "Jury Trial Waiver": 8,
        "Confession of Judgment": 15,
        "Prepayment Penalty": 8,
        "Balloon Payment": 10,
        "Variable / Adjustable Rate": 10,
        "Cross-Default / Cross-Collateralization": 10,
        "Late Fees / Default Interest": 6,
        "Auto-Renewal / Evergreen": 6,
        "Liquidated Damages": 6,
        "Personal Guarantee": 12,
        "Governing Law / Venue": 5,
    }
    score = 0
    for k, hits in clause_hits.items():
        if hits:
            score += weights.get(k, 3)
    return max(0, min(100, score))

# --- Analyzer ---
CLAUSE_PATTERNS = {
    "Arbitration / Class Action Waiver": r"(arbitration|class\s+action\s+waiver|binding\s+arbitration)",
    "Jury Trial Waiver": r"(waiver\s+of\s+jury\s+trial|jury\s+trial\s+waived)",
    "Confession of Judgment": r"(confession\s+of\s+judgment|cognovit)",
    "Prepayment Penalty": r"(prepayment\s+penalt(y|ies)|early\s+termination\s+fee)",
    "Balloon Payment": r"(balloon\s+payment)",
    "Variable / Adjustable Rate": r"(variable\s+rate|adjustable\s+rate|apr\s+may\s+change|index\s+rate)",
    "Cross-Default / Cross-Collateralization": r"(cross-?default|cross-?collateral)",
    "Late Fees / Default Interest": r"(late\s+fee|default\s+interest)",
    "Auto-Renewal / Evergreen": r"(auto-?renew|evergreen\s+term)",
    "Liquidated Damages": r"(liquidated\s+damages)",
    "Personal Guarantee": r"(personal\s+guarant(ee|y))",
    "Governing Law / Venue": r"(governing\s+law|venue|jurisdiction)",
}

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    texts = []
    for page in reader.pages:
        texts.append(page.extract_text() or "")
    return "\n".join(texts)

def extract_text_from_docx(file_bytes: bytes) -> str:
    with io.BytesIO(file_bytes) as fh:
        doc = DocxDocument(fh)
    return "\n".join(p.text for p in doc.paragraphs)

def extract_text(file_bytes: bytes, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    if name.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")
    raise ValueError("Unsupported file type. Please upload PDF, DOCX, or TXT.")

def find_clause_hits(text: str) -> Dict[str, List[str]]:
    hits = {}
    for label, pat in CLAUSE_PATTERNS.items():
        m = re.finditer(pat, text, flags=re.IGNORECASE)
        examples = []
        for match in m:
            start = max(0, match.start()-120)
            end = min(len(text), match.end()+120)
            snippet = text[start:end].strip().replace("\n", " ")
            examples.append(snippet)
        hits[label] = examples
    return hits

def llm_call_openai(chunks: List[str], meta: Dict) -> Dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = OpenAI(api_key=api_key)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_TASK_INSTRUCTIONS + "\n\n" + json.dumps({"meta": meta})}
    ]
    big_text = "\n\n".join(chunks)[:200000]
    messages.append({"role": "user", "content": f"RAW_DOCUMENT_TEXT:\n{big_text}"})
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.2
    )
    content = resp.choices[0].message.content
    try:
        data = json.loads(content)
    except Exception:
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            data = json.loads(content[start:end+1])
        else:
            raise RuntimeError("Model did not return JSON.")
    return data

def llm_call_local(chunks: List[str], meta: Dict) -> Dict:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    summaries = []
    for ch in chunks:
        try:
            summaries.append(summarizer(ch, max_length=130, min_length=30, do_sample=False)[0]["summary_text"])
        except Exception:
            summaries.append("[Could not summarize chunk]")
    return {
        "summary": summaries,
        "key_terms": [],
        "obligations": {"you": [], "other_party": []},
        "costs_and_payments": [],
        "risks": [],
        "red_flags": [],
        "questions_to_ask": [],
        "negotiation_suggestions": [],
        "decision_assist": {"pros": [], "cons": [], "overall_take": ""}
    }

def analyze(file_bytes: bytes, filename: str, meta: Dict = None, provider: str = "openai") -> AnalysisReport:
    text = extract_text(file_bytes, filename)
    clause_hits = find_clause_hits(text)
    chunks = chunk_text(text)
    if provider == "openai":
        result = llm_call_openai(chunks, meta or {})
    else:
        result = llm_call_local(chunks, meta or {})
    naive_risk_score = score_risk(clause_hits)
    result["clause_hits"] = clause_hits
    result["meta"] = {**(meta or {}), "naive_risk_score": naive_risk_score}
    try:
        report = AnalysisReport(**result)
    except ValidationError as e:
        raise RuntimeError(f"Invalid report format: {e}")
    return report

# --- Streamlit App ---
st.set_page_config(page_title="Legal Document Summarizer & Risk Assistant", layout="wide")
st.title("📄 Legal Document Summarizer & Risk Assistant")
st.caption("For informational purposes only — not legal advice.")

with st.sidebar:
    st.header("Settings")
    provider = st.selectbox("Model Provider", ["openai", "local (transformers)"])
    if provider == "openai":
        st.text_input("OPENAI_API_KEY", type="password", key="openai_key")
        if st.session_state.get("openai_key"):
            os.environ["OPENAI_API_KEY"] = st.session_state["openai_key"]
    st.divider()
    st.markdown("**Optional Metadata**")
    borrower = st.text_input("Your name / business (optional)")
    counterparty = st.text_input("Other party (optional)")
    doc_type = st.selectbox("Document type", ["Loan Agreement", "Rental Agreement", "Terms of Service", "Other"])
    jurisdiction = st.text_input("Jurisdiction (if known)")

uploaded = st.file_uploader("Upload PDF, DOCX, or TXT", type=["pdf","docx","txt"])
analyze_btn = st.button("Analyze Document", type="primary", disabled=uploaded is None)

if analyze_btn and uploaded is not None:
    with st.spinner("Analyzing..."):
        meta = {
            "doc_type": doc_type,
            "borrower": borrower,
            "counterparty": counterparty,
            "jurisdiction": jurisdiction,
            "filename": uploaded.name,
        }
        report = analyze(uploaded.getvalue(), uploaded.name, meta=meta, provider="openai" if provider=="openai" else "local")
    st.success("Analysis complete.")

    col1, col2 = st.columns([2,1])
    with col1:
        st.subheader("Plain-English Summary")
        for s in report.summary[:10]:
            st.markdown(f"- {s}")
    with col2:
        st.subheader("Naive Risk Score")
        st.metric("Score (0–100)", report.meta.get("naive_risk_score", 0))
        st.caption("Heuristic based on clause detection. Not a legal assessment.")

    st.subheader("Key Terms")
    if report.key_terms:
        st.markdown("\n".join(f"- {k}" for k in report.key_terms))
    else:
        st.write("No key terms extracted.")

    st.subheader("Obligations")
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**You / Borrower**")
        st.markdown("\n".join(f"- {x}" for x in report.obligations.get("you", [])) or "_None detected_")
    with c2:
        st.markdown("**Other Party**")
        st.markdown("\n".join(f"- {x}" for x in report.obligations.get("other_party", [])) or "_None detected_")

    st.subheader("Costs & Payments")
    st.markdown("\n".join(f"- {c}" for c in report.costs_and_payments) or "_None detected_")

    st.subheader("Detected Clauses")
    if report.clause_hits:
        for label, examples in report.clause_hits.items():
            if not examples:
                continue
            with st.expander(label + f" ({len(examples)})", expanded=False):
                for ex in examples[:5]:
                    st.markdown(f"> {ex}")
    else:
        st.write("_No clauses detected by pattern matcher._")

    st.subheader("Potential Risks")
    if report.risks:
        for r in report.risks:
            st.markdown(f"**{r.title}** — {r.why_it_matters}")
            if r.where_found:
                st.caption(f"_Where found:_ {r.where_found}")
            if r.mitigations:
                st.markdown("Mitigations: " + "; ".join(r.mitigations))
            st.markdown("---")
    else:
        st.write("_No risks listed._")

    st.subheader("Red Flags")
    st.markdown("\n".join(f"- {x}" for x in report.red_flags) or "_None listed._")
