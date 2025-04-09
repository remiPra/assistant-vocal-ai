/**
 * Gestion de l'enregistrement audio manuel
 */
export class AudioRecorder {
    /**
     * @param {Object} callbacks - Fonctions de callback
     */
    constructor(callbacks = {}) {
        this.mediaRecorder = null;
        this.mediaStream = null;
        this.audioChunks = [];
        this.recording = false;
        this.callbacks = callbacks;
    }

    /**
     * Initialise l'enregistreur
     * @returns {Promise<boolean>} Succès ou échec de l'initialisation
     */
    async initialize() {
        try {
            // Demander l'accès au microphone
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            
            // Initialiser le MediaRecorder
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 16000
            };
            
            try {
                this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
            } catch (e) {
                console.warn("Format audio spécifié non pris en charge, utilisation du format par défaut");
                this.mediaRecorder = new MediaRecorder(this.mediaStream);
            }
            
            // Configurer les événements du MediaRecorder
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                console.log("Enregistrement terminé, traitement en cours...");
                
                if (this.audioChunks.length === 0) {
                    console.warn("Pas de données audio enregistrées");
                    return;
                }
                
                try {
                    // Convertir les chunks en blob
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
                    console.log("Taille du blob audio:", audioBlob.size, "octets");
                    
                    // Convertir le Blob en ArrayBuffer
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    console.log("Taille de l'ArrayBuffer:", arrayBuffer.byteLength, "octets");
                    
                    // Décoder l'audio
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Assurez-vous que le décodage se passe bien
                    let audioBuffer;
                    try {
                        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        console.log("Audio décodé avec succès, durée:", audioBuffer.duration, "s, canaux:", audioBuffer.numberOfChannels);
                    } catch (decodeError) {
                        console.error("Erreur lors du décodage audio:", decodeError);
                        // Essayer une approche alternative avec un format différent
                        const alternativeBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                        const alternativeBuffer = await alternativeBlob.arrayBuffer();
                        audioBuffer = await audioContext.decodeAudioData(alternativeBuffer);
                    }
                    
                    // Extraire les données audio en tant que Float32Array
                    const audioData = audioBuffer.getChannelData(0);
                    console.log("Données audio extraites, longueur:", audioData.length, "échantillons");
                    console.log("Échantillon de valeurs:", audioData.slice(0, 5));
                    
                    // Vérifier si nous devons rééchantillonner pour 16000Hz
                    const targetSampleRate = 16000;
                    let finalAudioData = audioData;
                    
                    if (audioBuffer.sampleRate !== targetSampleRate) {
                        console.log("Rééchantillonnage de", audioBuffer.sampleRate, "Hz à", targetSampleRate, "Hz");
                        finalAudioData = this.resampleAudio(audioData, audioBuffer.sampleRate, targetSampleRate);
                        console.log("Audio rééchantillonné, nouvelle longueur:", finalAudioData.length);
                    }
                    
                    // Réinitialiser les chunks pour le prochain enregistrement
                    this.audioChunks = [];
                    
                    // Appeler le callback avec les données audio
                    if (this.callbacks.onRecordingComplete) {
                        this.callbacks.onRecordingComplete(finalAudioData);
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de l'audio enregistré:", error);
                    if (this.callbacks.onError) {
                        this.callbacks.onError(error);
                    }
                }
            };
            
            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation de l'enregistreur:", error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
            return false;
        }
    }

    /**
     * Commence l'enregistrement
     */
    startRecording() {
        if (!this.mediaRecorder || this.recording) {
            return;
        }
        
        this.audioChunks = [];
        
        try {
            this.mediaRecorder.start(100); // Recueillir des chunks toutes les 100ms
        } catch (error) {
            console.error("Erreur au démarrage de l'enregistrement:", error);
            // Essayer sans options si l'erreur se produit
            this.mediaRecorder.start();
        }
        
        this.recording = true;
        
        console.log("Enregistrement démarré");
        
        if (this.callbacks.onRecordingStart) {
            this.callbacks.onRecordingStart();
        }
    }

    /**
     * Arrête l'enregistrement
     */
    stopRecording() {
        if (!this.mediaRecorder || !this.recording) {
            return;
        }
        
        this.mediaRecorder.stop();
        this.recording = false;
        
        console.log("Enregistrement arrêté");
        
        if (this.callbacks.onRecordingStop) {
            this.callbacks.onRecordingStop();
        }
    }

    /**
     * Libère les ressources
     */
    dispose() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        this.mediaRecorder = null;
        this.mediaStream = null;
        this.audioChunks = [];
        this.recording = false;
    }

    /**
     * Vérifie si l'enregistrement est en cours
     * @returns {boolean} État de l'enregistrement
     */
    isRecording() {
        return this.recording;
    }

    /**
     * Rééchantillonne l'audio à un taux d'échantillonnage cible
     * @param {Float32Array} audioData - Données audio source
     * @param {number} sourceSampleRate - Taux d'échantillonnage source
     * @param {number} targetSampleRate - Taux d'échantillonnage cible
     * @returns {Float32Array} - Données audio rééchantillonnées
     */
    resampleAudio(audioData, sourceSampleRate, targetSampleRate) {
        if (sourceSampleRate === targetSampleRate) {
            return audioData;
        }
        
        const ratio = sourceSampleRate / targetSampleRate;
        const newLength = Math.round(audioData.length / ratio);
        const result = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
            const pos = i * ratio;
            const index = Math.floor(pos);
            const fraction = pos - index;
            
            if (index + 1 < audioData.length) {
                // Interpolation linéaire simple
                result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
            } else {
                result[i] = audioData[index];
            }
        }
        
        return result;
    }
}