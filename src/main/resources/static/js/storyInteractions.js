/**
 * Enhanced core functionality for the story view page
 */

// Core variables
let currentPageIndex = 0;
let speech = null;
let speechSynthVoices = [];
let isSpeaking = false;
let totalPagesCount = 0;

/**
 * Initialize the story view when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set theme from localStorage
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

            // Update the progress bar
            updateProgressBar(0);
        }, 300);
    }

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
        if (e.key === 'q') {
            if (typeof showQuestions === 'function') {
                showQuestions();
            }
        }
    });
});

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
 * Go to the previous page with enhanced transition
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
 * Show page turn effect animation
 * @param {string} direction - The direction of the page turn ('left' or 'right')
 */
function showPageTurnEffect(direction) {
    const effect = document.querySelector('.page-turn-effect');
    const fold = effect.querySelector('.page-turn-fold');

    // Set up the effect based on direction
    if (direction === 'right') {
        fold.style.top = '0';
        fold.style.right = '0';
        fold.style.borderWidth = '0 0 100vh 100vw';
        fold.style.borderColor = 'transparent transparent var(--page-color) transparent';
    } else {
        fold.style.top = '0';
        fold.style.left = '0';
        fold.style.borderWidth = '100vh 100vw 0 0';
        fold.style.borderColor = 'var(--page-color) transparent transparent transparent';
    }

    // Show the effect
    effect.style.display = 'block';

    // Animate the fold
    setTimeout(() => {
        if (direction === 'right') {
            fold.style.borderWidth = '0 0 0 0';
        } else {
            fold.style.borderWidth = '0 0 0 0';
        }
    }, 10);

    // Hide the effect after animation completes
    setTimeout(() => {
        effect.style.display = 'none';
    }, 300);
}

/**
 * Initialize speech synthesis with enhanced voices
 */
function initSpeechSynthesis() {
    // Get available voices
    speechSynthVoices = window.speechSynthesis.getVoices();

    // If voices aren't loaded yet, wait for them
    if (speechSynthVoices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
            speechSynthVoices = window.speechSynthesis.getVoices();
        });
    }
}

/**
 * Toggle read aloud functionality with enhanced feedback
 */
function toggleReadAloud() {
    const readBtn = document.getElementById('readBtn');
    if (speech && window.speechSynthesis.speaking) {
        stopReading();
        readBtn.classList.remove('playing');
    } else {
        const currentText = document.querySelector('.story-page.active .story-text').textContent;
        startReading(currentText);
        readBtn.classList.add('playing');

        // Visual indication that reading is happening
        createTinyShower('💬', 3, true);
    }
}

/**
 * Start reading the provided text with enhanced voice options
 * @param {string} text - The text to read aloud
 */
function startReading(text) {
    // Stop any current reading
    window.speechSynthesis.cancel();

    speech = new SpeechSynthesisUtterance(text);

    // Configure professional voice
    speech.rate = 0.9; // Slightly slower for clarity
    speech.pitch = 1.0; // Natural pitch
    speech.volume = 1.0; // Full volume

    // Find a suitable voice
    if (speechSynthVoices.length > 0) {
        // Try to find an English voice labeled as "Google" which tends to sound more professional
        let professionalVoice = speechSynthVoices.find(voice =>
            voice.lang.includes('en') && voice.name.includes('Google'));

        // Fallback to any English voice
        if (!professionalVoice) {
            professionalVoice = speechSynthVoices.find(voice => voice.lang.includes('en'));
        }

        // Use the first available voice if no English voice is found
        speech.voice = professionalVoice || speechSynthVoices[0];
    }

    // Speaking events
    speech.onstart = () => {
        isSpeaking = true;
        const readBtn = document.getElementById('readBtn');
        readBtn.classList.add('playing');

        // Show reading indicator
        showReadingIndicator();
    };

    speech.onend = () => {
        isSpeaking = false;
        const readBtn = document.getElementById('readBtn');
        readBtn.classList.remove('playing');

        // Hide reading indicator
        hideReadingIndicator();

        // Show achievement for listening to a page
        showAchievement('Listener', 'You listened to a page being read aloud!');
    };

    // Start speaking
    window.speechSynthesis.speak(speech);
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

/**
 * Create a shower of emoji particles with enhanced animations
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

        // Random sizes and rotation
        const size = 40 + Math.random() * 60;
        const rotation = Math.random() * 360;
        const delay = Math.random() * 0.5;

        // Set styles
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.fontSize = size + 'px';
        particle.style.animationDelay = delay + 's';

        // Add to container
        container.appendChild(particle);

        // Animate upward with enhanced physics
        setTimeout(() => {
            particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${rotation}deg)`;
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
 * Play a sound effect with volume control
 * @param {string} type - The type of sound to play
 */
function playSound(type) {
    // Skip if sound effects are disabled
    if (typeof soundEffectsEnabled !== 'undefined' && !soundEffectsEnabled) {
        return;
    }

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