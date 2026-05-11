let currentEvent = null;
let selectedTicketId = null;
let cantidad = 1;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    if (eventId) {
        loadEvent(eventId);
    } else {
        document.getElementById('event-title').textContent = 'Evento no encontrado';
    }

    document.getElementById('qty-minus')?.addEventListener('click', () => {
        if (cantidad > 1) { cantidad--; actualizarTotal(); }
    });
    document.getElementById('qty-plus')?.addEventListener('click', () => {
        cantidad++; actualizarTotal();
    });
    document.getElementById('buy-btn')?.addEventListener('click', comprar);
});

async function loadEvent(eventId) {
    try {
        const result = await Events.getById(eventId);
        const event = result.evento;
        if (!event) return;
        currentEvent = event;

        document.getElementById('event-image').src = event.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819';
        document.getElementById('event-title').textContent = event.name || 'Sin nombre';
        document.getElementById('event-date').textContent = event.eventDateTime ? new Date(event.eventDateTime).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        document.getElementById('event-location').textContent = [event.city, event.location].filter(Boolean).join(', ') || 'Ubicación no especificada';
        document.getElementById('event-description').textContent = event.description || '';

        const venueName = document.getElementById('venue-name');
        if (venueName) venueName.textContent = event.venueName || '';

        const mapsIframe = document.getElementById('event-map-iframe');
        if (mapsIframe && event.mapsEmbedUrl) {
            mapsIframe.src = event.mapsEmbedUrl;
            mapsIframe.parentElement.style.display = '';
        } else if (mapsIframe) {
            mapsIframe.parentElement.style.display = 'none';
        }

        const mapsLink = document.getElementById('maps-link');
        if (mapsLink && event.mapsLinkUrl) {
            mapsLink.href = event.mapsLinkUrl;
        }

        const spotifyEmbed = document.getElementById('spotify-embed');
        if (spotifyEmbed && event.spotifyUrl) {
            const playlistId = event.spotifyUrl.split('/').pop()?.split('?')[0];
            if (playlistId) {
                spotifyEmbed.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
            }
            spotifyEmbed.parentElement.style.display = '';
        } else if (spotifyEmbed) {
            spotifyEmbed.parentElement.style.display = 'none';
        }

        renderTickets(event.tickets || []);
    } catch (err) {
        console.error('Error loading event:', err);
        document.getElementById('event-title').textContent = 'Error al cargar evento';
    }
}

function renderTickets(tickets) {
    const container = document.getElementById('tickets-container');
    if (!container) return;
    if (tickets.length === 0) {
        container.innerHTML = '<p class="text-secondary">No hay entradas disponibles</p>';
        return;
    }
    container.innerHTML = tickets.map((t, i) => `
        <label class="ticket-option">
            <input type="radio" name="ticket" value="${t.id}" ${i === 0 ? 'checked' : ''}>
            <div class="ticket-info">
                <strong>${t.type}</strong>
                <span>${t.description || ''}</span>
            </div>
            <div class="ticket-price">
                <strong>$${(t.price || 0).toLocaleString()}</strong>
                <span>${t.capacity - t.soldCount} disponibles</span>
            </div>
        </label>
    `).join('');

    container.querySelectorAll('input[name="ticket"]').forEach(radio => {
        radio.addEventListener('change', () => {
            selectedTicketId = radio.value;
            actualizarTotal();
        });
    });

    const firstRadio = container.querySelector('input[name="ticket"]');
    if (firstRadio) {
        firstRadio.checked = true;
        selectedTicketId = firstRadio.value;
    }
    actualizarTotal();
}

function actualizarTotal() {
    if (!currentEvent || !currentEvent.tickets) return;
    const ticket = currentEvent.tickets.find(t => t.id === selectedTicketId);
    if (!ticket) return;
    const total = (ticket.price || 0) * cantidad;
    document.getElementById('ticket-total').textContent = '$' + total.toLocaleString();
    document.getElementById('ticket-quantity').textContent = cantidad;
}

function comprar() {
    const user = AuthService.getUser();
    if (!user) {
        window.location.href = '/auth/login.html';
        return;
    }
    if (!selectedTicketId || !currentEvent) {
        showToast('Selecciona un tipo de entrada', 'error');
        return;
    }
    const ticket = currentEvent.tickets.find(t => t.id === selectedTicketId);
    if (!ticket) return;
    window.location.href = `/assets/payment.html?eventId=${currentEvent.id}&ticketId=${selectedTicketId}&type=${encodeURIComponent(ticket.type)}&cantidad=${cantidad}&total=${(ticket.price * cantidad).toFixed(2)}`;
}

function showToast(message, type) {
    const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-primary' };
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[9999] ${colors[type] || colors.info} text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm transition-all duration-300`;
    toast.style.transform = 'translateX(120%)';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
