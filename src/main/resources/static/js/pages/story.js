/**
 * pages/story.js - Story viewing, navigation and questions (DEBUG VERSION)
 * With extensive console logging for debugging
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
        console.log('🚀 Story.init() called');
        this.cacheElements();
        this.loadQuestions();
        this.setupEventListeners();
        this.setupMetricsTracking();
        this.setupTouchGestures();

        // Show first page
        this.showPage(0);
    },

    cacheElements() {
        console.log('📦 Caching DOM elements');
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
        console.log(`📖 Total pages found: ${this.totalPages}`);

        if (this.elements.totalPagesSpan) {
            this.elements.totalPagesSpan.textContent = this.totalPages;
        }

        // Debug: Check if key elements exist
        console.log('🔍 DOM Elements check:');
        console.log('  - questionsBtn:', !!this.elements.questionsBtn);
        console.log('  - questionModal:', !!this.elements.questionModal);
        console.log('  - pages:', this.elements.pages.length);
    },

    setupEventListeners() {
        console.log('🎧 Setting up event listeners');

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
            console.log('✅ Questions button found, adding click listener');
            this.elements.questionsBtn.addEventListener('click', () => {
                console.log('🎯 Questions button clicked!');
                this.showQuestions();
            });
        } else {
            console.error('❌ Questions button not found!');
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
                    console.log('🎯 Q key pressed - showing questions');
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
        console.log('📊 Interaction ID:', this.interactionId);

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
        console.log('❓ Loading questions...');
        console.log('📚 questionsByPage global variable:', typeof questionsByPage !== 'undefined' ? questionsByPage : 'UNDEFINED');

        // Load questions from global variable set by Thymeleaf
        if (typeof questionsByPage !== 'undefined') {
            this.pageQuestions = [];

            for (let i = 0; i < this.totalPages; i++) {
                const page = this.elements.pages[i];
                const pageId = page ? page.getAttribute('data-page-id') : null;
                console.log(`📄 Page ${i}: pageId = ${pageId}`);

                const questions = pageId ? (questionsByPage[pageId] || []) : [];
                console.log(`❓ Page ${i} questions:`, questions);

                this.pageQuestions[i] = questions.map(q => ({
                    question: q.text,
                    options: [q.option1, q.option2],
                    correctAnswer: q.correctOptionIndex
                }));

                console.log(`✅ Page ${i} processed questions:`, this.pageQuestions[i]);
            }
        } else {
            console.error('❌ questionsByPage is undefined! Check if Thymeleaf is passing the data correctly.');
        }

        console.log('📋 Final pageQuestions array:', this.pageQuestions);
        this.updateQuestionsButton();
    },

    loadCurrentPageImage() {
        const currentPage = document.querySelector('.story-page.active');
        if (!currentPage) return;

        const img = currentPage.querySelector('.lazy-image[data-src]');
        if (!img || img.src) return; // Already loaded

        // Create loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            text-align: center;
            padding: 2rem;
            color: #999;
            font-size: 1.2rem;
        `;
        loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading image...';
        img.parentNode.insertBefore(loadingDiv, img);

        // Load the image
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = tempImg.src;
            img.style.display = 'block';
            loadingDiv.remove();
        };

        tempImg.onerror = () => {
            loadingDiv.innerHTML = '<i class="fas fa-image"></i> Image unavailable';
        };

        tempImg.src = img.dataset.src;
    },

    showPage(index) {
        console.log(`📖 Showing page ${index}`);
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
        this.loadCurrentPageImage();

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
        console.log(`🔄 Updating questions button for page ${this.currentPageIndex}`);
        if (!this.elements.questionsBtn) {
            console.error('❌ Questions button not found in updateQuestionsButton!');
            return;
        }

        const hasQuestions = this.pageQuestions[this.currentPageIndex] &&
                           this.pageQuestions[this.currentPageIndex].length > 0;
        const alreadyAnswered = this.questionsAnswered.has(this.currentPageIndex);

        console.log(`❓ Page ${this.currentPageIndex}: hasQuestions=${hasQuestions}, alreadyAnswered=${alreadyAnswered}`);

        if (alreadyAnswered) {
            this.elements.questionsBtn.classList.remove('has-questions');
            console.log('✅ Questions already answered - removing has-questions class');
        } else if (hasQuestions) {
            this.elements.questionsBtn.classList.add('has-questions');
            console.log('🎯 Questions available - adding has-questions class');
        } else {
            this.elements.questionsBtn.classList.remove('has-questions');
            console.log('📝 No questions available - removing has-questions class');
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
        console.log(`🎯 showQuestions() called for page ${this.currentPageIndex}`);

        if (this.questionsAnswered.has(this.currentPageIndex)) {
            console.log('✅ Questions already answered for this page');
            return; // Already answered
        }

        const questions = this.pageQuestions[this.currentPageIndex];
        console.log('❓ Questions for current page:', questions);

        if (!questions || questions.length === 0) {
            console.log('📝 No questions found for this page, marking as answered');
            this.questionsAnswered.add(this.currentPageIndex);
            this.updateQuestionsButton();
            return;
        }

        console.log(`🎬 Showing ${questions.length} questions for page ${this.currentPageIndex}`);
        this.currentQuestionIndex = 0;
        this.showQuestionModal();
    },

    showQuestionModal() {
        console.log('🎭 showQuestionModal() called');
        if (!this.elements.questionModal) {
            console.error('❌ Question modal not found!');
            return;
        }

        const questions = this.pageQuestions[this.currentPageIndex];
        const currentQuestion = questions[this.currentQuestionIndex];
        console.log('❓ Current question:', currentQuestion);

        // Update modal content
        this.updateQuestionContent(currentQuestion, questions.length);

        // Show modal
        this.elements.questionModal.style.display = 'flex';
        setTimeout(() => {
            this.elements.questionModal.style.opacity = '1';
        }, 10);

        console.log('✅ Question modal displayed');
    },

    updateQuestionContent(question, totalQuestions) {
        console.log('🔄 Updating question content:', question);

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

        console.log('✅ Question content updated');
    },

    checkAnswer(selectedIndex) {
        console.log(`🎯 Answer selected: ${selectedIndex}`);
        const questions = this.pageQuestions[this.currentPageIndex];
        const currentQuestion = questions[this.currentQuestionIndex];
        const isCorrect = selectedIndex === currentQuestion.correctAnswer;
        console.log(`✅ Answer is ${isCorrect ? 'correct' : 'incorrect'}`);

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
        console.log('🎉 All questions completed for page', this.currentPageIndex);
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
        console.log('🎭 Hiding question modal');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM Content Loaded');
    // Only initialize on story view pages
    if (document.querySelector('.story-pages.view-mode')) {
        console.log('📚 Story view page detected, initializing Story module');
        Story.init();
    } else {
        console.log('❌ Not a story view page');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Story };
}