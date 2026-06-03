const AuthService = {
    _getStore(remember) {
        return remember ? localStorage : sessionStorage;
    },

    _getItem(key) {
        return localStorage.getItem(key) || sessionStorage.getItem(key);
    },

    _removeItem(key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    },

    async login(email, password, remember) {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.twoFactorRequired) {
                return { success: false, twoFactorRequired: true, tempToken: data.tempToken, userId: data.userId };
            }
            this._removeItem('token');
            this._removeItem('user');
            const store = this._getStore(remember);
            const jwtToken = data.token && data.token.token ? data.token.token : data.token;
            store.setItem('token', jwtToken);
            const userData = data.user || (data.token ? data.token : null);
            if (userData) store.setItem('user', JSON.stringify(userData));
            return { success: true, data };
        } else {
            return { success: false, message: data.message || 'Error al iniciar sesión' };
        }
    },

    async verify2fa(tempToken, code, remember) {
        const response = await fetch('/api/v1/auth/2fa/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, code })
        });
        const data = await response.json();
        if (response.ok) {
            this._removeItem('token');
            this._removeItem('user');
            const store = this._getStore(remember);
            const jwtToken = data.token && data.token.token ? data.token.token : data.token;
            store.setItem('token', jwtToken);
            const userData = data.user || data.token;
            if (userData) store.setItem('user', JSON.stringify(userData));
            return { success: true, data };
        }
        return { success: false, message: data.error || 'Código inválido' };
    },

    async register(userData) {
        const response = await fetch('/api/v1/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, message: data.message || 'Error al registrarse' };
        }
    },

    async logout() {
        try {
            await fetch('/api/v1/auth/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + this.getToken() } });
        } catch (e) {
            console.warn('Error al cerrar sesion en el servidor', e);
        }
        this._removeItem('token');
        this._removeItem('user');
        window.location.href = '/index.html';
    },

    getUser() {
        const user = this._getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        return this._getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    requireAuth(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            window.location.href = '/auth/login.html';
            return false;
        }

        if (allowedRoles.length > 0) {
            const user = this.getUser();
            if (!allowedRoles.includes(user.role)) {
                window.location.href = '/auth/login.html';
                return false;
            }
        }

        return true;
    },

    redirectByRole() {
        const user = this.getUser();
        if (!user) {
            window.location.href = '/auth/login.html';
            return;
        }

        const role = (user.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'ORGANIZER' || role === 'ORGANIZADOR') {
            window.location.href = '/assets/DashboardOrganizer.html';
        } else if (role === 'LOGISTICA') {
            window.location.href = '/assets/DashboardLogistica.html';
        } else {
            window.location.href = '/index.html';
        }
    }
};

window.AuthService = AuthService;

// ============================================
// NAVBAR - Gestión dinámica de navegación
// ============================================

function updateNavbar() {
    const nav = document.querySelector('header.navbar nav');
    if (!nav) return;

    const user = AuthService.getUser();
    const isAuth = AuthService.isAuthenticated();

    if (isAuth && user) {
        // Usuario logueado: Mis entradas, Mi cuenta, Soporte, Cerrar sesión
        nav.innerHTML = `
            <a href="/assets/Tickets.html">Mis entradas</a>
            <a href="/assets/MyAccount.html">Mi cuenta</a>
            <a href="/assets/support.html">Soporte</a>
            <a href="#" id="logoutBtn">Cerrar sesión</a>
        `;

        // Agregar evento al botón de cerrar sesión
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            AuthService.logout();
        });
    }
    // Si no está logueado, mantener las opciones originales (ya definidas en el HTML)
}

// Actualizar navbar al cargar la página
document.addEventListener('DOMContentLoaded', updateNavbar);