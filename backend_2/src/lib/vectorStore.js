const { getFirestore } = require('./firestore');
const db = getFirestore();

async function saveEmbeddings(docId, chunks, vectors) {
  const coll = db.collection('document_vectors').doc(docId).collection('chunks');
  const batch = db.batch();
  for (let i = 0; i < chunks.length; i++) {
    const ref = coll.doc(String(i));
    batch.set(ref, { idx: i, text: chunks[i], vector: vectors[i] });
  }
  await batch.commit();
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

async function topKSimilar(docId, queryVector, k = 5) {
  const snap = await db.collection('document_vectors').doc(docId).collection('chunks').get();
  const items = [];
  snap.forEach((d)=> items.push(d.data()));
  items.forEach((it)=> it.score = cosineSimilarity(queryVector, it.vector));
  items.sort((a,b)=> b.score-a.score);
  return items.slice(0, k);
}

module.exports = { saveEmbeddings, topKSimilar };

