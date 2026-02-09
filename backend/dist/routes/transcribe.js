/**
 * Transcribe Route - Speech-to-Text using Provider Abstraction Layer
 *
 * This route uses the ProviderRegistry to obtain an STTProvider implementation
 * based on environment configuration. The route depends on the STTProvider contract
 * interface, not on any specific vendor implementation.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - Routes MUST depend on contracts, NOT concrete implementations
 * - Routes MUST NOT know vendor names
 * - Provider switching MUST be environment-based only
 */
import express from 'express';
import { ProviderRegistry } from '../providers/registry.js';
export const transcribeRouter = express.Router();
transcribeRouter.post('/', async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }
        // Get STT provider from registry (contract-based, vendor-agnostic)
        const sttProvider = await ProviderRegistry.getSTTProvider();
        // Call provider through contract interface
        const audioBuffer = req.file.buffer;
        const text = await sttProvider.transcribe(audioBuffer);
        res.json({ text });
    }
    catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});
