// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// @description: Show a message in the form response container
// @param {string} message - The message to display

const GoogleFormConfiguration = {
    formId: 'contactForm', // The ID of the contact form
    responseContainerId: 'form-response', // The ID of the response container
    messages: {
        success: "Hey! Thanks for the message. We got it and will get back to you soon. :)",
        error: "Hmmm... That didn't work! Yeah, that really sucks. Please try again later."
    }
}
function showFormResponseMessage(message) {
    const container = document.getElementById(GoogleFormConfiguration.responseContainerId);
    const messageElement = document.getElementById('form-response-message');
    messageElement.textContent = message;
    container.style.display = 'block';
}
document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById(GoogleFormConfiguration.formId);
    if (contactForm) {
        console.log("Found contact form", contactForm);
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);

            // Convert FormData to URL-encoded string for Google Forms
            const urlEncodedData = new URLSearchParams(formData).toString();

            // Get the Google Form URL from the form's action attribute
            const googleFormUrl = contactForm.action;

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
                    showFormResponseMessage(GoogleFormConfiguration.messages.success);
                    contactForm.reset();
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                    showFormResponseMessage(GoogleFormConfiguration.messages.error);
                });
        });
    } else {
        console.warn('Contact form element not found :(');
    }
});