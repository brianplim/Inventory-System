import '../bootstrap';
import '../../css/app.css';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

function UserApp() {
    const authUser = window.StockTrackAuth ?? null;
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockProducts: 0,
        totalUnits: 0,
        inventoryValue: 0,
    });
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [purchaseSummary, setPurchaseSummary] = useState({
        productsBought: 0,
        unitsBought: 0,
        totalSpent: 0,
        lastPurchaseAt: null,
        lastPurchaseProduct: null,
        lastPurchaseAmount: 0,
    });
    const [totalSpent, setTotalSpent] = useState(0);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [activeProduct, setActiveProduct] = useState(null);
    const [purchaseTarget, setPurchaseTarget] = useState(null);
    const [purchaseQuantity, setPurchaseQuantity] = useState(1);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            loadProducts(page, deferredSearch);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [page, deferredSearch]);

    useEffect(() => {
        void loadPurchases();
    }, []);

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

    async function loadPurchases() {
        try {
            const response = await window.axios.get('/api/purchases');
            setPurchaseHistory(response.data.data ?? []);
            setPurchaseSummary({
                productsBought: Number(response.data.summary?.productsBought ?? 0),
                unitsBought: Number(response.data.summary?.unitsBought ?? 0),
                totalSpent: Number(response.data.summary?.totalSpent ?? 0),
                lastPurchaseAt: response.data.summary?.lastPurchaseAt ?? null,
                lastPurchaseProduct: response.data.summary?.lastPurchaseProduct ?? null,
                lastPurchaseAmount: Number(response.data.summary?.lastPurchaseAmount ?? 0),
            });
            setTotalSpent(Number(response.data.summary?.totalSpent ?? 0));
        } catch {
            // Keep user browsing available even if purchase history fails.
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

    function openPurchaseModal(product) {
        setPurchaseTarget(product);
        setPurchaseQuantity(product.quantity > 0 ? 1 : 0);
    }

    function closePurchaseModal() {
        if (purchasing) {
            return;
        }

        setPurchaseTarget(null);
        setPurchaseQuantity(1);
    }

    async function handlePurchase(event) {
        event.preventDefault();

        if (!purchaseTarget) {
            return;
        }

        setPurchasing(true);

        try {
            const response = await window.axios.post(`/api/products/${purchaseTarget.id}/purchase`, {
                quantity: purchaseQuantity,
            });

            const updatedProduct = response.data.data.product;
            setMessage({
                type: 'success',
                text: `You bought ${response.data.data.purchase.quantity} unit(s) of ${updatedProduct.name}.`,
            });
            setStats(response.data.stats);
            setProducts((current) =>
                current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
            );
            setActiveProduct((current) => (current?.id === updatedProduct.id ? updatedProduct : current));
            setPurchaseHistory((current) => {
                const nextHistory = [response.data.data.purchase, ...current].slice(0, 8);
                const uniqueProductIds = new Set(nextHistory.map((purchase) => purchase.product?.id).filter(Boolean));

                setPurchaseSummary((currentSummary) => ({
                    productsBought: Math.max(currentSummary.productsBought, uniqueProductIds.size),
                    unitsBought: currentSummary.unitsBought + Number(response.data.data.purchase.quantity ?? 0),
                    totalSpent: currentSummary.totalSpent + Number(response.data.data.purchase.total_price ?? 0),
                }));

                return nextHistory;
            });
            setTotalSpent((current) => current + Number(response.data.data.purchase.total_price ?? 0));
            closePurchaseModal();
            await loadProducts(page, deferredSearch);
            await loadPurchases();
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractPurchaseError(error),
            });
        } finally {
            setPurchasing(false);
        }
    }

    async function handleLogout() {
        try {
            await window.axios.post('/logout');
        } finally {
            window.location.href = '/login';
        }
    }

    const purchaseTotal = purchaseTarget ? Number(purchaseTarget.price) * Number(purchaseQuantity || 0) : 0;

    return (
        <div className="app-shell">
            <div className="app-backdrop" />
            <header className="topbar">
                <div>
                    <p className="eyebrow">User Portal</p>
                    <h1>StockTrack Product Showcase</h1>
                </div>
                <div className="topbar-actions">
                    <p className="topbar-copy">
                        Browse products, inspect live stock, and place quick purchases from the user portal.
                    </p>
                    <div className="session-chip">
                        <span>{authUser?.name ?? 'User Account'}</span>
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
                        <span className="hero-badge">User purchase access</span>
                        <h2>Search the catalog, inspect a product, and buy available stock without admin tools.</h2>
                        <p>
                            Purchases automatically reduce inventory quantity, so the user side stays connected to
                            the live stock count.
                        </p>
                    </div>
                    <div className="stats-grid">
                        <StatCard label="Products Bought" value={purchaseSummary.productsBought} />
                        <StatCard
                            label="Last Purchase"
                            value={purchaseSummary.lastPurchaseAt ? formatStatDate(purchaseSummary.lastPurchaseAt) : 'Never'}
                            note={purchaseSummary.lastPurchaseProduct
                                ? `${purchaseSummary.lastPurchaseProduct} - ${currency.format(purchaseSummary.lastPurchaseAmount)}`
                                : 'No purchases yet'}
                        />
                        <StatCard label="Units Bought" value={purchaseSummary.unitsBought} />
                        <StatCard label="Money Spent" value={currency.format(totalSpent)} />
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
                                                        <button
                                                            type="button"
                                                            className="primary-button viewer-buy-button"
                                                            onClick={() => openPurchaseModal(product)}
                                                            disabled={product.quantity < 1}
                                                        >
                                                            {product.quantity < 1 ? 'Out of Stock' : 'Buy'}
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
                        <ProductDetails product={activeProduct} currency={currency} onBuy={() => openPurchaseModal(activeProduct)} />
                    ) : (
                        <div className="empty-state details-empty">
                            <strong>Select a product</strong>
                            <span>Choose any product to view its full details here.</span>
                        </div>
                    )}

                    <div className="details-description viewer-history-card">
                        <span>Recent purchases</span>
                        {purchaseHistory.length === 0 ? (
                            <p>You have not purchased any products yet.</p>
                        ) : (
                            <div className="report-mini-list">
                                {purchaseHistory.map((purchase) => (
                                    <div key={purchase.id} className="mini-row">
                                        <div>
                                            <strong>{purchase.product?.name ?? 'Product'}</strong>
                                            <small>{purchase.quantity} unit(s)</small>
                                        </div>
                                        <small>{currency.format(purchase.total_price)}</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            {purchaseTarget ? (
                <div className="modal-backdrop" onClick={closePurchaseModal}>
                    <div className="modal-card confirm-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">Purchase product</p>
                                <h3>Buy {purchaseTarget.name}</h3>
                            </div>
                        </div>

                        <form className="purchase-form" onSubmit={handlePurchase}>
                            <div className="detail-item">
                                <span>Unit price</span>
                                <strong>{currency.format(purchaseTarget.price)}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Available stock</span>
                                <strong>{purchaseTarget.quantity}</strong>
                            </div>
                            <label className="form-field form-field-wide">
                                <span>Quantity to buy</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={purchaseTarget.quantity}
                                    value={purchaseQuantity}
                                    onChange={(event) => setPurchaseQuantity(event.target.value)}
                                    required
                                />
                            </label>
                            <div className="details-description form-field-wide">
                                <span>Total</span>
                                <p className="purchase-total">{currency.format(purchaseTotal)}</p>
                            </div>
                            <div className="modal-actions form-field-wide">
                                <button className="ghost-button" type="button" onClick={closePurchaseModal} disabled={purchasing}>
                                    Cancel
                                </button>
                                <button className="primary-button" type="submit" disabled={purchasing || purchaseTarget.quantity < 1}>
                                    {purchasing ? 'Processing...' : 'Confirm Purchase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function StatCard({ label, value, note = null, warning = false }) {
    return (
        <article className={`stat-card${warning ? ' stat-card-warning' : ''}`}>
            <span>{label}</span>
            <strong>{value}</strong>
            {note ? <small>{note}</small> : null}
        </article>
    );
}

function ProductThumb({ product }) {
    if (product.image_url) {
        return <img src={product.image_url} alt={product.name} className="product-thumb" />;
    }

    return <div className="product-thumb product-thumb-fallback">{product.name.slice(0, 1).toUpperCase()}</div>;
}

function ProductDetails({ product, currency, onBuy }) {
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
                <DetailItem label="Status" value={product.quantity < 1 ? 'Out of Stock' : product.quantity < 5 ? 'Low Stock' : 'Available'} />
            </div>
            <div className="details-description">
                <span>Description</span>
                <p>{product.description || 'No description has been added yet.'}</p>
            </div>
            <button className="primary-button" type="button" onClick={onBuy} disabled={product.quantity < 1}>
                {product.quantity < 1 ? 'Out of Stock' : 'Buy Product'}
            </button>
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

function extractPurchaseError(error) {
    return error.response?.data?.errors?.quantity?.[0]
        || error.response?.data?.message
        || 'Unable to complete the purchase.';
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

function formatStatDate(value) {
    if (!value) {
        return 'Never';
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

createRoot(document.getElementById('app')).render(<UserApp />);
