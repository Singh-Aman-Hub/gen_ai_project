const { VertexAI } = require('@google-cloud/vertexai');

function getVertex() {
  const project = process.env.VERTEX_PROJECT_ID || process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || process.env.GCP_LOCATION || 'us-central1';
  if (!project) throw new Error('VERTEX_PROJECT_ID or GCP_PROJECT_ID is required');
  const vertex = new VertexAI({ project, location });
  return vertex;
}

async function embedTexts(texts) {
  const vertex = getVertex();
  const modelName = process.env.VERTEX_EMBED_MODEL || 'text-embedding-005';
  const model = vertex.getTextEmbeddingModel(modelName);
  const instances = texts.map((text) => ({ content: text }));
  const res = await model.embedContent({ content: instances[0].content });
  // The current SDK returns { embedding: { values: number[] } }
  const values = res?.embedding?.values || res?.data?.[0]?.embedding?.values || [];
  return values;
}

async function chatGemini(prompt) {
  const vertex = getVertex();
  const modelName = process.env.VERTEX_GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const model = vertex.getGenerativeModel({ model: modelName });
  const res = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
  const text = res?.response?.candidates?.[0]?.content?.parts?.[0]?.text || res?.response?.candidates?.[0]?.content?.parts?.[0]?.stringValue || '';
  return text;
}

module.exports = { embedTexts, chatGemini };
