// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/**
 * Health Check Status Page JavaScript
 * Handles real-time status monitoring and display for system services
 */

// Emergency fallback data when backend is completely unreachable
const emergencyFailureData = {
  "checks": {
    "database": {
      "details": {
        "connection_failed": true,
        "last_error": "Unable to reach backend service"
      },
      "message": "Database status unknown - backend unreachable",
      "status": "unhealthy"
    },
    "discord": {
      "details": {
        "webhook_configured": false,
        "backend_connection": false
      },
      "message": "Discord status unknown - backend unreachable",
      "status": "unhealthy"
    },
    "email": {
      "details": {
        "email_sending_enabled": false,
        "smtp_configured": false,
        "backend_connection": false
      },
      "message": "Email status unknown - backend unreachable",
      "status": "unhealthy"
    },
    "environment": {
      "details": {
        "all_required_present": false,
        "backend_connection": false,
        "status_check_failed": true
      },
      "message": "Environment status unknown - backend unreachable",
      "status": "unhealthy"
    }
  },
  "environment": "unknown",
  "status": "unhealthy",
  "timestamp": new Date().toISOString(),
  "version": "unknown - backend unreachable"
};

/**
 * Get the appropriate Bootstrap badge class for a given status
 * @param {string} status - The status string (healthy, unhealthy, warning)
 * @returns {string} The Bootstrap class name
 */
function getStatusBadgeClass(status) {
  switch(status.toLowerCase()) {
    case 'healthy': return 'bg-success';
    case 'unhealthy': return 'bg-danger';
    case 'warning': return 'bg-warning';
    default: return 'bg-secondary';
  }
}

/**
 * Get the appropriate FontAwesome icon for a given status
 * @param {string} status - The status string (healthy, unhealthy, warning)
 * @returns {string} The HTML string for the icon
 */
function getStatusIcon(status) {
  switch(status.toLowerCase()) {
    case 'healthy': return '<i class="fas fa-check-circle text-success"></i>';
    case 'unhealthy': return '<i class="fas fa-times-circle text-danger"></i>';
    case 'warning': return '<i class="fas fa-exclamation-triangle text-warning"></i>';
    default: return '<i class="fas fa-question-circle text-secondary"></i>';
  }
}

/**
 * Format a timestamp string for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted timestamp for display
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format service details for display
 * @param {Object} details - The details object from the service check
 * @param {string} service - The service name (for context)
 * @returns {string} HTML string of formatted details
 */
function formatDetails(details, service) {
  if (!details || Object.keys(details).length === 0) {
    return '<em>No additional details available</em>';
  }
  
  let html = '';
  for (const [key, value] of Object.entries(details)) {
    let displayValue = value;
    if (typeof value === 'boolean') {
      displayValue = value ? 
        '<span class="text-success"><i class="fas fa-check"></i> Yes</span>' : 
        '<span class="text-danger"><i class="fas fa-times"></i> No</span>';
    } else if (Array.isArray(value)) {
      displayValue = value.length > 0 ? value.join(', ') : '<em>None</em>';
    }
    
    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    html += `<div><strong>${displayKey}:</strong> ${displayValue}</div>`;
  }
  
  return html;
}

/**
 * Update the health status display with new data
 * @param {Object} data - The health check response data
 */
function updateHealthDisplay(data) {
  // Update overall status
  document.getElementById('overall-status-text').textContent = data.status.toUpperCase();
  document.getElementById('environment-text').textContent = data.environment.toUpperCase();
  document.getElementById('version-text').textContent = data.version;
  document.getElementById('last-updated').textContent = formatTimestamp(data.timestamp);
  
  const overallCard = document.getElementById('overall-status-card');
  const statusIcon = document.getElementById('overall-status-icon');
  
  statusIcon.innerHTML = getStatusIcon(data.status);
  overallCard.className = `card status-${data.status}`;
  
  // Update individual service checks
  for (const [serviceName, serviceData] of Object.entries(data.checks)) {
    const statusElement = document.getElementById(`${serviceName}-status`);
    const messageElement = document.getElementById(`${serviceName}-message`);
    const detailsElement = document.getElementById(`${serviceName}-details`);
    const cardElement = document.getElementById(`${serviceName}-card`);
    
    if (statusElement) {
      statusElement.textContent = serviceData.status.toUpperCase();
      statusElement.className = `badge ${getStatusBadgeClass(serviceData.status)}`;
    }
    
    if (messageElement) {
      messageElement.textContent = serviceData.message;
    }
    
    if (detailsElement) {
      detailsElement.innerHTML = formatDetails(serviceData.details, serviceName);
    }
    
    if (cardElement) {
      cardElement.className = `card h-100 status-${serviceData.status}`;
    }
  }
  
  // Update info alert
  const alertDiv = document.querySelector('.alert');
  if (alertDiv) {
    if (data.status === 'healthy') {
      alertDiv.className = 'alert alert-success';
      alertDiv.innerHTML = '<i class="fas fa-check-circle"></i> <strong>All systems operational!</strong> All services are running normally.';
    } else {
      alertDiv.className = 'alert alert-danger';
      alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>CRITICAL: System issues detected!</strong> Check individual service status below.';
    }
  }
}

/**
 * Load health data from the backend API
 */
function loadHealthData() {
  // Check if window.backendBaseURL is available
  if (!window.backendBaseURL) {
    console.error('Backend base URL not configured - assuming system failure');
    const alertDiv = document.querySelector('.alert');
    if (alertDiv) {
      alertDiv.className = 'alert alert-danger';
      alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>Backend not configured!</strong> Unable to check system status.';
    }
    updateHealthDisplay(emergencyFailureData);
    return;
  }

  const healthEndpoint = `${window.backendBaseURL}/healthcheck?statuspage=1`;

  // Show loading state
  const alertDiv = document.querySelector('.alert');
  if (alertDiv) {
    alertDiv.className = 'alert alert-info';
    alertDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <strong>Loading system status...</strong> Fetching latest data from backend...';
  }
  
  fetch(healthEndpoint)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      updateHealthDisplay(data);
    })
    .catch(error => {
      console.error('Failed to fetch health data:', error);
      
      // Show critical error state
      const alertDiv = document.querySelector('.alert');
      if (alertDiv) {
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>CRITICAL: Backend unreachable!</strong> ${error.message} - All services assumed down.`;
      }
      
      // Show emergency failure state
      updateHealthDisplay(emergencyFailureData);
    });
}

/**
 * Refresh health data (called by refresh button)
 */
function refreshHealthData() {
  // Reset to loading state
  document.querySelectorAll('.badge').forEach(badge => {
    badge.textContent = 'Checking...';
    badge.className = 'badge bg-secondary';
  });
  
  document.querySelectorAll('[id$="-message"]').forEach(el => {
    el.textContent = 'Loading...';
  });
  
  // Reload data
  loadHealthData();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only run on health page
  if (document.getElementById('health-status')) {
    loadHealthData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadHealthData, 30000);
  }
});

// Make refresh function globally available for onclick handler
window.refreshHealthData = refreshHealthData;

