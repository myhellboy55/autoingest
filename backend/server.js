import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import ingestRoutes from './routes/ingestRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/drives', ingestRoutes);
app.use('/api/ingest', jobRoutes);

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
