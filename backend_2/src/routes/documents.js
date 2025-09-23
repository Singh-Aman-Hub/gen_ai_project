const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('../lib/firestore');
const { extractPdfText, chunkText } = require('../lib/text');
const { embedTexts, chatGemini } = require('../lib/vertex');
const { saveEmbeddings } = require('../lib/vectorStore');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const db = getFirestore();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.body.user_id || req.body.userId;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!userId) return res.status(400).json({ error: 'Missing user_id' });

    const docId = uuidv4();
    const filename = req.file.originalname;

    let text = '';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      text = await extractPdfText(req.file.buffer);
    } else {
      text = 'Unsupported file type (only PDF supported in Node version).';
    }

    const cacheDir = process.env.CACHE_DIR || path.join(__dirname, '..', '..', 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    const cachePath = path.join(cacheDir, `extract_${docId}.txt`);
    fs.writeFileSync(cachePath, text, 'utf-8');

    const chunks = chunkText(text);
    // Embed each chunk individually
    const vectors = [];
    for (const c of chunks) {
      const vec = await embedTexts([c]);
      vectors.push(vec);
    }
    await saveEmbeddings(docId, chunks, vectors);

    // Summarize
    const prompt = `Summarize this legal document in clear bullet points for a non-lawyer:\n\n${chunks.slice(0, 10).join('\n\n')}`;
    const summaryText = await chatGemini(prompt);

    const summaryJson = { summary: [summaryText] };
    await db.collection('documents').doc(docId).set({
      user_id: userId,
      doc_id: docId,
      doc_name: filename,
      summary: summaryJson,
      upload_date: new Date()
    });

    res.json({ doc_id: docId, meta: { filename }, summary: summaryJson });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

module.exports = router;
