/**
 * Gestion de la détection d'activité vocale
 */
export class VoiceDetector {
    /**
     * @param {Object} callbacks - Fonctions de callback
     */
    constructor(callbacks = {}) {
        this.vad = null;
        this.mediaStream = null;
        this.callbacks = callbacks;
        this.listening = false;
        this.muted = false;
    }

    /**
     * Initialise le détecteur d'activité vocale
     * @returns {Promise<boolean>} Succès ou échec de l'initialisation
     */
    async initialize() {
        try {
            this.vad = await vad.MicVAD.new({
                onSpeechStart: () => {
                    console.log("Parole détectée");
                    if (this.callbacks.onSpeechStart) {
                        this.callbacks.onSpeechStart();
                    }
                },
                onSpeechEnd: (audio) => {
                    console.log("Fin de parole");
                    if (!this.muted && this.callbacks.onSpeechEnd) {
                        this.callbacks.onSpeechEnd(audio);
                    }
                },
                onVADMisfire: () => {
                    console.log("Fausse détection");
                    if (this.callbacks.onVADMisfire) {
                        this.callbacks.onVADMisfire();
                    }
                }
            });
            
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation du VAD:", error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
            return false;
        }
    }

    /**
     * Démarre la détection vocale
     */
    start() {
        if (this.vad) {
            this.vad.start();
            this.listening = true;
        }
    }

    /**
     * Met en pause la détection vocale
     */
    pause() {
        if (this.vad) {
            this.vad.pause();
            this.listening = false;
        }
    }

    /**
     * Arrête complètement la détection et libère les ressources
     */
    stop() {
        this.pause();
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        this.listening = false;
    }

    /**
     * Active ou désactive le microphone
     * @param {boolean} muted - État de la sourdine
     */
    setMute(muted) {
        this.muted = muted;
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });
        }
    }

    /**
     * Vérifie si la détection est active
     * @returns {boolean} État d'écoute
     */
    isListening() {
        return this.listening;
    }

    /**
     * Vérifie si le micro est en sourdine
     * @returns {boolean} État de la sourdine
     */
    isMuted() {
        return this.muted;
    }
}