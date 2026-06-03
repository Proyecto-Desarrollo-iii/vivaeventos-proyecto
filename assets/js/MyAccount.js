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
            Toast.success('Perfil actualizado', 'Tus datos se guardaron correctamente');
            loadProfile();
        } else {
            const data = await response.json();
            Toast.error('Error', data.error || data.message || 'Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.error('Error de conexión', 'No se pudo conectar con el servidor');
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
        Toast.warning('Campos incompletos', 'Todos los campos de contraseña son obligatorios');
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        Toast.warning('Contraseñas no coinciden', 'Las contraseñas nuevas no coinciden');
        return;
    }

    if (nuevaPassword.length < 6) {
        Toast.warning('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
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
            Toast.success('Contraseña cambiada', 'Tu contraseña se actualizó correctamente');
            document.getElementById('password-form').reset();
        } else {
            const data = await response.json();
            Toast.error('Error', data.error || data.message || 'Error al cambiar contraseña');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.error('Error de conexión', 'No se pudo conectar con el servidor');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const user = AuthService.getUser();
    const backBtn = document.getElementById('back-btn');
    if (backBtn && user) {
        if (user.role === 'ORGANIZER') {
            backBtn.href = '/assets/DashboardOrganizer.html';
        } else if (user.role === 'ADMIN') {
            backBtn.href = '/assets/DashboardManager.html';
        } else {
            backBtn.href = '/';
        }
    }
    loadProfile();
    load2faStatus();
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

let current2faMethod = 'APP';

async function load2faStatus() {
    try {
        const statusEl = document.getElementById('twofa-status');
        const methodEl = document.getElementById('twofa-method');
        const setupEl = document.getElementById('twofa-setup-area');
        const emailSetupEl = document.getElementById('twofa-email-setup-area');
        const disableEl = document.getElementById('twofa-disable-area');
        const methodSelector = document.getElementById('twofa-method-selector');
        const token = AuthService.getToken();
        if (!token) {
            if (statusEl) statusEl.textContent = 'No autenticado';
            return;
        }
        const res = await fetch('/api/v1/auth/2fa/status', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            if (statusEl) statusEl.textContent = 'Error (' + res.status + ')';
            return;
        }
        const data = await res.json();
        current2faMethod = data.method || 'APP';
        if (data.enabled) {
            if (statusEl) statusEl.textContent = 'Activado';
            if (methodEl) methodEl.textContent = current2faMethod === 'EMAIL' ? 'Código por email' : 'App autenticación';
            if (methodSelector) methodSelector.style.display = 'none';
            if (setupEl) setupEl.style.display = 'none';
            if (emailSetupEl) emailSetupEl.style.display = 'none';
            if (disableEl) disableEl.style.display = 'block';
            const activeMethodEl = document.getElementById('twofa-active-method');
            if (activeMethodEl) activeMethodEl.textContent = current2faMethod === 'EMAIL' ? 'Código por email' : 'App de autenticación';
            updateMethodButtons(current2faMethod);
        } else {
            if (statusEl) statusEl.textContent = 'Desactivado';
            if (methodEl) methodEl.textContent = '-';
            if (methodSelector) methodSelector.style.display = 'flex';
            if (disableEl) disableEl.style.display = 'none';
            updateMethodButtons(current2faMethod);
            if (current2faMethod === 'EMAIL') {
                if (setupEl) setupEl.style.display = 'none';
                if (emailSetupEl) emailSetupEl.style.display = 'block';
            } else {
                if (setupEl) setupEl.style.display = 'block';
                if (emailSetupEl) emailSetupEl.style.display = 'none';
            }
        }
    } catch (e) {
        console.error('Error al cargar estado 2FA:', e);
        const statusEl = document.getElementById('twofa-status');
        if (statusEl) statusEl.textContent = 'Error de conexión';
    }
}

function updateMethodButtons(method) {
    const appBtn = document.getElementById('method-app');
    const emailBtn = document.getElementById('method-email');
    if (!appBtn || !emailBtn) return;
    if (method === 'EMAIL') {
        appBtn.style.borderColor = '#e2e8f0';
        appBtn.style.background = '#fff';
        emailBtn.style.borderColor = '#0097b2';
        emailBtn.style.background = 'rgba(0,151,178,0.08)';
    } else {
        appBtn.style.borderColor = '#0097b2';
        appBtn.style.background = 'rgba(0,151,178,0.08)';
        emailBtn.style.borderColor = '#e2e8f0';
        emailBtn.style.background = '#fff';
    }
}

document.getElementById('method-app')?.addEventListener('click', async () => {
    current2faMethod = 'APP';
    updateMethodButtons('APP');
    document.getElementById('twofa-setup-area').style.display = 'block';
    document.getElementById('twofa-email-setup-area').style.display = 'none';
});

document.getElementById('method-email')?.addEventListener('click', async () => {
    current2faMethod = 'EMAIL';
    updateMethodButtons('EMAIL');
    document.getElementById('twofa-setup-area').style.display = 'none';
    document.getElementById('twofa-email-setup-area').style.display = 'block';
});

async function setup2fa() {
    try {
        const token = AuthService.getToken();
        if (!token) return;
        const res = await fetch('/api/v1/auth/2fa/setup', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) { Toast.error('Error', 'Error al configurar 2FA'); return; }
        const data = await res.json();
        document.getElementById('twofa-setup-btn').style.display = 'none';
        document.getElementById('twofa-qr-area').style.display = 'block';
        document.getElementById('twofa-secret').textContent = data.secret;
        document.getElementById('twofa-qr-img').src = 'data:image/png;base64,' + data.qrCodeBase64;
        document.getElementById('twofa-verify-area').style.display = 'block';
    } catch (e) {
        console.error('Error en setup 2FA:', e);
    }
}

async function verify2faSetup() {
    const code = document.getElementById('twofa-verify-code').value.trim();
    if (code.length !== 6) { Toast.warning('Código requerido', 'Ingresa el código de 6 dígitos'); return; }
    try {
        const token = AuthService.getToken();
        const res = await fetch('/api/v1/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ code })
        });
        if (res.ok) {
            Toast.success('2FA activado', 'Autenticación de dos factores activada exitosamente');
            load2faStatus();
        } else {
            const err = await res.json();
            Toast.error('Código inválido', err.error || 'El código ingresado no es correcto');
        }
    } catch (e) {
        console.error('Error al verificar 2FA:', e);
    }
}

async function setupEmail2fa() {
    try {
        const token = AuthService.getToken();
        if (!token) return;
        const res = await fetch('/api/v1/auth/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ method: 'EMAIL' })
        });
        if (!res.ok) { const err = await res.json(); Toast.error('Error', err.error || 'Error'); return; }
        const data = await res.json();
        Toast.info('Código enviado', 'Revisa tu correo electrónico y la consola del servidor');
        console.log('[2FA Email] Código de verificación enviado (simulado). Revisa los logs del servidor.');
        document.getElementById('twofa-email-setup-btn').style.display = 'none';
        document.getElementById('twofa-email-verify-area').style.display = 'block';
    } catch (e) {
        console.error('Error en setup 2FA email:', e);
    }
}

async function verifyEmail2faSetup() {
    const code = document.getElementById('twofa-email-code').value.trim();
    if (code.length !== 6) { Toast.warning('Código requerido', 'Ingresa el código de 6 dígitos'); return; }
    try {
        const token = AuthService.getToken();
        const res = await fetch('/api/v1/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ code })
        });
        if (res.ok) {
            Toast.success('2FA activado', 'Autenticación por email activada exitosamente');
            load2faStatus();
        } else {
            const err = await res.json();
            Toast.error('Código inválido', err.error || 'El código ingresado no es correcto');
        }
    } catch (e) {
        console.error('Error al verificar 2FA email:', e);
    }
}

async function disable2fa() {
    const password = prompt('Ingresa tu contraseña para deshabilitar 2FA:');
    if (!password) return;
    const code = prompt('Ingresa el código de 6 dígitos' + (current2faMethod === 'EMAIL' ? ' enviado a tu email' : ' de tu app de autenticación') + ':');
    if (!code || code.length !== 6) { Toast.warning('Código inválido', 'Debes ingresar un código de 6 dígitos'); return; }
    try {
        const token = AuthService.getToken();
        const res = await fetch('/api/v1/auth/2fa/disable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ password, code })
        });
        if (res.ok) {
            Toast.success('2FA deshabilitado', 'La autenticación de dos factores fue desactivada');
            load2faStatus();
        } else {
            const err = await res.json();
            Toast.error('Error', err.error || 'Error al deshabilitar 2FA');
        }
    } catch (e) {
        console.error('Error al deshabilitar 2FA:', e);
    }
}

document.getElementById('twofa-setup-btn')?.addEventListener('click', setup2fa);
document.getElementById('twofa-verify-btn')?.addEventListener('click', verify2faSetup);
document.getElementById('twofa-email-setup-btn')?.addEventListener('click', setupEmail2fa);
document.getElementById('twofa-email-verify-btn')?.addEventListener('click', verifyEmail2faSetup);
document.getElementById('twofa-disable-btn')?.addEventListener('click', disable2fa);

document.querySelectorAll('.close-session').forEach(btn => {
    btn.addEventListener('click', function () {
        this.closest('.session-card').remove();
    });
});