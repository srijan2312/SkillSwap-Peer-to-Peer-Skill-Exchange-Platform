const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./utils/helpers');

dotenv.config();

const app = express();

// Allow the React dev server (and any configured client URL) to call the API.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json()); // parse JSON request bodies

// Serve uploaded avatars: files saved by multer live in server/uploads and
// are reachable at /uploads/avatars/<filename>. The folder is gitignored.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check — quick way to confirm the API is up.
app.get('/', (req, res) => res.json({ message: 'SkillSwap API is running' }));

// Route modules — one file per resource keeps the entry point readable.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/swaps', require('./routes/swaps'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Unknown routes → clean JSON 404 instead of Express's HTML page.
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler (must be registered last).
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`SkillSwap server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
