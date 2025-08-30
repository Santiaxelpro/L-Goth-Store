document.addEventListener('DOMContentLoaded', () => {
  const backendUrl = 'https://tu-backend.onrender.com'; // Reemplaza con tu URL de Render
  const adminForm = document.getElementById('admin-form');
  const addProductBtn = document.getElementById('add-product-btn');
  const editPriceBtn = document.getElementById('edit-price-btn');
  const editImageBtn = document.getElementById('edit-image-btn');
  let products = [];

  // Cargar productos del backend
  fetch(`${backendUrl}/products`)
    .then(response => response.json())
    .then(data => {
      products = data;
    })
    .catch(error => console.error('Error al cargar productos:', error));

  // Mostrar formulario para agregar producto
  addProductBtn.addEventListener('click', () => {
    adminForm.innerHTML = `
      <label for="product-name">Nombre:</label>
      <input type="text" id="product-name" required>
      <label for="current-price">Precio Actual:</label>
      <input type="number" id="current-price" step="0.01" required>
      <label for="previous-price">Precio Anterior:</label>
      <input type="number" id="previous-price" step="0.01" required>
      <label for="currency">Moneda:</label>
      <select id="currency">
        <option value="PEN">PEN</option>
        <option value="USD">USD</option>
      </select>
      <label for="description">Descripción:</label>
      <input type="text" id="description">
      <label for="image-file">Subir Imagen:</label>
      <input type="file" id="image-file" accept="image/*" required>
      <button onclick="saveProduct()">Guardar</button>
    `;
  });

  // Mostrar formulario para cambiar precio
  editPriceBtn.addEventListener('click', () => {
    if (products.length === 0) {
      adminForm.innerHTML = '<p>No hay productos para editar.</p>';
      return;
    }
    const productSelect = products.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
    adminForm.innerHTML = `
      <label for="product-select">Selecciona Producto:</label>
      <select id="product-select">${productSelect}</select>
      <label for="new-current-price">Nuevo Precio Actual:</label>
      <input type="number" id="new-current-price" step="0.01" required>
      <label for="new-previous-price">Nuevo Precio Anterior:</label>
      <input type="number" id="new-previous-price" step="0.01" required>
      <button onclick="savePrice()">Guardar Cambios</button>
    `;
  });

  // Mostrar formulario para cambiar imagen
  editImageBtn.addEventListener('click', () => {
    if (products.length === 0) {
      adminForm.innerHTML = '<p>No hay productos para editar.</p>';
      return;
    }
    const productSelect = products.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
    adminForm.innerHTML = `
      <label for="product-select">Selecciona Producto:</label>
      <select id="product-select">${productSelect}</select>
      <label for="image-file">Subir Nueva Imagen:</label>
      <input type="file" id="image-file" accept="image/*" required>
      <button onclick="saveImage()">Guardar Cambio</button>
    `;
  });

  // Funciones de guardado enviando al backend
  window.saveProduct = () => {
    const imageFile = document.getElementById('image-file').files[0];
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const newProduct = {
          name: document.getElementById('product-name').value,
          current_price: parseFloat(document.getElementById('current-price').value),
          previous_price: parseFloat(document.getElementById('previous-price').value),
          currency: document.getElementById('currency').value,
          description: document.getElementById('description').value || '',
          images: [e.target.result] // Base64 para imagen local
        };
        fetch(`${backendUrl}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) alert('Producto agregado, los cambios se reflejarán en la página principal.');
          else alert('Error al agregar producto.');
        })
        .catch(error => console.error('Error en la solicitud:', error));
        adminForm.innerHTML = '';
      };
      reader.readAsDataURL(imageFile);
    }
  };

  window.savePrice = () => {
    const index = document.getElementById('product-select').value;
    const updatedProduct = {
      index: parseInt(index),
      current_price: parseFloat(document.getElementById('new-current-price').value),
      previous_price: parseFloat(document.getElementById('new-previous-price').value)
    };
    fetch(`${backendUrl}/update-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) alert('Precios actualizados, los cambios se reflejarán en la página principal.');
      else alert('Error al actualizar precios.');
    })
    .catch(error => console.error('Error en la solicitud:', error));
    adminForm.innerHTML = '';
  };

  window.saveImage = () => {
    const index = document.getElementById('product-select').value;
    const imageFile = document.getElementById('image-file').files[0];
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const updatedProduct = {
          index: parseInt(index),
          images: [e.target.result]
        };
        fetch(`${backendUrl}/update-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) alert('Imagen actualizada, los cambios se reflejarán en la página principal.');
          else alert('Error al actualizar imagen.');
        })
        .catch(error => console.error('Error en la solicitud:', error));
        adminForm.innerHTML = '';
      };
      reader.readAsDataURL(imageFile);
    }
  };
});