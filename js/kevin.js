import { VoiceDetector } from './audio/vad.js';
import { TranscriptionService } from './api/transcription.js';
import { ChatService } from './api/chat.js';
import { TTSService } from './api/tts.js';
import { UIManager } from './ui/interface.js';
import { ConversationManager } from './ui/conversation.js';
import { StorageManager } from './utils/storage.js';
import { initSlider } from './ui/slider-init.js';

document.addEventListener('DOMContentLoaded', () => {
    const storage = new StorageManager();
    const ui = new UIManager();
    const conversation = new ConversationManager(document.getElementById('conversation-list'));
    const transcriptionService = new TranscriptionService();
    const chatService = new ChatService();
    const ttsService = new TTSService();
    let voiceDetector = null;
    let segments = [];
    let processing = false;
    let wasInterrupted = false;
    let isInterrupting = false;
    let messageCounter = 0;

    initSlider();

    // API key
    const savedKey = storage.getItem('groq-api-key');
    if (savedKey) {
        ui.setApiKey(savedKey);
    }

    document.getElementById('api-key').addEventListener('change', () => {
        storage.setItem('groq-api-key', ui.getApiKey());
    });

    // TTS callbacks
    ttsService.onSpeakingStarted = () => {
        if (voiceDetector) {
            voiceDetector.start();
            ui.updateUI(true, false);
        }
    };

    ttsService.onSpeakingEnded = () => {};
    ttsService.onSpeakingInterrupted = () => {
        wasInterrupted = true;
    };

    // Start button → activer la détection vocale
    document.getElementById('start-button').addEventListener('click', async () => {
        try {
            voiceDetector = new VoiceDetector({
                onSpeechStart: () => {
                    if (ttsService.isSpeaking) {
                        isInterrupting = true;
                        ttsService.cancel();
                        transcriptionService.cancel();
                        chatService.cancel();
                        processing = false;
                    }
                    if (!voiceDetector.isMuted()) {
                        ui.updateUI(true, true);
                    }
                },
                onSpeechEnd: (audio) => {
                    if (!voiceDetector.isMuted() && audio?.length >= 100) {
                        ui.updateUI(true, false);
                        processAudioSegment(audio);
                        isInterrupting = false;
                    }
                },
                onError: (error) => {
                    console.error("Erreur de détection vocale:", error);
                    conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
                }
            });

            const success = await voiceDetector.initialize();
            if (success) {
                voiceDetector.start();
                ui.updateUI(true, false);
                conversation.addInfoMessage("Détection vocale démarrée", 'success');
            } else {
                throw new Error("Échec de l'initialisation");
            }
        } catch (error) {
            console.error("Erreur:", error);
            conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
        }
    });

    // Stop button → tout arrêter
    document.getElementById('stop-button').addEventListener('click', () => {
        stopEverything();
    });

    // Mute
    document.getElementById('mute-button').addEventListener('click', () => {
        if (voiceDetector) {
            voiceDetector.setMute(!voiceDetector.isMuted());
            ui.updateMuteState(voiceDetector.isMuted());
        }
    });

    // Formulaire texte
    const textForm = document.getElementById('text-input-form');
    if (textForm) {
        textForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const textInput = document.getElementById('text-input');
            const message = textInput.value.trim();
            if (!message) return;

            try {
                const apiKey = ui.getApiKey();
                if (!apiKey) throw new Error("Aucune clé API");

                const messageId = ++messageCounter;
                conversation.addUserTextMessage(messageId, message);

                textInput.value = '';
                textInput.disabled = true;
                document.getElementById('send-text-button').disabled = true;

                conversation.addPendingAssistantMessage(messageId);
                const response = await chatService.sendMessage(message, apiKey);

                conversation.updateAssistantMessage(messageId, response);

                try {
                    await ttsService.speak(response);
                } catch (ttsError) {
                    console.error("Erreur TTS:", ttsError);
                }

            } catch (error) {
                console.error("Erreur:", error);
                conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
            } finally {
                textInput.disabled = false;
                textInput.focus();
                document.getElementById('send-text-button').disabled = false;
            }
        });
    }

    async function processAudioSegment(audioData) {
        if (!audioData || audioData.length < 100) return;

        segments.push(audioData);
        const segmentId = ++messageCounter;
        ui.addSegment(segments.length, audioData.length / 16000);

        try {
            processing = true;
            ui.updateUI(true, false, true);
            voiceDetector.pause();

            conversation.addPendingUserMessage(segmentId);

            const apiKey = ui.getApiKey();
            if (!apiKey) throw new Error("Aucune clé API");

            const transcription = await transcriptionService.transcribe(audioData, apiKey);

            if (transcription.toLowerCase().includes('fin de discussion')) {
                stopEverything();
                return;
            }
            if (!transcription.toLowerCase().includes('monsieur')) {
                stopEverything(); // on arrête tout proprement
            
                setTimeout(() => {
                    // simulate a click sur le bouton start pour tout relancer
                    document.getElementById('start-button').click();
                }, 500); // petit délai pour que tout soit bien reset
            
                return;
            }
            
            
            conversation.updateUserMessage(segmentId, transcription);

            conversation.addPendingAssistantMessage(segmentId);
            const response = await chatService.sendMessage(transcription, apiKey);
            conversation.updateAssistantMessage(segmentId, response);

            wasInterrupted = false;
            try {
                await ttsService.speak(response);
            } catch (ttsError) {
                console.error("Erreur synthèse vocale:", ttsError);
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Erreur:", error);
                conversation.addInfoMessage(`Erreur: ${error.message}`, 'error');
            }
        } finally {
            processing = false;
            if (!wasInterrupted && voiceDetector?.isListening()) {
                ui.updateUI(true, false);
            }
        }
    }

    function stopEverything() {
        if (voiceDetector) voiceDetector.stop();
        transcriptionService.cancel();
        chatService.cancel();
        ttsService.cancel();

        processing = false;
        wasInterrupted = false;
        isInterrupting = false;

        ui.updateUI(false);
        conversation.addInfoMessage('Session arrêtée', 'info');
    }

    const resetButton = document.querySelector('button.bg-emerald-50');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            stopEverything();
            conversation.clearConversation();
            segments = [];
            ui.resetSegments();
            chatService.clearHistory();
            messageCounter = 0;
            conversation.addInfoMessage('Conversation réinitialisée', 'success');
        });
    }
});
