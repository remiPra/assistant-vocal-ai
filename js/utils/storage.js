/**
 * Gestion du stockage local
 */
export class StorageManager {
    /**
     * Sauvegarde une valeur dans le stockage local
     * @param {string} key - Clé de stockage
     * @param {string} value - Valeur à stocker
     */
    setItem(key, value) {
        localStorage.setItem(key, value);
    }
    
    /**
     * Récupère une valeur depuis le stockage local
     * @param {string} key - Clé de stockage
     * @returns {string|null} La valeur stockée ou null
     */
    getItem(key) {
        return localStorage.getItem(key);
    }
    
    /**
     * Supprime une valeur du stockage local
     * @param {string} key - Clé à supprimer
     */
    removeItem(key) {
        localStorage.removeItem(key);
    }
}