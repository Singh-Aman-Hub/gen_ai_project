const pdfParse = require('pdf-parse');

function chunkText(text, maxLen = 800, overlap = 100) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxLen, text.length);
    chunks.push(text.slice(i, end));
    i = end - overlap;
    if (i < 0) i = 0;
    if (i >= text.length) break;
  }
  return chunks.filter((t)=> t.trim().length >= 40).slice(0, 200); // cap chunks
}

async function extractPdfText(buffer) {
  const data = await pdfParse(buffer);
  return (data.text || '').slice(0, 500000); // cap text size
}

module.exports = { chunkText, extractPdfText };

