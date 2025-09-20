import os
import sys
import json
import time
import hashlib
import logging
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---- Third-party deps ----
from PIL import Image, ImageEnhance
import pytesseract
from PyPDF2 import PdfReader

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_vertexai import VertexAIEmbeddings, ChatVertexAI

# ---- GUI ----
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext

# =============================================================================
# CONFIG
# =============================================================================

@dataclass
class AppConfig:
    GOOGLE_APPLICATION_CREDENTIALS: str = r"gemini-api-key.json"
    EMBEDDING_BACKEND: str = "hf-legal-bert"
    DATA_DIR: str = "data"
    CACHE_DIR: str = "cache"
    CONVERSATIONS_DIR: str = "conversations"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MIN_CHUNK_LENGTH: int = 40
    MAX_CHUNKS: int = 400
    TOP_K: int = 5
    SIMILARITY_FLOOR: float = 0.2
    DEDUP_THRESHOLD: float = 0.9
    MODEL_NAME: str = "gemini-2.5-flash-lite"
    TEMPERATURE: float = 0.1
    MAX_OUTPUT_TOKENS: int = 2048
    TOP_P: float = 0.95
    TOP_K_SAMPLING: int = 40

    def __post_init__(self):
        Path(self.DATA_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.CACHE_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.CONVERSATIONS_DIR).mkdir(parents=True, exist_ok=True)

CONFIG = AppConfig()

# =============================================================================
# LOGGING
# =============================================================================

def setup_logging() -> logging.Logger:
    log_file = Path(CONFIG.DATA_DIR) / f"lite_{datetime.now():%Y%m%d}.log"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[logging.FileHandler(log_file, encoding="utf-8"), logging.StreamHandler(sys.stdout)],
    )
    return logging.getLogger("legal-lite")

logger = setup_logging()

# =============================================================================
# LANGUAGES
# =============================================================================

LANGUAGES = {
    "English": ("en", "👋 Welcome! You are now using English."),
    "Español": ("es", "👋 ¡Bienvenido! Ahora estás usando Español."),
    "Deutsch": ("de", "👋 Willkommen! Du verwendest jetzt Deutsch."),
    "Français": ("fr", "👋 Bienvenue ! Vous utilisez maintenant le Français."),
    "हिन्दी": ("hi", "👋 स्वागत है! आप अब हिन्दी का उपयोग कर रहे हैं।"),
    "தமிழ்": ("ta", "👋 வரவேற்கிறோம்! நீங்கள் தற்போது தமிழ் பயன்படுத்துகிறீர்கள்."),
    "中文": ("zh", "👋 欢迎！您现在使用中文。"),
}

# =============================================================================
# UTILS
# =============================================================================

def file_fingerprint(path: str) -> str:
    try:
        st = Path(path).stat()
        s = f"{path}|{st.st_mtime_ns}|{st.st_size}"
        return hashlib.md5(s.encode()).hexdigest()
    except Exception as e:
        logger.warning(f"fingerprint fallback: {e}")
        return hashlib.md5(Path(path).read_bytes()[:4096]).hexdigest()

def clean_text(text: str) -> str:
    import re
    text = text.replace("\x00", " ")
    text = re.sub(r"[\t ]+", " ", text)
    text = re.sub(r"\s*\n\s*", "\n", text)
    lines = []
    for ln in text.splitlines():
        if len(ln.strip()) < 3:
            continue
        bad = sum(1 for c in ln if not (c.isalnum() or c in " .,:;!?()-'/\"%$#&@[]{}"))
        if len(ln.strip()) and bad / max(1, len(ln)) > 0.4:
            continue
        lines.append(ln)
    return "\n".join(lines).strip()

# =============================================================================
# EXTRACTION
# =============================================================================

class Extractor:
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(exist_ok=True, parents=True)

    def _cache_path(self, fid: str) -> Path:
        return self.cache_dir / f"extract_{fid}.txt"

    def from_pdf(self, pdf_path: str) -> str:
        fid = file_fingerprint(pdf_path)
        cpath = self._cache_path(fid)
        if cpath.exists():
            return cpath.read_text(encoding="utf-8")

        try:
            with open(pdf_path, "rb") as f:
                reader = PdfReader(f)
                parts: List[str] = []
                for i, page in enumerate(reader.pages, 1):
                    try:
                        txt = (page.extract_text() or "").strip()
                        if txt:
                            parts.append(f"\n--- Page {i} ---\n{clean_text(txt)}")
                    except Exception as e:
                        logger.warning(f"page {i} extract failed: {e}")
                text = "\n".join(parts).strip() or ""
        except Exception as e:
            return f"Error reading PDF: {e}"

        if not text:
            text = "No readable text found."
        cpath.write_text(text, encoding="utf-8")
        return text

    def from_image(self, image_path: str, lang: str = "eng") -> str:
        fid = file_fingerprint(image_path)
        cpath = self._cache_path(fid)
        if cpath.exists():
            return cpath.read_text(encoding="utf-8")

        try:
            with Image.open(image_path) as im:
                if im.mode != "L":
                    im = im.convert("L")
                im = ImageEnhance.Contrast(im).enhance(1.6)
                im = ImageEnhance.Sharpness(im).enhance(1.8)
                text = pytesseract.image_to_string(im, config="--oem 3 --psm 6", lang=lang)
                text = clean_text(text)
        except Exception as e:
            return f"Error reading image: {e}"

        text = text or "No readable text found."
        cpath.write_text(text, encoding="utf-8")
        return text

# =============================================================================
# VECTOR STORE
# =============================================================================

class VectorStore:
    def __init__(self, backend: str, data_dir: Path):
        self.backend = backend
        self.data_dir = data_dir
        self.emb = None
        self.store: Optional[FAISS] = None

    def init_embeddings(self):
        if self.emb is not None:
            return
        if self.backend == "vertex":
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CONFIG.GOOGLE_APPLICATION_CREDENTIALS
            self.emb = VertexAIEmbeddings(model_name="text-embedding-005", requests_per_minute=300)
            logger.info("Embeddings: VertexAI text-embedding-005")
        elif self.backend == "hf-legal-bert":
            self.emb = HuggingFaceEmbeddings(
                model_name="nlpaueb/legal-bert-base-uncased",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True, "batch_size": 64},
            )
            logger.info("Embeddings: HF Legal-BERT (normalized)")
        else:
            raise ValueError("Unsupported EMBEDDING_BACKEND")

    def _vs_path(self, fid: str) -> Path:
        return self.data_dir / f"vs_{CONFIG.EMBEDDING_BACKEND}_{fid}"

    def build_or_load(self, text: str, fid: str) -> Tuple[int, FAISS]:
        self.init_embeddings()
        vs_path = self._vs_path(fid)

        if vs_path.exists():
            try:
                self.store = FAISS.load_local(vs_path.as_posix(), self.emb, allow_dangerous_deserialization=True)
                return self.store.index.ntotal, self.store
            except Exception as e:
                logger.warning(f"reload vector store failed, rebuilding: {e}")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CONFIG.CHUNK_SIZE,
            chunk_overlap=CONFIG.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", ", ", " "],
        )
        docs = splitter.create_documents([text])
        docs = [d for d in docs if len(d.page_content.strip()) >= CONFIG.MIN_CHUNK_LENGTH]
        if len(docs) > CONFIG.MAX_CHUNKS:
            docs = docs[: CONFIG.MAX_CHUNKS]

        if not docs:
            raise ValueError("No valid chunks to index")

        self.store = FAISS.from_documents(docs, self.emb)
        self.store.save_local(vs_path.as_posix())
        return len(docs), self.store

    def search(self, query: str, k: int) -> List[Any]:
        if not self.store:
            return []
        results = self.store.similarity_search_with_score(query, k=k * 3)
        kept = []
        for doc, score in results:
            if score >= CONFIG.SIMILARITY_FLOOR:
                kept.append((doc, float(score)))
        kept.sort(key=lambda x: x[1], reverse=True)
        out_docs: List[Any] = []
        seen: List[str] = []
        def jacc(a: str, b: str) -> float:
            A, B = set(a.lower().split()), set(b.lower().split())
            if not A or not B:
                return 0.0
            return len(A & B) / max(1, len(A | B))
        for d, _ in kept:
            c = d.page_content.strip()
            if all(jacc(c, s) < CONFIG.DEDUP_THRESHOLD for s in seen):
                out_docs.append(d)
                seen.append(c)
            if len(out_docs) >= k:
                break
        return out_docs

# =============================================================================
# QA ENGINE (with memory and conversation saving)
# =============================================================================

class QAEngine:
    def __init__(self):
        os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", CONFIG.GOOGLE_APPLICATION_CREDENTIALS)
        self.llm = ChatVertexAI(
            model=CONFIG.MODEL_NAME,
            temperature=CONFIG.TEMPERATURE,
            max_output_tokens=CONFIG.MAX_OUTPUT_TOKENS,
            top_p=CONFIG.TOP_P,
            top_k=CONFIG.TOP_K_SAMPLING,
        )
        # Store per-document conversation history
        self._history: Dict[str, List[Dict[str, str]]] = {}
        self.conversations_dir = Path(CONFIG.CONVERSATIONS_DIR)
        self.conversations_dir.mkdir(exist_ok=True, parents=True)

        self.prompt = PromptTemplate(
            input_variables=["history", "context", "question"],
            template=(
                "You are a legal assistant AI specialized in simplifying complex legal documents. "
                "Your role is to help users understand rental agreements, loan contracts, terms of service, "
                "and other legal documents by providing clear summaries, explaining complex clauses, "
                "and answering questions in simple, practical language.\n\n"
                "IMPORTANT: You must ONLY answer questions related to legal documents and their contents. "
                "If a question is not about legal documents or legal matters, politely decline to answer "
                "and explain that you are a specialized legal assistant.\n\n"
                "HISTORY:\n{history}\n\n"
                "CONTEXT:\n{context}\n\n"
                "QUESTION: {question}\n\n"
                "Answer:"
            ),
        )

    def _get_conversation_file(self, doc_id: str) -> Path:
        return self.conversations_dir / f"conversation_{doc_id}.json"

    def _save_conversation(self, doc_id: str):
        """Save conversation history to a JSON file"""
        if doc_id not in self._history:
            return
            
        conversation_file = self._get_conversation_file(doc_id)
        try:
            with open(conversation_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "document_id": doc_id,
                    "conversations": self._history[doc_id],
                    "last_updated": datetime.now().isoformat()
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save conversation: {e}")

    def _load_conversation(self, doc_id: str):
        """Load conversation history from a JSON file"""
        conversation_file = self._get_conversation_file(doc_id)
        if conversation_file.exists():
            try:
                with open(conversation_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._history[doc_id] = data.get("conversations", [])
            except Exception as e:
                logger.error(f"Failed to load conversation: {e}")
                self._history[doc_id] = []
        else:
            # Initialize with empty history if no file exists
            self._history[doc_id] = []

    def answer(self, docs: List[Any], question: str, doc_id: str) -> str:
        # Ensure we have a history for this document
        if doc_id not in self._history:
            self._load_conversation(doc_id)

        hist_text = ""
        for entry in self._history[doc_id]:
            hist_text += f"{entry['role'].upper()}: {entry['content']}\n"

        ctx = []
        total = 0
        cap = 8000
        for i, d in enumerate(docs, 1):
            t = d.page_content.strip()
            piece = f"[Doc {i}]\n{t}\n"
            if total + len(piece) > cap:
                break
            ctx.append(piece)
            total += len(piece)

        try:
            chain = LLMChain(llm=self.llm, prompt=self.prompt)
            resp = chain.invoke({
                "history": hist_text or "None",
                "context": "\n".join(ctx),
                "question": question
            })
            out = (resp.get("text") or "").strip() or "Unable to generate an answer."
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            out = "I apologize, but I encountered an error while processing your question. Please try again."

        # Save Q&A in history
        self._history[doc_id].append({"role": "user", "content": question})
        self._history[doc_id].append({"role": "assistant", "content": out})
        
        # Save conversation to file
        self._save_conversation(doc_id)

        return out

# =============================================================================
# GUI
# =============================================================================

class App:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Legal Assistant — Lite")
        self.root.geometry("1000x700")

        self.extractor = Extractor(Path(CONFIG.CACHE_DIR))
        self.vs = VectorStore(CONFIG.EMBEDDING_BACKEND, Path(CONFIG.DATA_DIR))
        self.qa = QAEngine()

        self.current_doc_text: Optional[str] = None
        self.current_doc_fid: Optional[str] = None
        self.current_doc_name: Optional[str] = None
        self.busy = False
        self.lang = "en"

        top = tk.Frame(root)
        top.pack(fill="x", padx=8, pady=8)

        tk.Button(top, text="Load PDF", command=self.load_pdf).pack(side="left")
        tk.Button(top, text="Load Image", command=self.load_image).pack(side="left", padx=6)
        tk.Button(top, text="Clear", command=self.clear_chat).pack(side="left", padx=6)
        tk.Button(top, text="Export Conversation", command=self.export_conversation).pack(side="left", padx=6)

        self.lang_var = tk.StringVar(value="English")
        lang_menu = tk.OptionMenu(top, self.lang_var, *LANGUAGES.keys(), command=self.on_language_change)
        lang_menu.pack(side="left", padx=10)

        self.status = tk.StringVar(value="Ready")
        tk.Label(top, textvariable=self.status, anchor="w").pack(side="left", padx=20)

        self.chat = scrolledtext.ScrolledText(root, wrap=tk.WORD, height=25)
        self.chat.pack(fill="both", expand=True, padx=8, pady=(0, 8))
        self.chat_insert_system("Loaded. Use Load PDF/Image, then ask questions.")

        bottom = tk.Frame(root)
        bottom.pack(fill="x", padx=8, pady=8)
        self.entry = tk.Text(bottom, height=3)
        self.entry.pack(side="left", fill="both", expand=True)
        tk.Button(bottom, text="Send", command=self.on_send).pack(side="left", padx=6)
        self.entry.bind("<Return>", self._enter)
        self.entry.bind("<Shift-Return>", lambda e: None)

    def export_conversation(self):
        """Export current conversation to a JSON file"""
        if not self.current_doc_fid:
            messagebox.showwarning("No Document", "Please load a document first.")
            return
            
        try:
            # Get the conversation file path
            conversation_file = self.qa._get_conversation_file(self.current_doc_fid)
            
            if not conversation_file.exists():
                messagebox.showinfo("No Conversation", "No conversation history found for this document.")
                return
                
            # Ask user where to save the file
            export_path = filedialog.asksaveasfilename(
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
                title="Export Conversation As"
            )
            
            if export_path:
                # Copy the conversation file to the selected location
                import shutil
                shutil.copy2(conversation_file, export_path)
                messagebox.showinfo("Success", f"Conversation exported to {export_path}")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export conversation: {e}")

    def on_language_change(self, choice: str):
        code, greeting = LANGUAGES[choice]
        self.lang = code
        self.chat_insert_system(greeting)

    def chat_insert(self, who: str, text: str):
        ts = datetime.now().strftime("%H:%M:%S")
        self.chat.configure(state="normal")
        self.chat.insert("end", f"[{ts}] {who}: {text}\n\n")
        self.chat.configure(state="disabled")
        self.chat.see("end")

    def chat_insert_system(self, text: str):
        self.chat_insert("SYSTEM", text)

    def _enter(self, event):
        if event.state & 0x1:
            return
        self.on_send()
        return "break"

    def set_busy(self, flag: bool, msg: str = ""):
        self.busy = flag
        self.status.set(msg or ("Working..." if flag else "Ready"))
        self.root.update_idletasks()

    def clear_chat(self):
        self.chat.configure(state="normal")
        self.chat.delete("1.0", "end")
        self.chat.configure(state="disabled")
        self.chat_insert_system("Cleared. Load a document to begin.")

    def load_pdf(self):
        if self.busy:
            return
        path = filedialog.askopenfilename(title="Select PDF", filetypes=[("PDF", "*.pdf"), ("All", "*.*")])
        if not path:
            return
        threading.Thread(target=self._load_pdf_worker, args=(path,), daemon=True).start()

    def _load_pdf_worker(self, path: str):
        self.set_busy(True, "Extracting PDF text...")
        text = self.extractor.from_pdf(path)
        self._after_load(path, text)

    def load_image(self):
        if self.busy:
            return
        path = filedialog.askopenfilename(
            title="Select Image",
            filetypes=[("Images", "*.png;*.jpg;*.jpeg;*.bmp;*.tiff;*.gif"), ("All", "*.*")],
        )
        if not path:
            return
        threading.Thread(target=self._load_image_worker, args=(path,), daemon=True).start()

    def _load_image_worker(self, path: str):
        self.set_busy(True, "Running OCR...")
        text = self.extractor.from_image(path)
        self._after_load(path, text)

    def _after_load(self, path: str, text: str):
        try:
            fid = file_fingerprint(path)
            self.current_doc_text = text
            self.current_doc_fid = fid
            self.current_doc_name = Path(path).name

            if text.startswith("Error") or len(text.strip()) < 100:
                self.chat_insert_system(f"Loaded: {Path(path).name}\nBut text is insufficient: {text[:120]}...")
                return

            self.set_busy(True, "Building/Loading vector store...")
            n, _ = self.vs.build_or_load(text, fid)
            
            # Load any existing conversation for this document
            self.qa._load_conversation(fid)
            if self.qa._history.get(fid):
                self.chat_insert_system(f"Loaded previous conversation for this document.")
            
            self.chat_insert_system(
                f"Loaded: {Path(path).name}\nCharacters: {len(text):,} | Chunks indexed: {n} | Backend: {CONFIG.EMBEDDING_BACKEND}"
            )
        except Exception as e:
            messagebox.showerror("Error", str(e))
        finally:
            self.set_busy(False)

    def on_send(self):
        if self.busy:
            return
        q = self.entry.get("1.0", "end").strip()
        if not q:
            return
        if not self.vs.store:
            messagebox.showwarning("No document", "Load a PDF or image first.")
            return
        self.entry.delete("1.0", "end")
        self.chat_insert("YOU", q)
        threading.Thread(target=self._qa_worker, args=(q,), daemon=True).start()

    def _qa_worker(self, question: str):
        try:
            self.set_busy(True, "Retrieving relevant passages...")
            docs = self.vs.search(question, CONFIG.TOP_K)
            if not docs:
                self.chat_insert_system("No relevant chunks found. Try rephrasing.")
                return

            self.set_busy(True, "Generating answer...")
            answer = self.qa.answer(docs, question, self.current_doc_fid)
            self.chat_insert("ASSISTANT", answer)

        except Exception as e:
            self.chat_insert_system(f"Error during QA: {e}")
            logger.error(f"QA Error: {e}")
        finally:
            self.set_busy(False)

# =============================================================================
# RUN APP
# =============================================================================

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()