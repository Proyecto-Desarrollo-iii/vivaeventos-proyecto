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

// Filtros de categorías
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".cards .card:not(.highlight)");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

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