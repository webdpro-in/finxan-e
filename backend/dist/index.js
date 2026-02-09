/**
 * Haru AI Teacher Backend Server
 * Handles AI processing, speech services, and image generation
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { chatRouter } from './routes/chat.js';
import { transcribeRouter } from './routes/transcribe.js';
import { synthesizeRouter } from './routes/synthesize.js';
import { imagesRouter } from './routes/images.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });
// Routes
app.use('/api/chat', chatRouter);
app.use('/api/transcribe', upload.single('audio'), transcribeRouter);
app.use('/api/synthesize', synthesizeRouter);
app.use('/api/images', imagesRouter);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Haru AI Teacher Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    // Log configured providers (environment-based selection)
    console.log('\n📦 Provider Configuration:');
    console.log(`   AI Provider: ${process.env.AI_PROVIDER || 'aws-bedrock (default)'}`);
    console.log(`   TTS Provider: ${process.env.TTS_PROVIDER || 'aws-polly (default)'}`);
    console.log(`   STT Provider: ${process.env.STT_PROVIDER || 'aws-transcribe (default)'}`);
    console.log(`   Image Provider: ${process.env.IMAGE_PROVIDER || 'aws-bedrock (default)'}`);
    console.log('\n✅ Server initialization complete - providers will be instantiated on first use\n');
});
