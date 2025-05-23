/**
 * pages/admin.js - Admin dashboard functionality
 * Lightweight admin interface management
 */

const Admin = {
    activeTab: 'overview',
    charts: {},

    init() {
        this.setupTabNavigation();
        this.initializeCharts();
        this.loadSavedTab();
    },

    setupTabNavigation() {
        const navItems = document.querySelectorAll('.admin-nav-item a');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');

                if (href && href.startsWith('#')) {
                    const tabId = href.substring(1);
                    this.activateTab(tabId);
                }
            });
        });
    },

    activateTab(tabId) {
        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(tabId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        const navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Find and activate the clicked nav item
        const links = document.querySelectorAll('.admin-nav-item a');
        links.forEach(link => {
            if (link.getAttribute('href') === '#' + tabId) {
                link.parentElement.classList.add('active');
            }
        });

        this.activeTab = tabId;
        localStorage.setItem('activeAdminTab', tabId);
    },

    loadSavedTab() {
        const savedTab = localStorage.getItem('activeAdminTab') || 'overview';
        this.activateTab(savedTab);
    },

    initializeCharts() {
        // Only initialize if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            return;
        }

        this.initPopularStoriesChart();
        this.initUserActivityChart();
        this.initMostReadChart();
        this.initCompletionRateChart();
        this.initDailyActiveUsersChart();
        this.initSessionDurationChart();
    },

    initPopularStoriesChart() {
        const ctx = document.getElementById('popularStoriesChart');
        if (!ctx || !window.popularStories) return;

        try {
            this.charts.popularStories = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: popularStories.map(story => story.title),
                    datasets: [{
                        label: 'Number of Reads',
                        data: popularStories.map(story => story.readCount),
                        backgroundColor: 'rgba(164, 90, 82, 0.7)',
                        borderColor: 'rgba(164, 90, 82, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating popular stories chart:', error);
        }
    },

    initUserActivityChart() {
        const ctx = document.getElementById('userActivityChart');
        if (!ctx || !window.userActivity) return;

        try {
            this.charts.userActivity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: userActivity.map(day => day.date),
                    datasets: [{
                        label: 'Active Users',
                        data: userActivity.map(day => day.activeUsers),
                        backgroundColor: 'rgba(90, 122, 111, 0.2)',
                        borderColor: 'rgba(90, 122, 111, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: 'rgba(90, 122, 111, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating user activity chart:', error);
        }
    },

    initMostReadChart() {
        const ctx = document.getElementById('mostReadChart');
        if (!ctx || !window.popularStories) return;

        try {
            this.charts.mostRead = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: popularStories.map(story => story.title),
                    datasets: [{
                        data: popularStories.map(story => story.readCount),
                        backgroundColor: [
                            'rgba(164, 90, 82, 0.7)',
                            'rgba(90, 122, 111, 0.7)',
                            'rgba(217, 184, 143, 0.7)',
                            'rgba(125, 92, 78, 0.7)',
                            'rgba(188, 166, 142, 0.7)'
                        ],
                        borderColor: [
                            'rgba(164, 90, 82, 1)',
                            'rgba(90, 122, 111, 1)',
                            'rgba(217, 184, 143, 1)',
                            'rgba(125, 92, 78, 1)',
                            'rgba(188, 166, 142, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating most read chart:', error);
        }
    },

    initCompletionRateChart() {
        const ctx = document.getElementById('completionRateChart');
        if (!ctx || !window.popularStories) return;

        try {
            // Sample completion rates (replace with real data)
            const completionRates = [85, 72, 68, 91, 60];

            this.charts.completionRate = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: popularStories.map(story => story.title),
                    datasets: [{
                        label: 'Completion Rate (%)',
                        data: completionRates,
                        backgroundColor: 'rgba(90, 122, 111, 0.7)',
                        borderColor: 'rgba(90, 122, 111, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating completion rate chart:', error);
        }
    },

    initDailyActiveUsersChart() {
        const ctx = document.getElementById('dailyActiveUsersChart');
        if (!ctx || !window.userActivity) return;

        try {
            this.charts.dailyActiveUsers = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: userActivity.map(day => day.date),
                    datasets: [{
                        label: 'Daily Active Users',
                        data: userActivity.map(day => day.activeUsers),
                        backgroundColor: 'rgba(164, 90, 82, 0.7)',
                        borderColor: 'rgba(164, 90, 82, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating daily active users chart:', error);
        }
    },

    initSessionDurationChart() {
        const ctx = document.getElementById('sessionDurationChart');
        if (!ctx) return;

        try {
            // Sample data (replace with real data)
            const durationRanges = ['< 1 min', '1-3 min', '3-5 min', '5-10 min', '> 10 min'];
            const sessionCounts = [42, 85, 67, 53, 28];

            this.charts.sessionDuration = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: durationRanges,
                    datasets: [{
                        data: sessionCounts,
                        backgroundColor: [
                            'rgba(164, 90, 82, 0.7)',
                            'rgba(90, 122, 111, 0.7)',
                            'rgba(217, 184, 143, 0.7)',
                            'rgba(125, 92, 78, 0.7)',
                            'rgba(188, 166, 142, 0.7)'
                        ],
                        borderColor: [
                            'rgba(164, 90, 82, 1)',
                            'rgba(90, 122, 111, 1)',
                            'rgba(217, 184, 143, 1)',
                            'rgba(125, 92, 78, 1)',
                            'rgba(188, 166, 142, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating session duration chart:', error);
        }
    },

    handleSettingsForm() {
        const settingsForm = document.getElementById('settingsForm');
        if (!settingsForm) return;

        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(settingsForm);
            const settings = {};

            for (let [key, value] of formData.entries()) {
                settings[key] = value;
            }

            // In a real implementation, this would send to backend
            console.log('Settings to save:', settings);

            // Show success message
            this.showAlert('Settings saved successfully!', 'success');
        });
    },

    showAlert(message, type = 'info') {
        // Create a simple alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;

        // Insert at top of admin content
        const adminContent = document.querySelector('.admin-content');
        if (adminContent) {
            adminContent.insertBefore(alert, adminContent.firstChild);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 3000);
        }
    },

    // Cleanup function
    destroy() {
        // Destroy all charts to prevent memory leaks
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
};

// Global function for backward compatibility
window.activateTab = (tabId) => Admin.activateTab(tabId);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on admin pages
    if (document.querySelector('.admin-container')) {
        Admin.init();
        Admin.handleSettingsForm();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Admin.destroy();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Admin };
}