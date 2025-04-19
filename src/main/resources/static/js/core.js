/**
 * core.js - Core utility functions and shared functionality
 * Used across all pages of the SleepyTales application
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

// Initialize on document ready
SleepyTales.ready(() => {
  SleepyTales.utils.init();
});