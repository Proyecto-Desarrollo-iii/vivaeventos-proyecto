const Toast = {
  _ensureContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  },

  _show(type, title, message, duration = 4000) {
    const container = this._ensureContainer();
    const icons = {
      success: 'check_circle',
      error: 'error',
      info: 'info',
      warning: 'warning'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined toast-icon">${icons[type] || 'info'}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close material-symbols-outlined">close</button>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    toast.querySelector('.toast-close').addEventListener('click', () => {
      this._dismiss(toast);
    });

    if (duration > 0) {
      setTimeout(() => this._dismiss(toast), duration);
    }

    return toast;
  },

  _dismiss(toast) {
    toast.classList.remove('show');
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 400);
  },

  success(title, message, duration) {
    return this._show('success', title, message, duration);
  },

  error(title, message, duration) {
    return this._show('error', title, message, duration);
  },

  info(title, message, duration) {
    return this._show('info', title, message, duration);
  },

  warning(title, message, duration) {
    return this._show('warning', title, message, duration);
  }
};

window.Toast = Toast;
