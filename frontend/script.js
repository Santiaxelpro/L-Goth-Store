/* ============================================================
   L-GOTH STORE — SPA SCRIPT (Módulo ES)
   Alto rendimiento · Event delegation · Lazy loading · WCAG 2.1 AA
   Zero framework overhead · requestIdleCallback · IntersectionObserver
   ============================================================ */

import { getProductos } from './src/utils/api.js';

/* ---------- DOM Helpers ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* throttle using rAF for scroll/resize */
function throttle(fn) {
  let pending = false;
  let lastArgs;
  return function (...args) {
    lastArgs = args;
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        fn(...lastArgs);
        pending = false;
      });
    }
  };
}

/* debounce for input events */
function debounce(fn, ms = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- Toast Notification ---------- */
function showToast(message, type = 'success', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.animation = 'none';
    void toast.offsetHeight;
    toast.style.animation = '';
  });

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
function initNavigation() {
  const sections = $$('.section');
  const navLinks = $$('.nav-link[data-section]');
  const siteNav = document.getElementById('siteNav');
  const menuToggle = document.getElementById('menuToggle');

  function activateSection(sectionId) {
    sections.forEach(s => s.classList.toggle('active', s.id === sectionId));
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });
    if (siteNav) siteNav.classList.remove('open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link[data-section]');
    if (link) {
      e.preventDefault();
      const sectionId = link.dataset.section;
      if (sectionId) activateSection(sectionId);
    }
  }, { passive: false });

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
      );
    });

    document.addEventListener('click', (e) => {
      if (
        siteNav.classList.contains('open') &&
        !siteNav.contains(e.target) &&
        e.target !== menuToggle &&
        !menuToggle.contains(e.target)
      ) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
      }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        menuToggle.focus();
      }
    });
  }
}

/* ============================================================
   PRODUCT CATALOG
   ============================================================ */
function initCatalog() {
  const grid = document.getElementById('productosGrid');
  const skeleton = document.getElementById('productosSkeleton');
  const emptyState = document.getElementById('emptyState');
  const filterContainer = $('.filters');

  if (!grid) return;

  let todosLosProductos = [];
  let activeCategory = 'todos';
  let abortController = null;

  const imageObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }
          imageObserver.unobserve(img);
        }
      }
    },
    { rootMargin: '250px' }
  );

  const cardObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeSlideIn 0.45s cubic-bezier(0.19, 1, 0.22, 1) both';
          cardObserver.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '100px' }
  );

  function buildImageUrl(producto) {
    if (producto.imagen) return `/api/imagenes/${producto.imagen}`;
    if (producto.images && producto.images[0]) {
      const img = producto.images[0];
      return img.startsWith('http') ? img : `/api/imagenes/${img}`;
    }
    return (
      'data:image/svg+xml,' +
      '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22%3E' +
      '%3Crect fill=%22%231a1a28%22 width=%22300%22 height=%22400%22 rx=%228%22/%3E' +
      '%3Ctext fill=%22%23555%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2213%22%3E' +
      'Sin imagen%3C/text%3E%3C/svg%3E'
    );
  }

  function formatPrice(precioRaw) {
    if (precioRaw == null) return 'Consultar';
    const num = Number(precioRaw);
    if (isNaN(num)) return 'Consultar';
    return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function renderProductos(categoria) {
    if (abortController) abortController.abort();

    const filtrados =
      categoria === 'todos'
        ? todosLosProductos
        : todosLosProductos.filter(p => {
            const cat = p.categoria || p.category || '';
            return cat.toLowerCase() === categoria.toLowerCase();
          });

    if (filtrados.length === 0) {
      grid.innerHTML = '';
      grid.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.classList.remove('hidden');

    const fragment = document.createDocumentFragment();

    filtrados.forEach(producto => {
      const nombre = producto.nombre || producto.name || 'Sin nombre';
      const precioRaw =
        producto.precio != null
          ? producto.precio
          : producto.current_price != null
            ? producto.current_price
            : null;
      const precioAnterior =
        producto.precio_anterior != null
          ? producto.precio_anterior
          : producto.previous_price != null
            ? producto.previous_price
            : null;
      const precio = formatPrice(precioRaw);
      const categoriaTexto = producto.categoria || producto.category || 'General';
      const descripcion = producto.descripcion || producto.description || '';
      const imagenSrc = buildImageUrl(producto);
      const altText = descripcion || nombre;
      const esNuevo = producto.nuevo || producto.new || false;

      const card = document.createElement('article');
      card.className = 'producto-card';
      card.style.opacity = '0';

      const imgContainer = document.createElement('div');
      imgContainer.className = 'producto-img-container';

      if (esNuevo) {
        const badge = document.createElement('span');
        badge.className = 'producto-badge';
        badge.textContent = 'Nuevo';
        badge.setAttribute('aria-label', 'Producto nuevo');
        imgContainer.appendChild(badge);
      }

      const img = document.createElement('img');
      img.className = 'producto-img';
      img.dataset.src = imagenSrc;
      img.alt = altText;
      img.width = 300;
      img.height = 400;
      img.loading = 'lazy';
      imageObserver.observe(img);

      imgContainer.appendChild(img);

      const info = document.createElement('div');
      info.className = 'producto-info';

      const catEl = document.createElement('p');
      catEl.className = 'producto-categoria';
      catEl.textContent = categoriaTexto;

      const nameEl = document.createElement('h3');
      nameEl.className = 'producto-nombre';
      nameEl.textContent = nombre;

      if (descripcion) {
        const descEl = document.createElement('p');
        descEl.className = 'producto-descripcion';
        descEl.textContent = descripcion;
        info.appendChild(descEl);
      }

      const priceEl = document.createElement('p');
      priceEl.className = 'producto-precio';
      priceEl.textContent = precio;

      if (precioAnterior && Number(precioAnterior) > 0) {
        const anteriorEl = document.createElement('span');
        anteriorEl.className = 'producto-precio-anterior';
        anteriorEl.textContent = formatPrice(precioAnterior);
        priceEl.appendChild(anteriorEl);
      }

      const btn = document.createElement('button');
      btn.className = 'producto-btn';
      btn.textContent = 'Ver Detalle';
      btn.setAttribute('aria-label', `Ver detalle de ${nombre}`);
      btn.addEventListener('click', () => {
        showToast(`Próximamente: vista detallada de "${nombre}"`, 'success', 3000);
      });

      info.appendChild(catEl);
      info.appendChild(nameEl);
      info.appendChild(priceEl);
      info.appendChild(btn);

      card.appendChild(imgContainer);
      card.appendChild(info);
      fragment.appendChild(card);

      cardObserver.observe(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);

    requestAnimationFrame(() => {
      grid.querySelectorAll('.producto-card').forEach(card => {
        card.style.opacity = '';
      });
    });
  }

  async function cargarProductos() {
    if (skeleton) skeleton.classList.remove('hidden');

    try {
      abortController = new AbortController();
      const data = await getProductos({ signal: abortController.signal });
      todosLosProductos = Array.isArray(data)
        ? data
        : data.productos || data.data || [];
      renderProductos(activeCategory);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error cargando productos:', err);
      grid.innerHTML =
        '<p class="empty-state" role="alert">No se pudieron cargar los productos. Intenta recargar la página.</p>';
      grid.classList.remove('hidden');
    } finally {
      if (skeleton) skeleton.classList.add('hidden');
    }
  }

  if (filterContainer) {
    filterContainer.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      $$('.filter-btn', filterContainer).forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      activeCategory = btn.dataset.categoria || 'todos';
      renderProductos(activeCategory);
    });

    filterContainer.addEventListener('keydown', e => {
      const btns = $$('.filter-btn', filterContainer);
      const current = document.activeElement;
      const idx = btns.indexOf(current);
      if (e.key === 'ArrowRight' && idx < btns.length - 1) {
        e.preventDefault();
        btns[idx + 1].focus();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        btns[idx - 1].focus();
      }
    });
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => cargarProductos(), { timeout: 2000 });
  } else {
    setTimeout(cargarProductos, 100);
  }
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contactoForm');
  const feedback = document.getElementById('formFeedback');

  if (!form) return;

  const showFeedback = (message, type) => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `form-feedback ${type}`;
    feedback.classList.remove('hidden');
    feedback.setAttribute('role', 'alert');
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      if (feedback.textContent === message) {
        feedback.classList.add('hidden');
      }
    }, 6000);
  };

  const submitDebounced = debounce(async formData => {
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (res.ok) {
        showFeedback(json.mensaje || 'Mensaje enviado con éxito.', 'success');
        showToast('Mensaje enviado correctamente', 'success');
        form.reset();
      } else {
        showFeedback(json.mensaje || 'Error al enviar el mensaje.', 'error');
      }
    } catch {
      showFeedback('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error');
    }
  }, 500);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    submitDebounced(formData);
  });

  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('invalid', () => {
      input.setAttribute('aria-invalid', 'true');
    });
    input.addEventListener('input', () => {
      if (input.validity.valid) {
        input.removeAttribute('aria-invalid');
      }
    });
  });
}

/* ============================================================
   PERFORMANCE: content-visibility for off-screen sections
   ============================================================ */
function initContentVisibility() {
  const style = document.documentElement.style;
  if (!('contentVisibility' in style)) return;

  const sectionObserver = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        entry.target.style.contentVisibility = entry.isIntersecting
          ? 'visible'
          : 'auto';
      }
    },
    { rootMargin: '400px' }
  );

  $$('.section').forEach(s => sectionObserver.observe(s));
}

/* ============================================================
   INIT
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

function init() {
  initNavigation();

  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        initCatalog();
        initContactForm();
        initContentVisibility();
      },
      { timeout: 3000 }
    );
  } else {
    initCatalog();
    initContactForm();
    initContentVisibility();
  }
}
