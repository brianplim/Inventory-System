import './bootstrap';
import '../css/app.css';
import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { createRoot } from 'react-dom/client';

const emptyForm = () => ({
    sku: '',
    name: '',
    category: '',
    price: '',
    quantity: 0,
    date_added: new Date().toISOString().slice(0, 10),
    description: '',
    image: null,
    remove_image: false,
});

function App() {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockProducts: 0,
        totalUnits: 0,
        inventoryValue: 0,
    });
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeProduct, setActiveProduct] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            loadProducts(page, deferredSearch);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [page, deferredSearch]);

    useEffect(() => {
        setPage(1);
    }, [deferredSearch]);

    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setMessage(null), 3000);
        return () => window.clearTimeout(timeout);
    }, [message]);

    const currency = useMemo(
        () =>
            new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }),
        [],
    );

    async function loadProducts(targetPage = 1, targetSearch = '') {
        setLoading(true);

        try {
            const response = await window.axios.get('/api/products', {
                params: {
                    page: targetPage,
                    search: targetSearch || undefined,
                },
            });

            setProducts(response.data.data);
            setStats(response.data.stats);
            setMeta(response.data.meta);
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractErrorMessage(error, 'Unable to load inventory data.'),
            });
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setEditingProduct(null);
        setForm(emptyForm());
        setFormErrors({});
        setImagePreview(null);
        setIsFormOpen(true);
    }

    function openEditForm(product) {
        setEditingProduct(product);
        setForm({
            sku: product.sku ?? '',
            name: product.name ?? '',
            category: product.category ?? '',
            price: product.price ?? '',
            quantity: product.quantity ?? 0,
            date_added: product.date_added ?? new Date().toISOString().slice(0, 10),
            description: product.description ?? '',
            image: null,
            remove_image: false,
        });
        setFormErrors({});
        setImagePreview(product.image_url);
        setIsFormOpen(true);
    }

    function closeForm() {
        setIsFormOpen(false);
        setEditingProduct(null);
        setFormErrors({});
        setImagePreview(null);
    }

    function handleFieldChange(event) {
        const { name, value, type, checked, files } = event.target;

        if (type === 'file') {
            const file = files?.[0] ?? null;
            setForm((current) => ({ ...current, image: file }));
            setImagePreview(file ? URL.createObjectURL(file) : editingProduct?.image_url ?? null);
            return;
        }

        setForm((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        const payload = new FormData();
        payload.append('sku', form.sku);
        payload.append('name', form.name);
        payload.append('category', form.category);
        payload.append('price', form.price);
        payload.append('quantity', form.quantity);
        payload.append('date_added', form.date_added);
        payload.append('description', form.description);
        payload.append('remove_image', form.remove_image ? '1' : '0');

        if (form.image) {
            payload.append('image', form.image);
        }

        if (editingProduct) {
            payload.append('_method', 'PUT');
        }

        try {
            const response = await window.axios.post(
                editingProduct ? `/api/products/${editingProduct.id}` : '/api/products',
                payload,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            setMessage({ type: 'success', text: response.data.message });
            closeForm();
            setActiveProduct(response.data.data ?? null);
            await loadProducts(page, deferredSearch);
        } catch (error) {
            if (error.response?.status === 422) {
                setFormErrors(error.response.data.errors ?? {});
            } else {
                setMessage({
                    type: 'error',
                    text: extractErrorMessage(error, 'Unable to save the product.'),
                });
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(product) {
        if (!window.confirm(`Delete "${product.name}"?`)) {
            return;
        }

        try {
            const response = await window.axios.delete(`/api/products/${product.id}`);
            setMessage({ type: 'success', text: response.data.message });

            if (activeProduct?.id === product.id) {
                setActiveProduct(null);
            }

            const shouldGoBack = products.length === 1 && page > 1;
            const nextPage = shouldGoBack ? page - 1 : page;
            setPage(nextPage);
            await loadProducts(nextPage, deferredSearch);
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractErrorMessage(error, 'Unable to delete the product.'),
            });
        }
    }

    async function handleSelectProduct(productId) {
        try {
            const response = await window.axios.get(`/api/products/${productId}`);
            setActiveProduct(response.data.data);
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractErrorMessage(error, 'Unable to load product details.'),
            });
        }
    }

    return (
        <div className="app-shell">
            <div className="app-backdrop" />
            <header className="topbar">
                <div>
                    <p className="eyebrow">React Frontend</p>
                    <h1>StockTrack Inventory Hub</h1>
                </div>
                <p className="topbar-copy">
                    Laravel now powers the API while React runs the product dashboard.
                </p>
            </header>

            <main className="content-grid">
                <section className="hero panel">
                    <div className="hero-copy">
                        <span className="hero-badge">Inventory command center</span>
                        <h2>Manage stock, spot low items, and update products from one React workspace.</h2>
                        <p>
                            Search the catalog, open product details, and create or edit records without bouncing
                            between server-rendered pages.
                        </p>
                    </div>
                    <div className="stats-grid">
                        <StatCard label="Products" value={stats.totalProducts} />
                        <StatCard label="Low Stock" value={stats.lowStockProducts} warning={stats.lowStockProducts > 0} />
                        <StatCard label="Units" value={stats.totalUnits} />
                        <StatCard label="Inventory Value" value={currency.format(stats.inventoryValue)} />
                    </div>
                </section>

                <section className="inventory-column">
                    <div className="panel toolbar">
                        <div className="toolbar-search">
                            <label htmlFor="search">Search products</label>
                            <input
                                id="search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, SKU, or category"
                            />
                        </div>
                        <button className="primary-button" type="button" onClick={openCreateForm}>
                            Add Product
                        </button>
                    </div>

                    {message ? <FlashMessage message={message} /> : null}

                    <section className="panel inventory-table-wrap">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">Catalog</p>
                                <h3>Current inventory</h3>
                            </div>
                            <span className="table-meta">{meta.total} items</span>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading products...</div>
                        ) : products.length === 0 ? (
                            <div className="empty-state">
                                <strong>No products found.</strong>
                                <span>Try a different search or add your first product.</span>
                            </div>
                        ) : (
                            <div className="table-scroll">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Date Added</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id} className={product.quantity < 5 ? 'is-low-stock' : ''}>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="product-cell"
                                                        onClick={() => handleSelectProduct(product.id)}
                                                    >
                                                        <ProductThumb product={product} />
                                                        <span>
                                                            <strong>{product.name}</strong>
                                                            <small>{product.sku}</small>
                                                        </span>
                                                    </button>
                                                </td>
                                                <td>{product.category || 'Uncategorized'}</td>
                                                <td>{currency.format(product.price)}</td>
                                                <td><span className="quantity-pill">{product.quantity}</span></td>
                                                <td>{formatDate(product.date_added)}</td>
                                                <td>
                                                    <div className="action-row">
                                                        <button type="button" onClick={() => handleSelectProduct(product.id)}>View</button>
                                                        <button type="button" onClick={() => openEditForm(product)}>Edit</button>
                                                        <button type="button" className="danger-button" onClick={() => handleDelete(product)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onChange={setPage} />
                    </section>
                </section>

                <aside className="panel details-panel">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Details</p>
                            <h3>Product spotlight</h3>
                        </div>
                    </div>

                    {activeProduct ? (
                        <ProductDetails product={activeProduct} currency={currency} onEdit={() => openEditForm(activeProduct)} />
                    ) : (
                        <div className="empty-state details-empty">
                            <strong>Select a product</strong>
                            <span>Choose any row to view a richer summary here.</span>
                        </div>
                    )}
                </aside>
            </main>

            {isFormOpen ? (
                <div className="modal-backdrop" onClick={closeForm}>
                    <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">{editingProduct ? 'Update product' : 'Create product'}</p>
                                <h3>{editingProduct ? 'Edit inventory item' : 'Add new inventory item'}</h3>
                            </div>
                            <button type="button" className="ghost-button" onClick={closeForm}>Close</button>
                        </div>

                        <form className="product-form" onSubmit={handleSubmit}>
                            <FormField label="SKU" error={formErrors.sku}>
                                <input name="sku" value={form.sku} onChange={handleFieldChange} placeholder="PRD-001" required />
                            </FormField>
                            <FormField label="Product Name" error={formErrors.name}>
                                <input name="name" value={form.name} onChange={handleFieldChange} placeholder="Wireless Mouse" required />
                            </FormField>
                            <FormField label="Category" error={formErrors.category}>
                                <input name="category" value={form.category} onChange={handleFieldChange} placeholder="Accessories" />
                            </FormField>
                            <FormField label="Price" error={formErrors.price}>
                                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleFieldChange} required />
                            </FormField>
                            <FormField label="Quantity" error={formErrors.quantity}>
                                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleFieldChange} required />
                            </FormField>
                            <FormField label="Date Added" error={formErrors.date_added}>
                                <input name="date_added" type="date" value={form.date_added} onChange={handleFieldChange} required />
                            </FormField>
                            <div className="form-field form-field-wide">
                                <label htmlFor="image">Product Image</label>
                                <input id="image" name="image" type="file" accept="image/*" onChange={handleFieldChange} />
                                {formErrors.image ? <p className="field-error">{formErrors.image[0]}</p> : null}
                                {imagePreview ? <div className="image-preview-wrap"><img src={imagePreview} alt="Preview" className="image-preview" /></div> : null}
                                {editingProduct?.image_url ? (
                                    <label className="checkbox-row">
                                        <input name="remove_image" type="checkbox" checked={form.remove_image} onChange={handleFieldChange} />
                                        Remove current image
                                    </label>
                                ) : null}
                            </div>
                            <FormField label="Description" error={formErrors.description} wide>
                                <textarea
                                    name="description"
                                    rows="4"
                                    value={form.description}
                                    onChange={handleFieldChange}
                                    placeholder="Short notes, supplier details, or usage info"
                                />
                            </FormField>
                            <div className="modal-actions form-field-wide">
                                <button className="primary-button" type="submit" disabled={submitting}>
                                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                                </button>
                                <button className="ghost-button" type="button" onClick={closeForm}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function StatCard({ label, value, warning = false }) {
    return <article className={`stat-card${warning ? ' stat-card-warning' : ''}`}><span>{label}</span><strong>{value}</strong></article>;
}

function ProductThumb({ product }) {
    if (product.image_url) {
        return <img src={product.image_url} alt={product.name} className="product-thumb" />;
    }

    return <div className="product-thumb product-thumb-fallback">{product.name.slice(0, 1).toUpperCase()}</div>;
}

function ProductDetails({ product, currency, onEdit }) {
    return (
        <div className="details-card">
            <ProductThumb product={product} />
            <span className="details-category">{product.category || 'Uncategorized'}</span>
            <h4>{product.name}</h4>
            <p className="details-sku">{product.sku}</p>
            <div className="details-metrics">
                <DetailItem label="Price" value={currency.format(product.price)} />
                <DetailItem label="Quantity" value={product.quantity} />
                <DetailItem label="Date Added" value={formatLongDate(product.date_added)} />
                <DetailItem label="Status" value={product.quantity < 5 ? 'Low Stock' : 'Available'} />
            </div>
            <div className="details-description">
                <span>Description</span>
                <p>{product.description || 'No description has been added yet.'}</p>
            </div>
            <button className="primary-button" type="button" onClick={onEdit}>Edit Product</button>
        </div>
    );
}

function DetailItem({ label, value }) {
    return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}

function Pagination({ currentPage, lastPage, onChange }) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <div className="pagination">
            <button type="button" onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {lastPage}</span>
            <button type="button" onClick={() => onChange(currentPage + 1)} disabled={currentPage === lastPage}>Next</button>
        </div>
    );
}

function FormField({ label, error, wide = false, children }) {
    return (
        <div className={`form-field${wide ? ' form-field-wide' : ''}`}>
            <label>{label}</label>
            {children}
            {error ? <p className="field-error">{error[0]}</p> : null}
        </div>
    );
}

function FlashMessage({ message }) {
    return <div className={`flash-message flash-${message.type}`}>{message.text}</div>;
}

function extractErrorMessage(error, fallback) {
    return error.response?.data?.message || fallback;
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatLongDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

createRoot(document.getElementById('app')).render(<App />);
