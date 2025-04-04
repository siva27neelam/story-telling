// Global variables for story interaction
let currentPageIndex = 0;
let totalPagesCount = 0;
let isSpeaking = false;
let speechSynthesisInstance = null;
let wordElements = [];
let currentWordIndex = 0;

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
    showPage(0);

    // Add interaction tracking if logged in
    trackPageInteraction();

    // Check speech synthesis support
    if (!('speechSynthesis' in window)) {
        const readBtn = document.getElementById('readBtn');
        if (readBtn) {
            readBtn.style.display = 'none';
        }
    }

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
 * Track page interaction for logged-in users
 */
function trackPageInteraction() {
    const interactionData = document.getElementById('interactionData');
    if (interactionData) {
        const interactionId = interactionData.dataset.interactionId;

        // Track time spent
        let startTime = Date.now();

        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);

            // Send time spent to server
            fetch(`/api/interactions/${interactionId}/time`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ seconds: timeSpent })
            });
        });
    }
}

/**
 * Show a specific page by index
 * @param {number} index - The index of the page to show
 */
function showPage(index) {
    // Hide all pages
    document.querySelectorAll('.story-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    const pageElement = document.getElementById('page-' + index);
    pageElement.classList.add('active');

    // Stop any ongoing reading
    stopReading();

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').style.display = index === totalPagesCount - 1 ? 'none' : 'inline-block';
    document.getElementById('exitBtn').style.display = index === totalPagesCount - 1 ? 'inline-block' : 'none';

    // Update page indicator and progress bar
    document.getElementById('currentPage').textContent = index + 1;
    updateProgressBar(index);

    // Trigger any page-specific actions
    currentPageIndex = index;
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
 * Go to the next page
 */
function nextPage() {
    if (currentPageIndex < totalPagesCount - 1) {
        showPage(currentPageIndex + 1);
    }
}

/**
 * Go to the previous page
 */
function previousPage() {
    if (currentPageIndex > 0) {
        showPage(currentPageIndex - 1);
    }
}

/**
 * Prepare text for highlighting by wrapping words in spans
 * @param {HTMLElement} pageElement - The current page element
 */
function prepareTextForHighlighting(pageElement) {
    const textElement = pageElement.querySelector('.story-text');
    if (!textElement) {
        console.error("Story text element not found!");
        return [];
    }

    const originalText = textElement.textContent;
    const words = originalText.split(/\s+/);

    // Clear and rebuild with spans
    textElement.innerHTML = '';

    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.setAttribute('data-index', index);
        span.textContent = word + ' ';
        textElement.appendChild(span);
    });

    return textElement.querySelectorAll('.word');
}

/**
 * Start reading the current page
 */
function startReading() {
    // If already speaking, just continue
    if (isSpeaking && speechSynthesisInstance) {
        speechSynthesis.resume();
        return;
    }

    // Get current page
    const currentPage = document.querySelector('.story-page.active');

    // Prepare text for highlighting
    wordElements = prepareTextForHighlighting(currentPage);

    // Get full text
    const fullText = Array.from(wordElements).map(el => el.textContent).join('');

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(fullText);

    // Configure speech
    utterance.rate = 0.7;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Select a voice (preferably English)
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(voice =>
        voice.lang.includes('en') &&
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    // Reset word tracking
    currentWordIndex = 0;

    // Setup word highlighting
    utterance.onboundary = (event) => {
        if (event.name === 'word' && currentWordIndex < wordElements.length) {
            // Remove previous highlight
            wordElements.forEach(el => el.classList.remove('highlight'));

            // Highlight current word
            const currentWord = wordElements[currentWordIndex];
            currentWord.classList.add('highlight');

            // Scroll to make word visible
            currentWord.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            currentWordIndex++;
        }
    };

    // Setup event handlers
    utterance.onstart = () => {
        isSpeaking = true;
        document.getElementById('readBtn').classList.add('playing');
    };

    utterance.onend = () => {
        stopReading();
    };

    // Speak the text
    speechSynthesis.speak(utterance);
    speechSynthesisInstance = utterance;

    // Track speaking state
    isSpeaking = true;
}

/**
 * Stop reading
 */
function stopReading() {
    if (speechSynthesisInstance) {
        speechSynthesis.cancel();
    }

    // Remove word highlights
    if (wordElements) {
        wordElements.forEach(el => el.classList.remove('highlight'));
    }

    // Reset speaking state
    isSpeaking = false;
    speechSynthesisInstance = null;
    currentWordIndex = 0;

    // Update button state
    const readBtn = document.getElementById('readBtn');
    if (readBtn) {
        readBtn.classList.remove('playing');
    }
}

/**
 * Toggle read aloud
 */
function toggleReadAloud() {
    if (isSpeaking) {
        stopReading();
    } else {
        startReading();
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