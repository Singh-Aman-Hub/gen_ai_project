const express = require('express');
const { topKSimilar } = require('../lib/vectorStore');
const { embedTexts, chatGemini } = require('../lib/vertex');

const router = express.Router();

router.post('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    const qVec = await embedTexts([query]);
    const hits = await topKSimilar(documentId, qVec.values || qVec, 5);
    const context = hits.map(h => h.text).join('\n\n');
    const prompt = `Using only the context below, answer the question in simple legal language.\n\nCONTEXT:\n${context}\n\nQUESTION:\n${query}`;
    const answer = await chatGemini(prompt);
    res.json({ answer, sources: hits });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

module.exports = router;

