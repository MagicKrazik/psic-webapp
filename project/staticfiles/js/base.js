document.addEventListener('DOMContentLoaded', function() {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const navLinks = document.querySelectorAll('.navbar-menu a');

    // Toggle mobile menu
    navbarToggle.addEventListener('click', function() {
        navbarMenu.classList.toggle('active');
        this.classList.toggle('active');
        
        // Toggle between hamburger and X icon
        if (this.classList.contains('active')) {
            this.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
            this.querySelectorAll('.bar')[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            this.querySelectorAll('.bar')[1].style.opacity = '0';
            this.querySelectorAll('.bar')[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            this.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
            this.querySelectorAll('.bar').forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        }
    });

    // Close menu when clicking on a nav link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 960) {
                navbarMenu.classList.remove('active');
                navbarToggle.classList.remove('active');
                navbarToggle.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
                navbarToggle.querySelectorAll('.bar').forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to current nav item
    const currentLocation = location.href;
    navLinks.forEach(link => {
        if (link.href === currentLocation) {
            link.classList.add('active');
        }
    });

    // Change navbar background on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(42, 4, 74, 0.9)'; // Using primary color with opacity
        } else {
            navbar.style.backgroundColor = 'var(--primary-color)';
        }
    });
});