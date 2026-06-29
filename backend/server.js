require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const {
  saveImage,
  deleteImage,
  resolveImageUrl,
  downloadFromHf,
  readJsonFile,
  writeJsonFile,
} = require('./services/storageService');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/authenticateToken');
const { csrfProtection, csrfTokenRoute } = require('./middleware/csrfProtection');
const config = require('./config/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'https://lgoth.qzz.io', 'https://lgoth-store.pages.dev'];

const PRODUCTS_FILE = 'productos.json';
const ORDERS_FILE = 'ordenes.json';

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes, intente de nuevo más tarde.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes de carga.' },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido. Use JPEG, PNG, WebP o GIF.'));
    }
  },
});

app.use(generalLimiter);

// Serve local images (fallback when not using HF)
app.use('/imagenes', express.static(path.join(__dirname, 'Imagenes')));

// CSRF token endpoint
app.get('/csrf-token', csrfTokenRoute);

// ==================== AUTH ROUTES ====================
app.use('/auth', authRoutes);

// ==================== PROTECTED ROUTES ====================

// Legacy login endpoint (removed - use /auth/login)

// Apply CSRF protection to authenticated state-changing routes
app.use(['/add', '/update-price', '/update-image', '/update-stock', '/delete', '/orders'], csrfProtection);

// Helper: read/write products
async function readProducts() {
  return readJsonFile(PRODUCTS_FILE, []);
}

async function writeProducts(products) {
  return writeJsonFile(PRODUCTS_FILE, products);
}

async function readOrders() {
  return readJsonFile(ORDERS_FILE, []);
}

async function writeOrders(orders) {
  return writeJsonFile(ORDERS_FILE, orders);
}

function normalizeOrder(order) {
  const createdAt = order.createdAt || new Date().toISOString();
  const total = Number(order.total || 0);
  const items = Array.isArray(order.items) ? order.items : [];
  const id = order._id || order.orderId || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return {
    _id: id,
    orderId: id,
    customer: order.customer || {},
    items,
    total,
    currency: order.currency || 'PEN',
    paymentMethod: order.paymentMethod || 'pending',
    status: order.status || 'pending',
    createdAt,
    updatedAt: order.updatedAt || createdAt,
  };
}

// Get all products (public)
app.get('/hf-images/*', async (req, res) => {
  try {
    const hfPath = req.params['0'] || req.params[0];
    if (!hfPath) {
      return res.status(400).json({ success: false, message: 'Path required' });
    }

    if (hfPath.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid path' });
    }

    const blob = await downloadFromHf(hfPath);

    if (!blob) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const ext = path.extname(hfPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', contentType);

    const buffer = Buffer.from(await blob.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Error proxying HF image:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching image' });
  }
});

app.get('/products', async (req, res) => {
  try {
    let products = await readProducts();
    products = products.map((product) => ({
      ...product,
      images: Array.isArray(product.images)
        ? product.images.map((img) => resolveImageUrl(img, req))
        : [],
    }));
    res.json(products);
  } catch (err) {
    console.error('Error reading products:', err);
    res.status(500).json({ success: false, message: 'Error al leer productos' });
  }
});

// Add product (authenticated)
app.post('/add', uploadLimiter, authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ninguna imagen' });
    }

    const { url: imageUrl } = await saveImage(req.file);

    const products = await readProducts();
    const newProduct = {
      name: req.body.name,
      current_price: parseFloat(req.body.current_price),
      previous_price: req.body.previous_price ? parseFloat(req.body.previous_price) : null,
      currency: req.body.currency || 'PEN',
      description: req.body.description || '',
      stock: parseInt(req.body.stock) || 0,
      images: [imageUrl],
    };

    products.push(newProduct);
    await writeProducts(products);

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ success: false, message: 'Error al agregar producto' });
  }
});

// Update price (authenticated)
app.post('/update-price', uploadLimiter, authenticateToken, async (req, res) => {
  try {
    const { index, current_price, previous_price } = req.body;

    if (index === undefined || current_price === undefined) {
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    const products = await readProducts();

    if (index < 0 || index >= products.length) {
      return res.status(400).json({ success: false, message: 'Índice de producto inválido' });
    }

    products[index].current_price = parseFloat(current_price);
    products[index].previous_price = previous_price !== undefined ? parseFloat(previous_price) : products[index].previous_price;

    await writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating price:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar precio' });
  }
});

// Update image (authenticated)
app.post('/update-image', uploadLimiter, authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ninguna imagen' });
    }

    const index = parseInt(req.body.index);
    const products = await readProducts();

    if (isNaN(index) || index < 0 || index >= products.length) {
      return res.status(400).json({ success: false, message: 'Índice de producto inválido' });
    }

    if (products[index].images && products[index].images[0]) {
      deleteImage(products[index].images[0]);
    }

    const { url: imageUrl } = await saveImage(req.file);
    products[index].images = [imageUrl];

    await writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating image:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar imagen' });
  }
});

// Update stock (authenticated)
app.post('/update-stock', uploadLimiter, authenticateToken, async (req, res) => {
  try {
    const { index, stock } = req.body;

    if (index === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    const products = await readProducts();

    if (index < 0 || index >= products.length) {
      return res.status(400).json({ success: false, message: 'Índice de producto inválido' });
    }

    products[index].stock = parseInt(stock);

    await writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar stock' });
  }
});

// Delete product (authenticated)
app.post('/delete', uploadLimiter, authenticateToken, async (req, res) => {
  try {
    const index = parseInt(req.body.index);
    const products = await readProducts();

    if (isNaN(index) || index < 0 || index >= products.length) {
      return res.status(400).json({ success: false, message: 'Índice de producto inválido' });
    }

    const removed = products.splice(index, 1)[0];

    if (removed.images) {
      removed.images.forEach((img) => deleteImage(img));
    }

    await writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
});

// Contact form
app.post('/contacto', (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }
    console.log(`Contacto de ${name} <${email}>: ${message}`);
    res.json({ success: true, message: 'Mensaje recibido correctamente.' });
  } catch (err) {
    console.error('Error processing contact:', err);
    res.status(500).json({ success: false, message: 'Error al procesar el mensaje.' });
  }
});

// Create order
app.post('/create-order', async (req, res) => {
  try {
    const { customer, items, total, currency, paymentMethod } = req.body;
    if (!customer || !Array.isArray(items) || items.length === 0 || total === undefined) {
      return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }

    const orders = await readOrders();
    const order = normalizeOrder({
      customer,
      items,
      total,
      currency,
      paymentMethod,
    });

    orders.unshift(order);
    await writeOrders(orders);

    console.log(`Pedido ${order.orderId}: ${customer.name || 'Cliente'}, ${items.length} items, ${order.currency} ${order.total}`);
    res.json({ success: true, message: 'Pedido creado exitosamente.', orderId: order.orderId, order });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Error al crear el pedido.' });
  }
});

// Get orders (authenticated)
app.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await readOrders();
    res.json({ success: true, data: orders.map(normalizeOrder) });
  } catch (err) {
    console.error('Error reading orders:', err);
    res.status(500).json({ success: false, message: 'Error al leer pedidos' });
  }
});

// Update order status (authenticated)
app.post('/orders/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const orders = await readOrders();
    const orderIndex = orders.findIndex((order) => order._id === req.params.orderId || order.orderId === req.params.orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    orders[orderIndex] = normalizeOrder({
      ...orders[orderIndex],
      status,
      updatedAt: new Date().toISOString(),
    });

    await writeOrders(orders);
    res.json({ success: true, data: orders[orderIndex] });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar pedido' });
  }
});

// Admin stats (authenticated)
app.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [products, orders] = await Promise.all([readProducts(), readOrders()]);
    const normalizedOrders = orders.map(normalizeOrder);
    const completedOrders = normalizedOrders.filter((order) => order.status === 'completed');

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalOrders: normalizedOrders.length,
        totalRevenue: completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        pendingOrders: normalizedOrders.filter((order) => order.status === 'pending').length,
      },
    });
  } catch (err) {
    console.error('Error reading stats:', err);
    res.status(500).json({ success: false, message: 'Error al leer estadísticas' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'La imagen excede el tamaño máximo de 10MB.' });
    }
    return res.status(400).json({ success: false, message: `Error de carga: ${err.message}` });
  }

  if (err.message === 'Formato de imagen no permitido. Use JPEG, PNG, WebP o GIF.') {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Almacenamiento: ${require('./services/storageService').USE_HF ? 'Hugging Face Hub' : 'Local'}`);
});
