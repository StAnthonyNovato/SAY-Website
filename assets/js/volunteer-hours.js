/**
 * Volunteer Hours Tracking Tool
 * 
 * Handles all functionality for the volunteer hours tracking system including:
 * - Logging volunteer hours
 * - Creating new volunteer accounts
 * - Viewing volunteer hour logs
 */

document.addEventListener('DOMContentLoaded', function() {
  const backendURL = window.backendBaseURL + '/volunteer_hours';
  
  // ==========================================
  // Helper Functions
  // ==========================================
  
  /**
   * Makes a fetch request to the API with error handling
   * @param {string} endpoint - API endpoint to fetch from
   * @param {Object} options - Fetch options (method, headers, body)
   * @returns {Promise} - Promise that resolves to the JSON response
   */
  function fetchWithErrorHandling(endpoint, options = {}) {
    return fetch(backendURL + endpoint, options)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || `Failed request - ${response.statusText}`);
          }).catch(e => {
            // If response.json() fails, just use the status text
            if (e instanceof SyntaxError) {
              throw new Error(`Failed request: ${response.statusText}`);
            }
            throw e;
          });
        }
        return response.json();
      });
  }
  
  /**
   * Shows a message to the user and hides it after 5 seconds
   * @param {string} elementId - ID of the element to show message in
   * @param {string} message - Message to display
   */
  function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('d-none');
    
    // Hide message after 5 seconds
    setTimeout(() => {
      element.classList.add('d-none');
    }, 5000);
  }
  
  /**
   * Formats a date string to a readable format
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} - Formatted date string
   */
  function formatDate(dateString) {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Populates a select element with user options
   * @param {string} selectId - ID of the select element to populate
   * @param {Array} users - Array of user objects
   * @param {string} defaultText - Default option text
   */
  function populateUserSelect(selectId, users, defaultText = "Select volunteer...") {
    const selectElement = document.getElementById(selectId);
    // Clear existing options
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    
    // Add users to dropdown
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.name;
      selectElement.appendChild(option);
    });
  }
  
  // ==========================================
  // Main Code
  // ==========================================
  
  // Load users for dropdown
  loadUsers();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateInput').value = today;
  
  // Event listeners for forms
  document.getElementById('logHoursForm').addEventListener('submit', logHours);
  document.getElementById('createUserForm').addEventListener('submit', createUser);
  
  // Load hours data when view tab is shown
  document.getElementById('view-hours-tab').addEventListener('click', loadHoursData);
  
  // Setup stats tab functionality
  document.getElementById('user-stats-tab').addEventListener('click', function() {
    // Populate the stats user dropdown if it's empty
    const statsUserSelect = document.getElementById('statsUserSelect');
    if (statsUserSelect.options.length <= 1) {
      populateStatsUserDropdown();
    }
  });
  
  // Add event listener for the load stats button
  document.getElementById('loadStatsBtn').addEventListener('click', loadUserStats);
  
  // Function to load users
  function loadUsers() {
    fetchWithErrorHandling('/users')
      .then(users => {
        populateUserSelect('userSelect', users);
      })
      .catch(error => {
        console.error('Error loading users:', error);
      });
  }
  
  // Function to log hours
  function logHours(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userSelect').value;
    const date = document.getElementById('dateInput').value;
    const hours = document.getElementById('hoursInput').value;
    const notes = document.getElementById('notesInput').value;
    
    // Validate form data
    if (!userId || !date || !hours) {
      showMessage('logHoursError', 'Please fill out all required fields.');
      return;
    }
    
    const hoursData = {
      user_id: parseInt(userId),
      date: date,
      hours: parseFloat(hours),
      notes: notes
    };
    
    fetchWithErrorHandling('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hoursData)
    })
    .then(data => {
      // Show success message
      showMessage('logHoursSuccess', 'Hours logged successfully!');
      
      // Reset form
      document.getElementById('logHoursForm').reset();
      document.getElementById('dateInput').value = today;
    })
    .catch(error => {
      console.error('Error logging hours:', error);
      showMessage('logHoursError', error.message || 'Error logging hours. Please try again.');
    });
  }
  
  // Function to create user
  function createUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('emailInput').value;
    const phone = document.getElementById('phoneInput').value;
    
    // Validate form data
    if (!name || !email) {
      showMessage('createUserError', 'Please fill out all required fields.');
      return;
    }
    
    const userData = {
      name: name,
      email: email,
      phone: phone
    };
    
    fetchWithErrorHandling('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    .then(data => {
      // Show success message
      showMessage('createUserSuccess', 'Volunteer registered successfully!');
      
      // Reset form
      document.getElementById('createUserForm').reset();
      
      // Reload users dropdown
      loadUsers();
    })
    .catch(error => {
      console.error('Error creating user:', error);
      showMessage('createUserError', error.message || 'Error registering volunteer. Please try again.');
    });
  }
  
  // Function to load hours data
  function loadHoursData() {
    fetchWithErrorHandling('/all')
      .then(hoursData => {
        const tableBody = document.getElementById('hoursTable').querySelector('tbody');
        tableBody.innerHTML = '';
        
        if (hoursData.length === 0) {
          document.getElementById('noHoursData').classList.remove('d-none');
          return;
        }
        
        document.getElementById('noHoursData').classList.add('d-none');
        
        // Sort data by date (newest first)
        hoursData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Add rows to table
        hoursData.forEach(entry => {
          const row = document.createElement('tr');
          
          row.innerHTML = `
            <td>${entry.name}</td>
            <td>${formatDate(entry.date)}</td>
            <td>${entry.hours}</td>
            <td>${entry.notes || ''}</td>
          `;
          
          tableBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Error loading hours data:', error);
        document.getElementById('viewHoursError').classList.remove('d-none');
        document.getElementById('viewHoursError').textContent = error.message || 'Error retrieving volunteer hours. Please try again.';
      });
  }
  // Function to populate the stats user dropdown
  function populateStatsUserDropdown() {
    fetchWithErrorHandling('/users')
      .then(users => {
        populateUserSelect('statsUserSelect', users, 'Choose volunteer...');
      })
      .catch(error => {
        console.error('Error loading users for stats:', error);
        showMessage('statsError', error.message || 'Error loading volunteers. Please try again.');
      });
  }
  
  // Function to load user stats
  function loadUserStats() {
    const userId = document.getElementById('statsUserSelect').value;
    
    if (!userId) {
      showMessage('statsError', 'Please select a volunteer to view their stats.');
      return;
    }
    
    // Show loading state
    document.getElementById('statsContent').classList.add('d-none');
    document.getElementById('statsEmptyState').classList.add('d-none');
    document.getElementById('statsLoading').classList.remove('d-none');
    document.getElementById('statsError').classList.add('d-none');
    
    fetchWithErrorHandling('/view/' + userId)
      .then(userData => {
        // Hide loading, show content
        document.getElementById('statsLoading').classList.add('d-none');
        document.getElementById('statsContent').classList.remove('d-none');
        
        // Update the stats display
        document.getElementById('statsName').textContent = userData.name;
        document.getElementById('statsTotalHours').textContent = userData.total_hours + ' hours';
        
        // Populate the history table
        const tableBody = document.getElementById('userHistoryTable').querySelector('tbody');
        tableBody.innerHTML = '';
        
        if (userData.history.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = '<td colspan="3" class="text-center">No volunteer hours recorded yet</td>';
          tableBody.appendChild(row);
        } else {
          // Sort history by date (newest first)
          userData.history.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Add rows to table
          userData.history.forEach(entry => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
              <td>${formatDate(entry.date)}</td>
              <td>${entry.hours}</td>
              <td>${entry.notes || ''}</td>
            `;
            
            tableBody.appendChild(row);
          });
        }
      })
      .catch(error => {
        console.error('Error loading volunteer stats:', error);
        document.getElementById('statsLoading').classList.add('d-none');
        document.getElementById('statsEmptyState').classList.remove('d-none');
        showMessage('statsError', error.message || 'Error retrieving volunteer stats. Please try again.');
      });
  }
});
