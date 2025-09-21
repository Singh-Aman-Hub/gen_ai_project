<h1 align="center">⚖️ Legal Document Simplifier</h1>

<p align="center">
A full-stack AI-powered platform designed to make legal documents more understandable and accessible.  
This project leverages modern web technologies, Google Cloud AI services, and state-of-the-art LLMs to simplify, summarize, and explain complex legal texts for users.
</p>

<hr/>

<h2>📌 Introduction</h2>
<p>
Legal documents are often filled with jargon, long sentences, and dense clauses that are difficult for non-experts to comprehend.  
The <b>Legal Document Simplifier</b> was built to solve this exact problem. It allows users to upload legal documents, automatically generates human-friendly summaries, identifies important points such as obligations, payments, red flags, and also enables users to <b>interact with their documents</b> via a Retrieval-Augmented Generation (RAG) chatbot.  
</p>

<p>
The platform is intended for:
<ul>
  <li>Individuals who want to better understand contracts, agreements, or policies.</li>
  <li>Businesses that need a quick way to review legal paperwork.</li>
  <li>Students or researchers studying law who want simplified explanations.</li>
</ul>
</p>

<hr/>

<h2>✨ Key Features</h2>
<p>
<ul>
  <li><b>User Authentication:</b> Secure login and signup system so users can manage their personal documents and summaries.</li>
  <li><b>Multi-Document Upload:</b> Supports various file formats (PDF, Word, images, scanned docs via OCR, etc.) and multiple uploads.</li>
  <li><b>AI-Powered Summarization:</b>
    <ul>
      <li>Overall summary in plain language</li>
      <li>Extraction of key obligations and responsibilities</li>
      <li>Details on payments, timelines, and involved parties</li>
      <li>Highlighting of critical terms and potential risks</li>
      <li>Suggestions for changes or negotiation points</li>
      <li>Identification of hidden red flags</li>
    </ul>
  </li>
  <li><b>Persistent Storage:</b> Summaries are saved in the cloud and can be accessed by the user at any time.</li>
  <li><b>Interactive RAG Chatbot:</b> Users can ask contextual questions like:
    <ul>
      <li>“What does this clause mean?”</li>
      <li>“What are the hidden risks in this agreement?”</li>
      <li>“Explain the payment terms in simple words.”</li>
    </ul>
    The system fetches relevant context and uses the LLM to answer intelligently.
  </li>
  <li><b>Analytics Dashboard:</b> Visual insights into uploaded documents, summaries, and user activity.</li>
  <li><b>Privacy & Security:</b> Documents are stored securely in Firestore and are accessible only to the respective user.</li>
</ul>
</p>

<hr/>

<h2>🖥️ Technical Architecture</h2>

<h3>Frontend</h3>
<p>
The frontend is built with <b>React + TypeScript</b> using <b>Vite</b> for fast development.  
It provides a modern, responsive UI with seamless navigation and interaction.
</p>
<ul>
  <li><b>Frameworks & Libraries:</b> React (TypeScript), Vite, Tailwind CSS, Axios, Radix UI, Nivo (for analytics)</li>
  <li><b>Core Features:</b>
    <ul>
      <li>User authentication (Login/Signup flows)</li>
      <li>Document upload interface with progress tracking</li>
      <li>Summary viewer with categorized insights</li>
      <li>Chatbot interface for RAG-based Q&A</li>
      <li>Analytics dashboard displaying charts and recent activity</li>
    </ul>
  </li>
  <li><b>Structure:</b>
    <ul>
      <li><code>src/components/</code> – UI components like Chatbot, Sidebar, Navbar, Cards</li>
      <li><code>src/pages/</code> – Pages for Dashboard, SummaryView, Policies, Login, Signup</li>
      <li><code>src/services/service.js</code> – API communication with backend</li>
      <li><code>src/contexts/AuthContext.tsx</code> – Authentication state management</li>
      <li><code>src/types/</code> – TypeScript type definitions</li>
    </ul>
  </li>
</ul>

<h3>Backend</h3>
<p>
The backend is powered by <b>FastAPI</b> (Python) and integrates with Google Cloud for AI and storage.  
It handles document parsing, summarization, RAG pipeline, and database management.
</p>
<ul>
  <li><b>Core Stack:</b> FastAPI, Uvicorn, Pydantic, LangChain, Firestore, Vertex AI, FAISS</li>
  <li><b>Document Processing Tools:</b> PyPDF2, Pillow, pytesseract (OCR), python-docx</li>
  <li><b>Structure:</b>
    <ul>
      <li><code>app/</code> – Main application logic</li>
      <li><code>main.py</code> – API routes and CORS configuration</li>
      <li><code>services/</code> – Summarizer, RAG engine, Firestore handlers</li>
      <li><code>models.py</code> – Pydantic models for requests and responses</li>
    </ul>
  </li>
  <li><b>Features:</b>
    <ul>
      <li>Secure file upload API</li>
      <li>AI-powered summarizer (Gemini via Vertex AI)</li>
      <li>RAG engine with FAISS-based per-user vector DB</li>
      <li>Firestore integration for metadata and summaries</li>
      <li>Health endpoints for deployment monitoring</li>
    </ul>
  </li>
</ul>

<h3>Google Cloud Integration</h3>
<ul>
  <li><b>Firestore:</b> Stores users, documents, and summaries.</li>
  <li><b>Vertex AI (Gemini 2.5 Flash):</b> Used for summarization and RAG chat.</li>
  <li><b>Service Accounts:</b> Backend authentication with Google APIs.</li>
</ul>

<hr/>

<h2>⚙️ Setup Instructions</h2>

<h3>1. Clone the Repository</h3>
<pre>
git clone https://github.com/Singh-Aman-Hub/gen_ai_project.git
cd GEN_AI_GOOGLE
</pre>

<h3>2. Backend Setup</h3>
<pre>
cd backend
pip install -r requirements.txt
</pre>

<b>Requirements:</b>
<ul>
  <li>Python 3.13+</li>
  <li>Google Cloud service account JSON (<code>legal-firebase.json</code>)</li>
  <li>.env file with Firestore and Vertex AI credentials (optional)</li>
</ul>

<b>Run Locally:</b>
<pre>
uvicorn app.main:app --host 0.0.0.0 --port 8000
</pre>

<b>Deploy on Render:</b>
<pre>
uvicorn app.main:app --host 0.0.0.0 --port $PORT
</pre>

<h3>3. Frontend Setup</h3>
<pre>
cd frontend
npm install
</pre>

<b>Requirements:</b>
<ul>
  <li>Node.js (18+ recommended)</li>
  <li>Vite</li>
</ul>

<b>Create .env:</b>
<pre>
VITE_API_BASE_URL=http://localhost:8000
</pre>
(Or use deployed backend URL)

<b>Run Locally:</b>
<pre>
npm run dev
</pre>
Access at: <code>http://localhost:8080</code>

<hr/>

<h2>🚀 Deployment Notes</h2>
<ul>
  <li>The backend must bind to <code>$PORT</code> when deployed to cloud platforms like Render.</li>
  <li>Ensure CORS origins in the backend match your frontend domain.</li>
  <li>Never commit <code>.env</code> files or <code>legal-firebase.json</code> keys to GitHub.</li>
  <li>For production, use Google Cloud IAM to restrict service account permissions.</li>
</ul>

<hr/>

<h2>📖 Summary</h2>
<p>
The <b>Legal Document Simplifier</b> is not just a document parser—it is an intelligent legal assistant.  
By combining advanced AI summarization with interactive RAG-based exploration, the platform empowers users to truly understand their legal documents in a simple and actionable way.  
</p>
<p>
With a secure cloud architecture, scalable deployment, and user-friendly frontend, this project demonstrates how <b>AI can bridge the gap between complex legal language and everyday understanding</b>.  
</p>
