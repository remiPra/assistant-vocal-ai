/**
 * Classe d'utilitaires divers
 */
export class Helpers {
    /**
     * Génère un identifiant unique
     * @returns {string} Identifiant unique
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Attend pendant un certain temps
     * @param {number} ms - Temps d'attente en millisecondes
     * @returns {Promise} Promise résolue après le délai
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Formate une durée en secondes de manière lisible
     * @param {number} seconds - Durée en secondes
     * @returns {string} Durée formatée
     */
    static formatDuration(seconds) {
        seconds = Math.round(seconds * 10) / 10;
        return seconds + 's';
    }
    
    /**
     * Crée un élément DOM à partir d'une chaîne HTML
     * @param {string} html - Code HTML
     * @returns {HTMLElement} Élément DOM créé
     */
    static createElementFromHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }
}