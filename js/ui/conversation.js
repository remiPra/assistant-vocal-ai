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
        message.className = 'message user mb-6 flex justify-end';
        message.id = `message-${id}`;
        message.innerHTML = `
            <div class="bg-blue-900 text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[80%]">
                <div><span class="inline-block animate-pulse">Transcription en cours...</span></div>
                <div class="flex justify-end mt-1">
                    <span class="text-xs text-blue-200">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
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
            const contentDiv = message.querySelector('div div:first-child');
            contentDiv.innerHTML = ''; // Vider le contenu
            contentDiv.textContent = text; // Ajouter le nouveau texte
            contentDiv.classList.remove('animate-pulse');
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
        message.className = 'message assistant mb-6 flex justify-start';
        message.id = `response-${id}`;
        message.innerHTML = `
            <div class="bg-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] text-slate-800">
                <div><span class="inline-block animate-pulse">Génération de la réponse...</span></div>
                <div class="flex justify-start mt-1">
                    <span class="text-xs text-slate-500">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
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
            const contentDiv = message.querySelector('div div:first-child');
            contentDiv.innerHTML = ''; // Vider le contenu
            contentDiv.textContent = text; // Ajouter le nouveau texte
            contentDiv.classList.remove('animate-pulse');
        }
        this.scrollToBottom();
    }

    /**
     * Ajoute un message d'information
     * @param {string} text - Texte informatif
     * @param {string} type - Type de message (info, error, success, warning)
     */
    addInfoMessage(text, type = 'info') {
        const colors = {
            info: 'bg-slate-200 text-slate-800',
            error: 'bg-red-100 text-red-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-amber-100 text-amber-800'
        };
        
        const message = document.createElement('div');
        message.className = `p-3 mb-4 ${colors[type]} rounded-md text-center text-sm max-w-[80%] mx-auto shadow-sm`;
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
        message.className = 'message user mb-6 flex justify-end';
        message.id = `message-${id}`;
        message.innerHTML = `
            <div class="bg-blue-900 text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[80%]">
                <p>${text}</p>
                <div class="flex justify-end mt-1">
                    <span class="text-xs text-blue-200">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>
        `;
        this.container.appendChild(message);
        this.scrollToBottom();
        return message;
    }

    /**
     * Vide la conversation
     */
    clearConversation() {
        this.container.innerHTML = '';
    }
}