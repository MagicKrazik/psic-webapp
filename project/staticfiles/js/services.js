document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const closeButton = document.getElementsByClassName('close')[0];
    const learnMoreButtons = document.querySelectorAll('.learn-more');

    const serviceDescriptions = {
        'individual-therapy': 'Las sesiones de terapia individual están diseñadas para proporcionar un espacio seguro y confidencial donde pueda explorar sus pensamientos, emociones y desafíos personales. Trabajaremos juntos para desarrollar estrategias efectivas que le ayuden a superar obstáculos y alcanzar sus metas de crecimiento personal.',
        'couple-therapy': 'La terapia de pareja se enfoca en mejorar la comunicación, resolver conflictos y fortalecer el vínculo emocional entre los miembros de la pareja. Aprenderá herramientas para expresar sus necesidades, escuchar activamente y construir una relación más sólida y satisfactoria.',
        'family-therapy': 'Le acompañaremos a usted y a tu familia a fortalecer sus vínculos y a crecer juntos. Trabajaremos en mejorar la comunicación, los roles y las dinámicas familiares, para que cada miembro pueda alcanzar su máximo potencial en un ambiente de apoyo mutuo.',
        'child-therapy': 'La terapia infantil utiliza técnicas adaptadas a la edad del niño, como el juego terapéutico, para ayudar a los niños a expresar sus emociones, desarrollar habilidades sociales y enfrentar desafíos en su desarrollo emocional y conductual.',
        'adolescent-therapy': 'La terapia para adolescentes se centra en abordar los desafíos únicos de esta etapa de la vida, como la formación de la identidad, la presión de los padres, los cambios físicos y emocionales. Proporcionando un espacio de apoyo para que los adolescentes exploren sus pensamientos y emociones.',
        'stress-management': 'En las sesiones de manejo del estrés, aprenderá técnicas prácticas como la respiración diafragmática y la reestructuración cognitiva para manejar el estrés y la ansiedad en su vida diaria. Le ayudaré a desarrollar un conjunto de herramientas para mantener el equilibrio emocional.'
    };

    learnMoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceId = this.parentElement.id;
            modalTitle.textContent = this.parentElement.querySelector('h2').textContent;
            modalDescription.textContent = serviceDescriptions[serviceId];
            modal.style.display = 'block';
        });
    });

    closeButton.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Animate service cards on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card').forEach(card => {
        observer.observe(card);
    });
});