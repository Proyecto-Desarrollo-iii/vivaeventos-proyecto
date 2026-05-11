function openEventHistory(eventId, eventName) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'historyOverlay';
    overlay.innerHTML = `
        <div class="modal-content-box">
            <div class="modal-header-box">
                <h5>Historial de Cambios — ${escapeHtml(eventName)}</h5>
                <button class="modal-close" onclick="closeHistoryModal()">&times;</button>
            </div>
            <div class="modal-body-box" id="historyBody">
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status" style="width:3rem;height:3rem;">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2 text-secondary">Cargando historial...</p>
                </div>
            </div>
            <div class="modal-footer-box">
                <button class="px-4 py-2 rounded-full bg-primary text-white font-bold text-sm" onclick="closeHistoryModal()">Cerrar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHistoryModal();
    });

    loadHistory(eventId);
}

function closeHistoryModal() {
    const overlay = document.getElementById('historyOverlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
    }
}

async function loadHistory(eventId) {
    try {
        const result = await Events.getHistory(eventId);
        const historyBody = document.getElementById('historyBody');

        if (!result.history || result.history.length === 0) {
            historyBody.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-clock-history" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="mt-2 text-secondary">No hay cambios registrados para este evento.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="timeline">`;
        result.history.forEach((entry, index) => {
            const date = new Date(entry.createdAt);
            const formattedDate = date.toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const badge = getActionBadge(entry.action);
            const icon = getActionIcon(entry.action);

            html += `
                <div class="timeline-item">
                    <div class="timeline-marker" style="background:${badge.color}">
                        <i class="bi ${icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span style="background:${badge.color};color:#fff;padding:0.25rem 0.75rem;border-radius:999px;font-size:0.65rem;font-weight:700;text-transform:uppercase;display:inline-block;">${entry.action}</span>
                                <small style="color:#6b7280;margin-left:0.5rem;">${formattedDate}</small>
                            </div>
                        </div>
                        <p style="margin:0.25rem 0 0;color:#374151;">${escapeHtml(entry.description || '')}</p>
                        ${entry.userEmail ? `<small style="color:#9ca3af;">Por: ${escapeHtml(entry.userEmail)}</small>` : ''}
                        ${entry.previousState && entry.newState ? `
                            <div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:#f3f4f6;border-radius:0.5rem;">
                                <small style="color:#6b7280;display:block;"><strong>Antes:</strong> ${escapeHtml(entry.previousState)}</small>
                                <small style="color:#6b7280;display:block;"><strong>Después:</strong> ${escapeHtml(entry.newState)}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        historyBody.innerHTML = html;
    } catch (error) {
        const historyBody = document.getElementById('historyBody');
        historyBody.innerHTML = `
            <div style="background:#fee2e2;color:#b91c1c;padding:1rem;border-radius:0.75rem;">
                <i class="bi bi-exclamation-triangle"></i>
                Error al cargar el historial: ${error.message || 'Error desconocido'}
            </div>
        `;
    }
}

function getActionBadge(action) {
    const map = {
        'CREATED': { color: '#10b981', label: 'Creado' },
        'UPDATED': { color: '#3b82f6', label: 'Actualizado' },
        'PUBLISHED': { color: '#06b6d4', label: 'Publicado' },
        'UNPUBLISHED': { color: '#f59e0b', label: 'Despublicado' },
        'DEACTIVATED': { color: '#6b7280', label: 'Desactivado' },
        'DELETED': { color: '#ef4444', label: 'Eliminado' }
    };
    return map[action] || { color: '#6b7280', label: action };
}

function getActionIcon(action) {
    const map = {
        'CREATED': 'bi-plus-circle',
        'UPDATED': 'bi-pencil-square',
        'PUBLISHED': 'bi-check-circle',
        'UNPUBLISHED': 'bi-eye-slash',
        'DEACTIVATED': 'bi-pause-circle',
        'DELETED': 'bi-trash'
    };
    return map[action] || 'bi-clock-history';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
