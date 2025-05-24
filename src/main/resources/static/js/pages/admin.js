/**
 * pages/admin.js - Fixed Admin dashboard functionality
 * Ensuring all links and navigation work properly
 */

const Admin = {
    activeTab: 'overview',
    charts: {},

    init() {
        this.setupTabNavigation();
        this.initializeCharts();
        this.loadSavedTab();
        this.handleSettingsForm();
    },

    setupTabNavigation() {
        // Handle both hash links and onclick events
        const navItems = document.querySelectorAll('.admin-nav-item a');

        navItems.forEach(item => {
            const href = item.getAttribute('href');

            // Only handle hash links (internal tabs)
            if (href && href.startsWith('#')) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabId = href.substring(1);
                    this.activateTab(tabId);
                });
            }
            // External links (like /admin/approvals, /stories) will work normally
        });

        // Handle browser back/forward with hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && document.getElementById(hash)) {
                this.activateTab(hash);
            }
        });
    },

    activateTab(tabId) {
        // Validate tab exists
        const targetSection = document.getElementById(tabId);
        if (!targetSection) {
            console.warn(`Tab section ${tabId} not found`);
            return;
        }

        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        targetSection.classList.add('active');

        // Update navigation active state
        const navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Find and activate the corresponding nav item
        const activeNavItem = document.querySelector(`.admin-nav-item a[href="#${tabId}"]`);
        if (activeNavItem) {
            activeNavItem.parentElement.classList.add('active');
        }

        // Update URL hash without triggering hashchange
        if (window.location.hash !== `#${tabId}`) {
            history.replaceState(null, null, `#${tabId}`);
        }

        // Save active tab
        this.activeTab = tabId;
        localStorage.setItem('activeAdminTab', tabId);

        // Refresh charts if switching to analytics
        if (tabId === 'analytics') {
            setTimeout(() => this.refreshCharts(), 100);
        }
    },

    loadSavedTab() {
        // Check URL hash first
        const urlHash = window.location.hash.substring(1);
        if (urlHash && document.getElementById(urlHash)) {
            this.activateTab(urlHash);
            return;
        }

        // Fall back to saved tab
        const savedTab = localStorage.getItem('activeAdminTab') || 'overview';
        this.activateTab(savedTab);
    },

    refreshCharts() {
        // Refresh all charts to ensure proper rendering
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    },

    initializeCharts() {
        // Only initialize if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            return;
        }

        // Set Chart.js defaults
        Chart.defaults.font.family = "'Nunito', sans-serif";
        Chart.defaults.color = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-color').trim();

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
            const data = window.popularStories.slice(0, 5); // Limit to top 5

            this.charts.popularStories = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(story => story.title.length > 20
                        ? story.title.substring(0, 20) + '...'
                        : story.title),
                    datasets: [{
                        label: 'Number of Reads',
                        data: data.map(story => story.readCount || 0),
                        backgroundColor: 'rgba(164, 90, 82, 0.7)',
                        borderColor: 'rgba(164, 90, 82, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { maxRotation: 45 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating popular stories chart:', error);
            this.showChartError('popularStoriesChart', 'Popular Stories Chart');
        }
    },

    initUserActivityChart() {
        const ctx = document.getElementById('userActivityChart');
        if (!ctx || !window.userActivity) return;

        try {
            this.charts.userActivity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: window.userActivity.map(day => day.date),
                    datasets: [{
                        label: 'Active Users',
                        data: window.userActivity.map(day => day.activeUsers || 0),
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
                    plugins: {
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating user activity chart:', error);
            this.showChartError('userActivityChart', 'User Activity Chart');
        }
    },

    initMostReadChart() {
        const ctx = document.getElementById('mostReadChart');
        if (!ctx || !window.popularStories) return;

        try {
            const data = window.popularStories.slice(0, 5);

            this.charts.mostRead = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(story => story.title),
                    datasets: [{
                        data: data.map(story => story.readCount || 0),
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
                        legend: {
                            position: 'bottom',
                            labels: {
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const value = data.datasets[0].data[i];
                                            return {
                                                text: `${label}: ${value}`,
                                                fillStyle: data.datasets[0].backgroundColor[i],
                                                strokeStyle: data.datasets[0].borderColor[i],
                                                lineWidth: data.datasets[0].borderWidth,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating most read chart:', error);
            this.showChartError('mostReadChart', 'Most Read Stories Chart');
        }
    },

    initCompletionRateChart() {
        const ctx = document.getElementById('completionRateChart');
        if (!ctx || !window.popularStories) return;

        try {
            // Sample completion rates (replace with real data from backend)
            const completionRates = [85, 72, 68, 91, 60];
            const data = window.popularStories.slice(0, 5);

            this.charts.completionRate = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(story => story.title.length > 20
                        ? story.title.substring(0, 20) + '...'
                        : story.title),
                    datasets: [{
                        label: 'Completion Rate (%)',
                        data: completionRates.slice(0, data.length),
                        backgroundColor: 'rgba(90, 122, 111, 0.7)',
                        borderColor: 'rgba(90, 122, 111, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { maxRotation: 45 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating completion rate chart:', error);
            this.showChartError('completionRateChart', 'Completion Rate Chart');
        }
    },

    initDailyActiveUsersChart() {
        const ctx = document.getElementById('dailyActiveUsersChart');
        if (!ctx || !window.userActivity) return;

        try {
            this.charts.dailyActiveUsers = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: window.userActivity.map(day => day.date),
                    datasets: [{
                        label: 'Daily Active Users',
                        data: window.userActivity.map(day => day.activeUsers || 0),
                        backgroundColor: 'rgba(164, 90, 82, 0.7)',
                        borderColor: 'rgba(164, 90, 82, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating daily active users chart:', error);
            this.showChartError('dailyActiveUsersChart', 'Daily Active Users Chart');
        }
    },

    initSessionDurationChart() {
        const ctx = document.getElementById('sessionDurationChart');
        if (!ctx) return;

        try {
            // Sample data (replace with real data from backend)
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
                        legend: { position: 'bottom' },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating session duration chart:', error);
            this.showChartError('sessionDurationChart', 'Session Duration Chart');
        }
    },

    showChartError(canvasId, chartName) {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const container = canvas.parentElement;
            container.innerHTML = `
                <div class="admin-empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Chart Error</h3>
                    <p>Unable to load ${chartName}</p>
                </div>
            `;
        }
    },

    handleSettingsForm() {
        const settingsForm = document.getElementById('settingsForm');
        if (!settingsForm) return;

        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Show loading state
            const submitBtn = settingsForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            // Collect form data
            const formData = new FormData(settingsForm);
            const settings = {};

            for (let [key, value] of formData.entries()) {
                settings[key] = value;
            }

            // Simulate API call (replace with actual implementation)
            setTimeout(() => {
                console.log('Settings to save:', settings);

                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                // Show success message
                this.showAlert('Settings saved successfully!', 'success');
            }, 1000);
        });
    },

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.admin-content .alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
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

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
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
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Admin.destroy();
});

// Handle window resize for charts
window.addEventListener('resize', () => {
    if (Admin.charts) {
        Object.values(Admin.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Admin };
}