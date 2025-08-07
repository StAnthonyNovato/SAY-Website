# Adding New Tabs to the Volunteer Hours Tool

This guide explains how to add a new tab to the Volunteer Hours Tracking Tool. The tool uses a tab-based interface with smooth sliding transitions between tabs.

## Tab System Overview

The Volunteer Hours tool uses a combination of Bootstrap tabs and custom JavaScript to create a smooth tab-switching experience with sliding animations. Tabs are managed by the `tabManager` object which handles:

- Tab activation and switching
- Animation direction (sliding left or right)
- URL hash updates
- Content loading for each tab

## Step 1: Add the Tab Button in HTML

First, add a new tab button to the tab navigation in `_includes/volunteer-hours/tabs-nav.html`:

```html
<li class="nav-item" role="presentation">
  <button class="nav-link" id="your-tab-name-tab" data-bs-toggle="tab" 
          data-bs-target="#your-tab-name" type="button" role="tab" 
          aria-controls="your-tab-name" aria-selected="false">
    <i class="fas fa-icon-name"></i> Your Tab Title
  </button>
</li>
```

## Step 2: Add the Tab Content

Create a new tab content pane in `_includes/volunteer-hours/tab-card.html`:

```html
<div class="tab-pane fade" id="your-tab-name" role="tabpanel" aria-labelledby="your-tab-name-tab">
  <div class="card-body">
    <!-- Your tab content goes here -->
    <h3>Your Tab Title</h3>
    
    <!-- Add your form, table, or other content -->
    <div class="row">
      <!-- Tab-specific content -->
    </div>
    
    <!-- Success/Error messages -->
    <div class="alert alert-success d-none" id="yourTabSuccess">
      Success message goes here
    </div>
    <div class="alert alert-danger d-none" id="yourTabError">
      Error message goes here
    </div>
  </div>
</div>
```

## Step 3: Register the Tab in JavaScript

Update the tab order in the tabManager object in `assets/js/volunteer-hours.js` to include your new tab:

```javascript
// Tab order for determining animation direction
tabOrder: ['log-hours', 'create-user', 'view-hours', 'user-stats', 'rules', 'your-tab-name'],
```

## Step 4: Add Tab Content Loading Logic

Add a case for your new tab in the `loadTabContent` function in `assets/js/volunteer-hours.js`:

```javascript
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
    case 'your-tab-name':
      // Call your tab's initialization function here
      loadYourTabContent();
      break;
  }
}
```

## Step 5: Create the Tab's JavaScript Functions

Add any necessary JavaScript functions to handle your tab's functionality:

```javascript
// Function to load your tab content
function loadYourTabContent() {
  // Add your code to initialize the tab
  // For example, loading data from API, setting up event listeners, etc.
  
  fetchWithErrorHandling('/your-endpoint')
    .then(data => {
      // Process data and update UI
    })
    .catch(error => {
      console.error('Error loading your tab data:', error);
      showMessage('yourTabError', error.message || 'Error loading data. Please try again.');
    });
}

// Add any other functions needed for your tab
function yourTabActionFunction(event) {
  event.preventDefault();
  
  // Handle form submission or other actions
  // ...
  
  // Show success message
  showMessage('yourTabSuccess', 'Action completed successfully!');
}
```

## Step 6: Add Event Listeners

If your tab has interactive elements like forms or buttons, add event listeners:

```javascript
// Add this to the DOMContentLoaded event listener
document.getElementById('yourTabForm').addEventListener('submit', yourTabActionFunction);
```

## Step 7: Add Any Required API Endpoints

If your tab requires new API endpoints, make sure to implement them in the backend service.

## Example: Adding a "Reports" Tab

Here's a complete example of adding a new "Reports" tab:

1. **Add the tab button**:
```html
<li class="nav-item" role="presentation">
  <button class="nav-link" id="reports-tab" data-bs-toggle="tab" 
          data-bs-target="#reports" type="button" role="tab" 
          aria-controls="reports" aria-selected="false">
    <i class="fas fa-chart-bar"></i> Reports
  </button>
</li>
```

2. **Add the tab content**:
```html
<div class="tab-pane fade" id="reports" role="tabpanel" aria-labelledby="reports-tab">
  <div class="card-body">
    <h3>Volunteer Hours Reports</h3>
    
    <div class="row mb-3">
      <div class="col-md-6">
        <label for="reportTypeSelect" class="form-label">Report Type</label>
        <select id="reportTypeSelect" class="form-select">
          <option value="monthly">Monthly Summary</option>
          <option value="user">User Summary</option>
        </select>
      </div>
      <div class="col-md-6">
        <label for="reportDateSelect" class="form-label">Date Range</label>
        <select id="reportDateSelect" class="form-select">
          <option value="current">Current Month</option>
          <option value="previous">Previous Month</option>
          <option value="year">Year to Date</option>
        </select>
      </div>
    </div>
    
    <div class="row mb-3">
      <div class="col-12">
        <button id="generateReportBtn" class="btn btn-primary">
          Generate Report
        </button>
      </div>
    </div>
    
    <div id="reportResults" class="mt-4 d-none">
      <!-- Report content will be added here -->
    </div>
    
    <div class="alert alert-success d-none" id="reportsSuccess"></div>
    <div class="alert alert-danger d-none" id="reportsError"></div>
  </div>
</div>
```

3. **Update the tab order**:
```javascript
tabOrder: ['log-hours', 'create-user', 'view-hours', 'user-stats', 'rules', 'reports'],
```

4. **Add tab content loading logic**:
```javascript
case 'reports':
  setupReportOptions();
  break;
```

5. **Create tab functions**:
```javascript
// Function to set up report options
function setupReportOptions() {
  // Maybe populate dropdown options dynamically
  // Or set default values
}

// Function to generate a report
function generateReport() {
  const reportType = document.getElementById('reportTypeSelect').value;
  const dateRange = document.getElementById('reportDateSelect').value;
  
  // Show loading indicator
  const resultsContainer = document.getElementById('reportResults');
  resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  resultsContainer.classList.remove('d-none');
  
  // Fetch report data
  fetchWithErrorHandling(`/reports?type=${reportType}&range=${dateRange}`)
    .then(data => {
      // Process and display the report
      displayReport(data, reportType);
    })
    .catch(error => {
      console.error('Error generating report:', error);
      showMessage('reportsError', error.message || 'Error generating report. Please try again.');
      resultsContainer.classList.add('d-none');
    });
}

// Function to display the report
function displayReport(data, reportType) {
  const resultsContainer = document.getElementById('reportResults');
  
  // Different display based on report type
  if (reportType === 'monthly') {
    // Display monthly report
    // ...
  } else {
    // Display user report
    // ...
  }
}
```

6. **Add event listeners**:
```javascript
// Add this to the DOMContentLoaded event listener
document.getElementById('generateReportBtn').addEventListener('click', generateReport);
```

## Tips for Success

1. **Test thoroughly**: Make sure your tab works correctly with the tab animation system.
2. **Maintain consistency**: Follow the existing patterns for UI design and code structure.
3. **Error handling**: Always include proper error handling and user feedback.
4. **Responsive design**: Ensure your tab works well on both desktop and mobile devices.
5. **Performance**: Avoid loading unnecessary data until the tab is activated.

By following these steps, you can seamlessly add new tabs to the Volunteer Hours Tracking Tool.
