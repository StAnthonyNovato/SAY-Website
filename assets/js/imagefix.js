// if we can't fetch the image show a message
console.log("[imagefix.js] Fixing image loading issues...");
document.addEventListener("DOMContentLoaded", function() {
    const imgs = document.querySelectorAll('.image-container img');
    imgs.forEach(img => {
        console.log(`[imagefix.js] Processing image: ${img.src}`);
        img.onload = function() {
            console.log(`[imagefix.js] Image loaded successfully: ${this.src}`);
        };
        img.onerror = function() {
            console.error(`[imagefix.js] Error loading image: ${this.src}`);
            this.style.display = 'none';
            const placeholder = this.closest('.img-placeholder');
            placeholder.innerHTML = '<span class="text-muted">Image not available</span>';
        };
    });
});
