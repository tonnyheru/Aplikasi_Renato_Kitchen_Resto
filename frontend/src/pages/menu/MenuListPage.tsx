import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR } from '../../lib/api';
import { Product, Category, Ingredient } from '../../types';
import {
  Search,
  Eye,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  Layers,
  Sparkles,
  Percent,
} from 'lucide-react';

interface VariantForm {
  name: string;
  price_adjustment: number;
}

interface AddonForm {
  name: string;
  price: number;
}

interface RecipeItemForm {
  ingredient_id: number;
  quantity: number;
}

export const MenuListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | ''>('');
  const [search, setSearch] = useState('');

  // View Recipe Modal
  const [viewingProductRecipe, setViewingProductRecipe] = useState<Product | null>(null);

  // Manage Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  // Product Create / Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [prepTime, setPrepTime] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [addons, setAddons] = useState<AddonForm[]>([]);
  const [recipeItems, setRecipeItems] = useState<RecipeItemForm[]>([]);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = async () => {
    let url = '/products?';
    if (selectedCat) url += `category_id=${selectedCat}&`;
    if (search) url += `search=${search}&`;
    const [pRes, cRes, iRes] = await Promise.all([
      apiRequest<Product[]>(url),
      apiRequest<Category[]>('/categories'),
      apiRequest<Ingredient[]>('/ingredients'),
    ]);
    if (pRes.success && pRes.data) setProducts(pRes.data);
    if (cRes.success && cRes.data) setCategories(cRes.data);
    if (iRes.success && iRes.data) setAvailableIngredients(iRes.data);
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedCat, search]);

  const handleToggleAvailability = async (id: number) => {
    const res = await apiRequest(`/products/${id}/toggle-availability`, { method: 'PATCH' });
    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_available: !p.is_available } : p))
      );
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setBasePrice(0);
    setCostPrice(0);
    setPrepTime(10);
    setDescription('');
    setImageUrl('');
    setVariants([]);
    setAddons([]);
    setRecipeItems([]);
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id);
    setBasePrice(p.base_price);
    setCostPrice(p.cost_price);
    setPrepTime(p.prep_time_minutes || 10);
    setDescription(p.description || '');
    setImageUrl(p.image_url || '');

    setVariants(
      p.variants?.map((v) => ({ name: v.name, price_adjustment: v.price_adjustment })) || []
    );
    setAddons(p.addons?.map((a) => ({ name: a.name, price: a.price })) || []);

    setRecipeItems(
      p.recipe?.items?.map((ri) => ({
        ingredient_id: ri.ingredient_id,
        quantity: ri.quantity,
      })) || []
    );

    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  // Add / Remove Variant Row
  const addVariantRow = () => {
    setVariants([...variants, { name: '', price_adjustment: 0 }]);
  };
  const removeVariantRow = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };
  const updateVariantRow = (idx: number, field: keyof VariantForm, val: any) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariants(updated);
  };

  // Add / Remove Addon Row
  const addAddonRow = () => {
    setAddons([...addons, { name: '', price: 0 }]);
  };
  const removeAddonRow = (idx: number) => {
    setAddons(addons.filter((_, i) => i !== idx));
  };
  const updateAddonRow = (idx: number, field: keyof AddonForm, val: any) => {
    const updated = [...addons];
    updated[idx] = { ...updated[idx], [field]: val };
    setAddons(updated);
  };

  // Add / Remove Recipe Row
  const addRecipeRow = () => {
    if (availableIngredients.length === 0) {
      alert('Tambahkan bahan baku di menu Inventaris terlebih dahulu!');
      return;
    }
    setRecipeItems([...recipeItems, { ingredient_id: availableIngredients[0].id, quantity: 100 }]);
  };
  const removeRecipeRow = (idx: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== idx));
  };
  const updateRecipeRow = (idx: number, field: keyof RecipeItemForm, val: any) => {
    const updated = [...recipeItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setRecipeItems(updated);
  };

  // Live Calculate Recipe HPP
  const calculatedRecipeHpp = recipeItems.reduce((sum, ri) => {
    const ing = availableIngredients.find((i) => i.id === ri.ingredient_id);
    return sum + (ing ? ing.cost_per_unit * ri.quantity : 0);
  }, 0);

  const effectiveHpp = calculatedRecipeHpp > 0 ? calculatedRecipeHpp : costPrice;
  const grossProfitAmount = Math.max(0, basePrice - effectiveHpp);
  const grossMarginPercent = basePrice > 0 ? ((grossProfitAmount / basePrice) * 100).toFixed(1) : 0;

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    if (!categoryId) {
      setProductFormError('Pilih kategori menu.');
      return;
    }
    if (basePrice <= 0) {
      setProductFormError('Harga jual harus lebih dari Rp 0.');
      return;
    }

    setSubmitting(true);

    const payload: any = {
      name,
      category_id: categoryId,
      base_price: basePrice,
      cost_price: effectiveHpp,
      prep_time_minutes: prepTime,
      description,
      image_url:
        imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      variants: variants.filter((v) => v.name.trim() !== ''),
      addons: addons.filter((a) => a.name.trim() !== ''),
      recipe_items: recipeItems.filter((ri) => ri.ingredient_id && ri.quantity > 0),
    };

    if (editingProduct) {
      const res = await apiRequest(`/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSubmitting(false);
      if (res.success) {
        setIsProductModalOpen(false);
        fetchMenu();
      } else {
        setProductFormError(res.message || 'Gagal memperbarui menu.');
      }
    } else {
      const res = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSubmitting(false);
      if (res.success) {
        setIsProductModalOpen(false);
        fetchMenu();
      } else {
        setProductFormError(res.message || 'Gagal menambahkan menu.');
      }
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Hapus menu '${p.name}' (${p.sku})? Tindakan ini tidak dapat dibatalkan.`)) return;

    const res = await apiRequest(`/products/${p.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchMenu();
    } else {
      alert(res.message || 'Gagal menghapus menu.');
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!newCatName.trim()) return;

    const slug = newCatName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const res = await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: newCatName,
        slug,
        sort_order: categories.length + 1,
      }),
    });

    if (res.success) {
      setNewCatName('');
      fetchMenu();
    } else {
      setCatError(res.message || 'Gagal menambahkan kategori.');
    }
  };

  const handleDeleteCategory = async (c: Category) => {
    if (!confirm(`Hapus kategori '${c.name}'?`)) return;

    const res = await apiRequest(`/categories/${c.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchMenu();
    } else {
      alert(res.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Daftar Menu & Formula Resep (BOM)
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Atur harga jual, varian, addon, ketersediaan, serta formula bahan baku otomatis pemotong stok
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.815rem' }}
          >
            <Layers size={14} /> Kelola Kategori
          </button>
          <button onClick={openCreateModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.815rem' }}>
            <Plus size={14} /> Tambah Menu Baru
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="renato-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari nama menu atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          className="input-field"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : '')}
          style={{ width: '200px' }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu Table */}
      <div className="renato-card" style={{ overflow: 'hidden' }}>
        <table className="renato-table">
          <thead>
            <tr>
              <th>Foto & Nama Menu</th>
              <th>Kategori</th>
              <th>Harga Jual</th>
              <th>HPP (Biaya Pokok)</th>
              <th>Durasi Masak</th>
              <th>Status Ketersediaan</th>
              <th>Resep (BOM)</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Tidak ada menu yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                        alt={p.name}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.onerror = null;
                          t.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23F5F0E8' rx='8'/%3E%3Ctext x='50' y='62' font-family='Arial' font-size='36' text-anchor='middle' fill='%23344C3D'%3E🍽%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>SKU: {p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gold">{p.category?.name || '-'}</span>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--color-forest-green)' }}>
                    {formatIDR(p.base_price)}
                  </td>
                  <td className="font-mono text-muted">
                    {formatIDR(p.cost_price)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.815rem' }}>
                      <Clock size={13} color="#8A8A83" />
                      <span>{p.prep_time_minutes} menit</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleAvailability(p.id)}
                      title="Klik untuk ubah ketersediaan"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {p.is_available ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Tersedia
                        </span>
                      ) : (
                        <span className="badge badge-error">
                          <XCircle size={12} /> Habis
                        </span>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => setViewingProductRecipe(p)}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      <UtensilsCrossed size={12} /> {p.recipe?.items?.length ? `${p.recipe.items.length} Bahan` : 'Lihat Resep'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(p)}
                        className="btn-secondary"
                        title="Edit Menu & Resep"
                        style={{ padding: '6px 8px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="btn-secondary"
                        title="Hapus Menu"
                        style={{ padding: '6px 8px', color: '#B91C1C' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal View Recipe (BOM) */}
      {viewingProductRecipe && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="renato-card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Formula Resep Bahan Baku (BOM)</h3>
                <span style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>{viewingProductRecipe.name}</span>
              </div>
              <button onClick={() => setViewingProductRecipe(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', backgroundColor: 'var(--color-warm-cream)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>Otomatisasi Stok:</div>
              <div style={{ fontSize: '0.815rem', fontWeight: 600, marginTop: '2px' }}>
                Bahan baku di bawah ini otomatis terpotong dari gudang saat kasir mengonfirmasi pesanan menu ini.
              </div>
            </div>

            {/* Recipe items list */}
            {viewingProductRecipe.recipe?.items && viewingProductRecipe.recipe.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {viewingProductRecipe.recipe.items.map((ri, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{ri.ingredient?.name || `Bahan #${ri.ingredient_id}`}</span>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)' }}>
                        SKU: {ri.ingredient?.sku}
                      </div>
                    </div>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-forest-green)' }}>
                      {ri.quantity} {ri.ingredient?.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-neutral-gray)', fontSize: '0.875rem' }}>
                Menu ini belum memiliki formula resep bahan baku. Klik tombol <strong>Edit</strong> untuk menambahkan formula.
              </div>
            )}

            <button
              onClick={() => {
                const prod = viewingProductRecipe;
                setViewingProductRecipe(null);
                openEditModal(prod);
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              <Edit2 size={14} /> Edit Resep & Detail Menu
            </button>
          </div>
        </div>
      )}

      {/* Modal Manage Categories */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="renato-card" style={{ width: '100%', maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Kelola Kategori Menu</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {catError && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error-text)', fontSize: '0.815rem', marginBottom: '12px' }}>
                {catError}
              </div>
            )}

            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Nama Kategori Baru..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
                <Plus size={14} /> Tambah
              </button>
            </form>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', marginLeft: '8px' }}>
                      ({c.products_count || 0} menu)
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCategory(c)}
                    className="btn-secondary"
                    title="Hapus Kategori"
                    style={{ padding: '4px 8px', color: '#B91C1C' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Product with Recipe Builder */}
      {isProductModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="renato-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {editingProduct ? `Edit Menu: ${editingProduct.name}` : 'Tambah Menu Masakan Baru'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                  Konfigurasi info produk, varian level pedas/ukuran, addon tambahan, dan formula resep (BOM)
                </span>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {productFormError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error-text)', fontSize: '0.815rem', marginBottom: '16px' }}>
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Section 1: Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Cth: Ayam Goreng Renato"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Kategori Menu
                  </label>
                  <select
                    className="input-field"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field font-mono"
                    value={basePrice || ''}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    required
                    placeholder="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Estimasi HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-field font-mono"
                    value={effectiveHpp}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Durasi Masak (Menit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field font-mono"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Profitability live preview banner */}
              <div
                style={{
                  backgroundColor: '#FAF6ED',
                  border: '1px solid #E8DFCB',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.815rem' }}>
                  <Sparkles size={15} color="#C5A46D" />
                  <span>
                    Laba Kotor Per Porsi: <strong className="font-mono">{formatIDR(grossProfitAmount)}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.815rem', fontWeight: 700, color: '#2D6A4F' }}>
                  Margin: {grossMarginPercent}%
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  URL Foto Menu
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Deskripsi Menu
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Keterangan cita rasa, porsi, atau bahan pendukung..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Section 2: Recipe (BOM) Builder */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      Formula Resep Bahan Baku (BOM - Bill of Materials)
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)' }}>
                      Setiap kali menu terjual, bahan baku ini otomatis dipotong dari stok gudang
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addRecipeRow}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} /> Tambah Bahan
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recipeItems.map((ri, idx) => {
                    const matchedIng = availableIngredients.find((i) => i.id === ri.ingredient_id);
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="input-field"
                          value={ri.ingredient_id}
                          onChange={(e) => updateRecipeRow(idx, 'ingredient_id', Number(e.target.value))}
                          style={{ flex: 2 }}
                        >
                          {availableIngredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit}) — {formatIDR(ing.cost_per_unit)}/{ing.unit}
                            </option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            className="input-field font-mono"
                            value={ri.quantity}
                            onChange={(e) => updateRecipeRow(idx, 'quantity', Number(e.target.value))}
                            placeholder="Jumlah"
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', width: '32px' }}>
                            {matchedIng?.unit || ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRecipeRow(idx)}
                          className="btn-secondary"
                          style={{ padding: '6px 8px', color: '#B91C1C' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                  {recipeItems.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', fontStyle: 'italic' }}>
                      Belum ada bahan baku dalam formula resep. Klik 'Tambah Bahan' di atas.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Variants */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Varian Menu (Level Pedas, Ukuran)</h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)' }}>
                      Pelanggan memilih 1 varian saat memesan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} /> Tambah Varian
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {variants.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Nama Varian (Cth: Level 1, Regular, Jumbo)"
                        value={v.name}
                        onChange={(e) => updateVariantRow(idx, 'name', e.target.value)}
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        className="input-field font-mono"
                        placeholder="+/- Selisih Harga (Rp)"
                        value={v.price_adjustment}
                        onChange={(e) => updateVariantRow(idx, 'price_adjustment', Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantRow(idx)}
                        className="btn-secondary"
                        style={{ padding: '6px 8px', color: '#B91C1C' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Addons */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Addon Tambahan (Topping / Ekstra)</h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)' }}>
                      Pelanggan dapat memilih beberapa addon
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addAddonRow}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} /> Tambah Addon
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addons.map((a, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Nama Addon (Cth: Telur Mata Sapi, Ekstra Keju)"
                        value={a.name}
                        onChange={(e) => updateAddonRow(idx, 'name', e.target.value)}
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        min="0"
                        className="input-field font-mono"
                        placeholder="Harga (Rp)"
                        value={a.price}
                        onChange={(e) => updateAddonRow(idx, 'price', Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAddonRow(idx)}
                        className="btn-secondary"
                        style={{ padding: '6px 8px', color: '#B91C1C' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '11px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 2, padding: '11px' }}
                >
                  {submitting ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Buat Menu Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
