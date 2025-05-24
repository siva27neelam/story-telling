/**
 * components/forms.js - Fixed story creation and editing functionality
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
        this.setupFormSubmission();
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

    setupFormSubmission() {
        const form = document.getElementById('storyForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    submitBtn.disabled = true;

                    // Re-enable after a delay in case of validation errors
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }, 5000);
                }
            });
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

                // Auto-verify if all inputs are filled
                const allFilled = Array.from(pinInputs).every(inp => inp.value.length === 1);
                if (allFilled) {
                    setTimeout(() => this.verifyPin(), 100);
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

        // Setup modal close handlers
        const pinModal = document.getElementById('pinModal');
        if (pinModal) {
            pinModal.addEventListener('hidden.bs.modal', () => {
                this.clearPinInputs();
            });
        }
    },

    setupFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            // Real-time validation
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                input.addEventListener('input', () => {
                    if (input.classList.contains('is-invalid')) {
                        this.validateField(input);
                    }
                });
            });

            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();

                    // Scroll to first error
                    const firstError = form.querySelector('.is-invalid');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstError.focus();
                    }
                }
            });
        });
    },

    validateField(field) {
        const isValid = field.value.trim() !== '';

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }

        return isValid;
    },

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate that each page has text
        const pages = form.querySelectorAll('.story-page');
        pages.forEach((page, index) => {
            const textArea = page.querySelector('textarea[name*=".text"]');
            if (textArea && !textArea.value.trim()) {
                textArea.classList.add('is-invalid');
                isValid = false;

                // Show error message
                this.showFieldError(textArea, `Page ${index + 1} must have text content`);
            }
        });

        if (!isValid) {
            this.showAlert('Please fix the validation errors before submitting.', 'danger');
        }

        return isValid;
    },

    showFieldError(field, message) {
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-danger mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);

        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    },

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.story-container .alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of story container
        const container = document.querySelector('.story-container');
        if (container) {
            container.insertBefore(alert, container.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
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

        // Scroll to new page
        const newPage = container.lastElementChild;
        newPage.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Focus on the text area
        const textArea = newPage.querySelector('textarea');
        if (textArea) {
            setTimeout(() => textArea.focus(), 500);
        }
    },

    deletePage(button) {
        const pageElements = document.querySelectorAll('.story-page');

        if (pageElements.length > 1) {
            const page = button.closest('.story-page');
            if (page) {
                // Add fade out animation
                page.style.transition = 'opacity 0.3s ease';
                page.style.opacity = '0';

                setTimeout(() => {
                    page.remove();
                    this.updatePageNumbers();
                }, 300);
            }
        } else {
            this.showAlert('Story must have at least one page', 'warning');
        }
    },

    updatePageNumbers() {
        const pages = document.querySelectorAll('.story-page');

        pages.forEach((page, index) => {
            const heading = page.querySelector('h4 span');
            if (heading) {
                heading.textContent = index + 1;
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
            const qInputs = question.querySelectorAll('input[name*="questions["], textarea[name*="questions["]');
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
            const file = input.files[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showAlert('Image file size must be less than 5MB', 'warning');
                input.value = '';
                return;
            }

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
            reader.readAsDataURL(file);
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    },

    previewCoverImage(input) {
        const preview = document.getElementById('coverPreview');
        if (!preview) return;

        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showAlert('Cover image file size must be less than 5MB', 'warning');
                input.value = '';
                return;
            }

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
            reader.readAsDataURL(file);
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

        // Add fade-in effect
        const newQuestion = questionsContainer.lastElementChild;
        newQuestion.style.opacity = '0';
        setTimeout(() => {
            newQuestion.style.opacity = '1';
            newQuestion.style.transition = 'opacity 0.3s ease';

            // Focus on question text input
            const questionInput = newQuestion.querySelector('input[type="text"]');
            if (questionInput) {
                questionInput.focus();
            }
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

    // PIN verification for delete actions only
    showPinModal(action) {
        this.currentAction = action;

        // Show Bootstrap modal
        const pinModal = document.getElementById('pinModal');
        if (pinModal && window.bootstrap) {
            const modal = new bootstrap.Modal(pinModal);
            modal.show();
            this.clearPinInputs();

            // Focus first input after modal is shown
            pinModal.addEventListener('shown.bs.modal', () => {
                const firstInput = document.querySelector('.pin-input');
                if (firstInput) firstInput.focus();
            }, { once: true });
        }
    },

    clearPinInputs() {
        const pinInputs = document.querySelectorAll('.pin-input');
        pinInputs.forEach(input => {
            input.value = '';
            input.classList.remove('is-invalid');
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
            // Hide PIN modal
            const pinModal = document.getElementById('pinModal');
            if (pinModal && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(pinModal);
                if (modal) {
                    modal.hide();
                }
            }

            // Execute the action
            if (this.currentAction === 'delete') {
                // Show delete confirmation modal
                const deleteModal = document.getElementById('deleteConfirmModal');
                if (deleteModal && window.bootstrap) {
                    const modal = new bootstrap.Modal(deleteModal);
                    modal.show();
                }
            }
        } else {
            // Show error
            const errorDiv = document.getElementById('pinError');
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }

            // Add error styling to inputs
            pinInputs.forEach(input => {
                input.classList.add('is-invalid');
            });

            // Clear inputs and refocus
            this.clearPinInputs();
            const firstInput = document.querySelector('.pin-input');
            if (firstInput) {
                firstInput.focus();
            }

            // Shake effect
            const pinContainer = document.querySelector('.pin-container');
            if (pinContainer) {
                pinContainer.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    pinContainer.style.animation = '';
                }, 500);
            }
        }
    },

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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

// PIN input navigation helper
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

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
    }

    .field-error {
        font-size: 0.875rem;
    }

    .is-invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }

    .is-valid {
        border-color: #198754 !important;
        box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25) !important;
    }

    .pin-input.is-invalid {
        border-color: #dc3545 !important;
        background-color: rgba(220, 53, 69, 0.1) !important;
    }
`;
document.head.appendChild(style);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryForms };
}