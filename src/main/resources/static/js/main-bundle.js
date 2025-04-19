/**
 * main-bundle.js - Combined JavaScript for SleepyTales
 * This file combines all the optimized modules into a single file
 * for easier inclusion in HTML pages.
 */

/**
 * ==========================================
 * Core Utilities
 * ==========================================
 */
// Create namespace to avoid global pollution
const SleepyTales = window.SleepyTales || {};

// Core configuration
SleepyTales.config = {
  debug: false, // Set to true to enable debug logging
  animationDuration: 300, // Default animation duration in ms
  storageKeys: {
    theme: 'theme'
  },
  soundEffects: {
    enabled: true,
    volume: 0.4,
    sounds: {
      twinkle: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/success.mp3',
      pop: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/click.mp3',
      balloon: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/notification.mp3',
      magic: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/toggle.mp3',
      'page-turn': 'https://cdn.jsdelivr.net/gh/Leimi/SoundButton@master/sounds/sfx_sounds_page-turn-01a.mp3'
    }
  }
};

// Core utilities
SleepyTales.utils = {
  /**
   * Debug logging - only logs if debug mode is enabled
   * @param {string} message - Message to log
   * @param {*} data - Optional data to log
   */
  log(message, data) {
    if (SleepyTales.config.debug && console) {
      if (data) {
        console.log(`[SleepyTales] ${message}`, data);
      } else {
        console.log(`[SleepyTales] ${message}`);
      }
    }
  },

  /**
   * Get a value from localStorage with fallback
   * @param {string} key - The key to retrieve
   * @param {*} fallback - Fallback value if key doesn't exist
   * @returns {*} The value or fallback
   */
  getStorageItem(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (e) {
      this.log('Error accessing localStorage', e);
      return fallback;
    }
  },

  /**
   * Set a value in localStorage with error handling
   * @param {string} key - The key to set
   * @param {*} value - The value to store
   */
  setStorageItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      this.log('Error writing to localStorage', e);
    }
  },

  /**
   * Debounce function to limit how often a function can be called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Time to wait in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 100) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Throttle function to limit how often a function can be called
   * @param {Function} func - Function to throttle
   * @param {number} limit - Minimum time between calls in ms
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Create a DOM element with attributes and children
   * @param {string} tag - The tag name
   * @param {Object} attributes - Element attributes
   * @param {Array|Node|string} children - Child elements or text
   * @returns {HTMLElement} The created element
   */
  createElement(tag, attributes = {}, children = null) {
    const element = document.createElement(tag);

    // Add attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    // Add children
    if (children) {
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (child instanceof Node) {
            element.appendChild(child);
          } else {
            element.appendChild(document.createTextNode(String(child)));
          }
        });
      } else if (children instanceof Node) {
        element.appendChild(children);
      } else {
        element.textContent = String(children);
      }
    }

    return element;
  },

  /**
   * Play a sound effect with volume control
   * @param {string} type - The type of sound to play
   */
  playSound(type) {
    if (!SleepyTales.config.soundEffects.enabled) return;

    const soundUrl = SleepyTales.config.soundEffects.sounds[type] ||
                     SleepyTales.config.soundEffects.sounds.pop;

    try {
      const audio = new Audio(soundUrl);
      audio.volume = SleepyTales.config.soundEffects.volume;
      audio.play().catch(e => this.log('Audio play failed:', e));
    } catch (e) {
      this.log('Error playing sound', e);
    }
  },

  /**
   * Initialize the application
   * Call this on DOMContentLoaded
   */
  init() {
    this.log('Core initialized');

    // Set theme from localStorage
    const savedTheme = this.getStorageItem(SleepyTales.config.storageKeys.theme, 'light');
    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      const themeIcon = document.getElementById('themeIcon');
      if (themeIcon) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
      }
    }

    // Remove skeleton loaders and show content after small delay
    setTimeout(() => {
      document.querySelectorAll('.story-content').forEach(content => {
        content.style.display = 'block';
      });

      document.querySelectorAll('.story-skeleton').forEach(skeleton => {
        skeleton.style.display = 'none';
      });

      // Show floating elements after content is loaded
      const floatingElements = document.querySelector('.floating-elements');
      if (floatingElements) {
        floatingElements.style.display = 'block';
      }
    }, 500);
  }
};

// Create a container for particles if it doesn't exist
SleepyTales.ensureParticleContainer = function() {
  let container = document.getElementById('particle-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'particle-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '999';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
  }
  return container;
};

// Document ready function
SleepyTales.ready = function(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
};

/**
 * ==========================================
 * UI Components & Controls
 * ==========================================
 */
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

/**
 * ==========================================
 * Visual Effects and Animations
 * ==========================================
 */
SleepyTales.animations = {
  /**
   * Create a shower of emoji particles
   * @param {string} emoji - The emoji to use
   */
  createShower(emoji) {
    const container = SleepyTales.ensureParticleContainer();
    const count = 20 + Math.floor(Math.random() * 10); // Between 20-30 particles

    // Clear existing particles if there are too many
    if (container.children.length > 100) {
      container.innerHTML = '';
    }

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Play a fun sound effect
    const audioEffects = {
      '⭐': 'twinkle',
      '❤️': 'pop',
      '🎈': 'balloon',
      '🌈': 'magic',
      '🎉': 'twinkle'
    };

    SleepyTales.utils.playSound(audioEffects[emoji] || 'pop');

    // Create particles
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = emoji;

      // Random position from click or center
      const startX = 40 + Math.random() * (window.innerWidth - 80);
      const startY = window.innerHeight;

      // Random end position
      const endX = startX + (Math.random() - 0.5) * 300;
      const endY = 100 + Math.random() * 400;

      // Random sizes and rotation
      const size = 40 + Math.random() * 60;
      const rotation = Math.random() * 360;

      // Set styles
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      particle.style.fontSize = size + 'px';

      // Add to fragment
      fragment.appendChild(particle);

      // Schedule removal after animation completes to prevent memory leaks
      setTimeout(() => {
        if (container.contains(particle)) {
          container.removeChild(particle);
        }
      }, 3000);
    }

    // Add all particles to DOM at once
    container.appendChild(fragment);

    // Trigger animation in next frame for better performance
    requestAnimationFrame(() => {
      const particles = container.querySelectorAll('.particle');
      particles.forEach((particle, index) => {
        // Random end position calculated above
        const endX = (Math.random() - 0.5) * 300;
        const endY = -(100 + Math.random() * 400);
        const rotation = Math.random() * 360;

        // Set transition with slight delay between particles
        particle.style.transition = `transform 3s ease-out ${index * 0.02}s, opacity 2.8s ease-out ${index * 0.02}s`;
        particle.style.transform = `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`;
        particle.style.opacity = '0';
      });
    });
  },

  /**
   * Create a smaller shower of emoji particles
   * @param {string} emoji - The emoji to use
   * @param {number} count - Number of particles
   * @param {boolean} nearButton - Whether to position near a button
   */
  createTinyShower(emoji, count = 5, nearButton = false) {
    const container = SleepyTales.ensureParticleContainer();
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle tiny';
      particle.textContent = emoji;

      let startX, startY;

      if (nearButton) {
        // Position near the button
        const buttonId = emoji === '❓' ? 'questionsBtn' : (emoji === '💬' ? 'readBtn' : 'questionsBtn');
        const button = document.getElementById(buttonId);

        if (button) {
          const rect = button.getBoundingClientRect();
          startX = rect.x + rect.width/2 + (Math.random() - 0.5) * 20;
          startY = rect.y;
        } else {
          startX = Math.random() * window.innerWidth;
          startY = Math.random() * window.innerHeight;
        }
      } else {
        startX = Math.random() * window.innerWidth;
        startY = Math.random() * window.innerHeight;
      }

      // Random end position
      const endX = startX + (Math.random() - 0.5) * 100;
      const endY = startY - 50 - Math.random() * 50;
      const rotation = (Math.random() - 0.5) * 60;

      // Set styles
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      particle.style.fontSize = 20 + Math.random() * 10 + 'px';

      // Add to fragment
      fragment.appendChild(particle);

      // Schedule removal
      setTimeout(() => {
        if (container.contains(particle)) {
          container.removeChild(particle);
        }
      }, 2000);
    }

    // Add all particles to DOM at once
    container.appendChild(fragment);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      const particles = container.querySelectorAll('.particle.tiny');
      particles.forEach((particle, index) => {
        // Apply the computed end positions
        const endX = (Math.random() - 0.5) * 100;
        const endY = -(50 + Math.random() * 50);
        const rotation = (Math.random() - 0.5) * 60;

        // Set transition with slight delay
        particle.style.transition = `transform 1.5s ease-out ${index * 0.05}s, opacity 1.2s ease-out ${index * 0.05}s`;
        particle.style.transform = `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`;
        particle.style.opacity = '0';
      });
    });
  },

  /**
   * Show achievement notification
   * @param {string} title - Achievement title
   * @param {string} text - Achievement description
   */
  showAchievement(title, text) {
    const toast = document.getElementById('achievementToast');
    if (!toast) return; // Skip if element doesn't exist

    const achievementText = document.getElementById('achievementText');
    const headingElement = toast.querySelector('h4');

    // Set achievement text
    if (achievementText) {
      achievementText.textContent = text;
    }

    // Update title
    if (headingElement) {
      headingElement.textContent = title;
    }

    // Show toast
    toast.classList.add('show');

    // Play sound
    SleepyTales.utils.playSound('twinkle');

    // Hide after some time
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  },

  /**
   * Show page turn effect animation
   * @param {string} direction - The direction of the page turn ('left' or 'right')
   */
  showPageTurnEffect(direction) {
    // Create the effect elements dynamically if they don't exist
    let effect = document.querySelector('.page-turn-effect');
    if (!effect) {
      effect = document.createElement('div');
      effect.className = 'page-turn-effect';
      effect.style.position = 'fixed';
      effect.style.top = '0';
      effect.style.left = '0';
      effect.style.width = '100%';
      effect.style.height = '100%';
      effect.style.zIndex = '1000';
      effect.style.pointerEvents = 'none';
      effect.style.display = 'none';

      const fold = document.createElement('div');
      fold.className = 'page-turn-fold';
      fold.style.position = 'absolute';
      fold.style.backgroundColor = 'var(--page-color, #f0f0f0)';
      fold.style.transformOrigin = 'top left';

      effect.appendChild(fold);
      document.body.appendChild(effect);
    }

    const fold = effect.querySelector('.page-turn-fold');

    // Fallback color if CSS variable is not set
    const pageColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-color') || '#f0f0f0';

    // Set up the effect based on direction
    if (direction === 'right') {
      fold.style.top = '0';
      fold.style.right = '0';
      fold.style.borderWidth = '0 0 100vh 100vw';
      fold.style.borderColor = `transparent transparent ${pageColor} transparent`;
      fold.style.borderStyle = 'solid';
    } else {
      fold.style.top = '0';
      fold.style.left = '0';
      fold.style.borderWidth = '100vh 100vw 0 0';
      fold.style.borderColor = `${pageColor} transparent transparent transparent`;
      fold.style.borderStyle = 'solid';
    }

    // Show the effect
    effect.style.display = 'block';

    // Animate the fold
    requestAnimationFrame(() => {
      fold.style.transition = 'all 0.3s ease-out';
      fold.style.borderWidth = '0 0 0 0';
    });

    // Hide the effect after animation completes
    setTimeout(() => {
      effect.style.display = 'none';
      fold.style.transition = 'none'; // Reset for next animation
    }, 300);
  },

  /**
   * Show reading indicator while text is being read aloud
   */
  showReadingIndicator() {
    let indicator = document.querySelector('.reading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'reading-indicator';
      indicator.innerHTML = `
        <div class="indicator-icon">🔊</div>
        <div class="indicator-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      `;
      document.body.appendChild(indicator);
    }

    indicator.style.display = 'flex';
    indicator.style.opacity = '0';
    indicator.style.transform = 'translateY(20px)';

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      indicator.style.transition = 'all 0.3s ease';
      indicator.style.opacity = '1';
      indicator.style.transform = 'translateY(0)';
    });
  },

  /**
   * Hide reading indicator
   */
  hideReadingIndicator() {
    const indicator = document.querySelector('.reading-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateY(20px)';

      setTimeout(() => {
        indicator.style.display = 'none';
      }, 300);
    }
  }
};

/**
 * ==========================================
 * Initialize on document ready
 * ==========================================
 */
SleepyTales.ready(() => {
  // Initialize core functionality
  SleepyTales.utils.init();

  // Initialize UI components
  SleepyTales.ui.sidebar.init();
  SleepyTales.ui.magicMenu.init();

  // Initialize pin verification if needed
  if (document.querySelector('.pin-input')) {
    SleepyTales.ui.pinVerification.init();
  }

  // Initialize components based on the current page

  // Story view page
  if (document.querySelector('.story-pages.view-mode')) {
    // Initialize story view and questions
    if (typeof SleepyTales.story !== 'undefined') {
      SleepyTales.story.init();
    }

    if (typeof SleepyTales.questions !== 'undefined') {
      SleepyTales.questions.init();
    }
  }

  // Story create/edit page
  if (document.getElementById('storyForm') && document.getElementById('pagesContainer')) {
    // Initialize story creator
    if (typeof SleepyTales.creator !== 'undefined') {
      // Set initial page count
      SleepyTales.creator.pageCount = typeof serverPageCount !== 'undefined' ? serverPageCount :
                                  document.querySelectorAll('.story-page').length;

      SleepyTales.creator.init();
    }
  }

  // Admin dashboard
  if (document.querySelector('.admin-container')) {
    if (typeof SleepyTales.admin !== 'undefined') {
      SleepyTales.admin.init();
    }
  }

  // Initialize forms handling
  if (typeof SleepyTales.forms !== 'undefined') {
    SleepyTales.forms.init();
  }

  // Initialize theme toggles
  const headerThemeToggle = document.getElementById('themeIcon');
  if (headerThemeToggle) {
    headerThemeToggle.addEventListener('click', SleepyTales.ui.theme.toggle);
  }

  const sidebarThemeToggle = document.getElementById('sidebarThemeIcon')?.parentElement;
  if (sidebarThemeToggle) {
    sidebarThemeToggle.addEventListener('click', SleepyTales.ui.theme.toggle);
  }
});

/**
 * ==========================================
 * Global Function Compatibility Layer
 * ==========================================
 * These global functions provide backward compatibility
 * with the old code structure to avoid breaking existing
 * HTML that relies on these function names
 */

// UI Functions
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

// Animation Functions
window.createShower = function(emoji) {
  SleepyTales.animations.createShower(emoji);
};

window.createTinyShower = function(emoji, count, nearButton) {
  SleepyTales.animations.createTinyShower(emoji, count, nearButton);
};

window.playSound = function(type) {
  SleepyTales.utils.playSound(type);
};

window.showAchievement = function(title, text) {
  SleepyTales.animations.showAchievement(title, text);
};

// Story Functions
window.showPage = function(index) {
  if (typeof SleepyTales.story !== 'undefined') {
    SleepyTales.story.showPage(index);
  }
};

window.nextPage = function() {
  if (typeof SleepyTales.story !== 'undefined') {
    SleepyTales.story.nextPage();
  }
};

window.previousPage = function() {
  if (typeof SleepyTales.story !== 'undefined') {
    SleepyTales.story.previousPage();
  }
};

window.toggleReadAloud = function() {
  if (typeof SleepyTales.story !== 'undefined') {
    SleepyTales.story.toggleReadAloud();
  }
};

window.startReading = function(text) {
  if (typeof SleepyTales.story !== 'undefined') {
    // If text is provided, that was the old API; if not, use our new method
    if (text) {
      SleepyTales.utils.log('Legacy startReading call with text parameter');
      // Legacy behavior would start with provided text; we now get it from the page
      SleepyTales.story.startReading();
    } else {
      SleepyTales.story.startReading();
    }
  }
};

window.stopReading = function() {
  if (typeof SleepyTales.story !== 'undefined') {
    SleepyTales.story.stopReading();
  }
};

window.recordQuestionAnswer = function(correct) {
  if (typeof SleepyTales.story !== 'undefined') {
    SleepyTales.story.recordQuestionAnswer(correct);
  }
};

// Question Functions
window.showQuestions = function() {
  if (typeof SleepyTales.questions !== 'undefined') {
    SleepyTales.questions.showQuestions();
  }
};

window.checkAnswer = function(selectedIndex) {
  if (typeof SleepyTales.questions !== 'undefined') {
    SleepyTales.questions.checkAnswer(selectedIndex);
  }
};

window.addQuestion = function(button) {
  if (typeof SleepyTales.questions !== 'undefined') {
    SleepyTales.questions.editor.addQuestion(button);
  }
};

window.removeQuestion = function(button) {
  if (typeof SleepyTales.questions !== 'undefined') {
    SleepyTales.questions.editor.removeQuestion(button);
  }
};

// Form Functions
window.previewCoverImage = function(input) {
  if (typeof SleepyTales.forms !== 'undefined') {
    SleepyTales.forms.previewCoverImage(input);
  }
};

window.previewImage = function(input) {
  if (typeof SleepyTales.forms !== 'undefined') {
    SleepyTales.forms.previewImage(input);
  }
};

// Creator Functions
window.addPage = function() {
  if (typeof SleepyTales.creator !== 'undefined') {
    SleepyTales.creator.addPage();
  }
};

window.deletePage = function(button) {
  if (typeof SleepyTales.creator !== 'undefined') {
    SleepyTales.creator.deletePage(button);
  }
};

// Admin Functions
window.activateTab = function(tabId) {
  if (typeof SleepyTales.admin !== 'undefined') {
    SleepyTales.admin.activateTab(tabId);
  }
};