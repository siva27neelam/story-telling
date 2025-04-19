/**
 * animations.js - Visual Effects and Animations
 * Manages particles, showers, page turns, and other visual effects
 */

// Add to the SleepyTales namespace
SleepyTales.animations = {};

/**
 * Particle system for visual effects
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