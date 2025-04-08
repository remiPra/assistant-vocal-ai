/**
 * Gestionnaire d'affichage de la conversation
 */
export class ConversationManager {
    /**
     * @param {HTMLElement} container - Élément conteneur pour la conversation
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Ajoute un message utilisateur avec statut en attente
     * @param {number} id - Identifiant du message
     * @returns {HTMLElement} Élément du message
     */
    addPendingUserMessage(id) {
        const message = document.createElement('div');
        message.className = 'p-3 mb-2 bg-blue-50 rounded-md flex items-start';
        message.id = `message-${id}`;
        message.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
            <div class="flex-grow">
                <div class="text-sm text-blue-700 mb-1">Vous</div>
                <div><span class="inline-block animate-pulse">Transcription en cours...</span></div>
            </div>
        `;
        this.container.appendChild(message);
        this.scrollToBottom();
        return message;
    }

    /**
     * Met à jour un message utilisateur avec le texte transcrit
     * @param {number} id - Identifiant du message
     * @param {string} text - Texte transcrit
     */
    updateUserMessage(id, text) {
        const message = document.getElementById(`message-${id}`);
        if (message) {
            message.querySelector('div:last-child div:last-child').textContent = text;
        }
        this.scrollToBottom();
    }

    /**
     * Ajoute un message de l'assistant avec statut en attente
     * @param {number} id - Identifiant du message
     * @returns {HTMLElement} Élément du message
     */
    addPendingAssistantMessage(id) {
        const message = document.createElement('div');
        message.className = 'p-3 mb-2 bg-gray-50 rounded-md flex items-start';
        message.id = `response-${id}`;
        message.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white mr-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <div class="flex-grow">
                <div class="text-sm text-purple-700 mb-1">Assistant</div>
                <div><span class="inline-block animate-pulse">Génération de la réponse...</span></div>
            </div>
        `;
        this.container.appendChild(message);
        this.scrollToBottom();
        return message;
    }

    /**
     * Met à jour un message de l'assistant avec la réponse
     * @param {number} id - Identifiant du message
     * @param {string} text - Texte de la réponse
     */
    updateAssistantMessage(id, text) {
        const message = document.getElementById(`response-${id}`);
        if (message) {
            const contentDiv = message.querySelector('div:last-child div:last-child');
            contentDiv.textContent = text;
            contentDiv.classList.remove('animate-pulse');
        }
        this.scrollToBottom();
    }

    /**
     * Ajoute un message d'information
     * @param {string} text - Texte informatif
     * @param {string} type - Type de message (info, error, success)
     */
    addInfoMessage(text, type = 'info') {
        const colors = {
            info: 'bg-blue-100',
            error: 'bg-red-100',
            success: 'bg-green-100'
        };
        
        const message = document.createElement('div');
        message.className = `p-3 mb-2 ${colors[type]} rounded-md text-center`;
        message.textContent = text;
        this.container.appendChild(message);
        this.scrollToBottom();
    }

    /**
     * Fait défiler la conversation jusqu'en bas
     */
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }
    /**
 * Ajoute un message utilisateur provenant de l'input texte
 * @param {number} id - Identifiant du message
 * @param {string} text - Texte du message
 */
addUserTextMessage(id, text) {
    const message = document.createElement('div');
    message.className = 'p-3 mb-2 bg-blue-50 rounded-md flex items-start';
    message.id = `message-${id}`;
    message.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
        <div class="flex-grow">
            <div class="text-sm text-blue-700 mb-1">Vous (texte)</div>
            <div>${text}</div>
        </div>
    `;
    this.container.appendChild(message);
    this.scrollToBottom();
    return message;
}
}