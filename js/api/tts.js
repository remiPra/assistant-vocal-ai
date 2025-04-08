// js/api/tts.js
export class TTSService {
    constructor() {
        this.currentAbortController = null;
        this.audioElement = new Audio();
        this.isSpeaking = false; // Ajouter cet indicateur
        this.onSpeakingStarted = null; // Callback quand la parole commence
        this.onSpeakingEnded = null; // Callback quand la parole se termine
        this.onSpeakingInterrupted = null; // Callback en cas d'interruption
    }

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
            
            // Définir la nouvelle source
            this.audioElement.src = audioUrl;
            
            return new Promise((resolve) => {
                // Quand l'audio commence
                this.audioElement.onplay = () => {
                    this.isSpeaking = true;
                    if (this.onSpeakingStarted) this.onSpeakingStarted();
                };
                
                // Quand l'audio se termine naturellement
                this.audioElement.onended = () => {
                    this.isSpeaking = false;
                    if (this.onSpeakingEnded) this.onSpeakingEnded();
                    resolve();
                };
                
                // Lancer la lecture
                this.audioElement.play();
            });
        } finally {
            this.currentAbortController = null;
        }
    }

    cancel() {
        // Annuler la requête en cours
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
        
        // Arrêter l'audio en cours
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            
            // Indiquer que la parole a été interrompue
            if (this.isSpeaking) {
                this.isSpeaking = false;
                if (this.onSpeakingInterrupted) this.onSpeakingInterrupted();
            }
        }
    }
}