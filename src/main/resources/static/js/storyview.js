// Global variables for speech synthesis
let isSpeaking = false;
let speechSynthVoices = [];
let wordElements = [];
let currentWordIndex = 0;
let readingInterval = null;
let utterance = null;
let averageWordDuration = 250; // milliseconds per word

/**
 * Initialize speech synthesis with voice loading
 */
function initSpeechSynthesis() {
  console.log("Initializing speech synthesis");
  // Try to get voices immediately
  speechSynthVoices = window.speechSynthesis.getVoices();
  console.log("Initial voices:", speechSynthVoices.length);

  // Set up event listener for when voices change/load
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthVoices = window.speechSynthesis.getVoices();
      console.log('Voices loaded:', speechSynthVoices.length);
    };
  }
}

/**
 * Split text into words for reading
 * @param {string} text - The text to split into words
 * @return {string[]} Array of words
 */
function splitTextIntoWords(text) {
  // Match words including attached punctuation
  const words = text.match(/\S+\s*/g) || [];
  console.log(`Split text into ${words.length} words`);
  return words;
}

/**
 * Configure the voice to sound as natural as possible
 * @param {SpeechSynthesisUtterance} utterance - The utterance to configure
 */
function configureVoice(utterance) {
  // Create a ranked list of preferred voices
  const preferredVoicePatterns = [
    /Google US English/i,
    /Microsoft Zira/i,
    /Daniel/i,
    /Samantha/i,
    /Karen/i,
    /English/i
  ];

  // Find the best available voice
  let selectedVoice = null;
  for (const pattern of preferredVoicePatterns) {
    selectedVoice = speechSynthVoices.find(voice => pattern.test(voice.name));
    if (selectedVoice) break;
  }

  // If we found a decent voice, use it
  if (selectedVoice) {
    console.log("Using voice:", selectedVoice.name);
    utterance.voice = selectedVoice;
  } else {
    console.log("No preferred voice found, using default");
  }

  // Adjust parameters for more natural speech
  utterance.rate = 0.9;     // Slightly slower than default
  utterance.pitch = 1.0;    // Natural pitch
  utterance.volume = 1.0;   // Full volume
}

/**
 * Prepare text for highlighting by wrapping words in spans
 * @param {HTMLElement} pageElement - The current page element
 * @return {string[]} Array of words
 */
function prepareTextForHighlighting(pageElement) {
  console.log("Preparing text for highlighting");
  const textElement = pageElement.querySelector('.story-text');
  if (!textElement) {
    console.error("Story text element not found!");
    return [];
  }

  const originalText = textElement.textContent;
  const words = splitTextIntoWords(originalText);

  // Clear and rebuild with spans
  textElement.innerHTML = '';

  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.setAttribute('data-index', index);
    span.textContent = word;
    textElement.appendChild(span);
  });

  console.log(`Created ${words.length} word span elements`);
  return words;
}

/**
 * Estimate reading time per word based on word complexity
 * @param {string} word - The word to analyze
 * @return {number} Estimated reading time in milliseconds
 */
function estimateWordReadingTime(word) {
  // Strip spaces and punctuation for length calculation
  const stripped = word.replace(/[^\w]/g, '');

  // Base time per word
  let time = averageWordDuration;

  // Adjust time based on word length
  if (stripped.length > 8) {
    time += 100; // Longer words take more time
  } else if (stripped.length <= 2) {
    time -= 50; // Very short words take less time
  }

  // Adjust for punctuation
  if (word.includes('.') || word.includes('!') || word.includes('?')) {
    time += 200; // Pause at end of sentences
  } else if (word.includes(',') || word.includes(';') || word.includes(':')) {
    time += 100; // Smaller pause for other punctuation
  }

  return time;
}

/**
 * Start highlighting words as they would be read, with estimated timing
 */
function startWordHighlighting() {
  console.log("Starting word highlighting");
  // Reset highlighting
  currentWordIndex = 0;

  // Get all word elements
  wordElements = document.querySelectorAll('.word');
  console.log(`Found ${wordElements.length} word elements`);

  // Clear any existing intervals
  if (readingInterval) {
    clearInterval(readingInterval);
    readingInterval = null;
  }

  // Calculate total text length for timing estimation
  const totalWords = wordElements.length;
  const utteranceText = Array.from(wordElements).map(el => el.textContent).join('');

  // Estimate total speech duration based on text length and speaking rate
  // This is very approximate and varies by browser/voice
  const totalCharacters = utteranceText.length;
  const estimatedTotalDuration = (totalCharacters / 15) * 1000; // ~15 chars per second
  averageWordDuration = estimatedTotalDuration / totalWords;

  console.log(`Estimated total duration: ${estimatedTotalDuration}ms, average word: ${averageWordDuration}ms`);

  // Function to highlight next word
  function highlightNextWord() {
    // Remove highlighting from all words
    wordElements.forEach(el => el.classList.remove('highlight'));

    // If we've reached the end, stop highlighting
    if (currentWordIndex >= wordElements.length) {
      if (readingInterval) {
        clearTimeout(readingInterval);
        readingInterval = null;
      }
      return;
    }

    // Highlight current word
    const currentWord = wordElements[currentWordIndex];
    currentWord.classList.add('highlight');

    // Make sure the word is visible
    currentWord.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Calculate reading time for this word
    const word = currentWord.textContent;
    const readTime = estimateWordReadingTime(word);

    // Move to next word after estimated time
    currentWordIndex++;

    // For smoother reading, use setTimeout instead of interval
    clearTimeout(readingInterval);
    readingInterval = setTimeout(highlightNextWord, readTime);
  }

  // Start the highlighting
  highlightNextWord();
}

/**
 * Start reading the entire page aloud
 */
function startReading() {
alert("jere")
  console.log("Starting reading");
  // Stop any previous reading
  stopReading();

  // Get current page and prepare text
  const currentPage = document.querySelector('.story-page.active');
  const words = prepareTextForHighlighting(currentPage);
  const fullText = words.join('');

  // Create a single utterance for the whole page
  utterance = new SpeechSynthesisUtterance(fullText);
  configureVoice(utterance);

  // Set up events
  utterance.onstart = () => {
    console.log("Speech started");
    // Start word highlighting when speech starts
    startWordHighlighting();

    // Show reading indicator
    showReadingIndicator();

    // Update UI
    isSpeaking = true;
    const readBtn = document.getElementById('readBtn');
    if (readBtn) {
      readBtn.classList.add('playing');
    }
  };

  utterance.onend = () => {
    console.log("Speech ended");
    // Clean up when done reading
    stopReading();
  };

  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    stopReading();
  };

  // Start speech
  console.log("Starting speech synthesis");
  window.speechSynthesis.speak(utterance);

  // Create tiny speech bubbles animation
  if (typeof createTinyShower === 'function') {
    createTinyShower('💬', 3, true);
  }
}

/**
 * Stop reading and clean up
 */
function stopReading() {
  console.log("Stopping reading");
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clear highlighting interval
  if (readingInterval) {
    clearTimeout(readingInterval);
    readingInterval = null;
  }

  // Remove word highlighting
  document.querySelectorAll('.word').forEach(el => {
    el.classList.remove('highlight');
  });

  // Hide reading indicator
  hideReadingIndicator();

  // Update UI
  isSpeaking = false;
  const readBtn = document.getElementById('readBtn');
  if (readBtn) {
    readBtn.classList.remove('playing');
  }
}

/**
 * Toggle between starting and stopping reading
 */
function toggleReadAloud() {
  console.log("Toggle read aloud, current state:", isSpeaking);
  if (isSpeaking) {
    stopReading();
  } else {
    startReading();
  }
}

/**
 * Show a subtle reading indicator
 */
function showReadingIndicator() {
  console.log("Showing reading indicator");
  let indicator = document.getElementById('readingIndicator');
  if (!indicator) {
    // Create the indicator dynamically if it doesn't exist
    console.log("Creating indicator element");
    indicator = document.createElement('div');
    indicator.id = 'readingIndicator';
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

  // Make sure it's using flex display
  indicator.style.display = 'flex';
}

/**
 * Hide reading indicator
 */
function hideReadingIndicator() {
  console.log("Hiding reading indicator");
  const indicator = document.getElementById('readingIndicator');
  if (indicator) {
    indicator.style.opacity = '0';

    setTimeout(() => {
      indicator.style.display = 'none';
      indicator.style.opacity = '1'; // Reset opacity for next time
    }, 300);
  }
}

/**
 * Handle browser quirks like Chrome's timeout issue
 */
function handleBrowserQuirks() {
  // Chrome stops speech after about 15 seconds
  if ('chrome' in window) {
    console.log("Handling Chrome-specific quirks");
    // Periodically resume speech
    setInterval(() => {
      if (isSpeaking && !window.speechSynthesis.speaking) {
        console.log("Resuming speech synthesis");
        window.speechSynthesis.resume();
      }
    }, 5000);
  }
}

/**
 * Make sure reading stops when navigating pages
 */
function setupPageNavigationEvents() {
  console.log("Setting up page navigation events");
  // Hook into existing page navigation functions
  const originalNextPage = window.nextPage;
  const originalPreviousPage = window.previousPage;

  // Override nextPage to stop reading first
  window.nextPage = function() {
    console.log("Next page - stopping reading");
    stopReading();
    if (typeof originalNextPage === 'function') {
      originalNextPage();
    }
  };

  // Override previousPage to stop reading first
  window.previousPage = function() {
    console.log("Previous page - stopping reading");
    stopReading();
    if (typeof originalPreviousPage === 'function') {
      originalPreviousPage();
    }
  };
}

/**
 * Check if the browser supports speech synthesis
 * @return {boolean} True if speech synthesis is supported
 */
function isSpeechSynthesisSupported() {
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  console.log("Speech synthesis supported:", supported);
  return supported;
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded - initializing read aloud functionality");

  // Check speech synthesis support
  if (isSpeechSynthesisSupported()) {
    // Initialize speech synthesis
    initSpeechSynthesis();

    // Handle browser quirks
    handleBrowserQuirks();

    // Setup navigation events
    setupPageNavigationEvents();
  } else {
    // Hide read aloud button if not supported
    const readBtn = document.getElementById('readBtn');
    if (readBtn) {
      console.log("Hiding read aloud button - not supported");
      readBtn.style.display = 'none';
    }
  }
});