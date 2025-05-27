/**
 * St. Anthony de Padua - Confirmation Program
 * Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("[main.js] Document is ready. Initializing scripts...");
  // Navbar scroll behavior
  const navbar = document.querySelector('.navbar');
  
  if (navbar) {
    console.log("[main.js] Navbar found. Adding scroll event listener...");
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      console.log(`[main.js] Smooth scroll initiated for: ${this.getAttribute('href')}`);
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70, // Account for navbar height
          behavior: 'smooth'
        });
      }
    });
  });

  // Form validation
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple form validation
      let valid = true;
      const requiredFields = contactForm.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('is-invalid');
        } else {
          field.classList.remove('is-invalid');
        }
      });
      
      // If form is valid, you would typically send it to a backend
      if (valid) {
        // Placeholder for form submission
        contactForm.reset();
      }
    });
  }

  // Initialize tooltips if Bootstrap is loaded
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});
