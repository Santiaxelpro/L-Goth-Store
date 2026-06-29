import DOMPurify from 'dompurify';

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html);
}

export function validateProductData(data) {
  const errors = [];

  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  if (data.nombre && data.nombre.length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }
  if (!data.precio || isNaN(parseFloat(data.precio)) || parseFloat(data.precio) <= 0) {
    errors.push('El precio debe ser un número mayor a 0');
  }
  if (!data.categoria) {
    errors.push('Debe seleccionar una categoría');
  }
  if (data.stock !== '' && (isNaN(parseInt(data.stock)) || parseInt(data.stock) < 0)) {
    errors.push('El stock debe ser un número mayor o igual a 0');
  }

  return errors;
}

export function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return 'Formato de imagen no permitido. Use JPEG, PNG, WebP o GIF.';
  }

  if (file.size > maxSize) {
    return 'La imagen excede el tamaño máximo de 10MB.';
  }

  if (file.size === 0) {
    return 'El archivo está vacío.';
  }

  return null;
}

export function rateLimit(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    return fn.apply(this, args);
  };
}
