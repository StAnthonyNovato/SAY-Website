// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const GoogleFormConfiguration = {
    responseContainerClass: 'form-response', // The class for response containers
    messages: {
        success: "Hey! Thanks for the message. We got it and will get back to you soon. :)",
        error: "Hmmm... That didn't work! Yeah, that really sucks. Please try again later."
    }
}

function showFormResponseMessage(form, message) {
    // Look for a response container within the form or right after it
    let container = form.querySelector('.' + GoogleFormConfiguration.responseContainerClass);
    
    // If no container exists inside the form, look for one after the form
    if (!container) {
        container = form.nextElementSibling;
        if (!container || !container.classList.contains(GoogleFormConfiguration.responseContainerClass)) {
            // Create a new response container if none exists
            container = document.createElement('div');
            container.className = GoogleFormConfiguration.responseContainerClass;
            container.innerHTML = '<p class="response-message"></p>';
            form.parentNode.insertBefore(container, form.nextSibling);
        }
    }
    
    // Find or create the message element
    let messageElement = container.querySelector('.response-message');
    if (!messageElement) {
        messageElement = document.createElement('p');
        messageElement.className = 'response-message';
        container.appendChild(messageElement);
    }
    
    messageElement.textContent = message;
    container.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
    // Find all forms with the data-google-form attribute
    const googleForms = document.querySelectorAll('form[data-google-form]');
    
    if (googleForms.length > 0) {
        console.log(`Found ${googleForms.length} Google Form(s)`);
        
        googleForms.forEach(form => {
            form.addEventListener('submit', function (event) {
                event.preventDefault();

                // Get form data
                const formData = new FormData(form);

                // Convert FormData to URL-encoded string for Google Forms
                const urlEncodedData = new URLSearchParams(formData).toString();

                // Get the Google Form URL from the form's action attribute
                const googleFormUrl = form.action;
                
                // Get custom success/error messages if provided
                const successMsg = form.getAttribute('data-success-message') || GoogleFormConfiguration.messages.success;
                const errorMsg = form.getAttribute('data-error-message') || GoogleFormConfiguration.messages.error;

                // Send the form data to Google Form
                fetch(googleFormUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: urlEncodedData,
                    mode: 'no-cors' // Google Forms requires no-cors mode
                })
                    .then(() => {
                        // Show success message
                        showFormResponseMessage(form, successMsg);
                        form.reset();
                    })
                    .catch(error => {
                        console.error('Error submitting form:', error);
                        showFormResponseMessage(form, errorMsg);
                    });
            });
        });
    } else {
        console.warn('No Google Forms found on this page');
    }
});