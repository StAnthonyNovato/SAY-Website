// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const updateHealthStatus = () => {
    const emojis = {
        'healthy': '\uD83D\uDFE2',
        'degraded': '\uD83D\uDFE1',
        'unhealthy': '\uD83D\uDD34',
        'unknown': '\u26AA'
    }
    const healthElement = document.getElementById('backend-health');

    if (!healthElement) {
        throw new Error('Backend health element not found');
    }
    const statusDot = healthElement.querySelector('.status-dot');
    const statusText = healthElement.querySelector('.status-text');

    fetch(`${window.backendBaseURL}/healthcheck?fcnl=1`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            statusDot.title = `Last checked: ${new Date().toLocaleTimeString()}`;
            return response.json();
        })
        .then(data => {
            if (data.status === 'healthy') {
                statusDot.textContent = emojis['healthy'];
                statusText.textContent = 'All Systems Operational';
            } else if (data.status === 'degraded') {
                statusDot.textContent = emojis['degraded'];
                statusText.textContent = 'Systems experiencing issues';
            } else if (data.status === 'unhealthy') {
                statusDot.textContent = emojis['unhealthy'];
                statusText.textContent = 'Service Unavailable';
            } else {
                statusDot.textContent = emojis['unknown'];
                statusText.textContent = 'Unable to determine backend status';
            }
        })
        .catch(error => {
            console.error('Error fetching backend health status:', error);
            statusDot.textContent = emojis['unhealthy'];
            statusText.textContent = 'Service Unavailable'; // assuming the backend is down
        });
}

setInterval(updateHealthStatus, 60000);

document.addEventListener('DOMContentLoaded', () => {
    updateHealthStatus();
})();