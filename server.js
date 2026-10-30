const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(express.json({ limit: '50mb' })); // Badi base64 images ke liye limit badhaayi gayi hai
app.use(cors());

// db.json se data read karke bhejna
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read db.json' });
  }
});

// Users update karne par db.json me save karna
app.post('/api/users', (req, res) => {
  try {
    const { users } = req.body;
    const currentData = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    currentData.users = users;
    fs.writeFileSync('./db.json', JSON.stringify(currentData, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save users' });
  }
});

// Complaints update/add hone par db.json me save karna
app.post('/api/complaints', (req, res) => {
  try {
    const { complaints } = req.body;
    const currentData = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    currentData.complaints = complaints;
    fs.writeFileSync('./db.json', JSON.stringify(currentData, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save complaints' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Backend Server running on http://localhost:5000');
});