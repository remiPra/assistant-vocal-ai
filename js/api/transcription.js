import { AudioEncoder } from '../audio/encoder.js';

/**
 * Service de transcription audio
 */
export class TranscriptionService {
    constructor() {
        this.currentAbortController = null;
    }

    /**
     * Transcrit un segment audio
     * @param {Float32Array} audioData - Données audio
     * @param {string} apiKey - Clé API Groq
     * @returns {Promise<string>} Texte transcrit
     */
    async transcribe(audioData, apiKey) {
        if (!apiKey) {
            throw new Error("Aucune clé API fournie");
        }

        // Créer un AbortController pour pouvoir annuler la requête
        this.currentAbortController = new AbortController();
        const signal = this.currentAbortController.signal;

        try {
            // Convertir l'audio en WAV
            const wavBlob = AudioEncoder.createWavBlob(audioData);
            
            // Créer un FormData pour l'API
            const formData = new FormData();
            formData.append('file', wavBlob, 'audio.wav');
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('temperature', '0');
            formData.append('response_format', 'json');
            formData.append('language', 'fr');
            
            // Envoyer à l'API
            const response = await fetch(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: formData,
                    signal: signal,
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur de transcription: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            return result.text;
        } finally {
            this.currentAbortController = null;
        }
    }

    /**
     * Annule la requête de transcription en cours
     */
    cancel() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    }
}