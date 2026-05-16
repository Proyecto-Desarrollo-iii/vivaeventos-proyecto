let editingEventId = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
        editingEventId = editId;
        loadEventForEdit(editId);
    }

    document.getElementById('addTicketBtn')?.addEventListener('click', addTicketRow);
    document.getElementById('saveEventBtn')?.addEventListener('click', () => saveEvent(true));
    document.getElementById('saveDraftBtn')?.addEventListener('click', () => saveEvent(false));

    document.getElementById('bannerPreview')?.addEventListener('click', () => {
        const url = prompt('Ingresa la URL del banner del evento:');
        if (url) {
            document.getElementById('eventBannerUrl').value = url;
            document.getElementById('bannerImage').src = url;
        }
    });

    document.querySelectorAll('.delete-ticket').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('.ticket-row');
            if (row && document.querySelectorAll('.ticket-row').length > 1) {
                row.remove();
            } else {
                showToast('Debe haber al menos un tipo de entrada', 'error');
            }
        });
    });
});

function addTicketRow() {
    const container = document.getElementById('ticketsContainer');
    const row = document.createElement('div');
    row.className = 'ticket-row grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-surface-container-low rounded-xl relative overflow-hidden group';
    row.innerHTML = `
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all"></div>
        <div class="space-y-2">
            <label>Tipo</label>
            <input class="ticket-type" type="text" placeholder="Ej: VIP" />
        </div>
        <div class="space-y-2">
            <label>Precio</label>
            <input class="ticket-price" type="number" step="0.01" placeholder="0.00" />
        </div>
        <div class="space-y-2">
            <label>Capacidad</label>
            <input class="ticket-capacity" type="number" placeholder="100" />
        </div>
        <div class="flex items-center justify-end gap-4">
            <span class="material-symbols-outlined text-secondary cursor-pointer hover:text-error transition-colors delete-ticket">delete</span>
        </div>
    `;
    container.appendChild(row);
    row.querySelector('.delete-ticket')?.addEventListener('click', function() {
        if (document.querySelectorAll('.ticket-row').length > 1) {
            row.remove();
        } else {
            showToast('Debe haber al menos un tipo de entrada', 'error');
        }
    });
}

async function saveEvent(publish = false) {
    const name = document.getElementById('eventName')?.value.trim();
    const category = document.getElementById('eventCategory')?.value;
    const date = document.getElementById('eventDate')?.value;
    const description = document.getElementById('eventDescription')?.value.trim();
    const venue = document.getElementById('eventVenue')?.value.trim();
    const address = document.getElementById('eventAddress')?.value.trim();
    const city = document.getElementById('eventCity')?.value.trim();
    const bannerUrl = document.getElementById('eventBannerUrl')?.value.trim();
    const spotify = document.getElementById('eventSpotify')?.value.trim();
    const instagram = document.getElementById('eventInstagram')?.value.trim();

    if (!name || !category || !date) {
        showToast('Completa nombre, categoría y fecha del evento', 'error');
        return;
    }

    const ticketRows = document.querySelectorAll('.ticket-row');
    const tickets = [];
    let ticketValid = true;
    ticketRows.forEach(row => {
        const type = row.querySelector('.ticket-type')?.value.trim();
        const price = row.querySelector('.ticket-price')?.value;
        const capacity = row.querySelector('.ticket-capacity')?.value;
        if (!type || !price || !capacity) {
            ticketValid = false;
            return;
        }
        tickets.push({ type, price: parseFloat(price), capacity: parseInt(capacity) });
    });

    if (!ticketValid || tickets.length === 0) {
        showToast('Completa todos los tipos de entrada (tipo, precio, capacidad)', 'error');
        return;
    }

    const user = typeof AuthService !== 'undefined' ? AuthService.getUser() : null;
    const organizerId = user?.id || null;

    const eventData = {
        name,
        category,
        eventDateTime: new Date(date).toISOString().split('.')[0],
        description: description || '',
        venueName: venue || '',
        address: address || '',
        city: city || '',
        bannerUrl: bannerUrl || '',
        spotifyUrl: spotify || '',
        instagramUrl: instagram || '',
        organizerId,
        tickets,
        isPublished: publish
    };

    try {
        let result;
        if (editingEventId) {
            result = await Events.update(editingEventId, eventData);
        } else {
            result = await Events.create(eventData);
        }
        if (result.ok) {
            showToast(editingEventId ? 'Evento actualizado exitosamente' : 'Evento creado exitosamente', 'success');
            setTimeout(() => { window.location.href = '/assets/DashboardOrganizer.html'; }, 1500);
        } else {
            showToast(result.data?.error || 'Error al guardar evento', 'error');
        }
    } catch (err) {
        showToast('Error de conexión al guardar evento', 'error');
    }
}

async function loadEventForEdit(eventId) {
    try {
        const result = await Events.getById(eventId);
        const event = result.evento;
        if (!event) return;

        document.getElementById('eventName').value = event.name || '';
        document.getElementById('eventCategory').value = event.category || '';
        if (event.eventDateTime) {
            document.getElementById('eventDate').value = event.eventDateTime.substring(0, 16);
        }
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventVenue').value = event.venueName || '';
        document.getElementById('eventAddress').value = event.address || '';
        document.getElementById('eventCity').value = event.city || '';
        document.getElementById('eventBannerUrl').value = event.bannerUrl || '';
        if (event.bannerUrl) document.getElementById('bannerImage').src = event.bannerUrl;
        document.getElementById('eventSpotify').value = event.spotifyUrl || '';
        document.getElementById('eventInstagram').value = event.instagramUrl || '';

        if (event.tickets && event.tickets.length > 0) {
            const container = document.getElementById('ticketsContainer');
            container.innerHTML = '';
            event.tickets.forEach(t => {
                const row = document.createElement('div');
                row.className = 'ticket-row grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-surface-container-low rounded-xl relative overflow-hidden group';
                row.innerHTML = `
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all"></div>
                    <div class="space-y-2">
                        <label>Tipo</label>
                        <input class="ticket-type" type="text" value="${escapeHtml(t.type)}" />
                    </div>
                    <div class="space-y-2">
                        <label>Precio</label>
                        <input class="ticket-price" type="number" step="0.01" value="${t.price}" />
                    </div>
                    <div class="space-y-2">
                        <label>Capacidad</label>
                        <input class="ticket-capacity" type="number" value="${t.capacity}" />
                    </div>
                    <div class="flex items-center justify-end gap-4">
                        <span class="material-symbols-outlined text-secondary cursor-pointer hover:text-error transition-colors delete-ticket">delete</span>
                    </div>
                `;
                container.appendChild(row);
                row.querySelector('.delete-ticket')?.addEventListener('click', function() {
                    if (document.querySelectorAll('.ticket-row').length > 1) {
                        row.remove();
                    } else {
                        showToast('Debe haber al menos un tipo de entrada', 'error');
                    }
                });
            });
        }

        document.querySelector('.font-label').textContent = `Editando: ${event.name}`;
        document.getElementById('saveEventBtn').textContent = 'Actualizar Evento';
    } catch (err) {
        showToast('Error al cargar evento para editar', 'error');
    }
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
