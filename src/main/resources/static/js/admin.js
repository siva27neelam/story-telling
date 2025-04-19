/**
 * admin.js - Admin Dashboard Functionality
 * Handles admin-specific features like charts, tabs, and data visualization
 */

// Add to the SleepyTales namespace
SleepyTales.admin = {
  // State for admin dashboard
  activeTab: 'overview',
  chartInstances: {},

  /**
   * Initialize admin dashboard functionality
   */
  init() {
    // Restore active tab from localStorage or use default
    this.activeTab = localStorage.getItem('activeAdminTab') || 'overview';
    this.activateTab(this.activeTab);

    // Add event listeners for tab navigation
    this.setupTabNavigation();

    // Initialize charts
    this.initializeCharts();
  },

  /**
   * Setup tab navigation event listeners
   */
  setupTabNavigation() {
    const tabLinks = document.querySelectorAll('.admin-nav-item a[href^="#"]');

    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = e.currentTarget.getAttribute('href').substring(1);
        this.activateTab(targetTab);
      });
    });
  },

  /**
   * Activate a specific tab
   * @param {string} tabId - The ID of the tab to activate
   */
  activateTab(tabId) {
    if (!document.getElementById(tabId)) return;

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

    // Update charts in the newly active tab
    this.refreshChartsInActiveTab();

    // Update state
    this.activeTab = tabId;
  },

  /**
   * Initialize all charts
   */
  initializeCharts() {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      SleepyTales.utils.log('Chart.js not found, skipping chart initialization');
      return;
    }

    // Define chart configurations
    const chartConfigs = this.getChartConfigurations();

    // Initialize each chart
    Object.entries(chartConfigs).forEach(([chartId, config]) => {
      const canvas = document.getElementById(chartId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      this.chartInstances[chartId] = new Chart(ctx, config);
    });
  },

  /**
   * Refresh charts in the active tab
   */
  refreshChartsInActiveTab() {
    // Skip if Chart.js isn't available
    if (typeof Chart === 'undefined') return;

    // Find charts in the active tab
    const activeSection = document.getElementById(this.activeTab);
    if (!activeSection) return;

    const canvases = activeSection.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const chartId = canvas.id;

      // If chart exists, update it
      if (this.chartInstances[chartId]) {
        this.chartInstances[chartId].update();
      } else {
        // If chart doesn't exist, create it
        const chartConfigs = this.getChartConfigurations();
        if (chartConfigs[chartId]) {
          const ctx = canvas.getContext('2d');
          this.chartInstances[chartId] = new Chart(ctx, chartConfigs[chartId]);
        }
      }
    });
  },

  /**
   * Get configurations for all charts
   * @returns {Object} Chart configurations
   */
  getChartConfigurations() {
    // Get data from global variables set by Thymeleaf
    const popularStories = (typeof window.popularStories !== 'undefined') ? window.popularStories : [];
    const userActivity = (typeof window.userActivity !== 'undefined') ? window.userActivity : [];

    // Sample data for charts that don't have server data
    const sampleCompletionRates = [85, 72, 68, 91, 60];
    const sampleSessionCounts = [42, 85, 67, 53, 28];

    // Common chart options
    const commonOptions = {
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
    };

    // Definitions for each chart
    return {
      'popularStoriesChart': {
        type: 'bar',
        data: {
          labels: popularStories.map(story => story.title || 'Untitled'),
          datasets: [{
            label: 'Number of Reads',
            data: popularStories.map(story => story.readCount || 0),
            backgroundColor: 'rgba(164, 90, 82, 0.7)',
            borderColor: 'rgba(164, 90, 82, 1)',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      },

      'userActivityChart': {
        type: 'line',
        data: {
          labels: userActivity.map(day => day.date || ''),
          datasets: [{
            label: 'Active Users',
            data: userActivity.map(day => day.activeUsers || 0),
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
        options: commonOptions
      },

      'mostReadChart': {
        type: 'doughnut',
        data: {
          labels: popularStories.map(story => story.title || 'Untitled'),
          datasets: [{
            data: popularStories.map(story => story.readCount || 0),
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
      },

      'completionRateChart': {
        type: 'bar',
        data: {
          labels: popularStories.map(story => story.title || 'Untitled'),
          datasets: [{
            label: 'Completion Rate (%)',
            data: sampleCompletionRates, // Sample data
            backgroundColor: 'rgba(90, 122, 111, 0.7)',
            borderColor: 'rgba(90, 122, 111, 1)',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              max: 100
            }
          }
        }
      },

      'dailyActiveUsersChart': {
        type: 'bar',
        data: {
          labels: userActivity.map(day => day.date || ''),
          datasets: [{
            label: 'Daily Active Users',
            data: userActivity.map(day => day.activeUsers || 0),
            backgroundColor: 'rgba(164, 90, 82, 0.7)',
            borderColor: 'rgba(164, 90, 82, 1)',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: commonOptions
      },

      'sessionDurationChart': {
        type: 'pie',
        data: {
          labels: ['< 1 min', '1-3 min', '3-5 min', '5-10 min', '> 10 min'],
          datasets: [{
            data: sampleSessionCounts, // Sample data
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
      }
    };
  },

  /**
   * Handle settings form submission
   * @param {Event} e - Form submission event
   */
  handleSettingsSubmit(e) {
    e.preventDefault();

    // Collect form data
    const settings = {
      siteTitle: document.getElementById('siteTitle').value,
      contactEmail: document.getElementById('contactEmail').value,
      itemsPerPage: document.getElementById('itemsPerPage').value,
      enableRegistration: document.getElementById('enableRegistration').checked
    };

    // Validate settings
    if (!settings.siteTitle) {
      alert('Site title is required');
      return;
    }

    if (!settings.contactEmail || !this.validateEmail(settings.contactEmail)) {
      alert('Please enter a valid contact email');
      return;
    }

    SleepyTales.utils.log('Admin settings:', settings);

    // In production, this would send the settings to the server
    // For now, just show a success message
    alert('Settings saved successfully!');
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if email is valid
   */
  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Handle user approval or rejection
   * @param {string} userId - ID of the user
   * @param {string} action - 'approve' or 'reject'
   * @param {string} reason - Reason for rejection (optional)
   */
  handleUserAction(userId, action, reason) {
    // This would make an API call to the server
    // For now, just log the action
    SleepyTales.utils.log('User action:', { userId, action, reason });

    if (action === 'approve') {
      alert(`User ${userId} has been approved`);
    } else if (action === 'reject') {
      if (!reason) {
        alert('Please provide a reason for rejection');
        return;
      }
      alert(`User ${userId} has been rejected. Reason: ${reason}`);
    }

    // In production, this would refresh the user list
    // For now, just reload the page
    window.location.reload();
  },

  /**
   * Handle story approval or rejection
   * @param {string} storyId - ID of the story
   * @param {string} action - 'approve' or 'reject'
   * @param {string} reason - Reason for rejection (optional)
   */
  handleStoryAction(storyId, action, reason) {
    // This would make an API call to the server
    // For now, just log the action
    SleepyTales.utils.log('Story action:', { storyId, action, reason });

    if (action === 'approve') {
      // In production, this would call the API
      // For now, redirect to the approval endpoint
      window.location.href = `/admin/approvals/approve/${storyId}`;
    } else if (action === 'reject') {
      if (!reason) {
        alert('Please provide a reason for rejection');
        return;
      }

      // Create a form and submit it
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/admin/approvals/reject/${storyId}`;

      const reasonInput = document.createElement('input');
      reasonInput.type = 'hidden';
      reasonInput.name = 'reason';
      reasonInput.value = reason;

      form.appendChild(reasonInput);
      document.body.appendChild(form);
      form.submit();
    }
  },

  /**
   * Export data to CSV
   * @param {string} dataType - Type of data to export ('users', 'stories', etc.)
   */
  exportData(dataType) {
    // This would make an API call to the server to get the data
    // For now, just log the action
    SleepyTales.utils.log('Export data:', { dataType });

    alert(`Data export for ${dataType} is not implemented yet`);
  },

  /**
   * Update site theme colors
   * @param {Object} colors - Color theme object
   */
  updateThemeColors(colors) {
    // This would update CSS variables
    SleepyTales.utils.log('Update theme colors:', colors);

    const root = document.documentElement;

    if (colors.primary) root.style.setProperty('--primary', colors.primary);
    if (colors.secondary) root.style.setProperty('--secondary', colors.secondary);
    if (colors.accent) root.style.setProperty('--accent-warm', colors.accent);

    // Save to localStorage
    localStorage.setItem('siteColors', JSON.stringify(colors));

    alert('Theme colors updated successfully!');
  }
};

// Initialize admin dashboard when DOM is loaded
SleepyTales.ready(() => {
  // Only initialize if we're on an admin page
  if (document.querySelector('.admin-container')) {
    SleepyTales.admin.init();

    // Add event listener for settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => SleepyTales.admin.handleSettingsSubmit(e));
    }
  }
});

// Add global functions as proxies to our methods for backward compatibility
window.activateTab = function(tabId) {
  SleepyTales.admin.activateTab(tabId);
};

window.handleUserAction = function(userId, action, reason) {
  SleepyTales.admin.handleUserAction(userId, action, reason);
};

window.handleStoryAction = function(storyId, action, reason) {
  SleepyTales.admin.handleStoryAction(storyId, action, reason);
};

window.exportData = function(dataType) {
  SleepyTales.admin.exportData(dataType);
};

window.updateThemeColors = function(colors) {
  SleepyTales.admin.updateThemeColors(colors);
};