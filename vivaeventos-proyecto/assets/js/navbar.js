/**
 * Componente Navbar dinámico
 * Renderiza el menú según el estado de autenticación
 */
const Navbar = {
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('MyAccount.html')) return 'cuenta';
        if (path.includes('Tickets.html')) return 'entradas';
        if (path.includes('support.html')) return 'soporte';
        if (path.includes('/validator')) return 'validador';
        if (path.includes('login.html') || path.includes('registro.html')) return 'auth';
        return 'eventos';
    },

    getUserRole() {
        try {
            const user = (AuthService && typeof AuthService.getUser === 'function') ? AuthService.getUser() : null;
            return user && user.role ? String(user.role).toUpperCase() : null;
        } catch (e) {
            return null;
        }
    },

    render() {
        const isAuth = AuthService && AuthService.isAuthenticated();
        const navbarContainer = document.getElementById('navbar-container');
        const currentPage = this.getCurrentPage();

        if (!navbarContainer) return;

        if (isAuth) {
            const role = this.getUserRole();
            const canValidate = role === 'ORGANIZER' || role === 'ORGANIZADOR' || role === 'ADMIN';
            const validatorLink = canValidate
                ? `<a href="/validator/index.html" class="${currentPage === 'validador' ? 'active' : ''}">Validar boletas</a>`
                : '';

            // Navbar cuando hay sesión iniciada
            navbarContainer.innerHTML = `
                <header class="navbar">
                    <div class="logo">
                        <a href="/index.html">
                            <img src="/assets/images/Logoblue.png" alt="Logo VivaEventos">
                            <img class="logo-text" src="/assets/images/Titulo.webp" alt="VivaEventos">
                        </a>
                    </div>
                    <nav>
                        <a href="/index.html" class="${currentPage === 'eventos' ? 'active' : ''}">Eventos</a>
                        <a href="/assets/Tickets.html" class="${currentPage === 'entradas' ? 'active' : ''}">Mis entradas</a>
                        ${validatorLink}
                        <a href="/assets/MyAccount.html" class="${currentPage === 'cuenta' ? 'active' : ''}">Mi cuenta</a>
                        <a href="#" id="logoutBtn">Cerrar sesión</a>
                    </nav>
                </header>
            `;
        } else {
            // Navbar público (sin sesión)
            navbarContainer.innerHTML = `
                <header class="navbar">
                    <div class="logo">
                        <a href="/index.html">
                            <img src="/assets/images/Logoblue.png" alt="Logo VivaEventos">
                            <img class="logo-text" src="/assets/images/Titulo.webp" alt="VivaEventos">
                        </a>
                    </div>
                    <nav>
                        <a href="/index.html" class="${currentPage === 'eventos' ? 'active' : ''}">Eventos</a>
                        <a href="/auth/login.html" class="${currentPage === 'auth' ? 'active' : ''}">Ingresar</a>
                        <a href="/assets/support.html" class="${currentPage === 'soporte' ? 'active' : ''}">Soporte</a>
                    </nav>
                </header>
            `;
        }

        // Agregar evento de logout si existe el botón
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                if (window.AuthService) await AuthService.logout();
            });
        }
    }
};

// Auto-renderizar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Navbar.render();
});