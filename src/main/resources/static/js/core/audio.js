/**
 * core/audio.js - Speech synthesis management
 * Lightweight audio handling for story reading
 */

const Audio = {
    speech: null,
    speechQueue: [],
    isPlaying: false,
    voices: [],

    init() {
        this.loadVoices();

        // Handle browsers that load voices asynchronously
        if (window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                this.loadVoices();
            });
        }
    },

    loadVoices() {
        if (!window.speechSynthesis) return;

        const allVoices = window.speechSynthesis.getVoices();

        // Preferred voices in order of preference
        const preferredVoices = [
            'Google US English',
            'Microsoft Zira Desktop',
            'Samantha',
            'Google US English Female',
            'Alex'
        ];

        // Language preferences
        const languagePreferences = ['en-US', 'en-GB', 'en'];

        let selectedVoice = null;

        // Try to find preferred voice
        for (const voiceName of preferredVoices) {
            selectedVoice = allVoices.find(voice => voice.name.includes(voiceName));
            if (selectedVoice) break;
        }

        // Fallback to language-based selection
        if (!selectedVoice) {
            for (const lang of languagePreferences) {
                selectedVoice = allVoices.find(voice => voice.lang.startsWith(lang));
                if (selectedVoice) break;
            }
        }

        // Final fallback
        if (!selectedVoice && allVoices.length > 0) {
            selectedVoice = allVoices[0];
        }

        this.voices = selectedVoice ? [selectedVoice] : [];
    },

    splitTextIntoSentences(text) {
        return text.split(/(?<=[.!?])\s+/).filter(sentence =>
            sentence.trim().length > 0
        );
    },

    speak(text) {
        if (!window.speechSynthesis || !text) return false;

        this.stop(); // Stop any current speech

        const sentences = this.splitTextIntoSentences(text);
        this.speechQueue = [...sentences];

        if (this.speechQueue.length === 0) return false;

        this.speakNextSentence();
        return true;
    },

    speakNextSentence() {
        if (this.speechQueue.length === 0) {
            this.isPlaying = false;
            this.onComplete();
            return;
        }

        const sentence = this.speechQueue.shift();
        this.speech = new SpeechSynthesisUtterance(sentence);

        // Configure voice settings
        this.speech.rate = 0.85;
        this.speech.pitch = 1.0;
        this.speech.volume = 1.0;

        // Use selected voice
        if (this.voices.length > 0) {
            this.speech.voice = this.voices[0];
        }

        // Event handlers
        this.speech.onstart = () => {
            this.isPlaying = true;
            this.onStart();
        };

        this.speech.onend = () => {
            this.speakNextSentence();
        };

        this.speech.onerror = (event) => {
            console.warn('Speech synthesis error:', event.error);
            this.stop();
        };

        window.speechSynthesis.speak(this.speech);
    },

    stop() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        this.speechQueue = [];
        this.isPlaying = false;
        this.onStop();
    },

    toggle(text) {
        if (this.isPlaying) {
            this.stop();
            return false;
        } else {
            return this.speak(text);
        }
    },

    // Event callbacks (override these)
    onStart() {
        const readBtn = document.getElementById('readBtn');
        if (readBtn) {
            readBtn.classList.add('playing');
        }
    },

    onStop() {
        const readBtn = document.getElementById('readBtn');
        if (readBtn) {
            readBtn.classList.remove('playing');
        }
    },

    onComplete() {
        this.onStop();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Audio.init();
});

// Global function for backward compatibility
window.toggleReadAloud = (text) => {
    if (!text) {
        const activeStoryText = document.querySelector('.story-page.active .story-text');
        text = activeStoryText ? activeStoryText.textContent : '';
    }
    return Audio.toggle(text);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Audio };
}