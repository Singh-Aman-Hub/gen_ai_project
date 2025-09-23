const pdfParse = require('pdf-parse');

function chunkText(text, maxLen = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxLen, text.length);
    chunks.push(text.slice(i, end));
    i = end - overlap;
    if (i < 0) i = 0;
    if (i >= text.length) break;
  }
  return chunks.filter((t)=> t.trim().length > 0);
}

async function extractPdfText(buffer) {
  const data = await pdfParse(buffer);
  return data.text || '';
}

module.exports = { chunkText, extractPdfText };

