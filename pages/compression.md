---
layout: page
title: HTML Compression Analysis
permalink: /compression/
---

<div class="compression-dashboard">
  <div class="alert alert-info mb-4">
    <h4><i class="fas fa-chart-line me-2"></i>HTML Compression Analysis Dashboard</h4>
    <p class="mb-0">This page shows real-time analysis of HTML compression statistics for this Jekyll site, measuring potential file size savings from minification.</p>
  </div>

  <!-- Current Build Statistics -->
  <div class="row mb-5">
    <div class="col-12">
      <h2><i class="fas fa-tachometer-alt me-2"></i>Current Build Statistics</h2>
      <div class="card">
        <div class="card-body">
          <div id="current-stats" class="row text-center">
            <div class="col-md-3">
              <h3 class="text-primary" id="total-files">0</h3>
              <p class="text-muted">HTML Files</p>
            </div>
            <div class="col-md-3">
              <h3 class="text-success" id="total-savings">0%</h3>
              <p class="text-muted">Average Compression</p>
            </div>
            <div class="col-md-3">
              <h3 class="text-info" id="bytes-saved">0KB</h3>
              <p class="text-muted">Bytes Saved</p>
            </div>
            <div class="col-md-3">
              <h3 class="text-warning" id="last-updated">Never</h3>
              <p class="text-muted">Last Analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- File-by-File Analysis -->
  <div class="row mb-5">
    <div class="col-12">
      <h2><i class="fas fa-file-code me-2"></i>File-by-File Analysis</h2>
      <div class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped" id="files-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Original Size</th>
                  <th>Compressed Size</th>
                  <th>Savings</th>
                  <th>Compression %</th>
                </tr>
              </thead>
              <tbody id="files-tbody">
                <!-- Will be populated by JavaScript -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Historical Trends -->
  <div class="row mb-5">
    <div class="col-12">
      <h2><i class="fas fa-history me-2"></i>Historical Trends</h2>
      <div class="card">
        <div class="card-body">
          <canvas id="compression-chart" width="400" height="150"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Log Entries -->
  <div class="row">
    <div class="col-12">
      <h2><i class="fas fa-list me-2"></i>Recent Build History</h2>
      <div class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Files</th>
                  <th>Original Size</th>
                  <th>Compressed Size</th>
                  <th>Savings</th>
                  <th>Compression %</th>
                </tr>
              </thead>
              <tbody id="history-tbody">
                <!-- Will be populated by JavaScript -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.compression-dashboard {
  font-family: 'Open Sans', sans-serif;
}

.compression-dashboard h2 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.compression-dashboard .card {
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.compression-dashboard .alert-info {
  background-color: #e8f4f8;
  border-color: #3498db;
  color: #2c3e50;
}

#compression-chart {
  max-height: 300px;
}

.table th {
  background-color: #f8f9fa;
  border-top: none;
}

.progress {
  height: 20px;
}

.badge-compression {
  font-size: 0.9em;
}

.text-compression-excellent { color: #27ae60 !important; }
.text-compression-good { color: #f39c12 !important; }
.text-compression-poor { color: #e74c3c !important; }
</style>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Simulate loading current compression data
  loadCompressionData();
  loadHistoricalData();
});

function loadCompressionData() {
  // Load real data from the generated JSON file
  fetch('/compression_data.json')
    .then(response => response.json())
    .then(data => {
      // Update current stats
      document.getElementById('total-files').textContent = data.file_count || 0;
      document.getElementById('total-savings').textContent = (data.percentage || 0) + '%';
      document.getElementById('bytes-saved').textContent = data.bytes_saved || '0KB';
      document.getElementById('last-updated').textContent = data.last_updated || 'Never';

      // Populate files table
      const tbody = document.getElementById('files-tbody');
      tbody.innerHTML = ''; // Clear existing content
      
      if (data.files && data.files.length > 0) {
        data.files
          .filter(file => file.percentage >= 15) // Only show files with significant compression
          .sort((a, b) => b.percentage - a.percentage) // Sort by compression percentage
          .forEach(file => {
            const row = document.createElement('tr');
            const compressionClass = getCompressionClass(file.percentage);
            
            row.innerHTML = `
              <td><code>${file.name}</code></td>
              <td>${file.original_formatted}</td>
              <td>${file.compressed_formatted}</td>
              <td>${file.savings_formatted}</td>
              <td>
                <span class="badge ${compressionClass}">${file.percentage}%</span>
                <div class="progress mt-1" style="height: 6px;">
                  <div class="progress-bar ${compressionClass.replace('badge', 'bg')}" 
                       style="width: ${Math.min(file.percentage, 100)}%"></div>
                </div>
              </td>
            `;
            tbody.appendChild(row);
          });
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No compression data available yet. Run a build to generate data.</td></tr>';
      }
    })
    .catch(error => {
      console.warn('Could not load compression data:', error);
      // Fallback to Jekyll data if JSON isn't available
      loadFallbackData();
    });
}

function loadFallbackData() {
  // If JSON fetch fails, show message that data will be available after build
  const tbody = document.getElementById('files-tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Compression data will be available after running a Jekyll build.</td></tr>';
}

function getCompressionClass(percentage) {
  if (percentage >= 30) return 'badge-success';
  if (percentage >= 20) return 'badge-warning';
  return 'badge-secondary';
}

function loadHistoricalData() {
  // Load real historical data from the generated JSON file
  fetch('/compression_history.json')
    .then(response => response.json())
    .then(data => {
      const historyData = data.history || [];
      
      // Populate history table (show last 10 entries)
      const historyTbody = document.getElementById('history-tbody');
      historyTbody.innerHTML = '';
      
      if (historyData.length > 0) {
        historyData.slice(-10).reverse().forEach(entry => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><small>${entry.timestamp}</small></td>
            <td>${entry.files}</td>
            <td>${entry.original}</td>
            <td>${entry.compressed}</td>
            <td>${entry.saved}</td>
            <td><span class="badge badge-info">${entry.percentage}%</span></td>
          `;
          historyTbody.appendChild(row);
        });
      } else {
        historyTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No historical data available yet.</td></tr>';
      }

      // Create chart with real data
      if (historyData.length > 0) {
        createCompressionChart(historyData);
      } else {
        document.getElementById('compression-chart').parentElement.innerHTML = 
          '<p class="text-center text-muted">Historical chart will appear after multiple builds.</p>';
      }
    })
    .catch(error => {
      console.warn('Could not load historical data:', error);
      // Fallback message
      document.getElementById('history-tbody').innerHTML = 
        '<tr><td colspan="6" class="text-center text-muted">Historical data will be available after GitHub Actions builds.</td></tr>';
      document.getElementById('compression-chart').parentElement.innerHTML = 
        '<p class="text-center text-muted">Historical chart will appear after multiple builds.</p>';
    });
}

function createCompressionChart(historyData) {
  const ctx = document.getElementById('compression-chart').getContext('2d');
  
  // Prepare data for chart (show last 20 data points)
  const chartData = historyData.slice(-20);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }),
      datasets: [
        {
          label: 'Compression Percentage',
          data: chartData.map(d => d.percentage),
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'File Count',
          data: chartData.map(d => d.files),
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Build Time'
          },
          ticks: {
            maxTicksLimit: 8
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Compression Percentage'
          },
          min: 0,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'File Count'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Compression Trends Over Time'
        },
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              if (context.datasetIndex === 0) {
                return 'Files: ' + chartData[context.dataIndex].files;
              }
              return '';
            }
          }
        }
      }
    }
  });
}
</script>
