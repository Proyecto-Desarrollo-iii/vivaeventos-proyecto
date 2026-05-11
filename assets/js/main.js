const CATEGORY_MAP = {
  'Concierto': 'musica',
  'Taller': 'arte',
  'Feria': 'networking',
  'Conferencia': 'networking'
};

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  try {
    const result = await api.get('/events');
    const eventos = result.data?.eventos || [];

    eventos.forEach(event => {
      const card = document.createElement('div');
      const cat = CATEGORY_MAP[event.category] || 'musica';
      card.className = 'card';
      card.dataset.category = cat;

      const banner = event.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819';
      const dateStr = event.eventDateTime ? new Date(event.eventDateTime).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '';

      card.innerHTML = `
        <img src="${banner}" alt="${event.name}" loading="lazy">
        <div class="card-content">
          <span class="card-tag">${event.category || ''}</span>
          <h3>${event.name}</h3>
          <p>${event.venueName ? event.venueName + (dateStr ? ' • ' + dateStr : '') : dateStr}</p>
          <div class="card-footer">
            <a href="/assets/Event.html?id=${event.id}" class="btn btn-sm">Ver más</a>
          </div>
        </div>
      `;
      grid.insertBefore(card, grid.querySelector('.highlight'));
    });

    initFilters();
  } catch (err) {
    console.error('Error loading events:', err);
  }
});

// Hero Carousel
const heroCard = document.getElementById('heroCard');
const heroInners = document.querySelectorAll('.hero-image-inner');
let currentHeroIndex = 0;
let isFlipping = false;
const totalHeroCards = heroInners.length;

function flipToNextCard() {
  if (isFlipping || !heroCard) return;
  isFlipping = true;
  
  const nextIndex = (currentHeroIndex + 1) % totalHeroCards;
  
  heroCard.classList.add('flipping');
  
  setTimeout(() => {
    heroInners.forEach((inner, i) => {
      inner.style.display = i === nextIndex ? 'block' : 'none';
    });
    
    currentHeroIndex = nextIndex;
    heroCard.classList.remove('flipping');
    
    setTimeout(() => {
      isFlipping = false;
    }, 800);
  }, 400);
}

function flipToPrevCard() {
  if (isFlipping || !heroCard) return;
  isFlipping = true;
  
  const prevIndex = (currentHeroIndex - 1 + totalHeroCards) % totalHeroCards;
  
  heroCard.classList.add('flipping-back');
  
  setTimeout(() => {
    heroInners.forEach((inner, i) => {
      inner.style.display = i === prevIndex ? 'block' : 'none';
    });
    
    currentHeroIndex = prevIndex;
    heroCard.classList.remove('flipping-back');
    
    setTimeout(() => {
      isFlipping = false;
    }, 800);
  }, 400);
}

if (heroCard && heroInners.length > 0) {
  setInterval(flipToNextCard, 5000);
}

function initFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll(".cards .card:not(.highlight)");

      cards.forEach(card => {
        const category = card.dataset.category;
        if (filter === "todos" || category === filter) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
}

// Barra de búsqueda
const searchInput = document.getElementById('searchInput');
const searchBtn = document.querySelector('.search-btn');

if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      console.log('Buscando:', query);
      // Aquí puedes agregar la lógica de búsqueda
      alert('Búsqueda: ' + query);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        console.log('Buscando:', query);
        alert('Búsqueda: ' + query);
      }
    }
  });
}