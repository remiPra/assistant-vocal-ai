/**
 * Service de chat avec l'API
 */
export class ChatService {
    constructor() {
        this.messageHistory = [];
        this.currentAbortController = null;
    }

    /**
     * Envoie un message à l'API et obtient une réponse
     * @param {string} message - Message de l'utilisateur
     * @param {string} apiKey - Clé API Groq
     * @returns {Promise<string>} Réponse du modèle
     */
    async sendMessage(message, apiKey) {
        if (!apiKey) {
            throw new Error("Aucune clé API fournie");
        }

        // Ajouter le message à l'historique
        this.messageHistory.push({
            role: "user",
            content: message
        });

        // Créer un AbortController pour pouvoir annuler la requête
        this.currentAbortController = new AbortController();
        const signal = this.currentAbortController.signal;

        try {
            const response = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: this.messageHistory,
                        model: "gemma2-9b-it",
                    }),
                    signal: signal,
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur de chat: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            
            // Ajouter la réponse à l'historique
            if (result.choices && result.choices[0] && result.choices[0].message) {
                this.messageHistory.push(result.choices[0].message);
                return result.choices[0].message.content;
            } else {
                throw new Error("Format de réponse invalide");
            }
        } finally {
            this.currentAbortController = null;
        }
    }

    /**
     * Annule la requête de chat en cours
     */
    cancel() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    }

    /**
     * Réinitialise l'historique des messages
     */
    clearHistory() {
        this.messageHistory = [];
    }

    /**
     * Obtient l'historique des messages
     * @returns {Array} Historique des messages
     */
    getHistory() {
        return [...this.messageHistory];
    }
}