// js/api/tts.js
export class TTSService {
    constructor() {
        this.currentAbortController = null;
        this.audioElement = document.getElementById('tts-player');
        this.isSpeaking = false;
        this.onSpeakingStarted = null;
        this.onSpeakingEnded = null;
        this.onSpeakingInterrupted = null;

        // S'assurer que nous avons trouvé l'élément audio
        if (!this.audioElement) {
            console.error("Élément audio non trouvé dans le DOM, création d'un élément temporaire");
            this.audioElement = document.createElement('audio');
            this.audioElement.id = 'tts-player';
            document.body.appendChild(this.audioElement);
        }

        // Ajouter les écouteurs d'événements
        this.setupAudioListeners();
    }

    setupAudioListeners() {
        // Quand l'audio commence
        this.audioElement.onplay = () => {
            console.log("TTS: lecture démarrée");
            this.isSpeaking = true;
            if (this.onSpeakingStarted) this.onSpeakingStarted();
        };
        
        // Quand l'audio se termine naturellement
        this.audioElement.onended = () => {
            console.log("TTS: lecture terminée");
            this.isSpeaking = false;
            if (this.onSpeakingEnded) this.onSpeakingEnded();
        };
        
        // En cas d'erreur
        this.audioElement.onerror = (e) => {
            console.error("TTS: erreur de lecture", e);
            this.isSpeaking = false;
            if (this.onSpeakingInterrupted) this.onSpeakingInterrupted();
        };

        // En cas de pause
        this.audioElement.onpause = () => {
            if (this.isSpeaking) {
                console.log("TTS: lecture mise en pause");
                this.isSpeaking = false;
                if (this.onSpeakingInterrupted) this.onSpeakingInterrupted();
            }
        };
    }

    async speak(text) {
        if (!text) {
            return Promise.resolve();
        }

        // Créer un AbortController pour pouvoir annuler la requête
        this.currentAbortController = new AbortController();
        const signal = this.currentAbortController.signal;

        try {
            // Afficher l'état dans la console pour debugging
            console.log("TTS: Envoi de la requête de synthèse vocale");
            
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
            
            console.log("TTS: Audio reçu, configuration du lecteur");
            
            // Définir la nouvelle source
            this.audioElement.src = audioUrl;
            
            // Pour debugging, montrer l'élément audio
            // this.audioElement.style.display = 'block';
            
            // Lancer la lecture et retourner une promesse
            console.log("TTS: Tentative de lecture");
            return new Promise((resolve, reject) => {
                // Un timeout de sécurité
                const safetyTimeout = setTimeout(() => {
                    console.warn("TTS: Timeout de sécurité déclenché");
                    this.isSpeaking = false;
                    if (this.onSpeakingEnded) this.onSpeakingEnded();
                    resolve();
                }, 30000);
                
                // Écouteur temporaire pour résoudre la promesse
                const onEndedOnce = () => {
                    clearTimeout(safetyTimeout);
                    this.audioElement.removeEventListener('ended', onEndedOnce);
                    resolve();
                };
                
                this.audioElement.addEventListener('ended', onEndedOnce);
                
                // Gestion des erreurs
                const onErrorOnce = (e) => {
                    clearTimeout(safetyTimeout);
                    this.audioElement.removeEventListener('error', onErrorOnce);
                    console.error("TTS: Erreur lors de la lecture", e);
                    resolve(); // Résoudre plutôt que rejeter pour ne pas bloquer le flux
                };
                
                this.audioElement.addEventListener('error', onErrorOnce);
                
                // Lancer la lecture
                this.audioElement.play().catch(error => {
                    clearTimeout(safetyTimeout);
                    console.error("TTS: Impossible de démarrer la lecture", error);
                    this.isSpeaking = false;
                    if (this.onSpeakingInterrupted) this.onSpeakingInterrupted();
                    resolve(); // Résoudre quand même pour éviter de bloquer
                });
            });
        } catch (error) {
            console.error("TTS: Erreur générale", error);
            this.isSpeaking = false;
            if (this.onSpeakingInterrupted) this.onSpeakingInterrupted();
            return Promise.resolve(); // Résoudre quand même pour éviter de bloquer
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
                console.log("TTS: Lecture interrompue manuellement");
                this.isSpeaking = false;
                if (this.onSpeakingInterrupted) this.onSpeakingInterrupted();
            }
        }
    }
}