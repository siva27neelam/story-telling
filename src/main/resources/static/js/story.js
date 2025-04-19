/**
 * story.js - Story viewing & interaction functionality
 * Handles story navigation, page turning, read aloud, and story metrics
 */

// Add to the SleepyTales namespace
SleepyTales.story = {
  // State for story view
  state: {
    currentPageIndex: 0,
    totalPagesCount: 0,
    speech: null,
    speechQueue: [],
    isSpeaking: false,
    speechSynthVoices: [],
    userMetrics: {
      interactionId: null,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      questionsAnswered: 0,
      questionsCorrect: 0
    }
  },

  /**
   * Initialize story view functionality
   */
  init() {
    // Set total pages from global variable or count
    this.state.totalPagesCount = typeof totalPages !== 'undefined' ? totalPages :
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
        this.updateProgressBar(0);
      }, 300);
    }

    // Initialize speech synthesis
    this.initSpeechSynthesis();

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.nextPage();
      if (e.key === 'ArrowLeft') this.previousPage();
      if (e.key === ' ') {
        e.preventDefault();
        this.toggleReadAloud();
      }
      if (e.key === 'q') {
        if (typeof SleepyTales.questions !== 'undefined' && typeof SleepyTales.questions.showQuestions === 'function') {
          SleepyTales.questions.showQuestions();
        }
      }
    });

    // Initialize metrics tracking
    this.initializeMetricsTracking();

    // Add button event listeners
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const readBtn = document.getElementById('readBtn');
    const questionsBtn = document.getElementById('questionsBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
    if (readBtn) readBtn.addEventListener('click', () => this.toggleReadAloud());
    if (questionsBtn && typeof SleepyTales.questions !== 'undefined' &&
        typeof SleepyTales.questions.showQuestions === 'function') {
      questionsBtn.addEventListener('click', () => SleepyTales.questions.showQuestions());
    }
  },

  /**
   * Show a specific page by index
   * @param {number} index - The index of the page to show
   */
  showPage(index) {
    // Create a page turn effect
    const pageElement = document.getElementById('page-' + index);
    if (!pageElement) return;

    // Stop any ongoing speech
    this.stopReading();

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
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const exitBtn = document.getElementById('exitBtn');

    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.style.display = (index === this.state.totalPagesCount - 1) ? 'none' : 'inline-block';
    if (exitBtn) exitBtn.style.display = (index === this.state.totalPagesCount - 1) ? 'inline-block' : 'none';

    // Update page indicator and progress bar
    const currentPageIndicator = document.getElementById('currentPage');
    if (currentPageIndicator) currentPageIndicator.textContent = index + 1;

    this.updateProgressBar(index);

    // Update questions button if function exists
    if (typeof SleepyTales.questions !== 'undefined' &&
        typeof SleepyTales.questions.updateQuestionsButton === 'function') {
      SleepyTales.questions.updateQuestionsButton();
    }

    // If it's the last page, celebrate
    if (index === this.state.totalPagesCount - 1) {
      setTimeout(() => {
        SleepyTales.animations.createShower('⭐');
        SleepyTales.utils.playSound('twinkle');
        SleepyTales.animations.showAchievement('Story Completed!', 'You have reached the end of the story!');

        // Mark story as complete in metrics
        this.recordStoryCompletion();
      }, 500);
    }

    // Update current page index
    this.state.currentPageIndex = index;
  },

  /**
   * Update progress bar based on current page
   * @param {number} index - Current page index
   */
  updateProgressBar(index) {
    const progressFill = document.getElementById('progressFill');
    if (!progressFill) return;

    const progressPercentage = ((index + 1) / this.state.totalPagesCount) * 100;
    progressFill.style.width = progressPercentage + '%';
  },

  /**
   * Go to the next page with enhanced transition
   */
  nextPage() {
    if (this.state.currentPageIndex >= this.state.totalPagesCount - 1) return;

    // Optional question reminder
    if (typeof SleepyTales.questions !== 'undefined' &&
        typeof SleepyTales.questions.questionsAnswered !== 'undefined' &&
        !SleepyTales.questions.questionsAnswered.has(this.state.currentPageIndex)) {
      // Highlight questions button
      const btn = document.getElementById('questionsBtn');
      if (btn) {
        btn.classList.add('pulse');
        setTimeout(() => {
          btn.classList.remove('pulse');
        }, 1000);

        // Show tiny shower reminder
        SleepyTales.animations.createTinyShower('❓', 3, true);
        SleepyTales.utils.playSound('pop');
      }
    }

    const oldPage = document.querySelector('.story-page.active');
    if (oldPage) {
      oldPage.style.transform = 'translateX(-100px)';
      oldPage.style.opacity = '0';
    }

    // Create page turn effect
    SleepyTales.animations.showPageTurnEffect('right');

    // Play page turn sound
    SleepyTales.utils.playSound('page-turn');

    // Update current page index and show new page
    setTimeout(() => {
      this.showPage(this.state.currentPageIndex + 1);
    }, 300);
  },

  /**
   * Go to the previous page
   */
  previousPage() {
    if (this.state.currentPageIndex <= 0) return;

    const oldPage = document.querySelector('.story-page.active');
    if (oldPage) {
      oldPage.style.transform = 'translateX(100px)';
      oldPage.style.opacity = '0';
    }

    // Create page turn effect
    SleepyTales.animations.showPageTurnEffect('left');

    // Play page turn sound
    SleepyTales.utils.playSound('page-turn');

    // Update current page index and show new page
    setTimeout(() => {
      this.showPage(this.state.currentPageIndex - 1);
    }, 300);
  },

  /**
   * Initialize speech synthesis with robust voice selection
   */
  initSpeechSynthesis() {
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      SleepyTales.utils.log('Speech synthesis not available');
      return;
    }

    // Comprehensive voice loading with fallback strategy
    const loadVoices = () => {
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

      this.state.speechSynthVoices = selectedVoice ? [selectedVoice] : [];
      SleepyTales.utils.log('Selected Voice:', selectedVoice ? selectedVoice.name : 'No voice found');
    };

    // Initial load
    loadVoices();

    // Handle browsers that load voices asynchronously
    if (this.state.speechSynthVoices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }
  },

  /**
   * Split text into sentences for more natural reading
   * @param {string} text - The text to split
   * @returns {string[]} Array of sentences
   */
  splitTextIntoSentences(text) {
    // Regular expression to split on sentence-ending punctuation
    return text.split(/(?<=[.!?])\s+/).filter(sentence =>
      sentence.trim().length > 0
    );
  },

  /**
   * Start reading the current page text
   */
  startReading() {
    // Get current page text
    const currentText = document.querySelector('.story-page.active .story-text').textContent;

    // Stop any ongoing speech
    this.stopReading();

    // Split text into sentences
    const sentences = this.splitTextIntoSentences(currentText);
    this.state.speechQueue = sentences;

    // If no sentences, return
    if (this.state.speechQueue.length === 0) return;

    // Configure speech
    const speakNextSentence = () => {
      if (this.state.speechQueue.length === 0) {
        // Reading complete
        this.state.isSpeaking = false;
        const readBtn = document.getElementById('readBtn');
        if (readBtn) readBtn.classList.remove('playing');

        SleepyTales.animations.hideReadingIndicator();
        SleepyTales.animations.showAchievement('Listener', 'You listened to a page being read aloud!');
        return;
      }

      const sentence = this.state.speechQueue.shift();
      this.state.speech = new SpeechSynthesisUtterance(sentence);

      // Configure voice settings
      this.state.speech.rate = 0.85;  // Slightly slower for clarity
      this.state.speech.pitch = 1.0;  // Natural pitch
      this.state.speech.volume = 1.0; // Full volume

      // Use pre-selected voice
      if (this.state.speechSynthVoices.length > 0) {
        this.state.speech.voice = this.state.speechSynthVoices[0];
      }

      // Event handlers
      this.state.speech.onstart = () => {
        this.state.isSpeaking = true;
        const readBtn = document.getElementById('readBtn');
        if (readBtn) readBtn.classList.add('playing');

        SleepyTales.animations.showReadingIndicator();
      };

      this.state.speech.onend = () => {
        // Immediately start next sentence
        speakNextSentence();
      };

      // Speak the sentence
      window.speechSynthesis.speak(this.state.speech);
    };

    // Start speaking the first sentence
    speakNextSentence();

    // Show visual indication that reading is happening
    SleepyTales.animations.createTinyShower('💬', 3, true);
  },

  /**
   * Stop reading and cancel speech
   */
  stopReading() {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    this.state.speechQueue = []; // Clear the queue

    const readBtn = document.getElementById('readBtn');
    if (readBtn) readBtn.classList.remove('playing');

    this.state.isSpeaking = false;
    SleepyTales.animations.hideReadingIndicator();
  },

  /**
   * Toggle read aloud functionality
   */
  toggleReadAloud() {
    if (this.state.isSpeaking) {
      this.stopReading();
    } else {
      this.startReading();
    }
  },

  /**
   * Initialize metrics tracking for story interactions
   */
  initializeMetricsTracking() {
    // Get interaction ID if logged in
    const interactionData = document.getElementById('interactionData');
    if (interactionData) {
      this.state.userMetrics.interactionId = interactionData.dataset.interactionId;
    }

    if (this.state.userMetrics.interactionId) {
      // Setup periodic tracking update
      setInterval(() => this.updateTimeSpent(), 30000); // Update every 30 seconds

      // Update on page change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.updateTimeSpent();
        }
      });

      // Update on page unload
      window.addEventListener('beforeunload', () => {
        this.updateTimeSpent();
      });
    }
  },

  /**
   * Update time spent on story
   */
  updateTimeSpent() {
    if (!this.state.userMetrics.interactionId) return;

    const now = Date.now();
    const timeSinceLastUpdate = Math.floor((now - this.state.userMetrics.lastUpdateTime) / 1000); // In seconds

    if (timeSinceLastUpdate > 2) { // Only update if more than 2 seconds have passed
      // Send update to server
      fetch(`/api/interactions/${this.state.userMetrics.interactionId}/time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seconds: timeSinceLastUpdate })
      }).catch(error => SleepyTales.utils.log('Failed to update time spent:', error));

      this.state.userMetrics.lastUpdateTime = now;
    }
  },

  /**
   * Record question answer
   * @param {boolean} correct - Whether the answer was correct
   */
  recordQuestionAnswer(correct) {
    if (!this.state.userMetrics.interactionId) return;

    this.state.userMetrics.questionsAnswered++;
    if (correct) this.state.userMetrics.questionsCorrect++;

    // Send data to server
    fetch(`/api/interactions/${this.state.userMetrics.interactionId}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correct: correct })
    }).catch(error => SleepyTales.utils.log('Failed to record question answer:', error));
  },

  /**
   * Record story completion
   */
  recordStoryCompletion() {
    if (!this.state.userMetrics.interactionId) return;

    // Send completion status to server
    fetch(`/api/interactions/${this.state.userMetrics.interactionId}/complete`, {
      method: 'POST'
    }).catch(error => SleepyTales.utils.log('Failed to record completion:', error));
  }
};

// Initialize story view when DOM is loaded
SleepyTales.ready(() => {
  // Only initialize if on a story view page
  if (document.querySelector('.story-pages.view-mode')) {
    SleepyTales.story.init();
  }
});

// Add global functions as proxies to our methods for backward compatibility
window.showPage = function(index) {
  SleepyTales.story.showPage(index);
};

window.nextPage = function() {
  SleepyTales.story.nextPage();
};

window.previousPage = function() {
  SleepyTales.story.previousPage();
};

window.toggleReadAloud = function() {
  SleepyTales.story.toggleReadAloud();
};

window.startReading = function(text) {
  // If text is provided, that was the old API; if not, use our new method
  if (text) {
    SleepyTales.utils.log('Legacy startReading call with text parameter');
    // Legacy behavior would start with provided text; we now get it from the page
    SleepyTales.story.startReading();
  } else {
    SleepyTales.story.startReading();
  }
};

window.stopReading = function() {
  SleepyTales.story.stopReading();
};

window.recordQuestionAnswer = function(correct) {
  SleepyTales.story.recordQuestionAnswer(correct);
};