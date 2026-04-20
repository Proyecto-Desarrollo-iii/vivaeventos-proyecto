const AuthService = {
    async login(email, password) {
        const response = await fetch('/api/auth/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        } else {
            return { success: false, message: data.message || 'Error al iniciar sesión' };
        }
    },
    
    async register(userData) {
        const response = await fetch('/api/auth/v1/register', {
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
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login.html';
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    getToken() {
        return localStorage.getItem('token');
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
        
        switch (user.role) {
            case 'admin':
            case 'organizador':
                window.location.href = '/admin/dashboard.html';
                break;
            case 'logistica':
                window.location.href = '/validator/validar.html';
                break;
            default:
                window.location.href = '/events/catalogo.html';
        }
    }
};

window.AuthService = AuthService;