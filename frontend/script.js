document.addEventListener('DOMContentLoaded', () => {
  const backendUrl = 'https://tu-backend.onrender.com'; // Reemplaza con tu URL de Render
  let products = [];
  const grid = document.getElementById('products-grid');

  // Función para renderizar productos
  function renderProducts() {
    if (!grid) return;
    grid.innerHTML = ''; // Limpiar cuadrícula antes de renderizar
    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.id = `product-${index}`;

      const discount = product.previous_price > product.current_price
        ? Math.round(((product.previous_price - product.current_price) / product.previous_price) * 100)
        : 0;

      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';

      const img = document.createElement('img');
      img.className = 'product-image';
      img.src = product.images[0];
      img.alt = product.name;

      imageContainer.appendChild(img);

      if (product.images.length > 1) {
        const prevButton = document.createElement('button');
        prevButton.className = 'carousel-button prev';
        prevButton.innerHTML = '&lt;';
        prevButton.addEventListener('click', () => changeImage(index, -1));

        const nextButton = document.createElement('button');
        nextButton.className = 'carousel-button next';
        nextButton.innerHTML = '&gt;';
        nextButton.addEventListener('click', () => changeImage(index, 1));

        imageContainer.appendChild(prevButton);
        imageContainer.appendChild(nextButton);
      }

      const name = document.createElement('h2');
      name.className = 'product-name';
      name.textContent = product.name;

      const currentPrice = document.createElement('p');
      currentPrice.className = 'current-price';
      currentPrice.textContent = `${product.currency} ${product.current_price.toFixed(2)}`;

      const previousPrice = document.createElement('p');
      previousPrice.className = 'previous-price';
      previousPrice.textContent = `${product.currency} ${product.previous_price.toFixed(2)}`;

      const discountElement = document.createElement('p');
      discountElement.className = 'discount';
      discountElement.textContent = discount > 0 ? `-${discount}% OFF` : '';

      const description = document.createElement('p');
      description.className = 'description';
      description.textContent = product.description || '';

      card.appendChild(imageContainer);
      card.appendChild(name);
      card.appendChild(currentPrice);
      card.appendChild(previousPrice);
      if (discount > 0) card.appendChild(discountElement);
      if (product.description) card.appendChild(description);

      grid.appendChild(card);

      card.dataset.images = JSON.stringify(product.images);
      card.dataset.currentIndex = '0';
    });
  }

  // Cargar productos del backend
  function loadProducts() {
    fetch(`${backendUrl}/products`)
      .then(response => response.json())
      .then(data => {
        products = data;
        renderProducts();
      })
      .catch(error => console.error('Error al cargar productos:', error));
  }

  // Recargar productos cada 5 segundos
  setInterval(loadProducts, 5000);

  loadProducts();

  function changeImage(productIndex, direction) {
    const card = document.getElementById(`product-${productIndex}`);
    if (!card) return;

    const images = JSON.parse(card.dataset.images);
    let currentIndex = parseInt(card.dataset.currentIndex);
    currentIndex = (currentIndex + direction + images.length) % images.length;

    const img = card.querySelector('.product-image');
    if (img) {
      img.src = images[currentIndex];
      card.dataset.currentIndex = currentIndex.toString();
    }
  }
});