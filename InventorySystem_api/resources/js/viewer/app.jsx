import '../bootstrap';
import '../../css/app.css';
import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { createRoot } from 'react-dom/client';

function ViewerApp() {
    const authUser = window.StockTrackAuth ?? null;
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
    const [message, setMessage] = useState(null);
    const [activeProduct, setActiveProduct] = useState(null);

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
            setActiveProduct((current) => {
                if (current) {
                    return response.data.data.find((product) => product.id === current.id) ?? current;
                }

                return response.data.data[0] ?? null;
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractErrorMessage(error, 'Unable to load products.'),
            });
        } finally {
            setLoading(false);
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

    async function handleLogout() {
        try {
            await window.axios.post('/logout');
        } finally {
            window.location.href = '/login';
        }
    }

    return (
        <div className="app-shell">
            <div className="app-backdrop" />
            <header className="topbar">
                <div>
                    <p className="eyebrow">Viewer Portal</p>
                    <h1>StockTrack Product Showcase</h1>
                </div>
                <div className="topbar-actions">
                    <p className="topbar-copy">
                        Read-only product browsing for staff or guests who should only view uploaded inventory.
                    </p>
                    <div className="session-chip">
                        <span>{authUser?.name ?? 'Viewer User'}</span>
                        <small>{authUser?.email ?? 'Signed in'}</small>
                    </div>
                    <button className="ghost-button" type="button" onClick={handleLogout}>
                        Log Out
                    </button>
                </div>
            </header>

            <main className="content-grid">
                <section className="hero panel">
                    <div className="hero-copy">
                        <span className="hero-badge">Read-only access</span>
                        <h2>Browse the live product catalog without edit, delete, or upload controls.</h2>
                        <p>
                            This viewer page shows the products created by the admin side of the system and keeps
                            the experience focused on lookup and inspection.
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
                    </div>

                    {message ? <FlashMessage message={message} /> : null}

                    <section className="panel inventory-table-wrap">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">Catalog</p>
                                <h3>Available products</h3>
                            </div>
                            <span className="table-meta">{meta.total} items</span>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading products...</div>
                        ) : products.length === 0 ? (
                            <div className="empty-state">
                                <strong>No products found.</strong>
                                <span>There are no uploaded products to display yet.</span>
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
                                            <th>Action</th>
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
                                                        <button type="button" onClick={() => handleSelectProduct(product.id)}>
                                                            View
                                                        </button>
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
                            <h3>Product preview</h3>
                        </div>
                    </div>

                    {activeProduct ? (
                        <ProductDetails product={activeProduct} currency={currency} />
                    ) : (
                        <div className="empty-state details-empty">
                            <strong>Select a product</strong>
                            <span>Choose any product to view its full details here.</span>
                        </div>
                    )}
                </aside>
            </main>
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

function ProductDetails({ product, currency }) {
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

createRoot(document.getElementById('app')).render(<ViewerApp />);
