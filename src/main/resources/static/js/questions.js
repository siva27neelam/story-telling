/**
 * questions.js - Interactive Question System
 * Manages interactive questions for story pages
 */

// Add to the SleepyTales namespace
SleepyTales.questions = {
  // State for questions system
  pageQuestions: [],
  currentQuestionIndex: 0,
  isQuestionCompleted: false,
  questionsAnswered: new Set(),

  /**
   * Initialize questions for the story
   */
  init() {
    // Get the story ID from the URL
    const pathParts = window.location.pathname.split('/');
    const storyId = pathParts[pathParts.length - 1];

    // Check if questionsByPage data is available from Thymeleaf
    if (typeof questionsByPage !== 'undefined') {
      this.pageQuestions = [];

      // Process questions for each page
      for (let i = 0; i < SleepyTales.story.state.totalPagesCount; i++) {
        const page = document.getElementById('page-' + i);
        if (!page) continue;

        const pageId = page.getAttribute('data-page-id');
        const questions = questionsByPage[pageId] || [];

        // Format questions for our frontend structure
        this.pageQuestions[i] = questions.map(q => ({
          question: q.text,
          options: [q.option1, q.option2],
          correctAnswer: q.correctOptionIndex
        }));
      }
    } else {
      // Fallback to sample questions for testing if needed
      SleepyTales.utils.log('No questions found in page data, using sample questions');
      this.pageQuestions = this.generateSampleQuestions();
    }

    // Update question button visibility
    this.updateQuestionsButton();

    // Initialize question event listeners
    this.initEventListeners();
  },

  /**
   * Generate sample questions for testing
   * @returns {Array} Array of sample questions
   */
  generateSampleQuestions() {
    const sampleQuestions = [];
    for (let i = 0; i < SleepyTales.story.state.totalPagesCount; i++) {
      sampleQuestions[i] = [
        {
          question: `What happens on page ${i+1}?`,
          options: ["Correct Answer", "Wrong Answer"],
          correctAnswer: 0
        },
        {
          question: `Who is the character on page ${i+1}?`,
          options: ["Wrong Answer", "Correct Answer"],
          correctAnswer: 1
        }
      ];
    }
    return sampleQuestions;
  },

  /**
   * Update the questions button appearance based on completion status
   */
  updateQuestionsButton() {
    const btn = document.getElementById('questionsBtn');
    if (!btn) return;

    if (this.questionsAnswered.has(SleepyTales.story.state.currentPageIndex)) {
      btn.classList.remove('has-questions');
    } else {
      btn.classList.add('has-questions');
    }
  },

  /**
   * Show the questions modal for the current page
   */
  showQuestions() {
    // If questions already answered for this page, just show a visual confirmation
    if (this.questionsAnswered.has(SleepyTales.story.state.currentPageIndex)) {
      SleepyTales.utils.playSound('pop');
      SleepyTales.animations.createTinyShower('✅', 3, true);
      return;
    }

    // Stop reading if in progress
    SleepyTales.story.stopReading();

    // Reset question state
    this.currentQuestionIndex = 0;
    this.isQuestionCompleted = false;

    // Check if there are questions for this page
    const currentPageQuestions = this.pageQuestions[SleepyTales.story.state.currentPageIndex];
    if (!currentPageQuestions || currentPageQuestions.length === 0) {
      // No questions for this page, mark as answered
      this.questionsAnswered.add(SleepyTales.story.state.currentPageIndex);
      this.updateQuestionsButton();
      return;
    }

    // Update modal with first question
    this.updateQuestionModal();

    // Show the modal
    const modal = document.getElementById('questionModal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.style.opacity = '1';
        const container = modal.querySelector('.question-container');
        if (container) container.style.transform = 'translateY(0)';
      }, 10);
    }
  },

  /**
   * Update the question modal with the current question
   */
  updateQuestionModal() {
    const currentPageQuestions = this.pageQuestions[SleepyTales.story.state.currentPageIndex];
    if (!currentPageQuestions || currentPageQuestions.length === 0) return;

    const currentQuestion = currentPageQuestions[this.currentQuestionIndex];

    // Update question number and progress
    const currentQuestionNum = document.getElementById('currentQuestionNum');
    const totalQuestions = document.getElementById('totalQuestions');

    if (currentQuestionNum) currentQuestionNum.textContent = this.currentQuestionIndex + 1;
    if (totalQuestions) totalQuestions.textContent = currentPageQuestions.length;

    // Update progress bar
    const progressBar = document.getElementById('questionProgress');
    if (progressBar) {
      const progressPercent = ((this.currentQuestionIndex) / currentPageQuestions.length) * 100;
      progressBar.style.width = progressPercent + '%';
    }

    // Update question text
    const questionText = document.getElementById('questionText');
    if (questionText) questionText.textContent = currentQuestion.question;

    // Update options
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
      optionsContainer.innerHTML = '';

      currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => this.checkAnswer(index);
        optionsContainer.appendChild(button);
      });
    }

    // Clear feedback
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.textContent = '';
  },

  /**
   * Check if the selected answer is correct
   * @param {number} selectedIndex - The index of the selected option
   */
  checkAnswer(selectedIndex) {
    const currentPageQuestions = this.pageQuestions[SleepyTales.story.state.currentPageIndex];
    if (!currentPageQuestions) return;

    const currentQuestion = currentPageQuestions[this.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;

    const options = document.querySelectorAll('.option-btn');

    // Disable all options during animation
    options.forEach(opt => opt.disabled = true);

    if (isCorrect) {
      // Correct answer
      options[selectedIndex].classList.add('correct');

      const feedback = document.getElementById('feedback');
      if (feedback) feedback.textContent = 'Correct!';

      SleepyTales.utils.playSound('twinkle');
      SleepyTales.animations.createTinyShower('✨', 5, true);

      // Record correct answer if interaction tracking is enabled
      SleepyTales.story.recordQuestionAnswer(true);

      // Move to next question or complete
      setTimeout(() => {
        options[selectedIndex].classList.remove('correct');
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= currentPageQuestions.length) {
          // All questions completed
          this.completeQuestions();
        } else {
          // Load next question
          this.updateQuestionModal();

          // Re-enable options
          options.forEach(opt => opt.disabled = false);
        }
      }, 1000);
    } else {
      // Incorrect answer
      options[selectedIndex].classList.add('incorrect');

      const feedback = document.getElementById('feedback');
      if (feedback) feedback.textContent = 'Try again!';

      SleepyTales.utils.playSound('pop');

      // Record incorrect answer if interaction tracking is enabled
      SleepyTales.story.recordQuestionAnswer(false);

      // Re-enable options after animation
      setTimeout(() => {
        options[selectedIndex].classList.remove('incorrect');
        options.forEach(opt => opt.disabled = false);
      }, 500);
    }
  },

  /**
   * Complete all questions for the current page
   */
  completeQuestions() {
    // Mark this page as completed
    this.questionsAnswered.add(SleepyTales.story.state.currentPageIndex);
    this.isQuestionCompleted = true;

    // Hide question modal
    const modal = document.getElementById('questionModal');
    if (modal) {
      modal.style.opacity = '0';
      const container = modal.querySelector('.question-container');
      if (container) container.style.transform = 'translateY(20px)';
    }

    // Show completion animation
    const completion = document.getElementById('questionCompleted');
    if (completion) {
      completion.classList.add('show');

      // Play celebration sounds
      SleepyTales.utils.playSound('twinkle');
      setTimeout(() => {
        SleepyTales.animations.createShower('🎉');
      }, 300);
    }

    // Update questions button
    this.updateQuestionsButton();

    // Hide completion animation and move to next page after delay
    setTimeout(() => {
      if (completion) completion.classList.remove('show');
      if (modal) modal.style.display = 'none';

      // Move to next page if not last page
      if (SleepyTales.story.state.currentPageIndex < SleepyTales.story.state.totalPagesCount - 1) {
        setTimeout(() => SleepyTales.story.nextPage(), 500);
      } else {
        // If last page, return to list after delay
        setTimeout(() => {
          window.location.href = '/stories';
        }, 2000);
      }
    }, 2000);
  },

  /**
   * Add event handlers for the question functionality
   */
  initEventListeners() {
    // Close question modal if clicked outside
    const questionModal = document.getElementById('questionModal');
    if (questionModal) {
      questionModal.addEventListener('click', (e) => {
        if (e.target === questionModal) {
          questionModal.style.opacity = '0';
          const container = questionModal.querySelector('.question-container');
          if (container) container.style.transform = 'translateY(20px)';

          setTimeout(() => {
            questionModal.style.display = 'none';
          }, 300);
        }
      });
    }

    // Add keyboard shortcut for questions
    document.addEventListener('keydown', (e) => {
      if (e.key === 'q') {
        this.showQuestions();
      }
    });
  },

  /**
   * Editor-specific functions for managing questions
   */
  editor: {
    /**
     * Add a new question to a page
     * @param {HTMLElement} button - The button element that was clicked
     */
    addQuestion(button) {
      const pageDiv = button.closest('.story-page');
      if (!pageDiv) return;

      const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
      const questionsContainer = pageDiv.querySelector('.questions-container');
      if (!questionsContainer) return;

      // Count existing questions
      const questionCount = questionsContainer.querySelectorAll('.question-item').length;

      // Create new question template
      const questionHtml = `
        <div class="question-item mb-3">
          <div class="card">
            <div class="card-body">
              <input type="hidden" name="pages[${pageIndex}].questions[${questionCount}].id" value="" />

              <div class="mb-3">
                <label class="form-label">Question</label>
                <input type="text" class="form-control"
                       name="pages[${pageIndex}].questions[${questionCount}].text"
                       placeholder="Enter your question here" required>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Option 1</label>
                  <div class="input-group">
                    <div class="input-group-text">
                      <input type="radio" class="form-check-input mt-0"
                             name="pages[${pageIndex}].questions[${questionCount}].correctOptionIndex"
                             value="0" checked required>
                    </div>
                    <input type="text" class="form-control"
                           name="pages[${pageIndex}].questions[${questionCount}].option1"
                           placeholder="Correct answer" required>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Option 2</label>
                  <div class="input-group">
                    <div class="input-group-text">
                      <input type="radio" class="form-check-input mt-0"
                             name="pages[${pageIndex}].questions[${questionCount}].correctOptionIndex"
                             value="1" required>
                    </div>
                    <input type="text" class="form-control"
                           name="pages[${pageIndex}].questions[${questionCount}].option2"
                           placeholder="Wrong answer" required>
                  </div>
                </div>
              </div>

              <button type="button" class="btn btn-sm btn-danger" onclick="SleepyTales.questions.editor.removeQuestion(this)">
                <i class="fas fa-trash"></i> Remove Question
              </button>
            </div>
          </div>
        </div>
      `;

      // Add the new question
      const questionDiv = document.createElement('div');
      questionDiv.innerHTML = questionHtml;
      questionsContainer.appendChild(questionDiv.firstElementChild);

      // Highlight the new question with animation
      const newQuestion = questionsContainer.lastElementChild;
      newQuestion.style.animation = 'fadeIn 0.5s';
    },

    /**
     * Remove a question from a page
     * @param {HTMLElement} button - The button element that was clicked
     */
    removeQuestion(button) {
      const questionItem = button.closest('.question-item');
      if (!questionItem) return;

      questionItem.style.animation = 'fadeOut 0.3s';

      setTimeout(() => {
        // Remove the question item from the DOM
        if (questionItem.parentNode) {
          questionItem.parentNode.removeChild(questionItem);
        }

        // Update question indices for the page
        const pageDiv = button.closest('.story-page');
        if (pageDiv) {
          const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
          const questionsContainer = pageDiv.querySelector('.questions-container');

          if (questionsContainer) {
            const questions = questionsContainer.querySelectorAll('.question-item');

            questions.forEach((question, qIndex) => {
              const qInputs = question.querySelectorAll('input[name*="questions["]');
              qInputs.forEach(input => {
                input.name = input.name.replace(/pages\[\d+\]\.questions\[\d+\]/, `pages[${pageIndex}].questions[${qIndex}]`);
              });
            });
          }
        }
      }, 300);
    }
  }
};