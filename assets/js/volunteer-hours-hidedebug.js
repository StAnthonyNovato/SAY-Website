// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

console.log("[volunteer-hours-hidedebug] Loaded :3");

window.addEventListener('resize', () => {
    // check if on desktop or mobile
    const isMobile = window.innerWidth <= 768; // Example threshold for mobile devices
    console.log('The window has been resized!', { width: window.innerWidth, height: window.innerHeight, mobile: isMobile });

    if (isMobile) {
        document.querySelectorAll(".reqDist").forEach((el) => {
            el.classList.add("vanish")
            el.parentElement.style.display = "none";
            el.parentElement.classList.remove("d-block");
        });
    } else {
        document.querySelectorAll(".reqDist").forEach((el) => {
            el.classList.remove("vanish")
            el.parentElement.style.display = "block";
            el.parentElement.classList.add("d-block");
        });
    }
});