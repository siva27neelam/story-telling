/**
 * components/forms.js - Story creation and editing functionality
 * Lightweight form handling for story management
 */

const StoryForms = {
    pageCount: 0,
    currentAction: null,
    correctPin: '5381',

    init() {
        this.setupImagePreviews();
        this.setupPinModal();
        this.setupFormValidation();
        this.initializePageCount();
    },

    initializePageCount() {
        // For create page, start with first page
        if (document.querySelector('title')?.textContent?.includes('Create')) {
            this.addPage();
        } else {
            // For edit page, get existing page count
            this.pageCount = document.querySelectorAll('.story-page').length;
        }
    },

    setupImagePreviews() {
        // Cover image preview
        const coverInput = document.querySelector('input[name="coverImageFile"]');
        if (coverInput) {
            coverInput.addEventListener('change', (e) => {
                this.previewCoverImage(e.target);
            });
        }

        // Page image previews (delegated event handling)
        document.addEventListener('change', (e) => {
            if (e.target.name === 'imageFile') {
                this.previewImage(e.target);
            }
        });
    },

    setupPinModal() {
        const pinInputs = document.querySelectorAll('.pin-input');

        pinInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    pinInputs[index - 1].focus();
                }
                if (e.key === 'Enter') {
                    this.verifyPin();
                }
            });
        });
    },

    setupFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    },

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    },

    addPage() {
        const container = document.getElementById('pagesContainer');
        const template = document.getElementById('pageTemplate');

        if (!container || !template) return;

        const templateContent = template.innerHTML;
        const pageHtml = templateContent
            .replace(/{pageNumber}/g, this.pageCount + 1)
            .replace(/{index}/g, this.pageCount);

        const pageDiv = document.createElement('div');
        pageDiv.innerHTML = pageHtml;
        container.appendChild(pageDiv.firstElementChild);

        this.pageCount++;
        this.updatePageNumbers();
    },

    deletePage(button) {
        const pageElements = document.querySelectorAll('.story-page');

        if (pageElements.length > 1) {
            const page = button.closest('.story-page');
            if (page) {
                page.remove();
                this.updatePageNumbers();
            }
        } else {
            alert('Story must have at least one page');
        }
    },

    updatePageNumbers() {
        const pages = document.querySelectorAll('.story-page');

        pages.forEach((page, index) => {
            const heading = page.querySelector('h4');
            if (heading) {
                heading.textContent = `Page ${index + 1}`;
            }

            // Update input names
            const inputs = page.querySelectorAll('input[name*="pages["], textarea[name*="pages["]');
            inputs.forEach(input => {
                input.name = input.name.replace(/pages\[\d+\]/, `pages[${index}]`);

                if (input.name.includes('pageOrder')) {
                    input.value = index;
                }
            });

            // Update question indices
            this.updateQuestionIndices(page, index);
        });
    },

    updateQuestionIndices(pageElement, pageIndex) {
        const questions = pageElement.querySelectorAll('.question-item');

        questions.forEach((question, qIndex) => {
            const qInputs = question.querySelectorAll('input[name*="questions["]');
            qInputs.forEach(input => {
                input.name = input.name.replace(
                    /pages\[\d+\]\.questions\[\d+\]/,
                    `pages[${pageIndex}].questions[${qIndex}]`
                );
            });
        });
    },

    previewImage(input) {
        const preview = input.nextElementSibling;
        if (!preview || preview.tagName !== 'IMG') return;

        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';

                // Remove keep existing image input if present
                const pageDiv = input.closest('.story-page');
                if (pageDiv) {
                    const keepExistingInput = pageDiv.querySelector('input[name*="keepExistingImage"]');
                    if (keepExistingInput) {
                        keepExistingInput.remove();
                    }
                }
            };
            reader.readAsDataURL(input.files[0]);
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    },

    previewCoverImage(input) {
        const preview = document.getElementById('coverPreview');
        if (!preview) return;

        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';

                // Remove keep existing cover input
                const keepExistingInput = document.querySelector('input[name="keepExistingCover"]');
                if (keepExistingInput) {
                    keepExistingInput.remove();
                }
            };
            reader.readAsDataURL(input.files[0]);
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    },

    // Questions management
    addQuestion(button) {
        const pageDiv = button.closest('.story-page');
        const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
        const questionsContainer = pageDiv.querySelector('.questions-container');
        const questionCount = questionsContainer.querySelectorAll('.question-item').length;

        const template = document.getElementById('questionTemplate');
        if (!template) return;

        const templateContent = template.innerHTML;
        const questionHtml = templateContent
            .replace(/{pageIndex}/g, pageIndex)
            .replace(/{questionIndex}/g, questionCount);

        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = questionHtml;
        questionsContainer.appendChild(questionDiv.firstElementChild);

        // Add simple fade-in effect
        const newQuestion = questionsContainer.lastElementChild;
        newQuestion.style.opacity = '0';
        setTimeout(() => {
            newQuestion.style.opacity = '1';
            newQuestion.style.transition = 'opacity 0.3s ease';
        }, 10);
    },

    removeQuestion(button) {
        const questionItem = button.closest('.question-item');
        if (!questionItem) return;

        // Simple fade-out effect
        questionItem.style.transition = 'opacity 0.3s ease';
        questionItem.style.opacity = '0';

        setTimeout(() => {
            const pageDiv = questionItem.closest('.story-page');
            questionItem.remove();

            // Update question indices for the page
            if (pageDiv) {
                const pageIndex = Array.from(document.querySelectorAll('.story-page')).indexOf(pageDiv);
                this.updateQuestionIndices(pageDiv, pageIndex);
            }
        }, 300);
    },

    // PIN verification for edit/delete actions
    showPinModal(action) {
        this.currentAction = action;

        if (window.Modal) {
            const modal = window.Modal.show('pinModal');
            this.clearPinInputs();

            // Focus first input
            setTimeout(() => {
                const firstInput = document.querySelector('.pin-input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    },

    clearPinInputs() {
        const pinInputs = document.querySelectorAll('.pin-input');
        pinInputs.forEach(input => {
            input.value = '';
        });

        const errorDiv = document.getElementById('pinError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    },

    verifyPin() {
        const pinInputs = document.querySelectorAll('.pin-input');
        const enteredPin = Array.from(pinInputs).map(input => input.value).join('');

        if (enteredPin === this.correctPin) {
            if (window.Modal) {
                window.Modal.hide('pinModal');
            }

            if (this.currentAction === 'save') {
                const form = document.getElementById('storyForm');
                if (form) form.submit();
            } else if (this.currentAction === 'delete') {
                if (window.Modal) {
                    window.Modal.show('deleteConfirmModal');
                }
            }
        } else {
            const errorDiv = document.getElementById('pinError');
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }

            this.clearPinInputs();

            // Focus first input
            const firstInput = document.querySelector('.pin-input');
            if (firstInput) firstInput.focus();
        }
    }
};

// Global functions for backward compatibility
window.addPage = () => StoryForms.addPage();
window.deletePage = (button) => StoryForms.deletePage(button);
window.previewImage = (input) => StoryForms.previewImage(input);
window.previewCoverImage = (input) => StoryForms.previewCoverImage(input);
window.addQuestion = (button) => StoryForms.addQuestion(button);
window.removeQuestion = (button) => StoryForms.removeQuestion(button);
window.showPinModal = (action) => StoryForms.showPinModal(action);
window.verifyPin = () => StoryForms.verifyPin();
window.moveToNext = (input, index) => {
    if (input.value.length === 1) {
        const inputs = document.querySelectorAll('.pin-input');
        if (index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on create/edit pages
    if (document.querySelector('#storyForm') ||
        document.querySelector('#pageTemplate')) {
        StoryForms.init();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryForms };
}