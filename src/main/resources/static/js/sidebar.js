/**
 * Sidebar functionality
 */

// Toggle sidebar visibility
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');

    // If opening sidebar, add event listener to close on outside click
    if (sidebar.classList.contains('active')) {
        document.addEventListener('click', closeSidebarOnOutsideClick);
    } else {
        document.removeEventListener('click', closeSidebarOnOutsideClick);
    }
}

// Close sidebar when clicking outside
function closeSidebarOnOutsideClick(event) {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburgerMenu');

    // If click is outside the sidebar and not on the hamburger menu
    if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        toggleSidebar();
    }
}

// Toggle theme and update icon in sidebar
function toggleThemeFromSidebar() {
    const body = document.body;
    const themeIcon = document.getElementById('sidebarThemeIcon');

    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
}

// Initialize sidebar
document.addEventListener('DOMContentLoaded', () => {
    // Set theme icon based on current theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = document.getElementById('sidebarThemeIcon');

    if (savedTheme === 'dark' && themeIcon) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
});