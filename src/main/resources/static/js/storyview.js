/**
 * Enhanced Story View Interaction Script
 */

// Core variables
let currentPageIndex = 0;
let magicMenuOpen = false;
let speech = null;
let speechQueue = [];
let isSpeaking = false;
let speechSynthVoices = [];
let totalPagesCount = 0;

/**
 * Show a specific page by index
 * @param {number} index - The index of the page to show
 */
function showPage(index) {
    // Create a page turn effect
    const pageElement = document.getElementById('page-' + index);

    // Stop any ongoing speech
    stopReading();

    // Hide all pages
    document.querySelectorAll('.story-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page with animation
    pageElement.style.opacity = '0';
    pageElement.classList.add('active');

    setTimeout(() => {
        pageElement.style.opacity = '1';
        pageElement.style.transform = 'translateY(0)';
    }, 50);

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').style.display = index === totalPagesCount - 1 ? 'none' : 'inline-block';
    document.getElementById('exitBtn').style.display = index === totalPagesCount - 1 ? 'inline-block' : 'none';

    // Update page indicator and progress bar
    document.getElementById('currentPage').textContent = index + 1;
    updateProgressBar(index);

    // Update questions button if function exists
    if (typeof updateQuestionsButton === 'function') {
        updateQuestionsButton();
    }

    // If it's the last page, celebrate
    if (index === totalPagesCount - 1) {
        setTimeout(() => {
            createShower('⭐');
            playSound('twinkle');
            showAchievement('Story Completed!', 'You have reached the end of the story!');
        }, 500);
    }
}

/**
 * Update progress bar based on current page
 * @param {number} index - Current page index
 */
function updateProgressBar(index) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = ((index + 1) / totalPagesCount) * 100;
    progressFill.style.width = progressPercentage + '%';
}

/**
 * Go to the next page with enhanced transition
 */
function nextPage() {
    // Optional question reminder
    if (typeof questionsAnswered !== 'undefined' && !questionsAnswered.has(currentPageIndex)) {
        // Highlight questions button
        const btn = document.getElementById('questionsBtn');
        btn.classList.add('pulse');
        setTimeout(() => {
            btn.classList.remove('pulse');
        }, 1000);

        // Show tiny shower reminder
        createTinyShower('❓', 3, true);
        playSound('pop');
    }

    if (currentPageIndex < totalPagesCount - 1) {
        const oldPage = document.querySelector('.story-page.active');
        oldPage.style.transform = 'translateX(-100px)';
        oldPage.style.opacity = '0';

        // Create page turn effect
        showPageTurnEffect('right');

        currentPageIndex++;

        // Play page turn sound
        playSound('page-turn');

        setTimeout(() => {
            showPage(currentPageIndex);
        }, 300);
    }
}

/**
 * Go to the previous page
 */
function previousPage() {
    if (currentPageIndex > 0) {
        const oldPage = document.querySelector('.story-page.active');
        oldPage.style.transform = 'translateX(100px)';
        oldPage.style.opacity = '0';

        // Create page turn effect
        showPageTurnEffect('left');

        currentPageIndex--;

        // Play page turn sound
        playSound('page-turn');

        setTimeout(() => {
            showPage(currentPageIndex);
        }, 300);
    }
}

/**
 * Initialize speech synthesis with robust voice selection
 */
function initSpeechSynthesis() {
    // Comprehensive voice loading with fallback strategy
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

        speechSynthVoices = selectedVoice ? [selectedVoice] : [];
        console.log('Selected Voice:', selectedVoice ? selectedVoice.name : 'No voice found');
    }

    // Initial load
    loadVoices();

    // Handle browsers that load voices asynchronously
    if (speechSynthVoices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }
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
 * Start reading the current page text
 * @param {string} text - The text to read
 */
function startReading(text) {
    // Stop any ongoing speech
    stopReading();

    // Split text into sentences
    const sentences = splitTextIntoSentences(text);
    speechQueue = sentences;

    // If no sentences, return
    if (speechQueue.length === 0) return;

    // Configure speech
    function speakNextSentence() {
        if (speechQueue.length === 0) {
            // Reading complete
            isSpeaking = false;
            const readBtn = document.getElementById('readBtn');
            readBtn.classList.remove('playing');
            hideReadingIndicator();
            showAchievement('Listener', 'You listened to a page being read aloud!');
            return;
        }

        const sentence = speechQueue.shift();
        speech = new SpeechSynthesisUtterance(sentence);

        // Configure voice settings
        speech.rate = 0.85;  // Slightly slower for clarity
        speech.pitch = 1.0;  // Natural pitch
        speech.volume = 1.0; // Full volume

        // Use pre-selected voice
        if (speechSynthVoices.length > 0) {
            speech.voice = speechSynthVoices[0];
        }

        // Event handlers
        speech.onstart = () => {
            isSpeaking = true;
            const readBtn = document.getElementById('readBtn');
            readBtn.classList.add('playing');
            showReadingIndicator();
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

function showReadingIndicator(){
}

function hideReadingIndicator(){
}

function addReadingIndicatorStyles(){
}
/**
 * Stop reading and cancel speech
 */
function stopReading() {
    if (speech) {
        window.speechSynthesis.cancel();
        speechQueue = []; // Clear the queue

        const readBtn = document.getElementById('readBtn');
        readBtn.classList.remove('playing');

        isSpeaking = false;
        hideReadingIndicator();
    }
}

/**
 * Toggle read aloud functionality
 */
function toggleReadAloud() {
    const readBtn = document.getElementById('readBtn');

    if (speech && window.speechSynthesis.speaking) {
        stopReading();
    } else {
        const currentText = document.querySelector('.story-page.active .story-text').textContent;
        startReading(currentText);

        // Visual indication that reading is happening
        createTinyShower('💬', 3, true);
    }
}

/**
 * Show page turn effect animation
 * @param {string} direction - The direction of the page turn ('left' or 'right')
 */
/**
 * Show page turn effect animation
 * @param {string} direction - The direction of the page turn ('left' or 'right')
 */
function showPageTurnEffect(direction) {
    // Create the effect elements dynamically if they don't exist
    let effect = document.querySelector('.page-turn-effect');
    if (!effect) {
        effect = document.createElement('div');
        effect.className = 'page-turn-effect';
        effect.style.position = 'fixed';
        effect.style.top = '0';
        effect.style.left = '0';
        effect.style.width = '100%';
        effect.style.height = '100%';
        effect.style.zIndex = '1000';
        effect.style.pointerEvents = 'none';
        effect.style.display = 'none';

        const fold = document.createElement('div');
        fold.className = 'page-turn-fold';
        fold.style.position = 'absolute';
        fold.style.backgroundColor = 'var(--page-color, #f0f0f0)';
        fold.style.transformOrigin = 'top left';

        effect.appendChild(fold);
        document.body.appendChild(effect);
    }

    const fold = effect.querySelector('.page-turn-fold');

    // Fallback color if CSS variable is not set
    const pageColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-color') || '#f0f0f0';

    // Set up the effect based on direction
    if (direction === 'right') {
        fold.style.top = '0';
        fold.style.right = '0';
        fold.style.borderWidth = '0 0 100vh 100vw';
        fold.style.borderColor = `transparent transparent ${pageColor} transparent`;
        fold.style.borderStyle = 'solid';
    } else {
        fold.style.top = '0';
        fold.style.left = '0';
        fold.style.borderWidth = '100vh 100vw 0 0';
        fold.style.borderColor = `${pageColor} transparent transparent transparent`;
        fold.style.borderStyle = 'solid';
    }

    // Show the effect
    effect.style.display = 'block';

    // Animate the fold
    setTimeout(() => {
        fold.style.borderWidth = '0 0 0 0';
    }, 10);

    // Hide the effect after animation completes
    setTimeout(() => {
        effect.style.display = 'none';
    }, 300);
}
// User metrics tracking
let interactionId = null;
let startTime = Date.now();
let lastUpdateTime = startTime;
let questionCorrectCount = 0;
let questionTotalCount = 0;

/**
 * Initialize metrics tracking
 */
function initializeMetricsTracking() {
    // Get interaction ID if logged in
    const interactionData = document.getElementById('interactionData');
    interactionId = interactionData ? interactionData.dataset.interactionId : null;

    if (interactionId) {
        // Setup periodic tracking update
        setInterval(updateTimeSpent, 30000); // Update every 30 seconds

        // Update on page change
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                updateTimeSpent();
            }
        });

        // Update on page unload
        window.addEventListener('beforeunload', function() {
            updateTimeSpent();
        });
    }
}

/**
 * Update time spent on story
 */
function updateTimeSpent() {
    if (!interactionId) return;

    const now = Date.now();
    const timeSinceLastUpdate = Math.floor((now - lastUpdateTime) / 1000); // In seconds

    if (timeSinceLastUpdate > 2) { // Only update if more than 2 seconds have passed
        // Send update to server
        fetch(`/api/interactions/${interactionId}/time`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seconds: timeSinceLastUpdate })
        }).catch(error => console.error('Failed to update time spent:', error));

        lastUpdateTime = now;
    }
}

/**
 * Record question answer
 * @param {boolean} correct - Whether the answer was correct
 */
function recordQuestionAnswer(correct) {
    if (!interactionId) return;

    questionTotalCount++;
    if (correct) questionCorrectCount++;

    // Send data to server
    fetch(`/api/interactions/${interactionId}/question`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correct: correct })
    }).catch(error => console.error('Failed to record question answer:', error));
}

/**
 * Record story completion
 */
function recordStoryCompletion() {
    if (!interactionId) return;

    // Send completion status to server
    fetch(`/api/interactions/${interactionId}/complete`, {
        method: 'POST'
    }).catch(error => console.error('Failed to record completion:', error));
}

// Initialize the story view when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    // Set total pages from global variable
    totalPagesCount = typeof totalPages !== 'undefined' ? totalPages :
        document.querySelectorAll('.story-page').length;

    // Initialize first page with animation
    const firstPage = document.querySelector('.story-page.active');
    if (firstPage) {
        firstPage.style.opacity = '0';
        firstPage.style.transform = 'translateY(20px)';

        setTimeout(() => {
            firstPage.style.opacity = '1';
            firstPage.style.transform = 'translateY(0)';
        }, 300);
    }

    // Add subtle sparkle to title
    setTimeout(() => {
        createTinyShower('✨', 3);
    }, 1000);

    // Initialize speech synthesis
    initSpeechSynthesis();

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextPage();
        if (e.key === 'ArrowLeft') previousPage();
        if (e.key === ' ') {
            e.preventDefault();
            toggleReadAloud();
        }
        if (e.key === 'm') {
            toggleMagicMenu();
        }
    });

    // Close magic menu when clicking outside
    document.addEventListener('click', (e) => {
        if (magicMenuOpen && !e.target.closest('.magic-corner')) {
            toggleMagicMenu();
        }
    });

    // Initialize metrics tracking
    initializeMetricsTracking();
});

/**
 * Toggle magic menu open/closed
 */
function toggleMagicMenu() {
    const menu = document.getElementById('magicMenu');
    magicMenuOpen = !magicMenuOpen;

    if (magicMenuOpen) {
        menu.style.display = 'flex';
        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        }, 10);

        // Play a subtle sound effect
        playSound('pop');
    } else {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.5)';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    }
}

/**
 * Create a shower of emoji particles
 * @param {string} emoji - The emoji to use
 */
function createShower(emoji) {
    const container = document.getElementById('particle-container');
    const count = 20 + Math.floor(Math.random() * 10); // Between 20-30 particles

    // Clear existing particles if there are too many
    if (container.children.length > 100) {
        container.innerHTML = '';
    }

    // Play a fun sound effect
    const audioEffects = {
        '⭐': 'twinkle',
        '❤️': 'pop',
        '🎈': 'balloon',
        '🌈': 'magic',
        '🎉': 'twinkle'
    };

    playSound(audioEffects[emoji] || 'pop');

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emoji;

        // Random position from click or center if no event
        const startX = 40 + Math.random() * (window.innerWidth - 80);
        const startY = window.innerHeight;

        // Random end position
        const endX = startX + (Math.random() - 0.5) * 300;
        const endY = 100 + Math.random() * 400;

        // Random sizes - much larger now
        const size = 40 + Math.random() * 60;

        // Set styles
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.fontSize = size + 'px';

        // Add to container
        container.appendChild(particle);

        // Animate upward
        setTimeout(() => {
            particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 360}deg)`;
            particle.style.opacity = '0';
        }, 10);

        // Remove after animation completes
        setTimeout(() => {
            if (container.contains(particle)) {
                container.removeChild(particle);
            }
        }, 3000);
    }
}

/**
 * Create a smaller shower of emoji particles
 * @param {string} emoji - The emoji to use
 * @param {number} count - Number of particles
 * @param {boolean} nearButton - Whether to position near a button
 */
function createTinyShower(emoji, count = 5, nearButton = false) {
    const container = document.getElementById('particle-container');

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle tiny';
        particle.textContent = emoji;

        let startX, startY;

        if (nearButton) {
            // Position near the button
            const buttonId = emoji === '❓' ? 'questionsBtn' : (emoji === '💬' ? 'readBtn' : 'questionsBtn');
            const button = document.getElementById(buttonId);
            const rect = button.getBoundingClientRect();
            startX = rect.x + rect.width/2 + (Math.random() - 0.5) * 20;
            startY = rect.y;
        } else {
            startX = Math.random() * window.innerWidth;
            startY = Math.random() * window.innerHeight;
        }

        // Random end position
        const endX = startX + (Math.random() - 0.5) * 100;
        const endY = startY - 50 - Math.random() * 50;
        const rotation = (Math.random() - 0.5) * 60;

        // Set styles
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.fontSize = 20 + Math.random() * 10 + 'px';

        // Add to container
        container.appendChild(particle);

        // Animate upward
        setTimeout(() => {
            particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${rotation}deg)`;
            particle.style.opacity = '0';
        }, 10);

        // Remove after animation completes
        setTimeout(() => {
            if (container.contains(particle)) {
                container.removeChild(particle);
            }
        }, 2000);
    }
}

/**
 * Play a sound effect
 * @param {string} type - The type of sound to play
 */
function playSound(type) {
    // Create audio elements with different sounds
    let soundUrl;

    switch(type) {
        case 'twinkle':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/success.mp3';
            break;
        case 'pop':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/click.mp3';
            break;
        case 'balloon':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/notification.mp3';
            break;
        case 'magic':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/toggle.mp3';
            break;
        case 'page-turn':
            soundUrl = 'https://cdn.jsdelivr.net/gh/Leimi/SoundButton@master/sounds/sfx_sounds_page-turn-01a.mp3';
            break;
        default:
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/click.mp3';
    }

    // Create and play the audio
    const audio = new Audio(soundUrl);
    audio.volume = 0.4; // 40% volume
    audio.play().catch(e => console.log('Audio play failed:', e));
}

/**
 * Show achievement notification
 * @param {string} title - Achievement title
 * @param {string} text - Achievement description
 */
function showAchievement(title, text) {
    const toast = document.getElementById('achievementToast');
    if (!toast) return; // Skip if element doesn't exist

    const achievementText = document.getElementById('achievementText');

    // Set achievement text
    achievementText.textContent = text;

    // Update title
    toast.querySelector('h4').textContent = title;

    // Show toast
    toast.classList.add('show');

    // Play sound
    playSound('twinkle');

    // Hide after some time
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

/**
 * Toggle theme between light and dark with enhanced transition
 */
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');

    // Create a transition overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(overlay);

    // Fade in overlay
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);

    // Switch theme after brief delay
    setTimeout(() => {
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }

        // Fade out overlay and remove
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }, 300);
}