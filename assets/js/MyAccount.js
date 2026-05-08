async function loadProfile() {
    const user = AuthService.getUser();
    if (!user) return;
    if (user.fullName) {
        const i = user.fullName.indexOf(' ');
        document.getElementById('nombre').value = i > 0 ? user.fullName.slice(0, i) : user.fullName;
        document.getElementById('apellido').value = i > 0 ? user.fullName.slice(i + 1) : '';
    }
    if (user.email) document.getElementById('email').value = user.email;
    try {
        const token = AuthService.getToken();
        if (!token) return;
        const response = await fetch('/api/v1/auth/mi-perfil', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) {
            console.warn('No se pudo obtener perfil completo desde el servidor');
            return;
        }
        const data = await response.json();
        const profile = data.usuario || data;
        if (!profile) return;
        if (profile.phone) document.getElementById('telefono').value = profile.phone;
        if (profile.documentType) document.getElementById('tipo-doc').value = profile.documentType;
        if (profile.documentNumber) document.getElementById('doc').value = profile.documentNumber;
    } catch (e) {
        console.warn('Error al cargar datos adicionales del perfil:', e);
    }
}

document.addEventListener('DOMContentLoaded', loadProfile);

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