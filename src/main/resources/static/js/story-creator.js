/**
 * story-creator.js - Story Creation Functionality
 * Handles the story creation interface, page management, and editor features
 */

// Add to the SleepyTales namespace
SleepyTales.creator = {
  // State for story creator
  pageCount: 0,

  /**
   * Initialize the story creator
   */
  init() {
    // Set theme from localStorage
    const savedTheme = SleepyTales.utils.getStorageItem(SleepyTales.config.storageKeys.theme, 'light');
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      if (icon) icon.classList.replace('fa-moon', 'fa-sun');
    }

    // Add first page if none exist
    if (this.pageCount === 0) {
      this.addPage();
    }

    // Add event listeners for creator buttons
    this.setupEventListeners();
  },

  /**
   * Setup event listeners for creator functionality
   */
  setupEventListeners() {
    // Add page button
    const addPageButton = document.querySelector('button[onclick*="addPage"]');
    if (addPageButton) {
      // Replace inline handler with proper event listener
      addPageButton.removeAttribute('onclick');
      addPageButton.addEventListener('click', () => this.addPage());
    }

    // Form submission validation
    const storyForm = document.getElementById('storyForm');
    if (storyForm) {
      storyForm.addEventListener('submit', (e) => SleepyTales.forms.validateStoryForm(e));
    }
  },

  /**
   * Add a new page to the story
   */
  addPage() {
    const container = document.getElementById('pagesContainer');
    if (!container) return;

    const template = document.getElementById('pageTemplate');
    if (!template) return;

    const pageHtml = template.innerHTML
      .replace(/{pageNumber}/g, this.pageCount + 1)
      .replace(/{index}/g, this.pageCount);

    const pageDiv = document.createElement('div');
    pageDiv.innerHTML = pageHtml;
    container.appendChild(pageDiv.children[0]); // Append the first child, not the wrapper div

    this.pageCount++;
    this.updatePageNumbers();

    // Add event listeners to the new page's elements
    const newPage = container.lastElementChild;

    // Delete button
    const deleteBtn = newPage.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.removeAttribute('onclick');
      deleteBtn.addEventListener('click', () => this.deletePage(deleteBtn));
    }

    // File inputs for images
    const fileInput = newPage.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.addEventListener('change', () => SleepyTales.forms.previewImage(fileInput));
    }

    // Add question button
    const addQuestionBtn = newPage.querySelector('.btn-questions');
    if (addQuestionBtn) {
      addQuestionBtn.removeAttribute('onclick');
      addQuestionBtn.addEventListener('click', () => SleepyTales.questions.editor.addQuestion(addQuestionBtn));
    }
  },

  /**
   * Delete a page from the story
   * @param {HTMLElement} button - The delete button element
   */
  deletePage(button) {
    const pages = document.querySelectorAll('.story-page');
    if (pages.length <= 1) {
      alert('Story must have at least one page');
      return;
    }

    const page = button.closest('.story-page');
    if (page) {
      // Animate removal
      page.style.opacity = '0';
      page.style.transform = 'translateY(-20px)';

      setTimeout(() => {
        page.remove();
        this.updatePageNumbers();
      }, 300);
    }
  },

  /**
   * Update page numbers and input indices after adding/removing pages
   */
  updatePageNumbers() {
    const pages = document.querySelectorAll('.story-page');

    pages.forEach((page, index) => {
      const heading = page.querySelector('h4');
      if (heading) heading.textContent = `Page ${index + 1}`;

      // Update input names
      const inputs = page.querySelectorAll('input[name*="pages["], textarea[name*="pages["]');
      inputs.forEach(input => {
        input.name = input.name.replace(/pages\[\d+\]/, `pages[${index}]`);

        // Also update page order input value if it exists
        if (input.name.includes('pageOrder')) {
          input.value = index;
        }
      });

      // Update question indices for this page
      const questionsContainer = page.querySelector('.questions-container');
      if (questionsContainer) {
        const questions = questionsContainer.querySelectorAll('.question-item');
        questions.forEach((question, qIndex) => {
          const qInputs = question.querySelectorAll('input[name*="questions["]');
          qInputs.forEach(input => {
            input.name = input.name.replace(/pages\[\d+\]\.questions\[\d+\]/, `pages[${index}].questions[${qIndex}]`);
          });
        });
      }
    });
  }
};

// Initialize story creator when DOM is loaded
SleepyTales.ready(() => {
  // Only initialize if we're on the create story page
  if (document.getElementById('storyForm') && document.getElementById('pagesContainer')) {
    // Set initial page count from existing pages or server variable
    SleepyTales.creator.pageCount = typeof serverPageCount !== 'undefined' ? serverPageCount :
                                document.querySelectorAll('.story-page').length;

    SleepyTales.creator.init();
  }
});

// Add global functions as proxies to our methods for backward compatibility
window.addPage = function() {
  SleepyTales.creator.addPage();
};

window.deletePage = function(button) {
  SleepyTales.creator.deletePage(button);
};