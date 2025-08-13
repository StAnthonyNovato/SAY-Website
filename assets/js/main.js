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

  // Mobile navigation handling
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('#navbarContent');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (navbarToggler && navbarCollapse) {
    console.log("[main.js] Mobile navigation found. Setting up handlers...");
    
    // Ensure initial state
    navbarCollapse.classList.add('collapse');
    navbarToggler.classList.add('collapsed');
    navbarToggler.setAttribute('aria-expanded', 'false');
    
    // Toggle mobile menu
    navbarToggler.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      console.log(`[main.js] Toggler clicked. Currently expanded: ${isExpanded}`);
      
      if (!isExpanded) {
        // Opening menu
        console.log("[main.js] Opening mobile menu");
        this.setAttribute('aria-expanded', 'true');
        this.classList.remove('collapsed');
        document.body.style.overflow = 'hidden';
        navbarCollapse.style.display = 'flex';
        navbarCollapse.classList.remove('collapse');
        // Small delay to ensure display is set before adding show class
        setTimeout(() => {
          navbarCollapse.classList.add('show');
        }, 10);
      } else {
        // Closing menu
        console.log("[main.js] Closing mobile menu");
        this.setAttribute('aria-expanded', 'false');
        this.classList.add('collapsed');
        document.body.style.overflow = '';
        navbarCollapse.classList.remove('show');
        // Wait for animation to complete before hiding
        setTimeout(() => {
          if (!navbarCollapse.classList.contains('show')) {
            navbarCollapse.style.display = '';
            navbarCollapse.classList.add('collapse');
          }
        }, 500);
      }
    });

    // Close menu function
    function closeMenu() {
      console.log("[main.js] Closing menu via function");
      navbarToggler.setAttribute('aria-expanded', 'false');
      navbarToggler.classList.add('collapsed');
      document.body.style.overflow = '';
      navbarCollapse.classList.remove('show');
      setTimeout(() => {
        if (!navbarCollapse.classList.contains('show')) {
          navbarCollapse.style.display = '';
          navbarCollapse.classList.add('collapse');
        }
      }, 500);
    }

    // Close menu when clicking on a nav link (mobile)
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth < 992) {
          closeMenu();
        }
      });
    });

    // Close menu when clicking outside (mobile)
    navbarCollapse.addEventListener('click', function(e) {
      if (e.target === this) {
        closeMenu();
      }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 992) {
        document.body.style.overflow = '';
        navbarCollapse.classList.remove('show');
        navbarCollapse.style.display = '';
        navbarCollapse.classList.add('collapse');
        navbarToggler.setAttribute('aria-expanded', 'false');
        navbarToggler.classList.add('collapsed');
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
