/**
 * Admin Dashboard functionality
 */

// Initialize tabs
function activateTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show the selected section
    document.getElementById(tabId).classList.add('active');

    // Update navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Find and activate the clicked nav item
    document.querySelectorAll('.admin-nav-item a').forEach(link => {
        if (link.getAttribute('href') === '#' + tabId) {
            link.parentElement.classList.add('active');
        }
    });

    // Save active tab to localStorage
    localStorage.setItem('activeAdminTab', tabId);
}

// Initialize charts
function initializeCharts() {
    // Popular Stories Chart
    if (document.getElementById('popularStoriesChart')) {
        const ctx1 = document.getElementById('popularStoriesChart').getContext('2d');
        new Chart(ctx1, {
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // User Activity Chart
    if (document.getElementById('userActivityChart')) {
        const ctx2 = document.getElementById('userActivityChart').getContext('2d');
        new Chart(ctx2, {
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Most Read Chart
    if (document.getElementById('mostReadChart')) {
        const ctx3 = document.getElementById('mostReadChart').getContext('2d');
        new Chart(ctx3, {
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
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Completion Rate Chart
    if (document.getElementById('completionRateChart')) {
        const ctx4 = document.getElementById('completionRateChart').getContext('2d');

        // Sample data (replace with real data)
        const storyTitles = popularStories.map(story => story.title);
        const completionRates = [85, 72, 68, 91, 60]; // Sample completion rates

        new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: storyTitles,
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Daily Active Users Chart
    if (document.getElementById('dailyActiveUsersChart')) {
        const ctx5 = document.getElementById('dailyActiveUsersChart').getContext('2d');

        // Sample data (replace with real data)
        const dates = userActivity.map(day => day.date);
        const dailyUsers = userActivity.map(day => day.activeUsers);

        new Chart(ctx5, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Active Users',
                    data: dailyUsers,
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Session Duration Chart
    if (document.getElementById('sessionDurationChart')) {
        const ctx6 = document.getElementById('sessionDurationChart').getContext('2d');

        // Sample data (replace with real data)
        const durationRanges = ['< 1 min', '1-3 min', '3-5 min', '5-10 min', '> 10 min'];
        const sessionCounts = [42, 85, 67, 53, 28]; // Sample counts

        new Chart(ctx6, {
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
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Handle settings form submission
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the previously active tab, if any
    const activeTab = localStorage.getItem('activeAdminTab') || 'overview';
    activateTab(activeTab);

    // Initialize charts
    initializeCharts();

    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect form data
            const siteTitle = document.getElementById('siteTitle').value;
            const contactEmail = document.getElementById('contactEmail').value;
            const itemsPerPage = document.getElementById('itemsPerPage').value;
            const enableRegistration = document.getElementById('enableRegistration').checked;

            // For now, just show a success message
            // In the future, this would send to your backend API
            alert('Settings saved successfully!');
        });
    }
});