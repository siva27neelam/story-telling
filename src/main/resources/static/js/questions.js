/**
 * Questions functionality for Social Story application
 */

// Question System Variables
let pageQuestions = [];
let currentQuestionIndex = 0;
let isQuestionCompleted = false;
let questionsAnswered = new Set();

/**
 * Initialize questions for the story
 */
function initializeQuestions() {
    // Get the story ID from the URL
    const pathParts = window.location.pathname.split('/');
    const storyId = pathParts[pathParts.length - 1];

    // Check if questionsByPage data is available from Thymeleaf
    if (typeof questionsByPage !== 'undefined') {
        pageQuestions = [];

        // Process questions for each page
        for (let i = 0; i < totalPages; i++) {
            const page = document.getElementById('page-' + i);
            const pageId = page.getAttribute('data-page-id');
            const questions = questionsByPage[pageId] || [];

            // Format questions for our frontend structure
            pageQuestions[i] = questions.map(q => ({
                question: q.text,
                options: [q.option1, q.option2],
                correctAnswer: q.correctOptionIndex
            }));
        }
    } else {
        // Fallback to sample questions for testing
        for (let i = 0; i < totalPages; i++) {
            pageQuestions[i] = [
                {
                    question: `What happens on page ${i+1}?`,
                    options: ["Correct Answer", "Wrong Answer"],
                    correctAnswer: 0
                },
                {
                    question: `Who is the character on page ${i+1}?`,
                    options: ["Wrong Answer", "Correct Answer"],
                    correctAnswer: 1
                },
                {
                    question: `Where does the story take place on page ${i+1}?`,
                    options: ["Correct Answer", "Wrong Answer"],
                    correctAnswer: 0
                }
            ];
        }
    }

    // Update question button visibility
    updateQuestionsButton();
}

/**
 * Update the questions button appearance based on completion status
 */
function updateQuestionsButton() {
    const btn = document.getElementById('questionsBtn');
    if (questionsAnswered.has(currentPageIndex)) {
        btn.classList.remove('has-questions');
    } else {
        btn.classList.add('has-questions');
    }
}

/**
 * Show the questions modal for the current page
 */
function showQuestions() {
    if (questionsAnswered.has(currentPageIndex)) {
        // Already answered questions for this page
        playSound('pop');
        createTinyShower('✅', 3, true);
        return;
    }

    // Stop reading if in progress
    if (typeof stopReading === 'function') {
        stopReading();
    }

    currentQuestionIndex = 0;
    isQuestionCompleted = false;

    // Check if there are questions for this page
    if (!pageQuestions[currentPageIndex] || pageQuestions[currentPageIndex].length === 0) {
        // No questions for this page
        questionsAnswered.add(currentPageIndex);
        updateQuestionsButton();
        return;
    }

    // Update modal with first question
    updateQuestionModal();

    // Show the modal
    const modal = document.getElementById('questionModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.question-container').style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Update the question modal with the current question
 */
function updateQuestionModal() {
    const questions = pageQuestions[currentPageIndex];
    const currentQuestion = questions[currentQuestionIndex];

    // Update question number and progress
    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = questions.length;

    // Update progress bar
    const progressPercent = ((currentQuestionIndex) / questions.length) * 100;
    document.getElementById('questionProgress').style.width = progressPercent + '%';

    // Update question text
    document.getElementById('questionText').textContent = currentQuestion.question;

    // Update options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = function() { checkAnswer(index); };
        optionsContainer.appendChild(button);
    });

    // Clear feedback
    document.getElementById('feedback').textContent = '';
}

/**
 * Check if the selected answer is correct
 * @param {number} selectedIndex - The index of the selected option
 */
function checkAnswer(selectedIndex) {
    const questions = pageQuestions[currentPageIndex];
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;

    const options = document.querySelectorAll('.option-btn');

    // Disable all options during animation
    options.forEach(opt => opt.disabled = true);

    if (isCorrect) {
        // Correct answer
        options[selectedIndex].classList.add('correct');
        document.getElementById('feedback').textContent = 'Correct!';
        playSound('twinkle');
        createTinyShower('✨', 5, true);

        // Record correct answer if interaction tracking is enabled
        if (typeof recordQuestionAnswer === 'function') {
            recordQuestionAnswer(true);
        }

        // Move to next question or complete
        setTimeout(() => {
            options[selectedIndex].classList.remove('correct');
            currentQuestionIndex++;

            if (currentQuestionIndex >= questions.length) {
                // All questions completed
                completeQuestions();
            } else {
                // Load next question
                updateQuestionModal();
            }
        }, 1000);
    } else {
        // Incorrect answer
        options[selectedIndex].classList.add('incorrect');
        document.getElementById('feedback').textContent = 'Try again!';
        playSound('pop');

        // Record incorrect answer if interaction tracking is enabled
        if (typeof recordQuestionAnswer === 'function') {
            recordQuestionAnswer(false);
        }

        // Re-enable options after animation
        setTimeout(() => {
            options[selectedIndex].classList.remove('incorrect');
            options.forEach(opt => opt.disabled = false);
        }, 500);
    }
}
/**
 * Complete all questions for the current page
 */
function completeQuestions() {
    // Mark this page as completed
    questionsAnswered.add(currentPageIndex);
    isQuestionCompleted = true;

    // Hide question modal
    const modal = document.getElementById('questionModal');
    modal.style.opacity = '0';
    modal.querySelector('.question-container').style.transform = 'translateY(20px)';

    // Show completion animation
    const completion = document.getElementById('questionCompleted');
    completion.classList.add('show');

    // Play celebration sounds
    playSound('twinkle');
    setTimeout(() => {
        createShower('🎉');
    }, 300);

    // Update questions button
    updateQuestionsButton();

    // Hide completion animation and move to next page after delay
    setTimeout(() => {
        completion.classList.remove('show');
        modal.style.display = 'none';

        // Move to next page if not last page
        if (currentPageIndex < totalPages - 1) {
            setTimeout(nextPage, 500);
        } else {
            // If last page, return to list after delay
            setTimeout(() => {
                window.location.href = '/stories';
            }, 2000);
        }
    }, 2000);
}

/**
 * Add event handlers for the question functionality
 */
function initializeQuestionEventListeners() {
    // Close question modal if clicked outside
    document.getElementById('questionModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('questionModal')) {
            document.getElementById('questionModal').style.opacity = '0';
            document.getElementById('questionModal').querySelector('.question-container').style.transform = 'translateY(20px)';
            setTimeout(() => {
                document.getElementById('questionModal').style.display = 'none';
            }, 300);
        }
    });

    // Add keyboard shortcut for questions
    document.addEventListener('keydown', (e) => {
        if (e.key === 'q') {
            showQuestions();
        }
    });
}

// Editor-specific functions for managing questions
/**
 * Add a new question to a page
 * @param {HTMLElement} button - The button element that was clicked
 */
function addQuestion(button) {
    const pageDiv = button.closest('.story-page');
    const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
    const questionsContainer = pageDiv.querySelector('.questions-container');

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

                    <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(this)">
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
}

/**
 * Remove a question from a page
 * @param {HTMLElement} button - The button element that was clicked
 */
function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.style.animation = 'fadeOut 0.3s';

    setTimeout(() => {
        questionItem.remove();
        // Could update indices here if needed
    }, 300);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize questions when on view page
    if (document.querySelector('.story-pages.view-mode')) {
        initializeQuestions();
        initializeQuestionEventListeners();
    }
});