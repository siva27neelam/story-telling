/**
 * forms.js - Form handling functionality
 * Manages forms, input validation, and submissions across the application
 */

// Add to the SleepyTales namespace
SleepyTales.forms = {
  /**
   * Initialize forms handling
   */
  init() {
    this.setupFormListeners();
  },

  /**
   * Set up listeners for common forms
   */
  setupFormListeners() {
    // Suggestion form
    const suggestionForm = document.getElementById('suggestionForm');
    if (suggestionForm) {
      suggestionForm.addEventListener('submit', this.handleSuggestionFormSubmit);
    }

    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', this.handleNewsletterFormSubmit);
    }

    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', this.handleSettingsFormSubmit);
    }

    // Story form validation
    const storyForm = document.getElementById('storyForm');
    if (storyForm) {
      storyForm.addEventListener('submit', this.validateStoryForm);
    }
  },

  /**
   * Handle suggestion form submission
   * @param {Event} e - The submit event
   */
  handleSuggestionFormSubmit(e) {
    e.preventDefault();

    // Collect form data
    const name = document.getElementById('suggestionName').value;
    const email = document.getElementById('suggestionEmail').value;
    const suggestion = document.getElementById('suggestionText').value;

    // Simple validation
    if (!name || !email || !suggestion) {
      alert('Please fill out all fields');
      return;
    }

    if (!SleepyTales.forms.validateEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // For now, just show a success message
    // In the future, this would send to your backend API
    alert(`Thank you, ${name}! Your suggestion has been submitted.`);

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('suggestionModal'));
    if (modal) modal.hide();

    // Reset the form
    e.target.reset();
  },

  /**
   * Handle newsletter form submission
   * @param {Event} e - The submit event
   */
  handleNewsletterFormSubmit(e) {
    e.preventDefault();

    // Collect form data
    const name = document.getElementById('newsletterName').value;
    const email = document.getElementById('newsletterEmail').value;

    // Simple validation
    if (!name || !email) {
      alert('Please fill out all fields');
      return;
    }

    if (!SleepyTales.forms.validateEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // For now, just show a success message
    // In the future, this would send to your backend API
    alert(`Thank you, ${name}! You have been successfully subscribed to our newsletter.`);

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newsletterModal'));
    if (modal) modal.hide();

    // Reset the form
    e.target.reset();
  },

  /**
   * Handle settings form submission
   * @param {Event} e - The submit event
   */
  handleSettingsFormSubmit(e) {
    e.preventDefault();

    // Collect form data
    const settings = {
      siteTitle: document.getElementById('siteTitle').value,
      contactEmail: document.getElementById('contactEmail').value,
      itemsPerPage: document.getElementById('itemsPerPage').value,
      enableRegistration: document.getElementById('enableRegistration').checked
    };

    SleepyTales.utils.log('Settings saved:', settings);

    // For now, just show a success message
    // In the future, this would send to your backend API
    alert('Settings saved successfully!');
  },

  /**
   * Validate a story form before submission
   * @param {Event} e - The submit event
   */
  validateStoryForm(e) {
    const titleInput = document.getElementById('title');
    if (!titleInput || !titleInput.value.trim()) {
      e.preventDefault();
      alert('Please enter a story title');
      titleInput.focus();
      return;
    }

    // Check if at least one page has content
    const pageTexts = document.querySelectorAll('textarea[name*="pages"][name*="text"]');
    let hasPageContent = false;

    for (const pageText of pageTexts) {
      if (pageText.value.trim()) {
        hasPageContent = true;
        break;
      }
    }

    if (!hasPageContent) {
      e.preventDefault();
      alert('Please add at least one page with content');
      return;
    }

    // If everything is valid, form will submit
  },

  /**
   * Preview cover image before upload
   * @param {HTMLElement} input - The file input element
   */
  previewCoverImage(input) {
    const preview = document.getElementById('coverPreview');
    if (!preview) return;

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
  },

  /**
   * Preview page image before upload
   * @param {HTMLElement} input - The file input element
   */
  previewImage(input) {
    const preview = input.nextElementSibling;
    if (!preview) return;

    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';

        // Find and remove the keepExistingImage input if it exists
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

  /**
   * Validate email address
   * @param {string} email - The email address to validate
   * @returns {boolean} True if email is valid
   */
  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
};

// Initialize forms handling when DOM is loaded
SleepyTales.ready(() => {
  SleepyTales.forms.init();
});

// Add global functions as proxies to our methods for backward compatibility
window.previewCoverImage = function(input) {
  SleepyTales.forms.previewCoverImage(input);
};

window.previewImage = function(input) {
  SleepyTales.forms.previewImage(input);
};