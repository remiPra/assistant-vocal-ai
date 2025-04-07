// js/api/tts.js
/**
 * Service de synthèse vocale
 */
export class TTSService {
    constructor() {
        this.currentAbortController = null;
        this.audioElement = new Audio();
    }

    /**
     * Synthétise un texte en parole
     * @param {string} text - Texte à synthétiser
     * @returns {Promise<void>} Promise résolue après la lecture audio
     */
    async speak(text) {
        if (!text) {
            return;
        }

        // Créer un AbortController pour pouvoir annuler la requête
        this.currentAbortController = new AbortController();
        const signal = this.currentAbortController.signal;

        try {
            const response = await fetch(
                "https://chatbot-20102024-8c94bbb4eddf.herokuapp.com/synthesize",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: text,
                        voice: "fr-FR-DeniseNeural",
                    }),
                    signal: signal,
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur de synthèse vocale: ${response.status} - ${response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Nettoyer l'URL précédente si elle existe
            if (this.audioElement.src) {
                URL.revokeObjectURL(this.audioElement.src);
            }
            
            // Définir la nouvelle source et lire l'audio
            this.audioElement.src = audioUrl;
            
            return new Promise((resolve) => {
                this.audioElement.onended = () => {
                    resolve();
                };
                this.audioElement.play();
            });
        } finally {
            this.currentAbortController = null;
        }
    }

    /**
     * Annule la requête de synthèse vocale en cours
     */
    cancel() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
    }
}