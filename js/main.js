import { VoiceDetector } from './audio/vad.js';
import { TranscriptionService } from './api/transcription.js';
import { ChatService } from './api/chat.js';
import { UIManager } from './ui/interface.js';
import { ConversationManager } from './ui/conversation.js';
import { StorageManager } from './utils/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des modules
    const storage = new StorageManager();
    const ui = new UIManager();
    const conversation = new ConversationManager(document.getElementById('conversation-list'));
    const transcriptionService = new TranscriptionService();
    const chatService = new ChatService();
    
    // Variables d'état
    let voiceDetector = null;
    let segments = [];
    let processing = false;
    
    // Charger la clé API depuis le stockage local
    const savedKey = storage.getItem('groq-api-key');
    if (savedKey) {
        ui.setApiKey(savedKey);
    }
    
    // Sauvegarder la clé API quand elle change
    document.getElementById('api-key').addEventListener('change', () => {
        storage.setItem('groq-api-key', ui.getApiKey());
    });
    
    // Gestionnaire pour le bouton de démarrage
    document.getElementById('start-button').addEventListener('click', async () => {
        try {
            // Initialiser le détecteur vocal
            voiceDetector = new VoiceDetector({
                onSpeechStart: () => {
                    console.log("Parole détectée");
                    if (!voiceDetector.isMuted() && !processing) {
                        ui.updateUI(true, true);
                    }
                },
                onSpeechEnd: (audio) => {
                    console.log("Fin de parole");
                    if (!voiceDetector.isMuted() && !processing) {
                        ui.updateUI(true, false);
                        processAudioSegment(audio);
                    }
                },
                onError: (error) => {
                    console.error("Erreur de détection vocale:", error);
                    conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
                }
            });
            
            // Initialisation du détecteur
            const success = await voiceDetector.initialize();
            if (success) {
                voiceDetector.start();
                ui.updateUI(true, false);
                conversation.addInfoMessage("Détection vocale démarrée", 'success');
            } else {
                throw new Error("Échec de l'initialisation de la détection vocale");
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation:", error);
            conversation.addInfoMessage(`Erreur d'initialisation: ${error.message}`, 'error');
        }
    });
    
    // Gestionnaire pour le bouton d'arrêt
    document.getElementById('stop-button').addEventListener('click', () => {
        stopEverything();
    });
    
    // Gestionnaire pour le bouton de sourdine
    document.getElementById('mute-button').addEventListener('click', () => {
        if (voiceDetector) {
            voiceDetector.setMute(!voiceDetector.isMuted());
            ui.updateMuteState(voiceDetector.isMuted());
        }
    });
    
    /**
     * Traite un segment audio
     * @param {Float32Array} audioData - Données audio
     */
    async function processAudioSegment(audioData) {
        // Ajouter le segment à la liste
        segments.push(audioData);
        const segmentId = segments.length;
        ui.addSegment(segmentId, audioData.length / 16000);
        
        try {
            // Signaler que le traitement commence
            processing = true;
            ui.updateUI(true, false, true);
            
            // Ajouter un message utilisateur en attente
            conversation.addPendingUserMessage(segmentId);
            
            // Transcription
            const apiKey = ui.getApiKey();
            if (!apiKey) {
                throw new Error("Aucune clé API fournie");
            }
            
            const transcription = await transcriptionService.transcribe(audioData, apiKey);
            
            // Mettre à jour le message utilisateur avec la transcription
            conversation.updateUserMessage(segmentId, transcription);
            
            // Ajouter un message assistant en attente
            conversation.addPendingAssistantMessage(segmentId);
            
            // Générer une réponse
            const response = await chatService.sendMessage(transcription, apiKey);
            
            // Mettre à jour le message assistant avec la réponse
            conversation.updateAssistantMessage(segmentId, response);
            
        } catch (error) {
            // Vérifier si l'erreur est due à une annulation volontaire
            if (error.name === 'AbortError') {
                console.log("Requête annulée volontairement");
                return;
            }
            
            console.error("Erreur de traitement:", error);
            conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
        } finally {
            // Fin du traitement
            processing = false;
            
            // Remettre l'UI dans l'état d'écoute si on n'a pas arrêté complètement
            if (voiceDetector && voiceDetector.isListening()) {
                ui.updateUI(true, false);
            }
        }
    }
    
    /**
     * Arrête complètement tout
     */
    function stopEverything() {
        // Arrêter les détections et enregistrements
        if (voiceDetector) {
            voiceDetector.stop();
        }
        
        // Annuler les requêtes en cours
        transcriptionService.cancel();
        chatService.cancel();
        
        // Réinitialiser l'état
        processing = false;
        
        // Mettre à jour l'UI
        ui.updateUI(false);
        
        // Informer l'utilisateur
        conversation.addInfoMessage('Session arrêtée', 'info');
    }
});