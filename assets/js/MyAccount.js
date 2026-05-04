const menuLinks = document.querySelectorAll('.account-sidebar a');
const sections = document.querySelectorAll('.account-section');

menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        // Quitar active del menú
        menuLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        // Ocultar todas las secciones
        sections.forEach(sec => sec.classList.remove('active'));

        // Mostrar la correspondiente
        const section = this.getAttribute('data-seccion');

        if (section === 'info') {
            document.getElementById('section-info').classList.add('active');
        }

        if (section === 'password') {
            document.getElementById('section-password').classList.add('active');
        }

        if (section === 'security') {
            document.getElementById('section-security').classList.add('active');
        }

        if (section === 'sessions') {
            document.getElementById('section-sessions').classList.add('active');
        }

        if (section === 'ayuda') {
            window.location.href = '/assets/support.html';
        }
    });
});

const securityCards = document.querySelectorAll('.security-card');

securityCards.forEach(card => {
    card.addEventListener('click', () => {
        securityCards.forEach(c => {
            c.classList.remove('active');
            c.querySelector('.radio').classList.remove('active');
        });

        card.classList.add('active');
        card.querySelector('.radio').classList.add('active');
    });
});

document.querySelectorAll('.close-session').forEach(btn => {
    btn.addEventListener('click', function () {
        this.closest('.session-card').remove();
    });
});