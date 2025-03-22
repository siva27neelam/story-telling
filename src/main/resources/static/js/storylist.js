/**
 * Story List Page functionality
 */

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
 * Create a shower of emoji particles
 * @param {string} emoji - The emoji to use
 */
function createShower(emoji) {
    const container = document.getElementById('particle-container');
    const count = 20 + Math.floor(Math.random() * 10); // Between 20-30 particles

    // Clear existing particles if there are too many
    if (container.children.length > 100) {
        container.innerHTML = '';
    }

    // Play a fun sound effect
    const audioEffects = {
        '⭐': 'twinkle',
        '❤️': 'pop',
        '🎈': 'balloon',
        '🌈': 'magic'
    };

    playSound(audioEffects[emoji] || 'pop');

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emoji;

        // Random position from click or center if no event
        const startX = 40 + Math.random() * (window.innerWidth - 80);
        const startY = window.innerHeight;

        // Random end position
        const endX = startX + (Math.random() - 0.5) * 300;
        const endY = 100 + Math.random() * 400;

        // Random sizes - much larger now
        const size = 40 + Math.random() * 60;

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
        }, 3000);
    }
}

/**
 * Play a sound effect
 * @param {string} type - The type of sound to play
 */
function playSound(type) {
    // Create audio elements with different sounds for each emoji type
    let soundUrl;

    switch(type) {
        case 'twinkle':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/success.mp3';
            break;
        case 'pop':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/click.mp3';
            break;
        case 'balloon':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/notification.mp3';
            break;
        case 'magic':
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/toggle.mp3';
            break;
        default:
            soundUrl = 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/sounds/click.mp3';
    }

    // Create and play the audio
    const audio = new Audio(soundUrl);
    audio.volume = 0.5; // 50% volume
    audio.play().catch(e => console.log('Audio play failed:', e));
}

/**
 * Initialize theme and animations when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    // Add animations to the cards with a slight delay between each

});

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

// Add these functions to your storylist.js file

let magicMenuOpen = false;

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

        // Play sound
        playSound('pop');
    } else {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.5)';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    }
}

// Close magic menu when clicking outside
document.addEventListener('click', (e) => {
    if (magicMenuOpen && !e.target.closest('.magic-corner')) {
        toggleMagicMenu();
    }
});