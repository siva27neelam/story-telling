/**
 * Optimized main.js for the story list page
 */

// Core variables
let magicMenuOpen = false;

/**
 * Initialize when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    // Remove skeleton loaders and show content
    document.querySelectorAll('.story-content').forEach(content => {
        content.style.display = 'block';
    });

    document.querySelectorAll('.story-skeleton').forEach(skeleton => {
        skeleton.style.display = 'none';
    });

    // Show floating elements after content is loaded
    setTimeout(() => {
        const floatingElements = document.querySelector('.floating-elements');
        if (floatingElements) {
            floatingElements.style.display = 'block';
        }
    }, 1000);
});

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
 * Sort stories alphabetically
 */
function sortStories() {
    const storiesContainer = document.querySelector('.row');
    const storyCards = Array.from(document.querySelectorAll('.col-md-4'));

    // Sort cards by story title
    storyCards.sort((a, b) => {
        const titleA = a.querySelector('.card-title').textContent.toLowerCase();
        const titleB = b.querySelector('.card-title').textContent.toLowerCase();
        return titleA.localeCompare(titleB);
    });

    // Reappend in sorted order
    storyCards.forEach(card => {
        storiesContainer.appendChild(card);
    });

    // Show a brief notification
    const notification = document.createElement('div');
    notification.className = 'sort-notification';
    notification.textContent = 'Stories sorted alphabetically';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 2000);
}

/**
 * Toggle magic menu open/closed
 */
function toggleMagicMenu() {
    const menu = document.getElementById('magicMenu');
    magicMenuOpen = !magicMenuOpen;

    if (magicMenuOpen) {
        menu.style.display = 'flex';
        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        }, 10);
    } else {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.5)';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    }
}

/**
 * Create a shower of emoji particles
 * @param {string} emoji - The emoji to use
 */
function createShower(emoji) {
    const container = document.getElementById('particle-container');
    const count = 10 + Math.floor(Math.random() * 5); // Reduced number of particles

    // Clear existing particles if there are too many
    if (container.children.length > 50) {
        container.innerHTML = '';
    }

    // Play a sound effect
    if (typeof playSound === 'function') {
        playSound('pop');
    }

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emoji;

        // Random position from click or center
        const startX = 40 + Math.random() * (window.innerWidth - 80);
        const startY = window.innerHeight;

        // Random end position
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = 100 + Math.random() * 200;

        // Random sizes - smaller now
        const size = 30 + Math.random() * 20;

        // Set styles
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.fontSize = size + 'px';

        // Add to container
        container.appendChild(particle);

        // Animate upward
        setTimeout(() => {
            particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 360}deg)`;
            particle.style.opacity = '0';
        }, 10);

        // Remove after animation completes
        setTimeout(() => {
            if (container.contains(particle)) {
                container.removeChild(particle);
            }
        }, 2000);
    }
}

// Close magic menu when clicking outside
document.addEventListener('click', (e) => {
    if (magicMenuOpen && !e.target.closest('.magic-corner')) {
        toggleMagicMenu();
    }
});