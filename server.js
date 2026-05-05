import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = 3001;
const db = new Database('designs.db');

app.use(cors());
app.use(express.json());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    poster_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// GET all designs
app.get('/api/designs', (req, res) => {
  try {
    const designs = db.prepare('SELECT * FROM designs ORDER BY created_at DESC').all();
    res.json(designs.map(d => ({
      ...d,
      poster_data: JSON.parse(d.poster_data)
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save a design
app.post('/api/designs', (req, res) => {
  try {
    const { name, poster_data } = req.body;
    const info = db.prepare('INSERT INTO designs (name, poster_data) VALUES (?, ?)').run(
      name,
      JSON.stringify(poster_data)
    );
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a design
app.put('/api/designs/:id', (req, res) => {
  try {
    const { name, poster_data } = req.body;
    db.prepare('UPDATE designs SET name = ?, poster_data = ? WHERE id = ?').run(
      name,
      JSON.stringify(poster_data),
      req.params.id
    );
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a design
app.delete('/api/designs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM designs WHERE id = ?').run(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
