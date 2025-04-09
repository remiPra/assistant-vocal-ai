/**
 * Gestion de l'interface utilisateur
 */
export class UIManager {
    constructor() {
        // Éléments DOM
        this.elements = {
            startButton: document.getElementById('start-button'),
            stopButton: document.getElementById('stop-button'),
            muteButton: document.getElementById('mute-button'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.getElementById('status-text'),
            segmentsCount: document.getElementById('segments-count'),
            segmentsList: document.getElementById('segments-list'),
            apiKeyInput: document.getElementById('api-key')
        };
        
        // Cacher initialement le bouton stop
        if (this.elements.stopButton) {
            this.elements.stopButton.style.display = 'none';
        }
    }

    /**
     * Met à jour l'interface en fonction de l'état
     * @param {boolean} listening - En écoute ou non
     * @param {boolean} speaking - Parole détectée
     * @param {boolean} processing - En cours de traitement
     */
    updateUI(listening, speaking = false, processing = false) {
        if (listening) {
            // Mode écoute
            // Cacher le bouton démarrer et montrer le bouton arrêt
            this.elements.startButton.style.display = 'none';
            this.elements.stopButton.style.display = 'flex';
            
            // Mise à jour des états et styles
            this.elements.startButton.disabled = true;
            this.elements.startButton.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            this.elements.startButton.classList.remove('bg-blue-800', 'text-white', 'hover:bg-blue-900');
            
            this.elements.stopButton.disabled = false;
            this.elements.stopButton.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
            this.elements.stopButton.classList.remove('bg-slate-200', 'text-slate-400', 'cursor-not-allowed');
            
            this.elements.muteButton.disabled = false;
            this.elements.muteButton.classList.remove('cursor-not-allowed');
            
            if (processing) {
                this.elements.statusText.textContent = 'Traitement en cours...';
                this.elements.statusIndicator.classList.remove('bg-slate-200', 'bg-yellow-500', 'bg-green-500', 'bg-red-500');
                this.elements.statusIndicator.classList.add('bg-blue-500');
            } else {
                this.elements.statusText.textContent = speaking ? 'Parole détectée' : 'En attente de parole';
                this.elements.statusIndicator.classList.remove('bg-slate-200', 'bg-blue-500', 'bg-red-500');
                this.elements.statusIndicator.classList.add(speaking ? 'bg-green-500' : 'bg-yellow-500');
            }
        } else {
            // Mode arrêté
            // Montrer le bouton démarrer et cacher le bouton arrêt
            this.elements.startButton.style.display = 'flex';
            this.elements.stopButton.style.display = 'none';
            
            // Mise à jour des états et styles
            this.elements.startButton.disabled = false;
            this.elements.startButton.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            this.elements.startButton.classList.add('bg-blue-800', 'text-white', 'hover:bg-blue-900');
            
            this.elements.stopButton.disabled = true;
            this.elements.stopButton.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600');
            this.elements.stopButton.classList.add('bg-slate-200', 'text-slate-400', 'cursor-not-allowed');
            
            this.elements.muteButton.disabled = true;
            this.elements.muteButton.classList.add('cursor-not-allowed');
            
            this.elements.statusText.textContent = 'En attente de démarrer';
            this.elements.statusIndicator.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500');
            this.elements.statusIndicator.classList.add('bg-slate-200');
        }
    }

    /**
     * Met à jour l'état de la sourdine
     * @param {boolean} muted - État de la sourdine
     */
    updateMuteState(muted) {
        if (muted) {
            this.elements.muteButton.innerHTML = '<i class="fas fa-microphone mr-2"></i>';
            this.elements.muteButton.classList.remove('bg-amber-500', 'hover:bg-amber-600');
            this.elements.muteButton.classList.add('bg-green-500', 'hover:bg-green-600');
            this.elements.statusIndicator.classList.remove('bg-yellow-500', 'bg-green-500');
            this.elements.statusIndicator.classList.add('bg-red-500');
            this.elements.statusText.textContent = 'Microphone coupé';
        } else {
            this.elements.muteButton.innerHTML = '<i class="fas fa-microphone-slash mr-2"></i>';
            this.elements.muteButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            this.elements.muteButton.classList.add('bg-amber-500', 'hover:bg-amber-600');
            this.elements.statusIndicator.classList.remove('bg-red-500');
            this.elements.statusIndicator.classList.add('bg-yellow-500');
            this.elements.statusText.textContent = 'En attente de parole';
        }
    }

    /**
     * Ajoute un segment audio à la liste
     * @param {number} segmentId - ID du segment
     * @param {number} duration - Durée en secondes
     */
    addSegment(segmentId, duration) {
        this.elements.segmentsCount.textContent = segmentId;
        
        const segment = document.createElement('div');
        segment.className = 'text-sm text-gray-700';
        segment.textContent = `Segment #${segmentId} - ${Math.round(duration * 100) / 100}s`;
        this.elements.segmentsList.appendChild(segment);
    }

    /**
     * Réinitialise les segments
     */
    resetSegments() {
        this.elements.segmentsCount.textContent = '0';
        this.elements.segmentsList.innerHTML = '';
    }

    /**
     * Récupère la clé API
     * @returns {string} Clé API
     */
    getApiKey() {
        return this.elements.apiKeyInput.value;
    }

    /**
     * Définit la clé API
     * @param {string} key - Clé API
     */
    setApiKey(key) {
        this.elements.apiKeyInput.value = key;
    }
}