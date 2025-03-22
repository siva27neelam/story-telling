/**
 * Story Creator - JavaScript for create.html
 */

// Global variables
let pageCount = 0;

/**
 * Initialize the story creator
 */
function initializeCreator() {
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    // Add first page
    addPage();
}

/**
 * Add a new page to the story
 */
function addPage() {
    const container = document.getElementById('pagesContainer');
    const template = document.getElementById('pageTemplate').innerHTML;
    const pageHtml = template
        .replace(/{pageNumber}/g, pageCount + 1)
        .replace(/{index}/g, pageCount);

    const pageDiv = document.createElement('div');
    pageDiv.innerHTML = pageHtml;
    container.appendChild(pageDiv);

    pageCount++;
    updatePageNumbers();
}

/**
 * Delete a page from the story
 * @param {HTMLElement} button - The delete button element
 */
function deletePage(button) {
    if (document.querySelectorAll('.story-page').length > 1) {
        const page = button.closest('.story-page');
        page.remove();
        updatePageNumbers();
    } else {
        alert('Story must have at least one page');
    }
}

/**
 * Update page numbers and input indices after adding/removing pages
 */
function updatePageNumbers() {
    const pages = document.querySelectorAll('.story-page');
    pages.forEach((page, index) => {
        const heading = page.querySelector('h4');
        heading.textContent = `Page ${index + 1}`;

        const inputs = page.querySelectorAll('input[name*="pages["], textarea[name*="pages["]');
        inputs.forEach(input => {
            input.name = input.name.replace(/pages\[\d+\]/, `pages[${index}]`);
        });

        // Update question indices for this page
        const questionsContainer = page.querySelector('.questions-container');
        const questions = questionsContainer.querySelectorAll('.question-item');
        questions.forEach((question, qIndex) => {
            const qInputs = question.querySelectorAll('input[name*="questions["]');
            qInputs.forEach(input => {
                input.name = input.name.replace(/pages\[\d+\]\.questions\[\d+\]/, `pages[${index}].questions[${qIndex}]`);
            });
        });
    });
}

/**
 * Preview an image before upload
 * @param {HTMLElement} input - The file input element
 */
function previewImage(input) {
    const preview = input.nextElementSibling;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

/**
 * Preview cover image before upload
 * @param {HTMLElement} input - The file input element
 */
function previewCoverImage(input) {
    const preview = document.getElementById('coverPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = '';
        preview.style.display = 'none';
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
 * Add a question to a page
 * @param {HTMLElement} button - The add question button
 */
function addQuestion(button) {
    const pageDiv = button.closest('.story-page');
    const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
    const questionsContainer = pageDiv.querySelector('.questions-container');

    // Count existing questions
    const questionCount = questionsContainer.querySelectorAll('.question-item').length;

    // Get question template
    const template = document.getElementById('questionTemplate').innerHTML;
    const questionHtml = template
        .replace(/{pageIndex}/g, pageIndex)
        .replace(/{questionIndex}/g, questionCount);

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
 * @param {HTMLElement} button - The remove question button
 */
function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.style.animation = 'fadeOut 0.3s';

    setTimeout(() => {
        questionItem.remove();

        // Update question indices
        const pageDiv = button.closest('.story-page');
        const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
        const questionsContainer = pageDiv.querySelector('.questions-container');
        const questions = questionsContainer.querySelectorAll('.question-item');

        questions.forEach((question, qIndex) => {
            const qInputs = question.querySelectorAll('input[name*="questions["]');
            qInputs.forEach(input => {
                input.name = input.name.replace(/pages\[\d+\]\.questions\[\d+\]/, `pages[${pageIndex}].questions[${qIndex}]`);
            });
        });
    }, 300);
}