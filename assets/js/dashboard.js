document.addEventListener('DOMContentLoaded', () => {
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/auth/login.html';
        return;
    }
    loadDashboard();
});

async function loadDashboard() {
    const user = AuthService.getUser();
    const greeting = document.querySelector('.font-label');
    if (greeting && user) {
        const name = user.fullName || user.email || 'Organizador';
        greeting.textContent = `Buenos días, ${name.split(' ')[0]}`;
    }

    const organizerId = user?.id || '';
    if (!organizerId) return;

    try {
        const result = await api.get(`/events/organizer/${organizerId}`);
        const eventos = result.data?.eventos || [];
        updateStats(eventos);
        renderInventoryTable(eventos);
        renderEventsTable(eventos);
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

function updateStats(eventos) {
    const totalVendidas = eventos.reduce((sum, e) => sum + (e.tickets?.reduce((s, t) => s + (t.soldCount || 0), 0) || 0), 0);
    const activos = eventos.filter(e => e.isPublished && e.isActive).length;
    const cards = document.querySelectorAll('.card p');
    if (cards.length >= 4) {
        cards[2].textContent = activos;
    }
    document.querySelectorAll('[id]').forEach(el => {
        if (el.id === 'total-revenue') el.textContent = `$${(totalVendidas * 25).toLocaleString()}`;
        if (el.id === 'total-sold') el.textContent = totalVendidas.toLocaleString();
        if (el.id === 'active-events') el.textContent = activos;
    });
}

function renderInventoryTable(eventos) {
    const tbody = document.querySelector('#dashboard-panel tbody');
    if (!tbody) return;
    tbody.innerHTML = buildTableRows(eventos, false);
    bindTableEvents();
}

function renderEventsTable(eventos) {
    const tbody = document.querySelector('#events-panel tbody');
    if (!tbody) return;
    tbody.innerHTML = buildTableRows(eventos, true);
    bindEventsPanelEvents();
}

function buildTableRows(eventos, showActions) {
    if (!eventos || eventos.length === 0) {
        return `<tr><td colspan="${showActions ? 5 : 4}" class="text-center py-12 text-secondary">
            No tienes eventos aún.
            <a href="/assets/newEvent.html" class="text-primary font-bold block mt-2">Crear tu primer evento</a>
        </td></tr>`;
    }
    return eventos.map(event => {
        const totalCap = event.tickets?.reduce((s, t) => s + (t.capacity || 0), 0) || 0;
        const totalSold = event.tickets?.reduce((s, t) => s + (t.soldCount || 0), 0) || 0;
        const pct = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;
        const isPub = event.isPublished;
        const statusText = isPub ? 'Publicado' : 'Borrador';
        const statusClass = isPub ? 'bg-primary-fixed/40 text-primary-container' : 'bg-surface-container-high text-secondary';

        const actions = showActions ? `
            <td class="px-6 py-5 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                    <button class="px-3 py-2 rounded-full bg-surface-container-high text-secondary text-xs font-semibold hover:bg-primary-fixed transition-colors edit-event" data-id="${event.id}">Editar</button>
                    <button class="px-3 py-2 rounded-full text-white text-xs font-semibold transition-colors ${isPub ? 'bg-amber-500 hover:bg-amber-600' : 'bg-cyan-600 hover:bg-cyan-700'} publish-event" data-id="${event.id}" data-published="${isPub}">${isPub ? 'Despublicar' : 'Publicar'}</button>
                    <button class="px-3 py-2 rounded-full bg-surface-container-high text-secondary text-xs font-semibold hover:bg-blue-100 transition-colors history-event" data-id="${event.id}" data-name="${event.name}">Historial</button>
                    <button class="px-3 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors delete-event" data-id="${event.id}">Eliminar</button>
                </div>
            </td>` : '';

        return `
            <tr class="bg-surface-container-lowest editorial-shadow rounded-3xl transition-transform hover:scale-[1.01] cursor-pointer" data-id="${event.id}">
                <td class="px-6 py-5 rounded-l-[2rem]">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container-high">
                            ${event.bannerUrl
                                ? `<img src="${event.bannerUrl}" class="w-full h-full object-cover" alt="">`
                                : `<div class="w-full h-full flex items-center justify-center text-secondary"><span class="material-symbols-outlined">event</span></div>`
                            }
                        </div>
                        <div>
                            <p class="font-bold text-on-surface">${event.name || 'Sin nombre'}</p>
                            <p class="text-xs text-secondary">${event.eventDateTime ? new Date(event.eventDateTime).toLocaleDateString() : ''}${event.venueName ? ' • ' + event.venueName : ''}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusClass} text-xs font-bold uppercase">
                        <span class="w-1.5 h-1.5 bg-current rounded-full ${isPub ? 'kinetic-pulse' : ''}"></span>
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-5 text-center">
                    <p class="font-bold text-primary">${totalSold.toLocaleString()}</p>
                    <p class="text-[10px] text-outline uppercase font-label">${pct}% ocupación</p>
                </td>
                <td class="px-6 py-5 ${showActions ? '' : 'rounded-r-[2rem]'} text-center">
                    <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div class="bg-primary h-full rounded-full" style="width: ${pct}%"></div>
                    </div>
                </td>
                ${actions}
            </tr>`;
    }).join('');
}

function bindTableEvents() {
    document.querySelectorAll('#dashboard-panel tr[data-id]').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            window.location.href = `/assets/Event.html?id=${row.dataset.id}`;
        });
    });
}

function bindEventsPanelEvents() {
    document.querySelectorAll('#events-panel .edit-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `/assets/newEvent.html?edit=${btn.dataset.id}`;
        });
    });

    document.querySelectorAll('#events-panel .publish-event').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const isPublished = btn.dataset.published === 'true';
            const user = AuthService.getUser();
            const body = { organizerId: user?.id || null };
            try {
                const result = isPublished
                    ? await api.post(`/events/${id}/unpublish`, body)
                    : await api.post(`/events/${id}/publish`, body);
                if (result.ok) {
                    showToast(isPublished ? 'Evento despublicado' : 'Evento publicado', 'success');
                    loadDashboard();
                } else {
                    showToast(result.data?.error || 'Error al cambiar estado', 'error');
                }
            } catch (err) {
                showToast('Error de conexión', 'error');
            }
        });
    });

    document.querySelectorAll('#events-panel .history-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const name = btn.dataset.name || 'Evento';
            openEventHistory(id, name);
        });
    });

    document.querySelectorAll('#events-panel .delete-event').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('¿Estás seguro de eliminar este evento?')) return;
            const user = AuthService.getUser();
            try {
                const result = await api.post(`/events/${btn.dataset.id}/delete`, { organizerId: user?.id || null });
                if (result.ok) {
                    showToast('Evento eliminado', 'success');
                    loadDashboard();
                } else {
                    showToast(result.data?.error || 'Error al eliminar', 'error');
                }
            } catch (err) {
                showToast('Error de conexión', 'error');
            }
        });
    });

    document.querySelectorAll('#events-panel tr[data-id]').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            window.location.href = `/assets/Event.html?id=${row.dataset.id}`;
        });
    });
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-primary' };
    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-4 right-4 z-[9999] ${colors[type] || colors.info} text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm transition-all duration-300`;
    toast.style.transform = 'translateX(120%)';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
