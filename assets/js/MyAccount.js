async function loadProfile() {
    try {
        const token = AuthService.getToken();
        if (!token) return;
        const response = await fetch('/api/v1/auth/mi-perfil', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) return;
        const data = await response.json();
        const user = data.usuario || data;
        if (!user) return;
        console.log('API response user:', JSON.stringify(user));
        if (user.fullName) {
            const i = user.fullName.indexOf(' ');
            document.getElementById('nombre').value = i > 0 ? user.fullName.slice(0, i) : user.fullName;
            document.getElementById('apellido').value = i > 0 ? user.fullName.slice(i + 1) : '';
        }
        if (user.email) document.getElementById('email').value = user.email;
        if (user.phonePrefix) document.getElementById('caracteristica').value = user.phonePrefix;
        if (user.phone) document.getElementById('telefono').value = user.phone;
        if (user.documentType) document.getElementById('tipo-doc').value = user.documentType;
        if (user.documentNumber) document.getElementById('doc').value = user.documentNumber;
        if (user.country) document.getElementById('pais').value = user.country;
        if (user.birthDate) document.getElementById('fecha-nac').value = user.birthDate;
    } catch (e) {
        console.error('Error al cargar perfil:', e);
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const token = AuthService.getToken();
    if (!token) return;

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;

    const body = {
        fullName: (nombre + ' ' + apellido).trim(),
        phonePrefix: document.getElementById('caracteristica').value || null,
        phone: document.getElementById('telefono').value || null,
        documentType: document.getElementById('tipo-doc').value || null,
        documentNumber: document.getElementById('doc').value || null,
        country: document.getElementById('pais').value || null,
        birthDate: document.getElementById('fecha-nac').value || null
    };

    try {
        const response = await fetch('/api/v1/auth/mi-perfil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const result = await response.json();
            const updatedUser = result.usuario || result;
            const storedUser = AuthService.getUser();
            if (storedUser && updatedUser) {
                if (updatedUser.fullName) storedUser.fullName = updatedUser.fullName;
                if (updatedUser.phonePrefix) storedUser.phonePrefix = updatedUser.phonePrefix;
                if (updatedUser.phone) storedUser.phone = updatedUser.phone;
                if (updatedUser.country) storedUser.country = updatedUser.country;
                AuthService._removeItem('user');
                const store = AuthService._getStore(true);
                store.setItem('user', JSON.stringify(storedUser));
            }
            alert('Perfil actualizado exitosamente');
            loadProfile();
        } else {
            const data = await response.json();
            alert(data.error || data.message || 'Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function savePassword(e) {
    e.preventDefault();
    const token = AuthService.getToken();
    if (!token) return;

    const passwordActual = document.getElementById('password-actual').value;
    const nuevaPassword = document.getElementById('nueva-password').value;
    const confirmarPassword = document.getElementById('confirmar-password').value;
    const cerrarOtrasSesiones = document.getElementById('logout-all').checked;

    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
        alert('Todos los campos de contrasena son obligatorios');
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        alert('Las contrasenas nuevas no coinciden');
        return;
    }

    if (nuevaPassword.length < 6) {
        alert('La contrasena debe tener al menos 6 caracteres');
        return;
    }

    try {
        const response = await fetch('/api/v1/auth/cambiar-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                passwordActual,
                nuevaPassword,
                confirmarPassword,
                cerrarOtrasSesiones
            })
        });

        if (response.ok) {
            alert('Contrasena cambiada exitosamente');
            document.getElementById('password-form').reset();
        } else {
            const data = await response.json();
            alert(data.error || data.message || 'Error al cambiar contrasena');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexion');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadProfile();
    const infoForm = document.querySelector('#section-info form');
    if (infoForm) {
        infoForm.addEventListener('submit', saveProfile);
    }
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', savePassword);
    }
    const cancelBtn = document.getElementById('cancel-password');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('password-form').reset();
        });
    }
});

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