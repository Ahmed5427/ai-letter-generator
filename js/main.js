// Main JavaScript for theme toggling and mobile navigation

document.addEventListener("DOMContentLoaded", () => {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const body = document.body;

    // Function to apply theme based on preference
    const applyTheme = (theme) => {
        if (theme === "dark") {
            body.classList.add("dark-mode");
            if (themeIcon) themeIcon.classList.replace("fa-moon", "fa-sun");
        } else {
            body.classList.remove("dark-mode");
            if (themeIcon) themeIcon.classList.replace("fa-sun", "fa-moon");
        }
    };

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Optional: Check system preference
        // const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        // applyTheme(prefersDark ? "dark" : "light");
        applyTheme("light"); // Default to light if no preference saved
    }

    // Event listener for theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const currentTheme = body.classList.contains("dark-mode") ? "dark" : "light";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(newTheme);
            localStorage.setItem("theme", newTheme);
        });
    }

    // Hamburger Menu Functionality
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        // Close menu when a link is clicked (optional)
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                if (hamburger.classList.contains("active")) {
                    hamburger.classList.remove("active");
                    navMenu.classList.remove("active");
                }
            });
        });
    }

    console.log("Main JS loaded.");
});

