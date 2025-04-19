/**
 * audio.js - Audio and Speech Synthesis
 * Audio module for SleepyTales application
 */

// Extend SleepyTales namespace
const SleepyTales = SleepyTales || {};

/**
 * Audio module for managing sound effects and speech synthesis
 */
SleepyTales.Audio = (function() {
    'use strict';

    // Private variables
    let audioEnabled = true;
    let volume = 0.4; // 40% default volume
    let speechSynthVoices = [];
    let isSpeaking = false;
    let speech = null;
    let speechQueue = [];
    let audioCache = {};

    // Sound effect URLs
    const soundUrls = {
        'twinkle': 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/success.mp3',
        'pop': 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/click.mp3',
        'balloon': 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/notification.mp3',
        'magic': 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/toggle.mp3',
        'page-turn': 'https://cdn.jsdelivr.net/gh/Leimi/SoundButton@master/sounds/sfx_sounds_page-turn-01a.mp3'
    };

    /**
     * Initialize the audio module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        // Set options
        audioEnabled = options.audioEnabled !== false;
        volume = options.volume || 0.4;

        // Initialize speech synthesis
        initSpeechSynthesis();

        // Listen for theme changes
        if (SleepyTales.UI && typeof SleepyTales.UI.onThemeChange === 'function') {
            SleepyTales.UI.onThemeChange(handleThemeChange);
        }

        // Log initialization
        SleepyTales.Core.log('Audio module initialized', {
            audioEnabled,
            volume,
            speechSynthesisAvailable: 'speechSynthesis' in window
        });
    }

    /**
     * Handle theme change
     * @param {string} theme - New theme
     */
    function handleThemeChange(theme) {
        // Can customize audio behavior based on theme
        SleepyTales.Core.log('Theme changed in audio module', theme);
    }

    /**
     * Initialize speech synthesis with robust voice selection
     */
    function initSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            SleepyTales.Core.log('Speech synthesis not supported');
            return;
        }

        // Get available voices
        speechSynthVoices = window.speechSynthesis.getVoices();

        // If voices aren't loaded yet, wait for them
        if (speechSynthVoices.length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                speechSynthVoices = loadVoices();
            });
        }
    }

    /**
     * Load and select appropriate voices
     * @returns {Array} Selected voices
     */
    function loadVoices() {
        const allVoices = window.speechSynthesis.getVoices();

        // Preferred voices in order
        const preferredVoices = [
            'Google US English',
            'Microsoft Zira Desktop',
            'Samantha',
            'Google US English Female',
            'Alex'
        ];

        // Language preferences
        const languagePreferences = ['en-US', 'en-GB', 'en'];

        // Voice selection strategy
        let selectedVoice = null;

        // First, try finding a preferred voice
        for (const voiceName of preferredVoices) {
            selectedVoice = allVoices.find(voice =>
                voice.name.includes(voiceName) ||
                preferredVoices.some(pref => voice.name.includes(pref))
            );

            if (selectedVoice) break;
        }

        // If no preferred voice, try language-based selection
        if (!selectedVoice) {
            for (const lang of languagePreferences) {
                selectedVoice = allVoices.find(voice =>
                    voice.lang.startsWith(lang)
                );

                if (selectedVoice) break;
            }
        }

        // Fallback to first available voice
        if (!selectedVoice && allVoices.length > 0) {
            selectedVoice = allVoices[0];
        }

        SleepyTales.Core.log('Selected voice:', selectedVoice ? selectedVoice.name : 'No voice found');

        return selectedVoice ? [selectedVoice] : [];
    }

    /**
     * Split text into sentences for more natural reading
     * @param {string} text - The text to split
     * @returns {string[]} Array of sentences
     */
    function splitTextIntoSentences(text) {
        // Regular expression to split on sentence-ending punctuation
        return text.split(/(?<=[.!?])\s+/).filter(sentence =>
            sentence.trim().length > 0
        );
    }

    /**
     * Play a sound effect
     * @param {string} type - The type of sound to play
     */
    function playSound(type) {
        if (!audioEnabled) return;

        const url = soundUrls[type] || soundUrls.pop;

        // Check cache first
        if (audioCache[url]) {
            const audio = audioCache[url];
            audio.currentTime = 0;
            audio.volume = volume;
            audio.play().catch(e => SleepyTales.Core.log('Audio play failed:', e));
            return;
        }

        // Create new audio element
        const audio = new Audio(url);
        audio.volume = volume;

        // Cache for future use
        audioCache[url] = audio;

        // Play the sound
        audio.play().catch(e => SleepyTales.Core.log('Audio play failed:', e));
    }

    /**
     * Start reading the provided text
     * @param {string} text - Text to read aloud
     * @param {Function} [onWordCallback] - Callback for word highlighting
     * @param {Function} [onComplete] - Callback for when reading is complete
     */
    function startReading(text, onWordCallback, onComplete) {
        if (!audioEnabled || !('speechSynthesis' in window)) return;

        // Stop any ongoing speech
        stopReading();

        // Split text into sentences
        const sentences = splitTextIntoSentences(text);
        speechQueue = sentences;

        // If no sentences, return
        if (speechQueue.length === 0) return;

        // Show reading indicator if Animations module exists
        if (SleepyTales.Animations) {
            SleepyTales.Animations.showReadingIndicator(true);
        }

        // Configure speech
        function speakNextSentence() {
            if (speechQueue.length === 0) {
                // Reading complete
                isSpeaking = false;

                // Hide reading indicator
                if (SleepyTales.Animations) {
                    SleepyTales.Animations.showReadingIndicator(false);
                }

                // Call complete callback
                if (typeof onComplete === 'function') {
                    onComplete();
                }

                return;
            }

            const sentence = speechQueue.shift();
            speech = new SpeechSynthesisUtterance(sentence);

            // Configure voice settings
            speech.rate = 0.85;  // Slightly slower for clarity
            speech.pitch = 1.0;  // Natural pitch
            speech.volume = volume;

            // Use pre-selected voice
            if (speechSynthVoices.length > 0) {
                speech.voice = speechSynthVoices[0];
            }

            // Word boundary event for highlighting
            if (typeof onWordCallback === 'function') {
                let wordIndex = 0;
                const words = sentence.split(/\s+/);

                speech.onboundary = function(event) {
                    if (event.name === 'word') {
                        // Call the callback with current word index
                        onWordCallback(wordIndex);
                        wordIndex++;
                    }
                };
            }

            // Event handlers
            speech.onstart = () => {
                isSpeaking = true;

                // Update UI elements
                const readBtn = document.getElementById('readBtn');
                if (readBtn) {
                    readBtn.classList.add('playing');
                }
            };

            speech.onend = () => {
                // Immediately start next sentence
                speakNextSentence();
            };

            // Speak the sentence
            window.speechSynthesis.speak(speech);
        }

        // Start speaking the first sentence
        speakNextSentence();
    }

    /**
     * Stop reading and cancel speech
     */
    function stopReading() {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        speechQueue = [];

        const readBtn = document.getElementById('readBtn');
        if (readBtn) {
            readBtn.classList.remove('playing');
        }

        isSpeaking = false;

        // Hide reading indicator
        if (SleepyTales.Animations) {
            SleepyTales.Animations.showReadingIndicator(false);
        }
    }

    /**
     * Toggle read aloud functionality
     * @param {string} text - Text to read
     * @param {Function} [onWordCallback] - Callback for word highlighting
     * @param {Function} [onComplete] - Callback for when reading is complete
     */
    function toggleReadAloud(text, onWordCallback, onComplete) {
        const readBtn = document.getElementById('readBtn');

        if (speech && window.speechSynthesis.speaking) {
            stopReading();
            if (readBtn) {
                readBtn.classList.remove('playing');
            }
        } else {
            startReading(text, onWordCallback, onComplete);
            if (readBtn) {
                readBtn.classList.add('playing');
            }

            // Visual indication that reading is happening
            if (SleepyTales.Animations) {
                SleepyTales.Animations.createTinyShower('💬', 3, true);
            }
        }
    }

    /**
     * Check if speech synthesis is currently active
     * @returns {boolean} True if speaking
     */
    function isSpeechActive() {
        return isSpeaking;
    }

    /**
     * Set audio volume
     * @param {number} newVolume - Volume level (0-1)
     */
    function setVolume(newVolume) {
        volume = Math.max(0, Math.min(1, newVolume));
    }

    /**
     * Toggle audio on/off
     * @param {boolean} [state] - Forced state
     * @returns {boolean} New audio state
     */
    function toggleAudio(state) {
        if (state !== undefined) {
            audioEnabled = Boolean(state);
        } else {
            audioEnabled = !audioEnabled;
        }

        if (!audioEnabled) {
            stopReading();
        }

        return audioEnabled;
    }

    // Public API
    return {
        init,
        playSound,
        startReading,
        stopReading,
        toggleReadAloud,
        isSpeechActive,
        setVolume,
        toggleAudio
    };
})();

// Initialize audio when document is ready
SleepyTales.Core.onDocumentReady(function() {
    SleepyTales.Audio.init();
});