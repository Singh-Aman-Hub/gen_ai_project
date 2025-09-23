const express = require('express');
const fs = require('fs');
const path = require('path');
const { chatGemini } = require('../lib/vertex');

const router = express.Router();

router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const cacheDir = process.env.CACHE_DIR || path.join(__dirname, '..', '..', 'cache');
    const cachePath = path.join(cacheDir, `extract_${documentId}.txt`);
    if (!fs.existsSync(cachePath)) return res.status(404).json({ error: 'Document not found in cache' });
    const text = fs.readFileSync(cachePath, 'utf-8');
    const prompt = `Summarize this legal document in structured JSON with fields: summary, key_terms, obligations, costs_and_payments, risks, red_flags, questions_to_ask, negotiation_suggestions, decision_assist.\n\n${text.slice(0, 20000)}`;
    const out = await chatGemini(prompt);
    res.json({ raw: out });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

module.exports = router;

