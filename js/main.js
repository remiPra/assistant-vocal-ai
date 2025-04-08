import { VoiceDetector } from './audio/vad.js';
import { TranscriptionService } from './api/transcription.js';
import { ChatService } from './api/chat.js';
import { TTSService } from './api/tts.js';
import { UIManager } from './ui/interface.js';
import { ConversationManager } from './ui/conversation.js';
import { StorageManager } from './utils/storage.js';
import { initSlider } from './ui/slider-init.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des modules
    const storage = new StorageManager();
    const ui = new UIManager();
    const conversation = new ConversationManager(document.getElementById('conversation-list'));
    const transcriptionService = new TranscriptionService();
    const chatService = new ChatService();
    const ttsService = new TTSService();
    
    // Initialiser le slider
    const slider = initSlider();
    
    // Variables d'état
    let voiceDetector = null;
    let segments = [];
    let processing = false;
    let wasInterrupted = false;
    let isInterrupting = false;
    let messageCounter = 0; // Compteur global pour les identifiants de message
    
    // Configurer les callbacks du ttsService
    ttsService.onSpeakingStarted = () => {
        console.log("TTS a commencé à parler");
        // Réactiver la détection vocale pendant que le TTS parle
        if (voiceDetector) {
            voiceDetector.start();
            ui.updateUI(true, false);
        }
    };
    
    ttsService.onSpeakingEnded = () => {
        console.log("TTS a terminé de parler");
        // Le TTS s'est terminé normalement
    };
    
    ttsService.onSpeakingInterrupted = () => {
        console.log("TTS a été interrompu");
        wasInterrupted = true;
        // Marquer visuellement que l'assistant a été interrompu
        conversation.addInfoMessage("Assistant interrompu", "warning");
    };
    
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
                    
                    // Vérifier si le TTS est en cours et l'interrompre
                    if (ttsService.isSpeaking) {
                        console.log("Interruption du TTS");
                        isInterrupting = true;
                        ttsService.cancel();
                    }
                    
                    if (!voiceDetector.isMuted()) {
                        ui.updateUI(true, true);
                    }
                },
                onSpeechEnd: (audio) => {
                    console.log("Fin de parole, audio length:", audio.length);
                    
                    // Si c'est une interruption, traiter l'audio même si processing est true
                    if (!voiceDetector.isMuted() && (isInterrupting || !processing)) {
                        ui.updateUI(true, false);
                        
                        // Forcer l'arrêt du traitement précédent si c'était une interruption
                        if (isInterrupting) {
                            console.log("Traitement audio après interruption");
                            // Annuler les requêtes précédentes si nécessaire
                            transcriptionService.cancel();
                            chatService.cancel();
                            
                            // Réinitialiser l'état de traitement
                            processing = false;
                            isInterrupting = false;
                        }
                        
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
    
    // Ajout de la gestion de l'input texte
    const textForm = document.getElementById('text-input-form');
    if (textForm) {
        textForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const textInput = document.getElementById('text-input');
            const message = textInput.value.trim();
            if (!message) return;
            
            try {
                // Récupérer la clé API
                const apiKey = ui.getApiKey();
                if (!apiKey) {
                    throw new Error("Aucune clé API fournie");
                }
                
                // Incrémenter le compteur global et créer un ID unique
                const messageId = ++messageCounter;
                
                // Ajouter le message à l'interface
                conversation.addUserTextMessage(messageId, message);
                
                // Vider l'input
                textInput.value = '';
                
                // Désactiver l'input pendant le traitement
                textInput.disabled = true;
                document.getElementById('send-text-button').disabled = true;
                
                // Ajouter un message assistant en attente
                conversation.addPendingAssistantMessage(messageId);
                
                // Générer une réponse
                const response = await chatService.sendMessage(message, apiKey);
                console.log("Réponse du LLM:", response);
                
                // Mettre à jour le message assistant avec la réponse
                conversation.updateAssistantMessage(messageId, response);
                
                // Synthétiser la réponse en audio si souhaité
                if (voiceDetector && voiceDetector.isListening()) {
                    try {
                        await ttsService.speak(response);
                    } catch (ttsError) {
                        console.error("Erreur TTS ignorée:", ttsError);
                    }
                }
                
            } catch (error) {
                console.error("Erreur lors du traitement du texte:", error);
                conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
            } finally {
                // Réactiver l'input
                const textInput = document.getElementById('text-input');
                if (textInput) {
                    textInput.disabled = false;
                    textInput.focus();
                }
                
                const sendButton = document.getElementById('send-text-button');
                if (sendButton) {
                    sendButton.disabled = false;
                }
            }
        });
    }
    
    /**
     * Traite un segment audio
     * @param {Float32Array} audioData - Données audio
     */
    async function processAudioSegment(audioData) {
        // Vérifier si l'audio est valide
        if (!audioData || audioData.length < 100) {
            console.warn("Segment audio trop court ou invalide", audioData?.length);
            return;
        }
        
        // Ajouter le segment à la liste
        segments.push(audioData);
        
        // Incrémenter le compteur global et créer un ID unique
        const segmentId = ++messageCounter;
        
        ui.addSegment(segments.length, audioData.length / 16000);
        
        try {
            // Signaler que le traitement commence
            processing = true;
            ui.updateUI(true, false, true);
            
            // Mettre en pause la détection vocale pendant le traitement
            if (voiceDetector) {
                voiceDetector.pause();
            }
            
            // Ajouter un message utilisateur en attente
            conversation.addPendingUserMessage(segmentId);
            
            // Transcription
            const apiKey = ui.getApiKey();
            if (!apiKey) {
                throw new Error("Aucune clé API fournie");
            }
            
            const transcription = await transcriptionService.transcribe(audioData, apiKey);
            console.log("Transcription:", transcription);
            
            // Mettre à jour le message utilisateur avec la transcription
            conversation.updateUserMessage(segmentId, transcription);
            
            // Ajouter un message assistant en attente
            conversation.addPendingAssistantMessage(segmentId);
            
            // Générer une réponse
            const response = await chatService.sendMessage(transcription, apiKey);
            console.log("Réponse du LLM:", response);
            
            // Mettre à jour le message assistant avec la réponse IMMÉDIATEMENT
            // C'est crucial que cette ligne s'exécute avant la tentative de TTS
            conversation.updateAssistantMessage(segmentId, response);
            
            // Le traitement API est terminé
            // Maintenant tenter de jouer le TTS, mais ne pas bloquer si ça échoue
            wasInterrupted = false; // Réinitialiser le drapeau d'interruption
            try {
                await ttsService.speak(response);
            } catch (ttsError) {
                console.error("Erreur lors de la synthèse vocale:", ttsError);
                // Ne pas bloquer en cas d'erreur TTS
            }
            
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
            
            // Si le processus n'a pas été interrompu et que la détection est toujours active
            if (!wasInterrupted && voiceDetector && voiceDetector.isListening()) {
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
        ttsService.cancel();
        
        // Réinitialiser l'état
        processing = false;
        wasInterrupted = false;
        isInterrupting = false;
        
        // Mettre à jour l'UI
        ui.updateUI(false);
        
        // Informer l'utilisateur
        conversation.addInfoMessage('Session arrêtée', 'info');
    }
    
    // Gestionnaire pour le bouton de réinitialisation dans le menu latéral
    const resetButton = document.querySelector('button.bg-green-100');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Arrêter tout
            stopEverything();
            
            // Vider la conversation
            conversation.clearConversation();
            
            // Vider les segments
            segments = [];
            ui.resetSegments();
            
            // Effacer l'historique du chat
            chatService.clearHistory();
            
            // Réinitialiser le compteur de messages
            messageCounter = 0;
            
            // Informer l'utilisateur
            conversation.addInfoMessage('Conversation réinitialisée', 'success');
        });
    }
});