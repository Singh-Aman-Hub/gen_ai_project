const express = require('express');
const { getFirestore } = require('../lib/firestore');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const db = getFirestore();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const userId = uuidv4();
    await db.collection('users').doc(userId).set({ name, email, password });
    res.json({ message: 'User registered successfully', user: { id: userId, name, email } });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const snap = await db.collection('users').where('email','==',email).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'User not found' });
    const doc = snap.docs[0];
    const user = doc.data();
    if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: { id: doc.id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

module.exports = router;

