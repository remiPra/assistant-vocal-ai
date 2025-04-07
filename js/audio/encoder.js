/**
 * Classe pour l'encodage audio
 */
export class AudioEncoder {
    /**
     * Convertit un tableau Float32Array en PCM 16 bits
     * @param {DataView} output - Vue de données de sortie
     * @param {number} offset - Offset dans la vue de données
     * @param {Float32Array} input - Données audio en Float32
     */
    static floatTo16BitPCM(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    /**
     * Écrit une chaîne dans une DataView
     * @param {DataView} view - Vue de données
     * @param {number} offset - Position de départ
     * @param {string} string - Chaîne à écrire
     */
    static writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Encode des données audio en format WAV
     * @param {Float32Array} samples - Échantillons audio
     * @param {number} sampleRate - Taux d'échantillonnage
     * @returns {ArrayBuffer} Données WAV encodées
     */
    static encodeWAV(samples, sampleRate = 16000) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        /* RIFF identifier */
        this.writeString(view, 0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + samples.length * 2, true);
        /* RIFF type */
        this.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        this.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, 1, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * 2, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, 2, true);
        /* bits per sample */
        view.setUint16(34, 16, true);
        /* data chunk identifier */
        this.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, samples.length * 2, true);

        this.floatTo16BitPCM(view, 44, samples);

        return buffer;
    }
    
    /**
     * Convertit un ArrayBuffer en Blob WAV
     * @param {Float32Array} audioData - Données audio
     * @returns {Blob} Blob WAV
     */
    static createWavBlob(audioData) {
        const wavBuffer = this.encodeWAV(audioData);
        return new Blob([wavBuffer], { type: 'audio/wav' });
    }
}