/**
 * ui.js - UI Components and Controls
 * Handles UI elements like sidebar, theme, and modals
 */

// Add to the SleepyTales namespace
SleepyTales.ui = {};

/**
 * Theme management for light/dark modes
 */
SleepyTales.ui.theme = {
  /**
   * Toggle between light and dark theme
   */
  toggle() {
    const body = document.body;
    const mainIcon = document.getElementById('themeIcon');
    const sidebarIcon = document.getElementById('sidebarThemeIcon');

    // Create a transition overlay for smoother theme change
    const overlay = SleepyTales.utils.createElement('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: '9999',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      }
    });

    document.body.appendChild(overlay);

    // Fade in overlay
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);

    // Switch theme after brief delay
    setTimeout(() => {
      const isDark = body.getAttribute('data-theme') === 'dark';

      if (isDark) {
        body.removeAttribute('data-theme');
        if (mainIcon) mainIcon.classList.replace('fa-sun', 'fa-moon');
        if (sidebarIcon) sidebarIcon.classList.replace('fa-sun', 'fa-moon');
        SleepyTales.utils.setStorageItem(SleepyTales.config.storageKeys.theme, 'light');
      } else {
        body.setAttribute('data-theme', 'dark');
        if (mainIcon) mainIcon.classList.replace('fa-moon', 'fa-sun');
        if (sidebarIcon) sidebarIcon.classList.replace('fa-moon', 'fa-sun');
        SleepyTales.utils.setStorageItem(SleepyTales.config.storageKeys.theme, 'dark');
      }

      // Fade out overlay and remove
      overlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);

    }, 300);

    // Play sound effect
    SleepyTales.utils.playSound('pop');
  }
};

/**
 * Sidebar management
 */
SleepyTales.ui.sidebar = {
  isOpen: false,

  /**
   * Initialize sidebar
   */
  init() {
    // Set theme icon based on current theme
    const savedTheme = SleepyTales.utils.getStorageItem(SleepyTales.config.storageKeys.theme, 'light');
    const themeIcon = document.getElementById('sidebarThemeIcon');

    if (savedTheme === 'dark' && themeIcon) {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    // Add event listener for hamburger menu
    const hamburger = document.getElementById('hamburgerMenu');
    if (hamburger) {
      hamburger.addEventListener('click', this.toggle.bind(this));
    }

    // Add event listener for overlay
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.addEventListener('click', this.toggle.bind(this));
    }
  },

  /**
   * Toggle sidebar open/closed
   */
  toggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!sidebar || !overlay) return;

    this.isOpen = !this.isOpen;

    sidebar.classList.toggle('active', this.isOpen);
    overlay.classList.toggle('active', this.isOpen);
  }
};

/**
 * Modal management
 */
SleepyTales.ui.modals = {
  /**
   * Show a suggestion modal
   */
  showSuggestionModal() {
    const modal = bootstrap?.Modal?.getInstance?.(document.getElementById('suggestionModal')) ||
                  new bootstrap.Modal(document.getElementById('suggestionModal'));
    modal.show();
  },

  /**
   * Show a newsletter modal
   */
  showNewsletterModal() {
    const modal = bootstrap?.Modal?.getInstance?.(document.getElementById('newsletterModal')) ||
                  new bootstrap.Modal(document.getElementById('newsletterModal'));
    modal.show();
  },

  /**
   * Show a coming soon modal
   * @param {string} featureName - Name of the coming soon feature
   */
  showComingSoonModal(featureName) {
    const featureSpan = document.getElementById('comingSoonFeature');
    if (featureSpan) {
      featureSpan.textContent = featureName;
    }

    const modal = bootstrap?.Modal?.getInstance?.(document.getElementById('comingSoonModal')) ||
                  new bootstrap.Modal(document.getElementById('comingSoonModal'));
    modal.show();
  }
};

/**
 * Magic Menu functionality
 */
SleepyTales.ui.magicMenu = {
  isOpen: false,

  /**
   * Initialize magic menu
   */
  init() {
    const trigger = document.querySelector('.magic-trigger');
    if (trigger) {
      trigger.addEventListener('click', this.toggle.bind(this));
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !e.target.closest('.magic-corner')) {
        this.toggle();
      }
    });

    // Initialize magic items
    const magicItems = document.querySelectorAll('.magic-item');
    magicItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const emojiType = e.currentTarget.dataset.emoji || '⭐';
        SleepyTales.animations.createShower(emojiType);
      });
    });
  },

  /**
   * Toggle magic menu open/closed
   */
  toggle() {
    const menu = document.getElementById('magicMenu');
    if (!menu) return;

    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      menu.style.display = 'flex';
      setTimeout(() => {
        menu.style.opacity = '1';
        menu.style.transform = 'scale(1)';
      }, 10);

      // Play sound
      SleepyTales.utils.playSound('pop');
    } else {
      menu.style.opacity = '0';
      menu.style.transform = 'scale(0.5)';
      setTimeout(() => {
        menu.style.display = 'none';
      }, 300);
    }
  }
};

/**
 * Pin verification system
 */
SleepyTales.ui.pinVerification = {
  currentAction: null,
  pinModal: null,
  correctPin: '5381', // In production, this would be validated server-side, not stored in JS

  /**
   * Initialize pin system
   */
  init() {
    // Add keydown event listener for the PIN inputs
    document.querySelectorAll('.pin-input').forEach((input, index) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value) {
          if (index > 0) {
            const prevInput = document.querySelectorAll('.pin-input')[index - 1];
            prevInput.focus();
          }
        }
        // Submit when Enter is pressed
        if (e.key === 'Enter') {
          this.verify();
        }
      });
    });
  },

  /**
   * Show the PIN modal
   * @param {string} action - The action to perform after PIN verification ('save' or 'delete')
   */
  show(action) {
    this.currentAction = action;
    this.pinModal = new bootstrap.Modal(document.getElementById('pinModal'));
    this.pinModal.show();

    // Clear previous inputs and error message
    document.querySelectorAll('.pin-input').forEach(input => {
      input.value = '';
    });

    const errorElement = document.getElementById('pinError');
    if (errorElement) {
      errorElement.style.display = 'none';
    }

    // Focus first input
    const firstInput = document.querySelector('.pin-input');
    if (firstInput) {
      firstInput.focus();
    }
  },

  /**
   * Move focus to the next PIN input
   * @param {HTMLElement} input - The current input element
   * @param {number} index - The index of the current input
   */
  moveToNext(input, index) {
    if (input.value.length === 1) {
      if (index < 3) {
        const nextInput = document.querySelectorAll('.pin-input')[index + 1];
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  },

  /**
   * Verify the entered PIN
   */
  verify() {
    const inputs = document.querySelectorAll('.pin-input');
    const enteredPin = Array.from(inputs)
      .map(input => input.value)
      .join('');

    if (enteredPin === this.correctPin) {
      this.pinModal.hide();

      if (this.currentAction === 'save') {
        const form = document.getElementById('storyForm');
        if (form) form.submit();
      } else if (this.currentAction === 'delete') {
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        deleteModal.show();
      }
    } else {
      const errorElement = document.getElementById('pinError');
      if (errorElement) {
        errorElement.style.display = 'block';
      }

      // Clear inputs
      inputs.forEach(input => {
        input.value = '';
      });

      // Focus first input
      inputs[0].focus();
    }
  }
};

// Initialize sidebar and other UI components when DOM is ready
SleepyTales.ready(() => {
  SleepyTales.ui.sidebar.init();
  SleepyTales.ui.magicMenu.init();

  // Initialize pin verification if needed
  if (document.querySelector('.pin-input')) {
    SleepyTales.ui.pinVerification.init();
  }

  // Initialize event handlers for UI controls

  // Theme toggle button in header
  const headerThemeToggle = document.getElementById('themeIcon');
  if (headerThemeToggle) {
    headerThemeToggle.addEventListener('click', SleepyTales.ui.theme.toggle);
  }

  // Theme toggle in sidebar
  const sidebarThemeToggle = document.getElementById('sidebarThemeIcon')?.parentElement;
  if (sidebarThemeToggle) {
    sidebarThemeToggle.addEventListener('click', SleepyTales.ui.theme.toggle);
  }
});

// Add global functions as proxies to our methods for backward compatibility
window.toggleSidebar = function() {
  SleepyTales.ui.sidebar.toggle();
};

window.toggleTheme = function() {
  SleepyTales.ui.theme.toggle();
};

window.toggleThemeFromSidebar = function() {
  SleepyTales.ui.theme.toggle();
};

window.showSuggestionModal = function() {
  SleepyTales.ui.modals.showSuggestionModal();
};

window.showNewsletterModal = function() {
  SleepyTales.ui.modals.showNewsletterModal();
};

window.showComingSoonModal = function(featureName) {
  SleepyTales.ui.modals.showComingSoonModal(featureName);
};

window.toggleMagicMenu = function() {
  SleepyTales.ui.magicMenu.toggle();
};

window.showPinModal = function(action) {
  SleepyTales.ui.pinVerification.show(action);
};

window.verifyPin = function() {
  SleepyTales.ui.pinVerification.verify();
};

window.moveToNext = function(input, index) {
  SleepyTales.ui.pinVerification.moveToNext(input, index);
};