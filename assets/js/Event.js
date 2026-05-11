const event = {
    title: "Ed Sheeran",
    location: "Bogotá, Colombia",
    date: "Oct 24 - 26, 2024",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    spotify: "https://open.spotify.com/playlist/0C8qM17KlmoQCDApCbUSyC?si=afc1c3ab42f9411b",
    venue: "Estadio El Campín",
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39798.47379149456!2d-74.09061337783464!3d4.6483249422246895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f5c4c1e2b1f1b%3A0x8c2b1d5f9e8b1f1b!2sEstadio%20El%20Camp%C3%ADn!5e0!3m2!1ses!2sco!4v1672531200000!5m2!1ses!2sco",
    mapsLink: "https://www.google.com/maps/search/?api=1&query=Estadio+El+Campin+Bogota"
    
};

const precios = {
    general: 89000,
    vip: 159000
};

let tipoSeleccionado = 'general';
let cantidad = 1;

function loadEvent(event) {
    document.getElementById('event-image').src = event.image;
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-date').textContent = event.date;
    document.getElementById('event-location').textContent = event.location;
    document.getElementById('event-description').textContent = event.description;
    
    const spotifyEmbed = document.getElementById('spotify-embed');
    const playlistId = event.spotify.split('/').pop().split('?')[0];
    spotifyEmbed.src = `https://open.spotify.com/embed/playlist/${playlistId}`;

    document.getElementById('event-map-iframe').src = event.mapsEmbed;
    document.getElementById('maps-link').href = event.mapsLink;
    document.getElementById('venue-name').textContent = event.venue;

    const eventDetail = document.getElementById('event-detail');
    if (eventDetail) {
        eventDetail.classList.remove('hidden');
    }
}

function actualizarTotal() {
    const total = precios[tipoSeleccionado] * cantidad;
    document.querySelector('.total h2').textContent = '$' + total.toLocaleString();
    document.querySelector('.qty-controls span').textContent = cantidad;
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvent(event);
    actualizarTotal();

    // Event listeners para tipo de ticket
    document.querySelectorAll('input[name="ticket"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            tipoSeleccionado = e.target.value;
            actualizarTotal();
        });
    });

    // Event listeners para cantidad
    const btnMenos = document.querySelector('.qty-controls button:first-child');
    const btnMas = document.querySelector('.qty-controls button:last-child');

    btnMenos.addEventListener('click', () => {
        if (cantidad > 1) {
            cantidad--;
            actualizarTotal();
        }
    });

    btnMas.addEventListener('click', () => {
        cantidad++;
        actualizarTotal();
    });

    // Event listener para comprar
    document.querySelector('.buy-btn').addEventListener('click', () => {
        const total = precios[tipoSeleccionado] * cantidad;
        window.location.href = `payment.html?tipo=${tipoSeleccionado}&cantidad=${cantidad}&total=${total}`;
    });
});