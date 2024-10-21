document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Animate skills on scroll
    const skillsList = document.querySelector('.skills-list');
    if (skillsList) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateSkills();
                observer.unobserve(skillsList);
            }
        }, { threshold: 0.5 });

        observer.observe(skillsList);

        function animateSkills() {
            const skills = skillsList.querySelectorAll('li');
            skills.forEach((skill, index) => {
                setTimeout(() => {
                    skill.style.opacity = '1';
                    skill.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }

        // Initialize skill styles for animation
        const skills = skillsList.querySelectorAll('li');
        skills.forEach(skill => {
            skill.style.opacity = '0';
            skill.style.transform = 'translateY(20px)';
            skill.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
    }

    // Add hover effect to profile image
    const profileImage = document.querySelector('.profile-image');
    if (profileImage) {
        profileImage.addEventListener('mouseover', () => {
            profileImage.style.transform = 'scale(1.05)';
        });
        profileImage.addEventListener('mouseout', () => {
            profileImage.style.transform = 'scale(1)';
        });
    }
});