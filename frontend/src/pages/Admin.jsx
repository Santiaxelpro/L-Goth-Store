import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingCart,
  LogOut, X,
  ChevronLeft, ChevronRight, DollarSign,
  Clock, Image as ImageIcon,
  Plus, Edit2, Trash2, Upload, Search,
  Menu, AlertTriangle, PackageOpen, Inbox,
  LockKeyhole, User, LogIn
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  API_URL,
  addProduct,
  apiCall,
  deleteProduct,
  isAuthenticated,
  login,
  logout,
  updateImage,
  updatePrice,
  updateStock,
  verifyAuth,
} from "../utils/api";
import { useToast } from "../components/ToastProvider";

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeAdminProduct(product, index) {
  return {
    ...product,
    _id: String(product.id ?? index),
    index,
    name: product.name ?? product.nombre ?? "Sin nombre",
    description: product.description ?? product.descripcion ?? "",
    category: product.category ?? product.categoria ?? "General",
    price: Number(product.price ?? product.current_price ?? product.precio ?? 0),
    previous_price: product.previous_price ?? product.precio_anterior ?? "",
    stock: Number(product.stock ?? 0),
    images: Array.isArray(product.images)
      ? product.images
      : product.imagen
        ? [product.imagen]
        : [],
  };
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`} />;
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-white/50 text-sm">{message}</p>
        </div>
        <div className="flex border-t border-white/5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 border-l border-white/5 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

function TableSkeleton({ cols = 5, rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ProductImage({ src, alt }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
        <ImageIcon size={40} className="text-white/15" />
      </div>
    );
  }

  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </>
  );
}

// ============ DASHBOARD ============
function Dashboard({ stats, recentOrders, loading, onNavigate }) {
  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, color: "from-purple-500 to-purple-600" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "from-cyan-500 to-cyan-600" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "from-emerald-500 to-emerald-600" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "from-amber-500 to-amber-600" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <Skeleton className="h-6 w-32 mb-4" />
          <TableSkeleton cols={5} rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/15 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-sm">{card.label}</span>
              <div className={`bg-gradient-to-br ${card.color} p-2 rounded-lg`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <button
            onClick={() => onNavigate("orders")}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-white/25">
            <Inbox size={40} />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/5">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-mono text-white/60">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="py-3">{order.customer?.name || "N/A"}</td>
                    <td className="py-3 font-mono">{formatCurrency(order.total)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                        order.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                        "bg-red-500/20 text-red-300"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-white/40">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PRODUCTS PANEL ============
function ProductsPanel({ products, loading, onRefresh }) {
  const { addToast } = useToast();
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm.index);
      addToast("Product deleted", "success");
      onRefresh();
    } catch { addToast("Failed to delete product", "error"); }
    finally { setDeleteConfirm(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold font-display">Products</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 w-56 transition-colors"
            />
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-sm font-medium transition-all active:scale-95"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-white/25">
          <PackageOpen size={48} />
          <p className="text-sm">
            {searchTerm ? "No products match your search" : "No products yet. Add your first product!"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-sm font-medium text-white transition-all"
            >
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginated.map((product) => (
              <div
                key={product._id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all duration-200"
              >
                <div className="aspect-square bg-white/[0.02] overflow-hidden relative">
                  <ProductImage src={product.images?.[0]} alt={product.name} />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl pointer-events-none" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-sm text-white/40 truncate">{product.category || "Uncategorized"}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono font-bold text-purple-400">{formatCurrency(product.price)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      product.stock > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                    }`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setEditModal(product)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-xs transition-colors"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    currentPage === i + 1
                      ? "bg-purple-600 text-white"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-white/60"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {addModal && (
        <ProductFormModal
          product={null}
          onClose={() => setAddModal(false)}
          onSaved={() => { setAddModal(false); onRefresh(); }}
        />
      )}
      {editModal && (
        <ProductFormModal
          product={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); onRefresh(); }}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ============ PRODUCT FORM MODAL ============
function ProductFormModal({ product, onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    previous_price: product?.previous_price || "",
    category: product?.category || "",
    stock: product?.stock ?? 0,
    images: product?.images || [],
    sizes: product?.sizes || [],
    colors: product?.colors || [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = !!product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await updatePrice(product.index, Number(form.price), form.previous_price ? Number(form.previous_price) : null);
        await updateStock(product.index, Number(form.stock));
        if (imageFile) {
          const imageData = new FormData();
          imageData.append("index", product.index);
          imageData.append("image", imageFile);
          await updateImage(product.index, imageData);
        }
        addToast("Product updated", "success");
      } else {
        if (!imageFile) {
          addToast("Select an image before creating the product", "error");
          return;
        }

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("description", form.description);
        formData.append("current_price", form.price);
        formData.append("previous_price", form.previous_price);
        formData.append("currency", "PEN");
        formData.append("stock", form.stock);
        formData.append("image", imageFile);
        await addProduct(formData);
        addToast("Product created", "success");
      }
      onSaved();
    } catch { addToast("Failed to save product", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 flex items-center justify-between p-5 border-b border-white/10 z-10">
          <h2 className="text-lg font-bold">{isEditing ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 resize-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Price</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0" step="0.01"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Previous Price</label>
              <input type="number" value={form.previous_price} onChange={e => setForm(f => ({ ...f, previous_price: e.target.value }))} min="0" step="0.01"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required min="0"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Category</label>
              <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              {isEditing ? "Replace Image" : "Image"}
            </label>
            <label className="flex items-center gap-3 px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm cursor-pointer hover:border-purple-500/50 transition-colors">
              <Upload size={16} className="text-purple-400" />
              <span className="text-white/50 truncate">{imageFile ? imageFile.name : "Select image file..."}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required={!isEditing}
                className="sr-only"
              />
            </label>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.images.map((img, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs">
                    <ImageIcon size={12} className="text-purple-400" />
                    <span className="max-w-[120px] truncate">{img}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Sizes</label>
            <div className="flex gap-2">
              <input type="text" value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="e.g. S, M, L"
                className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
              <button type="button" onClick={() => { if (newSize.trim()) { setForm(f => ({ ...f, sizes: [...f.sizes, newSize.trim()] })); setNewSize(""); } }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors">Add</button>
            </div>
            {form.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.sizes.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs">
                    {s}
                    <button type="button" onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Colors</label>
            <div className="flex gap-2">
              <input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="e.g. Black, Red"
                className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
              <button type="button" onClick={() => { if (newColor.trim()) { setForm(f => ({ ...f, colors: [...f.colors, newColor.trim()] })); setNewColor(""); } }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors">Add</button>
            </div>
            {form.colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.colors.map((c, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg text-xs">
                    {c}
                    <button type="button" onClick={() => setForm(f => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ ORDERS PANEL ============
function OrdersPanel({ orders, loading, onRefresh }) {
  const { addToast } = useToast();
  const [filter, setFilter] = useState("all");

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiCall(`${API_URL}/orders/${orderId}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });
      addToast(`Order status updated to "${newStatus}"`, "success");
      onRefresh();
    } catch {
      addToast("Failed to update order status", "error");
    }
  };

  const statusFilters = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Orders</h1>

      <div className="flex gap-2">
        {statusFilters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === f.value ? "bg-purple-600 text-white" : "bg-white/[0.05] text-white/60 hover:bg-white/[0.1]"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <TableSkeleton cols={7} rows={4} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/25">
          <Inbox size={48} />
          <p className="text-sm">No orders found</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/5">
                  <th className="pb-3 px-5 pt-5 font-medium">Order ID</th>
                  <th className="pb-3 px-5 pt-5 font-medium">Customer</th>
                  <th className="pb-3 px-5 pt-5 font-medium">Products</th>
                  <th className="pb-3 px-5 pt-5 font-medium">Total</th>
                  <th className="pb-3 px-5 pt-5 font-medium">Status</th>
                  <th className="pb-3 px-5 pt-5 font-medium">Date</th>
                  <th className="pb-3 px-5 pt-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 font-mono text-white/60">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-5">
                      <div className="font-medium">{order.customer?.name || "N/A"}</div>
                      <div className="text-xs text-white/40">{order.customer?.email || ""}</div>
                    </td>
                    <td className="py-3 px-5">{order.items?.length || 0} items</td>
                    <td className="py-3 px-5 font-mono">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                        order.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                        "bg-red-500/20 text-red-300"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-white/40">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-5">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ LOGIN PANEL ============
function AdminLogin({ onSuccess }) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        addToast(result.message || "Invalid credentials", "error");
        return;
      }
      addToast("Welcome back", "success");
      onSuccess();
    } catch {
      addToast("Could not sign in. Is the backend running?", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <LockKeyhole size={20} className="text-purple-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Admin Login</h1>
            <p className="text-sm text-white/40">Use your backend credentials</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-white/60 mb-1">Username</span>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-white/60 mb-1">Password</span>
            <div className="relative">
              <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <LogIn size={16} />
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-3 px-4 py-2 text-sm text-white/45 hover:text-white transition-colors"
        >
          Back to store
        </button>
      </div>
    </div>
  );
}

// ============ MAIN ADMIN PAGE ============
export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState({ products: false, orders: false, stats: false });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    setLoading({ products: true, orders: true, stats: true });
    try {
      const [productsRes, ordersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/products`).then((res) => {
          if (!res.ok) throw new Error("Products request failed");
          return res.json();
        }),
        apiCall(`${API_URL}/orders`),
        apiCall(`${API_URL}/stats`),
      ]);
      const normalizedProducts = productsRes.map(normalizeAdminProduct);
      setProducts(normalizedProducts);
      setOrders(ordersRes.data || []);
      setStats(statsRes.data || {
        totalProducts: normalizedProducts.length,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      });
    } catch {
      addToast("Failed to load admin data. Is the backend running?", "error");
    } finally {
      setLoading({ products: false, orders: false, stats: false });
    }
  };

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      if (!isAuthenticated()) {
        setCheckingAuth(false);
        return;
      }

      const result = await verifyAuth();
      if (!mounted) return;

      if (result.success) {
        setAuthenticated(true);
      } else {
        await logout();
        setAuthenticated(false);
      }
      setCheckingAuth(false);
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setProducts([]);
    setOrders([]);
    setStats({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard stats={stats} recentOrders={orders.slice(0, 5)} loading={loading.stats} onNavigate={setActiveTab} />;
      case "products":
        return <ProductsPanel products={products} loading={loading.products} onRefresh={fetchData} />;
      case "orders":
        return <OrdersPanel orders={orders} loading={loading.orders} onRefresh={fetchData} />;
      default:
        return <Dashboard stats={stats} recentOrders={orders.slice(0, 5)} loading={loading.stats} onNavigate={setActiveTab} />;
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        {sidebarOpen && <span className="font-bold font-display text-purple-400">Admin Panel</span>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors hidden md:flex"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors md:hidden"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              activeTab === item.id
                ? "bg-purple-600/20 text-purple-300 font-medium"
                : "text-white/50 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <item.icon size={20} />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300/70 hover:text-red-200 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <ChevronLeft size={20} />
          {sidebarOpen && <span>Back to Store</span>}
        </button>
      </div>
    </>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} hidden md:flex bg-white/[0.02] border-r border-white/5 transition-all duration-300 flex-col`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-gray-950 border-r border-white/10 flex flex-col animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30 flex items-center gap-3 px-4 py-2 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-medium text-white/60 truncate">
          {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || "Admin"}
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-[calc(4rem+0.5rem)] md:pt-6">
        {renderPanel()}
      </main>
    </div>
  );
}
