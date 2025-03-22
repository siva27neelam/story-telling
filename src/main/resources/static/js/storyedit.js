/**
 * Story Edit page functionality
 */

// Global variables
let pageCount = 0;
const CORRECT_PIN = '5381';
let currentAction = null;
let pinModal = null;

/**
 * Initialize the edit page
 * @param {number} initialPageCount - The initial number of pages
 */
function initializeEditPage(initialPageCount) {
    pageCount = initialPageCount;

    // Add PIN modal event listeners
    initializePinModal();

    // Add theme support
    initializeTheme();
}

/**
 * Initialize PIN modal functionality
 */
function initializePinModal() {
    // Add keydown event listener for the PIN inputs
    document.querySelectorAll('.pin-input').forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value) {
                if (index > 0) {
                    const prevInput = document.querySelectorAll('.pin-input')[index - 1];
                    prevInput.focus();
                }
            }
            // Submit when Enter is pressed
            if (e.key === 'Enter') {
                verifyPin();
            }
        });
    });
}

/**
 * Show the PIN modal
 * @param {string} action - The action to perform after PIN verification ('save' or 'delete')
 */
function showPinModal(action) {
    currentAction = action;
    pinModal = new bootstrap.Modal(document.getElementById('pinModal'));
    pinModal.show();

    // Clear previous inputs and error message
    document.querySelectorAll('.pin-input').forEach(input => {
        input.value = '';
    });
    document.getElementById('pinError').style.display = 'none';

    // Focus first input
    document.querySelector('.pin-input').focus();
}

/**
 * Move focus to the next PIN input
 * @param {HTMLElement} input - The current input element
 * @param {number} index - The index of the current input
 */
function moveToNext(input, index) {
    if (input.value.length === 1) {
        if (index < 3) {
            const nextInput = document.querySelectorAll('.pin-input')[index + 1];
            nextInput.focus();
        }
    }
}

/**
 * Verify the entered PIN
 */
function verifyPin() {
    const enteredPin = Array.from(document.querySelectorAll('.pin-input'))
        .map(input => input.value)
        .join('');

    if (enteredPin === CORRECT_PIN) {
        pinModal.hide();
        if (currentAction === 'save') {
            document.getElementById('storyForm').submit();
        } else if (currentAction === 'delete') {
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
            deleteModal.show();
        }
    } else {
        document.getElementById('pinError').style.display = 'block';
        // Clear inputs
        document.querySelectorAll('.pin-input').forEach(input => {
            input.value = '';
        });
        // Focus first input
        document.querySelector('.pin-input').focus();
    }
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

        const inputs = page.querySelectorAll('input[name*="pages["], textarea[name*="pages["], input[name*="keepExistingImage["]');
        inputs.forEach(input => {
            if (input.name.includes('pages[')) {
                input.name = input.name.replace(/pages\[\d+\]/, `pages[${index}]`);
                if (input.name.includes('pageOrder')) {
                    input.value = index;
                }
            }
            if (input.name.includes('keepExistingImage[')) {
                input.name = input.name.replace(/keepExistingImage\[\d+\]/, `keepExistingImage[${index}]`);
            }
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

            // Find and remove the keepExistingImage input if it exists
            const pageDiv = input.closest('.story-page');
            const keepExistingInput = pageDiv.querySelector('input[name*="keepExistingImage"]');
            if (keepExistingInput) {
                keepExistingInput.remove();
            }
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

/**
 * Toggle between light and dark theme
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
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get initial page count from the server
    const initialPageCount = typeof serverPageCount !== 'undefined' ? serverPageCount :
                            document.querySelectorAll('.story-page').length;

    initializeEditPage(initialPageCount);
});

function previewCoverImage(input) {
    const preview = document.getElementById('coverPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';

            // Remove keepExistingCover if we're uploading a new image
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
}