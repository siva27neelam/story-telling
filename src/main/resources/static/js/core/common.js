/**
 * core/common.js - Essential shared utilities
 * Optimized for performance and mobile
 */

// Cache DOM elements
const Elements = {
    body: document.body,
    sidebar: null,
    sidebarOverlay: null,
    hamburgerMenu: null,
    themeIcon: null,

    init() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.hamburgerMenu = document.getElementById('hamburgerMenu');
        this.themeIcon = document.getElementById('themeIcon');
    }
};

// Theme management
const Theme = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.apply(savedTheme);
    },

    toggle() {
        const currentTheme = Elements.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.apply(newTheme);
    },

    apply(theme) {
        const icon = Elements.themeIcon || document.getElementById('themeIcon') || document.getElementById('sidebarThemeIcon');

        if (theme === 'dark') {
            Elements.body.setAttribute('data-theme', 'dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } else {
            Elements.body.removeAttribute('data-theme');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }

        localStorage.setItem('theme', theme);
    }
};

// Sidebar management
const Sidebar = {
    isOpen: false,

    toggle() {
        if (!Elements.sidebar) return;

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            Elements.sidebar.classList.add('active');
            if (Elements.sidebarOverlay) {
                Elements.sidebarOverlay.classList.add('active');
            }
        } else {
            Elements.sidebar.classList.remove('active');
            if (Elements.sidebarOverlay) {
                Elements.sidebarOverlay.classList.remove('active');
            }
        }
    },

    close() {
        if (this.isOpen) {
            this.toggle();
        }
    }
};

// Modal management
const Modal = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal && window.bootstrap) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            return bsModal;
        }
        return null;
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal && window.bootstrap) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }
};

// Form utilities
const Forms = {
    validate(formElement) {
        if (!formElement) return false;

        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    },

    clearValidation(formElement) {
        if (!formElement) return;

        const fields = formElement.querySelectorAll('.is-invalid');
        fields.forEach(field => {
            field.classList.remove('is-invalid');
        });
    }
};

// Touch event utilities for mobile
const Touch = {
    addSwipeListener(element, callback) {
        if (!element) return;

        let startX = 0;
        let startY = 0;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = startX - endX;
            const diffY = startY - endY;

            // Determine swipe direction
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) { // Minimum swipe distance
                    callback(diffX > 0 ? 'left' : 'right');
                }
            }

            startX = 0;
            startY = 0;
        }, { passive: true });
    }
};

// Global functions for backward compatibility
window.toggleTheme = () => Theme.toggle();
window.toggleSidebar = () => Sidebar.toggle();
window.toggleThemeFromSidebar = () => Theme.toggle();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Elements.init();
    Theme.init();

    // Setup sidebar overlay click handler
    if (Elements.sidebarOverlay) {
        Elements.sidebarOverlay.addEventListener('click', () => Sidebar.close());
    }

    // Setup click outside to close sidebar
    document.addEventListener('click', (e) => {
        if (Sidebar.isOpen &&
            Elements.sidebar &&
            !Elements.sidebar.contains(e.target) &&
            Elements.hamburgerMenu &&
            !Elements.hamburgerMenu.contains(e.target)) {
            Sidebar.close();
        }
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Remove any remaining event listeners
    // Clear any intervals or timeouts if they exist
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Theme, Sidebar, Modal, Forms, Touch };
}