// Simulación de búsqueda (puedes conectarlo luego a backend)

document.querySelector(".support-search").addEventListener("submit", (e) => {
  e.preventDefault();

  const value = document.querySelector(".support-search input").value;

  if (value.trim() === "") {
    Toast.warning('Búsqueda vacía', 'Escribe algo para buscar');
    return;
  }

  Toast.info('Buscando', 'Resultados para: ' + value);
});