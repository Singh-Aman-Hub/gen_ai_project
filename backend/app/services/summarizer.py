# backend/app/services/summarizer.py
from app.models import AnalysisReport
import re, json, os
from langchain_google_vertexai import ChatVertexAI
from langchain.prompts import PromptTemplate
from app.services.extractor import Extractor
from pathlib import Path

def coerce_report_fields(result):
    # Coerce key_terms to list of strings
    if "key_terms" in result and isinstance(result["key_terms"], list):
        result["key_terms"] = [
            kt["term"] if isinstance(kt, dict) and "term" in kt else str(kt)
            for kt in result["key_terms"]
        ]
    # Coerce costs_and_payments to list of strings
    if "costs_and_payments" in result:
        if isinstance(result["costs_and_payments"], dict):
            # Flatten dict to list of "key: value" strings
            result["costs_and_payments"] = [f"{k}: {v}" for k, v in result["costs_and_payments"].items()]
        elif isinstance(result["costs_and_payments"], list):
            result["costs_and_payments"] = [
                cp["total_estimated_cost"] if isinstance(cp, dict) and "total_estimated_cost" in cp else str(cp)
                for cp in result["costs_and_payments"]
            ]
    # Coerce red_flags to list of strings
    if "red_flags" in result and isinstance(result["red_flags"], list):
        result["red_flags"] = [
            rf["flag"] if isinstance(rf, dict) and "flag" in rf else str(rf)
            for rf in result["red_flags"]
        ]
    # Ensure summary is a list
    if isinstance(result.get("summary"), str):
        result["summary"] = [result["summary"]]
    # Ensure key_terms is a list
    if isinstance(result.get("key_terms"), str):
        result["key_terms"] = [result["key_terms"]]
    # Ensure obligations is a dict
    if isinstance(result.get("obligations"), list):
        result["obligations"] = {"you": result["obligations"], "other_party": []}
    # Ensure risks is a list of dicts
    if "risks" in result and isinstance(result["risks"], list):
        new_risks = []
        for r in result["risks"]:
            if isinstance(r, dict):
                if "risk" in r:  # AI gave {risk: "..."}
                    new_risks.append({
                        "title": r["risk"],
                        "why_it_matters": r.get("why_it_matters", ""),
                        "where_found": r.get("where_found"),
                        "mitigations": r.get("mitigations", [])
                    })
                else:
                    new_risks.append({
                        "title": r.get("title", str(r)),
                        "why_it_matters": r.get("why_it_matters", ""),
                        "where_found": r.get("where_found"),
                        "mitigations": r.get("mitigations", [])
                    })
            else:
                new_risks.append({"title": str(r), "why_it_matters": "", "where_found": None, "mitigations": []})
        result["risks"] = new_risks
    # Ensure decision_assist is a dict matching DecisionAssist
    da = result.get("decision_assist")
    if isinstance(da, str):
        result["decision_assist"] = {"pros": [], "cons": [], "overall_take": da}
    elif isinstance(da, list):
        # If it's a list, put all items in 'pros', leave cons/overall_take empty
        result["decision_assist"] = {"pros": [str(x) for x in da], "cons": [], "overall_take": ""}
    elif not isinstance(da, dict):
        # If it's anything else, default to empty DecisionAssist
        result["decision_assist"] = {"pros": [], "cons": [], "overall_take": ""}
    # If it's a dict, ensure all keys exist
    elif isinstance(da, dict):
        result["decision_assist"] = {
            "pros": da.get("pros", []),
            "cons": da.get("cons", []),
            "overall_take": da.get("overall_take", "")
        }
    return result

async def summarize_document(doc_id: str):
    try:
        # For MVP, load extracted text from cache
        cache_dir = os.environ.get("CACHE_DIR", "/tmp/cache")
        # Ensure cache directory exists
        Path(cache_dir).mkdir(parents=True, exist_ok=True)
        cache_path = Path(cache_dir) / f"extract_{doc_id}.txt"
        if not cache_path.exists():
            raise FileNotFoundError("Document not found in cache.")
        text = cache_path.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        # Use Gemini 2.5 Flash via Langchain
        # Set credentials if not already set
        if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(Path(__file__).parent.parent.parent / "legal-firebase.json")
        llm = ChatVertexAI(
            model="gemini-2.5-flash-lite",
            temperature=0.1,
            max_output_tokens=2048,
            top_p=0.95,
            top_k=40,
            project="legal-470807",
        )
        prompt = PromptTemplate(
            input_variables=["document_text"],
            template=(
                "You are a legal clarity assistant. Your job is to explain legal documents in plain, neutral language, "
                "flag potentially risky clauses, and suggest practical, non-legal-advice steps the user can take. "
                "Avoid definitive legal conclusions; use careful wording ('may', 'could', 'appears to'). "
                "Tailor explanations for a non-lawyer reader.\n\n"
                "Document:\n{document_text}\n\n"
                "Return a structured JSON object with these fields ONLY: summary, key_terms, obligations, costs_and_payments, risks, red_flags, questions_to_ask, negotiation_suggestions, decision_assist."
            ),
        )
        big_text = "\n\n".join(chunks)[:20000]
        resp = llm.invoke(prompt.format(document_text=big_text))
        # Gemini returns an AIMessage object, get the text
        if hasattr(resp, "content"):
            resp_text = resp.content
        else:
            resp_text = str(resp)
        import json
        try:
            result = json.loads(resp_text)
        except Exception:
            start = resp_text.find("{")
            end = resp_text.rfind("}")
            if start >= 0 and end > start:
                result = json.loads(resp_text[start:end+1])
            else:
                raise RuntimeError("Model did not return JSON.")
        result = coerce_report_fields(result)
        # --- Patch: Ensure key_terms is always a list of strings ---
        if "key_terms" in result:
            if isinstance(result["key_terms"], dict):
                # Convert dict to list of its values
                result["key_terms"] = [str(v) for v in result["key_terms"].values()]
            elif not isinstance(result["key_terms"], list):
                result["key_terms"] = [str(result["key_terms"])]
            else:
                # Flatten any dicts inside the list
                result["key_terms"] = [kt["term"] if isinstance(kt, dict) and "term" in kt else str(kt) for kt in result["key_terms"]]
        # --- End Patch ---
        report = AnalysisReport(**result)
        return report.dict()
    except Exception as e:
        print(f"Error in summarize_document: {e}")
        # Return a basic error response
        return {
            "summary": [f"Error processing document: {str(e)}"],
            "key_terms": [],
            "obligations": {"you": [], "other_party": []},
            "costs_and_payments": [],
            "risks": [],
            "red_flags": [],
            "questions_to_ask": [],
            "negotiation_suggestions": [],
            "decision_assist": {"pros": [], "cons": [], "overall_take": f"Error: {str(e)}"},
            "clause_hits": {},
            "meta": {"error": str(e)}
        }

def chunk_text(text: str, max_tokens: int = 2000):
    parts = re.split(r'(?<=[\.!?])\s+', text)
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
