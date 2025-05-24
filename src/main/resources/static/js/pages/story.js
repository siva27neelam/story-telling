/**
 * pages/story.js - Story viewing, navigation and questions
 * Final clean version
 */

const Story = {
    currentPageIndex: 0,
    totalPages: 0,
    pageQuestions: [],
    questionsAnswered: new Set(),
    currentQuestionIndex: 0,
    interactionId: null,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),

    // DOM element cache
    elements: {
        pages: null,
        prevBtn: null,
        nextBtn: null,
        exitBtn: null,
        currentPageSpan: null,
        totalPagesSpan: null,
        progressFill: null,
        questionsBtn: null,
        questionModal: null,
        readBtn: null,
        closeQuestionBtn: null
    },

    init() {
        this.cacheElements();
        this.loadQuestions();
        this.setupEventListeners();
        this.setupMetricsTracking();
        this.setupTouchGestures();

        // Show first page
        this.showPage(0);
    },

    cacheElements() {
        this.elements.pages = document.querySelectorAll('.story-page');
        this.elements.prevBtn = document.getElementById('prevBtn');
        this.elements.nextBtn = document.getElementById('nextBtn');
        this.elements.exitBtn = document.getElementById('exitBtn');
        this.elements.currentPageSpan = document.getElementById('currentPage');
        this.elements.totalPagesSpan = document.getElementById('totalPages');
        this.elements.progressFill = document.getElementById('progressFill');
        this.elements.questionsBtn = document.getElementById('questionsBtn');
        this.elements.questionModal = document.getElementById('questionModal');
        this.elements.readBtn = document.getElementById('readBtn');
        this.elements.closeQuestionBtn = document.getElementById('closeQuestionModal');

        this.totalPages = this.elements.pages.length;

        if (this.elements.totalPagesSpan) {
            this.elements.totalPagesSpan.textContent = this.totalPages;
        }
    },

    setupEventListeners() {
        // Navigation buttons
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.previousPage());
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.nextPage());
        }

        // Read aloud button
        if (this.elements.readBtn) {
            this.elements.readBtn.addEventListener('click', () => {
                if (window.toggleReadAloud) {
                    const currentText = this.getCurrentPageText();
                    window.toggleReadAloud(currentText);
                }
            });
        }

        // Questions button
        if (this.elements.questionsBtn) {
            this.elements.questionsBtn.addEventListener('click', () => this.showQuestions());
        }

        // Close question modal button
        if (this.elements.closeQuestionBtn) {
            this.elements.closeQuestionBtn.addEventListener('click', () => this.hideQuestionModal());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                    this.nextPage();
                    break;
                case 'ArrowLeft':
                    this.previousPage();
                    break;
                case ' ':
                    e.preventDefault();
                    if (window.toggleReadAloud) {
                        const currentText = this.getCurrentPageText();
                        window.toggleReadAloud(currentText);
                    }
                    break;
                case 'q':
                case 'Q':
                    this.showQuestions();
                    break;
                case 'Escape':
                    this.hideQuestionModal();
                    break;
            }
        });

        // Close modal on outside click
        if (this.elements.questionModal) {
            this.elements.questionModal.addEventListener('click', (e) => {
                if (e.target === this.elements.questionModal) {
                    this.hideQuestionModal();
                }
            });
        }
    },

    setupTouchGestures() {
        // Check if Touch utility exists and has the method
        if (window.Touch && typeof window.Touch.addSwipeListener === 'function' && this.elements.pages.length > 0) {
            const storyContainer = document.querySelector('.story-container');
            if (storyContainer) {
                window.Touch.addSwipeListener(storyContainer, (direction) => {
                    if (direction === 'left') {
                        this.nextPage();
                    } else if (direction === 'right') {
                        this.previousPage();
                    }
                });
            }
        }
    },

    setupMetricsTracking() {
        const interactionData = document.getElementById('interactionData');
        this.interactionId = interactionData ? interactionData.dataset.interactionId : null;

        if (this.interactionId) {
            // Update time spent every 30 seconds
            setInterval(() => this.updateTimeSpent(), 30000);

            // Update on page visibility change
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

    loadQuestions() {
        // Load questions from global variable set by Thymeleaf
        if (typeof questionsByPage !== 'undefined') {
            this.pageQuestions = [];

            for (let i = 0; i < this.totalPages; i++) {
                const page = this.elements.pages[i];
                const pageId = page ? page.getAttribute('data-page-id') : null;
                const questions = pageId ? (questionsByPage[pageId] || []) : [];

                this.pageQuestions[i] = questions.map(q => ({
                    question: q.text,
                    options: [q.option1, q.option2],
                    correctAnswer: q.correctOptionIndex
                }));
            }
        }

        this.updateQuestionsButton();
    },

    showPage(index) {
        if (index < 0 || index >= this.totalPages) return;

        // Hide all pages
        this.elements.pages.forEach(page => {
            page.classList.remove('active');
        });

        // Show current page
        const currentPage = this.elements.pages[index];
        if (currentPage) {
            currentPage.classList.add('active');
        }

        this.currentPageIndex = index;

        // Update navigation
        this.updateNavigation();
        this.updateProgress();
        this.updateQuestionsButton();

        // Record completion if last page
        if (index === this.totalPages - 1) {
            this.recordStoryCompletion();
        }
    },

    updateNavigation() {
        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = this.currentPageIndex === 0;
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.style.display =
                this.currentPageIndex === this.totalPages - 1 ? 'none' : 'inline-block';
        }

        if (this.elements.exitBtn) {
            this.elements.exitBtn.style.display =
                this.currentPageIndex === this.totalPages - 1 ? 'inline-block' : 'none';
        }

        if (this.elements.currentPageSpan) {
            this.elements.currentPageSpan.textContent = this.currentPageIndex + 1;
        }
    },

    updateProgress() {
        if (this.elements.progressFill) {
            const percentage = ((this.currentPageIndex + 1) / this.totalPages) * 100;
            this.elements.progressFill.style.width = percentage + '%';
        }
    },

    updateQuestionsButton() {
        if (!this.elements.questionsBtn) return;

        if (this.questionsAnswered.has(this.currentPageIndex)) {
            this.elements.questionsBtn.classList.remove('has-questions');
        } else {
            this.elements.questionsBtn.classList.add('has-questions');
        }
    },

    nextPage() {
        if (this.currentPageIndex < this.totalPages - 1) {
            this.showPage(this.currentPageIndex + 1);
        }
    },

    previousPage() {
        if (this.currentPageIndex > 0) {
            this.showPage(this.currentPageIndex - 1);
        }
    },

    getCurrentPageText() {
        const currentPage = document.querySelector('.story-page.active .story-text');
        return currentPage ? currentPage.textContent : '';
    },

    // Questions functionality
    showQuestions() {
        if (this.questionsAnswered.has(this.currentPageIndex)) {
            return; // Already answered
        }

        const questions = this.pageQuestions[this.currentPageIndex];
        if (!questions || questions.length === 0) {
            this.questionsAnswered.add(this.currentPageIndex);
            this.updateQuestionsButton();
            return;
        }

        this.currentQuestionIndex = 0;
        this.showQuestionModal();
    },

    showQuestionModal() {
        if (!this.elements.questionModal) return;

        const questions = this.pageQuestions[this.currentPageIndex];
        const currentQuestion = questions[this.currentQuestionIndex];

        // Update modal content
        this.updateQuestionContent(currentQuestion, questions.length);

        // Show modal
        this.elements.questionModal.style.display = 'flex';
        setTimeout(() => {
            this.elements.questionModal.style.opacity = '1';
        }, 10);
    },

    updateQuestionContent(question, totalQuestions) {
        const questionNum = document.getElementById('currentQuestionNum');
        const totalQuestionsSpan = document.getElementById('totalQuestions');
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const questionProgress = document.getElementById('questionProgress');

        if (questionNum) questionNum.textContent = this.currentQuestionIndex + 1;
        if (totalQuestionsSpan) totalQuestionsSpan.textContent = totalQuestions;
        if (questionText) questionText.textContent = question.question;
        if (questionProgress) {
            const progressPercent = (this.currentQuestionIndex / totalQuestions) * 100;
            questionProgress.style.width = progressPercent + '%';
        }

        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            question.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.addEventListener('click', () => this.checkAnswer(index));
                optionsContainer.appendChild(button);
            });
        }

        // Clear feedback
        const feedback = document.getElementById('feedback');
        if (feedback) feedback.textContent = '';
    },

    checkAnswer(selectedIndex) {
        const questions = this.pageQuestions[this.currentPageIndex];
        const currentQuestion = questions[this.currentQuestionIndex];
        const isCorrect = selectedIndex === currentQuestion.correctAnswer;

        const options = document.querySelectorAll('.option-btn');
        options.forEach(opt => opt.disabled = true);

        const feedback = document.getElementById('feedback');

        if (isCorrect) {
            options[selectedIndex].classList.add('correct');
            if (feedback) feedback.textContent = 'Correct!';

            this.recordQuestionAnswer(true);

            setTimeout(() => {
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= questions.length) {
                    this.completeQuestions();
                } else {
                    this.updateQuestionContent(questions[this.currentQuestionIndex], questions.length);
                    options.forEach(opt => {
                        opt.disabled = false;
                        opt.classList.remove('correct', 'incorrect');
                    });
                }
            }, 1000);
        } else {
            options[selectedIndex].classList.add('incorrect');
            if (feedback) feedback.textContent = 'Try again!';

            this.recordQuestionAnswer(false);

            setTimeout(() => {
                options.forEach(opt => {
                    opt.disabled = false;
                    opt.classList.remove('incorrect');
                });
            }, 500);
        }
    },

    completeQuestions() {
        this.questionsAnswered.add(this.currentPageIndex);
        this.hideQuestionModal();
        this.updateQuestionsButton();

        // Show completion message briefly
        this.showQuestionCompletedMessage();

        // Auto-advance to next page after delay
        setTimeout(() => {
            if (this.currentPageIndex < this.totalPages - 1) {
                this.nextPage();
            }
        }, 1500);
    },

    showQuestionCompletedMessage() {
        const completedDiv = document.getElementById('questionCompleted');
        if (completedDiv) {
            completedDiv.classList.add('show');
            setTimeout(() => {
                completedDiv.classList.remove('show');
            }, 2000);
        }
    },

    hideQuestionModal() {
        if (this.elements.questionModal) {
            this.elements.questionModal.style.opacity = '0';
            setTimeout(() => {
                this.elements.questionModal.style.display = 'none';
            }, 300);
        }
    },

    // Metrics tracking
    updateTimeSpent() {
        if (!this.interactionId) return;

        const now = Date.now();
        const timeSinceLastUpdate = Math.floor((now - this.lastUpdateTime) / 1000);

        if (timeSinceLastUpdate > 2) {
            fetch(`/api/interactions/${this.interactionId}/time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seconds: timeSinceLastUpdate })
            }).catch(error => console.error('Failed to update time spent:', error));

            this.lastUpdateTime = now;
        }
    },

    recordQuestionAnswer(correct) {
        if (!this.interactionId) return;

        fetch(`/api/interactions/${this.interactionId}/question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correct: correct })
        }).catch(error => console.error('Failed to record question answer:', error));
    },

    recordStoryCompletion() {
        if (!this.interactionId) return;

        fetch(`/api/interactions/${this.interactionId}/complete`, {
            method: 'POST'
        }).catch(error => console.error('Failed to record completion:', error));
    }
};

// Remove global functions since we're no longer using inline onclick handlers

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on story view pages
    if (document.querySelector('.story-pages.view-mode')) {
        Story.init();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Story };
}