/**
 * Core functionality for the story view page
 */

// Core variables
let currentPageIndex = 0;
let speech = null;
let magicMenuOpen = false;
let isSpeaking = false;
let speechSynthVoices = [];

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
    document.getElementById('nextBtn').style.display = index === totalPages - 1 ? 'none' : 'inline-block';
    document.getElementById('exitBtn').style.display = index === totalPages - 1 ? 'inline-block' : 'none';

   // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = ((index + 1) / totalPages) * 100;
    progressFill.style.width = progressPercentage + '%';

    // Update page indicator
    document.getElementById('currentPage').textContent = index + 1;

    // Update questions button if function exists
    if (typeof updateQuestionsButton === 'function') {
        updateQuestionsButton();
    }

    // If it's the last page, celebrate
    if (index === totalPages - 1) {
        setTimeout(() => {
            createShower('⭐');
            playSound('twinkle');
        }, 500);
    }
}

/**
 * Go to the next page
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

    if (currentPageIndex < totalPages - 1) {
        const oldPage = document.getElementById('page-' + currentPageIndex);
        oldPage.style.transform = 'translateX(-100px)';
        oldPage.style.opacity = '0';

        currentPageIndex++;

        const newPage = document.getElementById('page-' + currentPageIndex);
        newPage.style.transform = 'translateX(100px)';

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
        const oldPage = document.getElementById('page-' + currentPageIndex);
        oldPage.style.transform = 'translateX(100px)';
        oldPage.style.opacity = '0';

        currentPageIndex--;

        const newPage = document.getElementById('page-' + currentPageIndex);
        newPage.style.transform = 'translateX(-100px)';

        // Play page turn sound
        playSound('page-turn');

        setTimeout(() => {
            showPage(currentPageIndex);
        }, 300);
    }
}

function initSpeechSynthesis() {
    // Initialize voices array
    speechSynthVoices = [];

    // Function to load voices and select the best one
    const loadVoices = () => {
        // Get all available voices
        const allVoices = window.speechSynthesis.getVoices();

        // Top-tier voices known for natural sound (in order of preference)
        const topVoices = [
            "Google US English",
            "Microsoft Zira",
            "Samantha",
            "Google US English Female"
        ];

        // Try to find one of our preferred voices
        for (const voiceName of topVoices) {
            const voice = allVoices.find(v => v.name.includes(voiceName));
            if (voice) {
                speechSynthVoices = [voice]; // Just use this single voice
                console.log("Selected voice:", voice.name);
                return; // Exit once we've found a good voice
            }
        }

        // If no preferred voice found, try to find any US English voice
        const usVoice = allVoices.find(v => v.lang === 'en-US');
        if (usVoice) {
            speechSynthVoices = [usVoice];
            console.log("Fallback to US voice:", usVoice.name);
            return;
        }

        // Last resort: just use the first English voice
        const anyEnglishVoice = allVoices.find(v => v.lang.includes('en'));
        if (anyEnglishVoice) {
            speechSynthVoices = [anyEnglishVoice];
            console.log("Using English voice:", anyEnglishVoice.name);
        }
    };

    // Initial load
    loadVoices();

    // Wait for voices to be loaded (some browsers load asynchronously)
    if (speechSynthVoices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }
}

function startReading(text) {
    // Stop any current reading
    window.speechSynthesis.cancel();

    speech = new SpeechSynthesisUtterance(text);

    // Configure voice settings for more natural sound
    speech.rate = 0.85;        // Slightly slower for more natural pacing
    speech.pitch = 1.05;       // Slight pitch adjustment for better intonation
    speech.volume = 1.0;       // Full volume

    // Use our selected voice
    if (speechSynthVoices.length > 0) {
        speech.voice = speechSynthVoices[0];
    }

    // Speaking events
    speech.onstart = () => {
        isSpeaking = true;
        const readBtn = document.getElementById('readBtn');
        readBtn.classList.add('playing');
        showReadingIndicator();
    };

    speech.onend = () => {
        isSpeaking = false;
        const readBtn = document.getElementById('readBtn');
        readBtn.classList.remove('playing');
        hideReadingIndicator();
        showAchievement('Listener', 'You listened to a page being read aloud!');
    };

    // Start speaking
    window.speechSynthesis.speak(speech);
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
        readBtn.classList.add('playing');

        // Visual indication that reading is happening
        createTinyShower('💬', 3, true);
    }
}


/**
 * Show a subtle reading indicator
 */
function showReadingIndicator() {
    let indicator = document.querySelector('.reading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'reading-indicator';
        indicator.innerHTML = `
            <div class="indicator-icon">🔊</div>
            <div class="indicator-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        `;
        document.body.appendChild(indicator);
    }

    indicator.style.display = 'flex';
    indicator.style.opacity = '0';
    indicator.style.transform = 'translateY(20px)';

    setTimeout(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Hide reading indicator
 */
function hideReadingIndicator() {
    const indicator = document.querySelector('.reading-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(20px)';

        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }
}

/**
 * Stop reading
 */
function stopReading() {
    if (speech) {
        window.speechSynthesis.cancel();
        const readBtn = document.getElementById('readBtn');
        readBtn.classList.remove('playing');
        isSpeaking = false;

        // Hide reading indicator
        hideReadingIndicator();
    }
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');

    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
}

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

        // Set styles
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.fontSize = 20 + Math.random() * 10 + 'px';

        // Add to container
        container.appendChild(particle);

        // Animate upward
        setTimeout(() => {
            particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 30}deg)`;
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

// Initialize the story view when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

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
});


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

// Initialize tracking when DOM loads
document.addEventListener('DOMContentLoaded', initializeMetricsTracking);