# backend/app/services/qa_engine.py
from app.services.summarizer import chunk_text
from app.models import AnalysisReport
from pathlib import Path
import json
from langchain_google_vertexai import ChatVertexAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
import os

# Load the embedding model once globally
EMBED_MODEL = HuggingFaceEmbeddings(
    model_name="nlpaueb/legal-bert-base-uncased",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True, "batch_size": 64},
)

from collections import defaultdict, deque

# In-memory user chat history (user_id -> deque of last 10 queries)
USER_CHAT_HISTORY = defaultdict(lambda: deque(maxlen=10))

# New: Chat with all documents for a user
async def chat_with_documents(doc_ids, query, user_id=None):
    # Store the query in user history
    if user_id:
        USER_CHAT_HISTORY[user_id].append(query)
        # Build context from last 10 queries
        memory_context = "\n".join(USER_CHAT_HISTORY[user_id])
    else:
        memory_context = query
    all_context = []
    for doc_id in doc_ids:
        cache_path = Path("../cache") / f"extract_{doc_id}.txt"
        if not cache_path.exists():
            continue
        text = cache_path.read_text(encoding="utf-8")
        emb = EMBED_MODEL  # Use global model
        vs_path = Path("../data") / f"vs_hf-legal-bert_{doc_id}"
        if vs_path.exists():
            store = FAISS.load_local(vs_path.as_posix(), emb, allow_dangerous_deserialization=True)
        else:
            from langchain.text_splitter import RecursiveCharacterTextSplitter
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            docs = splitter.create_documents([text])
            docs = [d for d in docs if len(d.page_content.strip()) >= 40]
            store = FAISS.from_documents(docs, emb)
            store.save_local(vs_path.as_posix())
        results = store.similarity_search_with_score(memory_context, k=3)
        context = "\n\n".join([doc.page_content.strip() for doc, score in results if score >= 0.2])
        if context:
            all_context.append(context)
    combined_context = "\n\n".join(all_context)
    if not combined_context:
        return "No relevant information found in your documents."
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(Path(__file__).parent.parent / "gemini-api-key.json")
    llm = ChatVertexAI(
        model="gemini-2.5-flash-lite",
        temperature=0.1,
        max_output_tokens=1024,
        top_p=0.95,
        top_k=40,
        project="legal-470807",
    )
    # Only answer the last query, but use history for context
    last_query = query if not user_id else USER_CHAT_HISTORY[user_id][-1] if USER_CHAT_HISTORY[user_id] else query
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "You are a legal assistant AI specialized in simplifying complex legal documents. "
            "Your role is to help users understand rental agreements, loan contracts, terms of service, "
            "and other legal documents by providing clear summaries, explaining complex clauses, "
            "and answering questions in simple, practical language.\n\n"
            "CONTEXT:\n{context}\n\nQUESTION:\n{question}\n\nAnswer concisely and only to the last question."
        ),
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    resp = chain.invoke({"context": combined_context, "question": last_query})
    if hasattr(resp, "content"):
        out = resp.content
    elif isinstance(resp, dict) and "text" in resp:
        out = resp["text"]
    else:
        out = str(resp)
    return out

async def chat_with_document(doc_id: str, query: str):
    cache_path = Path("../cache") / f"extract_{doc_id}.txt"
    if not cache_path.exists():
        raise FileNotFoundError("Document not found in cache.")
    text = cache_path.read_text(encoding="utf-8")
    # Build vector store
    emb = EMBED_MODEL  # Use global model
    vs_path = Path("../data") / f"vs_hf-legal-bert_{doc_id}"
    if vs_path.exists():
        store = FAISS.load_local(vs_path.as_posix(), emb, allow_dangerous_deserialization=True)
    else:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = splitter.create_documents([text])
        docs = [d for d in docs if len(d.page_content.strip()) >= 40]
        store = FAISS.from_documents(docs, emb)
        store.save_local(vs_path.as_posix())
    # Search relevant chunks
    results = store.similarity_search_with_score(query, k=5)
    context = "\n\n".join([doc.page_content.strip() for doc, score in results if score >= 0.2])
    # RAG prompt
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(Path(__file__).parent.parent / "gemini-api-key.json")
    llm = ChatVertexAI(
        model="gemini-2.5-flash-lite",
        temperature=0.1,
        max_output_tokens=1024,
        top_p=0.95,
        top_k=40,
        project="legal-470807",
    )
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "You are a legal assistant AI specialized in simplifying complex legal documents. "
            "Your role is to help users understand rental agreements, loan contracts, terms of service, "
            "and other legal documents by providing clear summaries, explaining complex clauses, "
            "and answering questions in simple, practical language.\n\n"
            "CONTEXT:\n{context}\n\nQUESTION: {question}\n\nAnswer:"
        ),
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    resp = chain.invoke({"context": context, "question": query})
    # Gemini returns an AIMessage object, get the text
    if hasattr(resp, "content"):
        out = resp.content
    elif isinstance(resp, dict) and "text" in resp:
        out = resp["text"]
    else:
        out = str(resp)
    return out
