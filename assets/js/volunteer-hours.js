/**
 * Volunteer Hours Tracking Tool
 * 
 * Handles all functionality for the volunteer hours tracking system including:
 * - Logging volunteer hours
 * - Creating new volunteer accounts
 * - Viewing volunteer hour logs
 */

var apiRequests = {
    total: 0,
    success: 0,
    failed: 0,
    post: 0
};

// Declare tabManager in global scope
var tabManager;

function cleanVersion(version) {
    // remove .dXXXXXXXX, if present
    const cleaned = version.replace(/\.d[0-9a-f]+$/, '');
    console.log(`cleanVersion: ${version} -> ${cleaned}`);
    return cleaned;
}

function wrappedFetch(endpoint, options = {}) {
    // Ensure headers exist in options
    if (!options.headers) {
        options.headers = {};
    }
    
    // Track POST requests
    if (options.method === 'POST') {
        apiRequests.post++;
    }
    
    return fetch(endpoint, options)
        .then(response => {
            apiRequests.success++;
            apiRequests.total = apiRequests.success + apiRequests.failed;
            
            // Update all API request counters
            updateAllElements('apiRequests', apiRequests.total);
            updateAllElements('postRequests', apiRequests.post);
            updateAllElements('failedRequests', apiRequests.failed);
            return response;
        })
        .catch(error => {
            // Track failed requests
            apiRequests.failed++;
            apiRequests.total = apiRequests.success + apiRequests.failed;
            
            // Update counters
            updateAllElements('apiRequests', apiRequests.total);
            updateAllElements('failedRequests', apiRequests.failed);
            
            // Re-throw the error for handling elsewhere
            throw error;
        });
}

// Helper function to update all elements with the same base ID
function updateAllElements(baseId, value) {
    // Find all elements that start with the baseId
    for (let i = 1; i <= 4; i++) {
        const element = document.getElementById(baseId + i);
        if (element) {
            element.textContent = value;
        }
    }
    // Also update the original element if it exists (for backward compatibility)
    const originalElement = document.getElementById(baseId);
    if (originalElement) {
        originalElement.textContent = value;
    }
}

document.addEventListener('DOMContentLoaded', function() {
  const backendURL = window.backendBaseURL + '/volunteer_hours';
  
  wrappedFetch(window.backendBaseURL + "/healthcheck?src=VolunteerHoursTool&c=1")
    .then(response => {
        return response.json();
    })
    .then(data => {
        // Update all version elements
        updateAllElements('backendVersion', cleanVersion(data.version) || 'Unknown');
    })
    .catch(error => {
        console.error('Error fetching backend version:', error);
    });

  // Track the currently selected users in each dropdown
  const selectedUsers = {
    userSelect: '',
    statsUserSelect: ''
  };
  
  // Tab management object - assigned to global variable
  tabManager = {
    // Keep track of current and previous tab for direction-aware animations
    previousTabId: null,
    currentTabId: 'log-hours',
    
    // Tab order for determining animation direction
    tabOrder: ['log-hours', 'create-user', 'view-hours', 'user-stats', 'rules', 'registration-confirmation'],
    
    // Get the current tab ID from URL hash or default to 'log-hours'
    getCurrentTabId: function() {
      if (window.location.hash) {
        return window.location.hash.substring(1); // Remove the # from the hash
      }
      return 'log-hours'; // Default tab
    },
    
    // Update URL hash without scrolling
    setTabInUrl: function(tabId) {
      history.replaceState(null, null, `#${tabId}`);
    },
    
    // Determine if we're moving left or right in tab order
    getAnimationDirection: function(newTabId) {
      const previousIndex = this.tabOrder.indexOf(this.currentTabId);
      const newIndex = this.tabOrder.indexOf(newTabId);
      
      // Update tab tracking
      this.previousTabId = this.currentTabId;
      this.currentTabId = newTabId;
      
      return (newIndex > previousIndex) ? 'right' : 'left';
    },
    
    // Apply sliding animation classes based on direction
    animateTabTransition: function(newTabId) {
      const direction = this.getAnimationDirection(newTabId);
      const newTab = document.getElementById(newTabId);
      const oldTab = document.getElementById(this.previousTabId);
      
      if (oldTab && newTab) {
        // First remove any existing animation classes
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('sliding-left', 'sliding-right');
        });
        
        // Set direction classes for nice animation
        if (direction === 'right') {
          oldTab.classList.add('sliding-left');
          newTab.classList.add('sliding-right');
        } else {
          oldTab.classList.add('sliding-right');
          newTab.classList.add('sliding-left');
        }
        
        // Remove animation classes after transition completes
        setTimeout(() => {
          document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('sliding-left', 'sliding-right');
          });
        }, 400);
      }
    },
    
    // Activate a tab by ID with animation
    activateTab: function(tabId) {
      console.log(`Activating tab ID: ${tabId}`);
      const tabToActivate = document.querySelector(`[data-bs-target="#${tabId}"]`);
      
      // For hidden tabs like registration-confirmation that don't have nav buttons
      if (tabId === 'registration-confirmation') {
        // Handle the special case of confirmation tab which has no nav button
        this.previousTabId = this.currentTabId;
        this.currentTabId = tabId;
        
        // Get the tab panes
        const oldTab = document.getElementById(this.previousTabId);
        const newTab = document.getElementById(tabId);
        
        if (oldTab && newTab) {
          // Hide all tab panes first
          document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
            // Ensure fade class is present for bootstrap transitions
            pane.classList.add('fade');
          });
          
          // Show the new tab pane with animation
          oldTab.classList.add('sliding-left');
          newTab.classList.add('sliding-right', 'show', 'active');
          
          // Remove animation classes after transition completes
          setTimeout(() => {
            document.querySelectorAll('.tab-pane').forEach(pane => {
              pane.classList.remove('sliding-left', 'sliding-right');
            });
          }, 400);
          
          // Update URL hash
          this.setTabInUrl(tabId);
        }
        return;
      }
      
      // Normal case for tabs with navigation buttons
      if (tabToActivate) {
        // Hide all tab panes first to ensure clean state
        document.querySelectorAll('.tab-pane').forEach(pane => {
          if (pane.id !== tabId) {
            pane.classList.remove('show', 'active');
          }
        });
        
        // Set up animation before tab changes
        this.animateTabTransition(tabId);
        
        // Show the tab
        const tab = new bootstrap.Tab(tabToActivate);
        tab.show();
      }
    },
    
    // Handle tab content loading based on tab ID
    loadTabContent: function(tabId) {
      switch(tabId) {
        case 'log-hours':
          loadUsers();
          break;
        case 'view-hours':
          loadHoursData();
          break;
        case 'user-stats':
          populateStatsUserDropdown();
          break;
        case 'rules':
          // Nothing specific to load for rules tab
          break;
        case 'registration-confirmation':
          // The confirmation tab is populated when a user registers
          break;
      }
    },
    
    // Check if rules should be shown and handle
    checkRulesShown: function() {
      // Check if rules have been shown before
      console.log('Checking if rules have been shown...');
      const rulesShown = localStorage.getItem('rulesShown');
      
      console.log(`Rules shown: ${rulesShown}`);
      if (!rulesShown) {
        alert('Please read the rules before logging hours.');
        console.log('Showing rules tab for the first time.');

        // Show rules tab on first visit
        this.activateTab('rules');
        // Mark that rules have been shown
        localStorage.setItem('rulesShown', 'true');
      }
    }
  };

  // ==========================================
  // Helper Functions
  // ==========================================
  
  /**
   * Makes a fetch request to the API with error handling and no caching
   * @param {string} endpoint - API endpoint to fetch from
   * @param {Object} options - Fetch options (method, headers, body)
   * @returns {Promise} - Promise that resolves to the JSON response
   */
  function fetchWithErrorHandling(endpoint, options = {}) {
    // Ensure headers exist in options
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add cache control headers to prevent caching
    options.headers = {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    return wrappedFetch(backendURL + endpoint, options)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            // Track failed requests in fetchWithErrorHandling too
            apiRequests.failed++;
            updateAllElements('failedRequests', apiRequests.failed);
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
    
    if (!element) {
      console.error(`Element with ID "${elementId}" not found for showing message: ${message}`);
      return;
    }
    
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
    // Remember currently selected value if any
    const currentValue = selectElement.value;
    selectedUsers[selectId] = currentValue;
    
    // Clear existing options
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    
    // Add users to dropdown
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.name;
      
      // If this was the previously selected value, keep it selected
      if (user.id == currentValue) {
        option.selected = true;
      }
      
      selectElement.appendChild(option);
    });
    
    // If there was a previously selected value that's no longer in the list
    if (currentValue && selectElement.value !== currentValue) {
      console.log(`Previously selected user (${currentValue}) no longer available.`);
    }
  }
  
  // ==========================================
  // Main Code
  // ==========================================
  
  // Load users for dropdown
  loadUsers();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateInput').value = today;
  
  // Initialize tab from URL hash if present
  const initialTabId = tabManager.getCurrentTabId();
  
  // Set current tab in tab manager to ensure animations work correctly
  tabManager.currentTabId = initialTabId;
  
  // Check if rules should be shown (only if not coming from a direct URL)
  if (initialTabId === 'log-hours') {
    tabManager.checkRulesShown();
  }
  
  if (initialTabId !== 'log-hours') { // Only if not the default tab
    // Use setTimeout to avoid scroll behavior
    setTimeout(() => {
      window.scrollTo(0, 0); // Ensure no scrolling
      
      // For initial load, we just activate the tab without animation
      const tabToActivate = document.querySelector(`[data-bs-target="#${initialTabId}"]`);
      if (tabToActivate) {
        const tab = new bootstrap.Tab(tabToActivate);
        tab.show();
        tabManager.loadTabContent(initialTabId);
      }
    }, 0);
  }
  
  // Event listeners for forms
  document.getElementById('logHoursForm').addEventListener('submit', logHours);
  document.getElementById('createUserForm').addEventListener('submit', createUser);
  
  // Add tab change event listeners to all tabs
  const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
  tabButtons.forEach(button => {
    // Listen for the 'show.bs.tab' event which fires BEFORE tab is shown
    button.addEventListener('show.bs.tab', function(event) {
      // Get the newly activated tab
      const activeTab = event.target.getAttribute('data-bs-target');
      const tabId = activeTab.substring(1); // Remove the # from the selector
      
      // First, make sure all special tabs are hidden
      const confirmationTab = document.getElementById('registration-confirmation');
      if (confirmationTab) {
        confirmationTab.classList.remove('show', 'active');
      }
      
      // Set up animation before the tab change happens
      tabManager.animateTabTransition(tabId);
    });
    
    // Listen for the 'shown.bs.tab' event which fires AFTER tab is shown
    button.addEventListener('shown.bs.tab', function(event) {
      // Get the newly activated tab
      const activeTab = event.target.getAttribute('data-bs-target');
      const tabId = activeTab.substring(1); // Remove the # from the selector
      console.log(`Tab changed to: ${tabId}`);
      
      // Update URL hash without scrolling
      tabManager.setTabInUrl(tabId);
      
      // Load the appropriate content for this tab
      tabManager.loadTabContent(tabId);
    });
  });
  
  // Remove duplicate event listeners as they're now handled by tabManager
  // The "click" handlers aren't needed as we already have "shown.bs.tab" handlers
  
  // Add event listener for the load stats button
  document.getElementById('loadStatsBtn').addEventListener('click', loadUserStats);
  
  // Add event listener for the "Log Hours Now" button on the confirmation screen
  if (document.getElementById('goToLogHoursBtn')) {
    document.getElementById('goToLogHoursBtn').addEventListener('click', function() {
      // First, make sure all tab panes are hidden
      document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id !== 'log-hours') {
          pane.classList.remove('show', 'active');
        }
      });
      
      // Get reference to the log hours tab and explicitly hide the confirmation tab
      const confirmationTab = document.getElementById('registration-confirmation');
      if (confirmationTab) {
        confirmationTab.classList.remove('show', 'active');
      }
      
      // Navigate back to the log hours tab
      const logHoursTabButton = document.querySelector('[data-bs-target="#log-hours"]');
      if (logHoursTabButton) {
        // Update tab manager's state
        tabManager.previousTabId = 'registration-confirmation';
        tabManager.currentTabId = 'log-hours';
        
        // Use Bootstrap's API to show the tab
        const tab = new bootstrap.Tab(logHoursTabButton);
        tab.show();
        
        // Update the URL hash
        tabManager.setTabInUrl('log-hours');
      }
    });
  }
  
  // No need for modal initialization anymore since we're using inline editing
  
  // Function to load users
  function loadUsers() {
    fetchWithErrorHandling('/users')
      .then(users => {
        // Populate the log hours dropdown
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
      // Show success message (this will be shown briefly before tab change)
      showMessage('createUserSuccess', 'Volunteer registered successfully!');
      
      // Populate the confirmation screen with the user's information
      document.getElementById('confirmedUserName').textContent = name;
      document.getElementById('confirmationName').textContent = name;
      document.getElementById('confirmationEmail').textContent = email;
      if (phone) {
        document.getElementById('confirmationPhone').textContent = phone;
      }
      
      // Switch to the confirmation tab
      tabManager.activateTab('registration-confirmation');
      
      // Reset form (will be hidden now)
      document.getElementById('createUserForm').reset();
      
      // Reload users dropdown in background
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
        const hoursTable = document.getElementById('hoursTable');
        
        // Check if the table exists before proceeding
        if (!hoursTable) {
          console.error('Hours table element not found');
          return;
        }
        
        const tableBody = hoursTable.querySelector('tbody');
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
          row.setAttribute('data-id', entry.id);
          row.setAttribute('data-mode', 'view');
          row.className = 'hours-row';
          row.innerHTML = `
            <td class="name-cell">${entry.name}</td>
            <td class="date-cell" data-date="${entry.date}">${formatDate(entry.date)}</td>
            <td class="hours-cell" data-hours="${entry.hours}">${entry.hours}</td>
            <td class="notes-cell" data-notes="${entry.notes || ''}">${entry.notes || ''}</td>
            <td class="text-center action-buttons">
              <div class="view-mode-buttons">
                <button class="btn btn-sm btn-primary edit-row-btn" title="Edit this entry">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-hours-btn" title="Delete this entry">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
              <div class="edit-mode-buttons" style="display: none;">
                <button class="btn btn-sm btn-success save-row-btn" title="Save changes">
                  <span class="save-icon"><i class="fas fa-check"></i></span>
                  <span class="spinner-border spinner-border-sm save-spinner" role="status" style="display: none;">
                    <span class="visually-hidden">Loading...</span>
                  </span>
                </button>
                <button class="btn btn-sm btn-secondary cancel-edit-btn" title="Cancel editing">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </td>
          `;
          
          tableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        attachActionEventListeners();
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
  
  // Function to attach event listeners to action buttons
  function attachActionEventListeners() {
    // Attach listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.delete-hours-btn');
    
    if (deleteButtons.length > 0) {
      deleteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          event.preventDefault();
          const row = this.closest('tr');
          const entryId = row.getAttribute('data-id');
          
          // Confirm before deleting
          if (confirm('Are you sure you want to delete this volunteer hours entry? This action cannot be undone.')) {
            deleteHoursEntry(entryId);
          }
        });
      });
    }
    
    // Attach listeners to edit row buttons
    const editButtons = document.querySelectorAll('.edit-row-btn');
    
    if (editButtons.length > 0) {
      editButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          event.preventDefault();
          const row = this.closest('tr');
          switchToEditMode(row);
        });
      });
    }
    
    // Attach listeners to save row buttons
    const saveButtons = document.querySelectorAll('.save-row-btn');
    
    if (saveButtons.length > 0) {
      saveButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          event.preventDefault();
          const row = this.closest('tr');
          saveRowChanges(row);
        });
      });
    }
    
    // Attach listeners to cancel edit buttons
    const cancelButtons = document.querySelectorAll('.cancel-edit-btn');
    
    if (cancelButtons.length > 0) {
      cancelButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          event.preventDefault();
          const row = this.closest('tr');
          cancelRowEdit(row);
        });
      });
    }
  }
  
  // Function to delete a volunteer hours entry
  function deleteHoursEntry(entryId) {
    // Hide any previous messages
    const successElement = document.getElementById('deleteHoursSuccess');
    const errorElement = document.getElementById('deleteHoursError');
    
    if (successElement) {
      successElement.classList.add('d-none');
    }
    
    if (errorElement) {
      errorElement.classList.add('d-none');
    }
    
    fetchWithErrorHandling(`/delete/${entryId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(data => {
      // Show success message
      showMessage('deleteHoursSuccess', data.message || 'Entry deleted successfully.');
      
      // Reload hours data to refresh the table
      loadHoursData();
    })
    .catch(error => {
      console.error('Error deleting hours entry:', error);
      showMessage('deleteHoursError', error.message || 'Error deleting entry. Please try again.');
    });
  }
  
  // Function to switch a row to edit mode
  function switchToEditMode(row) {
    // Set row to edit mode
    row.setAttribute('data-mode', 'edit');
    
    // Get the current values from the cells
    const dateCell = row.querySelector('.date-cell');
    const hoursCell = row.querySelector('.hours-cell');
    const notesCell = row.querySelector('.notes-cell');
    
    const date = dateCell.getAttribute('data-date');
    const hours = hoursCell.getAttribute('data-hours');
    const notes = notesCell.getAttribute('data-notes');
    
    // Replace content with form fields
    dateCell.innerHTML = `<input type="date" class="form-control form-control-sm edit-date" value="${date}">`;
    hoursCell.innerHTML = `<input type="number" class="form-control form-control-sm edit-hours" value="${hours}" step="0.5" min="0.5" max="24">`;
    notesCell.innerHTML = `<input type="text" class="form-control form-control-sm edit-notes" value="${notes}">`;
    
    // Show edit mode buttons, hide view mode buttons
    const viewBtns = row.querySelector('.view-mode-buttons');
    const editBtns = row.querySelector('.edit-mode-buttons');
    
    viewBtns.style.display = 'none';
    editBtns.style.display = 'block';
  }
  
  // Function to save changes made to a row
  function saveRowChanges(row) {
    // Get the entry ID from the row
    const entryId = row.getAttribute('data-id');
    
    // Get the save button and show the spinner
    const saveBtn = row.querySelector('.save-row-btn');
    const saveIcon = saveBtn.querySelector('.save-icon');
    const saveSpinner = saveBtn.querySelector('.save-spinner');
    
    // Disable buttons and show spinner
    saveBtn.disabled = true;
    row.querySelector('.cancel-edit-btn').disabled = true;
    saveIcon.style.display = 'none';
    saveSpinner.style.display = 'inline-block';
    
    // Get the updated values from the input fields
    const dateInput = row.querySelector('.edit-date');
    const hoursInput = row.querySelector('.edit-hours');
    const notesInput = row.querySelector('.edit-notes');
    
    const date = dateInput.value;
    const hours = parseFloat(hoursInput.value);
    const notes = notesInput.value;
    
    // Validate the input
    if (!date || isNaN(hours) || hours <= 0) {
      alert('Please enter valid date and hours.');
      
      // Reset button states
      saveBtn.disabled = false;
      row.querySelector('.cancel-edit-btn').disabled = false;
      saveIcon.style.display = 'inline-block';
      saveSpinner.style.display = 'none';
      return;
    }
    
    const updatedData = {
      date: date,
      hours: hours,
      notes: notes
    };
    
    // Make API request to update the entry
    fetchWithErrorHandling(`/edit/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    })
    .then(data => {
      // Show success message
      showMessage('deleteHoursSuccess', 'Hours updated successfully!');
      
      // Reload hours data to refresh the table
      loadHoursData();
    })
    .catch(error => {
      console.error('Error updating hours entry:', error);
      showMessage('deleteHoursError', error.message || 'Error updating hours. Please try again.');
      
      // Reset button states
      const saveBtn = row.querySelector('.save-row-btn');
      const cancelBtn = row.querySelector('.cancel-edit-btn');
      const saveIcon = saveBtn.querySelector('.save-icon');
      const saveSpinner = saveBtn.querySelector('.save-spinner');
      
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      saveIcon.style.display = 'inline-block';
      saveSpinner.style.display = 'none';
      
      // Switch back to view mode with old values
      cancelRowEdit(row);
    });
  }
  
  // Function to cancel editing a row
  function cancelRowEdit(row) {
    // Set row back to view mode
    row.setAttribute('data-mode', 'view');
    
    // Get the cells
    const dateCell = row.querySelector('.date-cell');
    const hoursCell = row.querySelector('.hours-cell');
    const notesCell = row.querySelector('.notes-cell');
    
    // Get the original values
    const date = dateCell.getAttribute('data-date');
    const hours = hoursCell.getAttribute('data-hours');
    const notes = notesCell.getAttribute('data-notes');
    
    // Restore the original content
    dateCell.innerHTML = formatDate(date);
    hoursCell.innerHTML = hours;
    notesCell.innerHTML = notes || '';
    
    // Show view mode buttons, hide edit mode buttons
    const viewBtns = row.querySelector('.view-mode-buttons');
    const editBtns = row.querySelector('.edit-mode-buttons');
    
    viewBtns.style.display = 'block';
    editBtns.style.display = 'none';
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
            row.setAttribute('title', `ID ${entry.id}`);
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
