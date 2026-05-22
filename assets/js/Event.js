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
        const ticket = currentEvent?.tickets?.find(t => t.id === (selectedTicketId || currentEvent?.tickets?.[0]?.id));
        const max = ticket ? (ticket.capacity - ticket.soldCount) : 999;
        if (cantidad < max) { cantidad++; actualizarTotal(); }
        else { showToast('No hay más boletas disponibles', 'info'); }
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

        const locationAddress = document.getElementById('location-address');
        if (locationAddress) {
            locationAddress.textContent = [event.address, event.city].filter(Boolean).join(', ') || '';
        }

        const mapsIframe = document.getElementById('event-map-iframe');
        if (mapsIframe && event.mapsEmbedUrl) {
            mapsIframe.src = event.mapsEmbedUrl;
            mapsIframe.parentElement.style.display = '';
        } else if (mapsIframe) {
            mapsIframe.parentElement.style.display = 'none';
        }

        const howSection = document.getElementById('how');
        if (howSection) {
            howSection.style.display = event.mapsEmbedUrl ? '' : 'none';
        }

        const spotifyContainer = document.getElementById('spotify-container');
        if (spotifyContainer) {
            const spotifyEmbed = document.getElementById('spotify-embed');
            if (spotifyEmbed && event.spotifyUrl) {
                const playlistId = event.spotifyUrl.split('/').pop()?.split('?')[0];
                if (playlistId) {
                    spotifyEmbed.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
                }
                spotifyContainer.style.display = '';
            } else {
                spotifyContainer.style.display = 'none';
            }
        }

        const socialGrid = document.getElementById('social-links-grid');
        if (socialGrid) {
            let links = [];
            if (event.socialLinks) {
                try { links = JSON.parse(event.socialLinks); } catch (e) {}
            }
            if (links.length > 0) {
                socialGrid.innerHTML = links.map(s => {
                    const icon = getSocialIcon(s.platform);
                    return `
                        <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="social-link-btn" title="${escapeHtml(s.platform)}">
                            ${icon}
                        </a>
                    `;
                }).join('');
                socialGrid.style.display = '';
            } else {
                socialGrid.style.display = 'none';
            }
        }

        const listenSection = document.getElementById('listen');
        if (listenSection) {
            const hasSpotify = spotifyContainer && spotifyContainer.style.display !== 'none';
            const hasSocial = socialGrid && socialGrid.style.display !== 'none';
            listenSection.style.display = (hasSpotify || hasSocial) ? '' : 'none';
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
    const disponibles = ticket.capacity - ticket.soldCount;
    if (cantidad > disponibles) {
        showToast(`Solo hay ${disponibles} boletas disponibles`, 'error');
        return;
    }
    window.location.href = `/assets/payment.html?eventId=${currentEvent.id}&ticketId=${selectedTicketId}&type=${encodeURIComponent(ticket.type)}&cantidad=${cantidad}&total=${(ticket.price * cantidad).toFixed(2)}`;
}

function getSocialIcon(platform) {
    const p = (platform || '').toLowerCase();
    if (p.includes('facebook')) {
        return '<svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';
    }
    if (p.includes('instagram')) {
        return '<svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>';
    }
    if (p.includes('twitter') || p.includes('x')) {
        return '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.178 17.96h2.105L7.398 4.174H5.15z"/></svg>';
    }
    if (p.includes('tiktok')) {
        return '<svg viewBox="0 0 24 24"><path d="M16.6 5.82S16.64 2 16.64 2h-3.9v12.83a2.75 2.75 0 1 1-2.75-2.75c.23 0 .45.03.66.08V8.17a6.66 6.66 0 1 0 7.6 6.55V5.82z"/></svg>';
    }
    if (p.includes('youtube')) {
        return '<svg viewBox="0 0 24 24"><path d="M19.6 5.3a2.5 2.5 0 0 1 1.8 1.8C22 9 22 12 22 12s0 3-.6 4.9a2.5 2.5 0 0 1-1.8 1.8C17.7 19 12 19 12 19s-5.7 0-7.6-.3a2.5 2.5 0 0 1-1.8-1.8C2 15 2 12 2 12s0-3 .6-4.9a2.5 2.5 0 0 1 1.8-1.8C6.3 5 12 5 12 5s5.7 0 7.6.3z"/><polygon points="10 8.48 16 12 10 15.52" fill="#fff"/></svg>';
    }
    if (p.includes('spotify')) {
        return '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.46c-.19.3-.57.4-.87.2-2.37-1.45-5.36-1.78-8.87-.98-.35.08-.69-.13-.77-.48-.08-.35.13-.69.48-.77 3.83-.87 7.12-.48 9.76 1.18.3.18.4.57.2.87zm1.24-2.76c-.24.36-.73.5-1.09.26-2.71-1.66-6.84-2.14-10.04-1.17-.39.12-.81-.1-.93-.49s.1-.81.49-.93c3.65-1.1 8.2-.56 11.31 1.36.36.22.5.71.26 1.07zm.1-2.88c-3.25-1.93-8.6-2.11-11.7-1.17-.47.14-.97-.12-1.11-.58-.14-.47.12-.97.58-1.11 3.55-1.07 9.4-.86 13.11 1.35.43.26.57.82.31 1.25-.26.43-.82.57-1.25.31z"/></svg>';
    }
    if (p.includes('linkedin')) {
        return '<svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-1 14v-5.5a3.5 3.5 0 0 0-3.5-3.5c-1 0-2 .5-2.5 1.3V8H9v9h3v-5.2a1.8 1.8 0 0 1 1.8-1.8c1 0 1.8.8 1.8 1.8V17h3zM6.5 7A1.5 1.5 0 1 0 6.5 4 1.5 1.5 0 0 0 6.5 7zM5 17h3V8H5v9z"/></svg>';
    }
    if (p.includes('whatsapp')) {
        return '<svg viewBox="0 0 24 24"><path d="M17.5 14.3c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.2-.8.9-1 1.1-.2.2-.3.2-.6.1-1.1-.5-2-1.1-2.8-1.9-.2-.2-.2-.5-.1-.6l.6-.7.4-.5-.2-.5c-.4-1-.7-2-.9-3.1 0-.3 0-.5.2-.6l1-.8c.2-.2.3-.5.2-.8-.1-.3-.8-2.1-1-2.6-.3-.6-.6-.7-1-.7h-.5c-.3 0-.8.1-1.2.6-.4.4-1.5 1.5-1.5 3.6s1.6 4.2 1.8 4.5c.2.3 3.1 4.8 7.6 6.2 1.1.3 1.9.2 2.6.1.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.5-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 2.1.6 4 1.7 5.6L2.3 21l3.6-1.3C7.4 20.9 9.6 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.8 0-3.5-.6-5-1.6l-.4-.2-2.2.8.8-2.1-.2-.4C4.6 15.8 4 14 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"/></svg>';
    }
    if (p.includes('telegram')) {
        return '<svg viewBox="0 0 24 24"><path d="M9.78 18.65l.48-4.92 8.88-8.07c.37-.34-.02-.5-.57-.22L7.05 13.17l-4.69-1.47c-1-.32-1-.99.22-1.47l18.4-7.1c.83-.34 1.63.2 1.34 1.47l-3.12 14.7c-.24 1.1-.87 1.36-1.77.85l-4.87-3.6-2.35 2.27c-.27.26-.5.5-1.02.5z"/></svg>';
    }
    if (p.includes('twitch')) {
        return '<svg viewBox="0 0 24 24"><path d="M3.5 2L2 5.5V20h5.5v3h3l3-3h4l5-5V2H3.5zm16 12.5l-3 3H11l-3 3v-3H5V4h14.5v10.5zM10 8v5H8V8h2zm6 0v5h-2V8h2z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
