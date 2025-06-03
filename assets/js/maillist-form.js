// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

(function() {
    console.log("[maillist-form] Loaded :3");
})();

const funnyEmailPlaceholders = [
    "you@example.com (but cooler)",
    "not.a.robot@trust.me",
    "totally.real@email.biz",
    "unicorn@rainbowmail.net",
    "yourboss@looking.over",
    "ihateforms@whyme.com",
    "sneaky.ferret@burrow.org",
    "catlover99@meowmail.com",
    "email@butmakeitfunny.com",
    "sendmememes@nowpls.io",
    "definitelynot@spam.bot",
    "wizardofemails@hogwarts.edu",
    "404email@not.found",
    "banana@fruitmail.org",
    "email@example.email.email",
    "stopasking@already.gosh",
    "pikachu@electricmail.pkmn",
    "nope@cantremember.com",
    "name@domain.lol",
    "guess@what.this.is",
    "placeholder@funnyemail.com",
    "placeholder-people@iana.org"
];
document.addEventListener("DOMContentLoaded", function () {
    const randomIndex = Math.floor(Math.random() * funnyEmailPlaceholders.length);
    const emailInput = document.querySelector("#maillist-form input[type='email']");
    console.log("[random-email-placeholder] Setting placeholder to:", funnyEmailPlaceholders[randomIndex] + " (index: " + randomIndex + ")");
    if (emailInput) {
        emailInput.placeholder = funnyEmailPlaceholders[randomIndex];
    }
});

window.addEventListener('load', function () {
    var forms = document.getElementsByClassName('needs-validation');
    Array.prototype.filter.call(forms, function (form) {
    form.addEventListener('submit', function (event) {
        if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
        }
        form.classList.add('was-validated');
    }, false);
    });
}, false);
