// Filtros activos
const buttons = document.querySelectorAll(".filters button");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filters .active").classList.remove("active");
    btn.classList.add("active");
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