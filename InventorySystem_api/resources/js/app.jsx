import './bootstrap';
import '../css/app.css';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
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
    const authUser = window.StockTrackAuth ?? null;
    const [view, setView] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockProducts: 0,
        totalUnits: 0,
        inventoryValue: 0,
    });
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeProduct, setActiveProduct] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const [deleting, setDeleting] = useState(false);

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

    useEffect(() => {
        if (view === 'reports' && !report && !reportLoading) {
            void loadReport();
        }
    }, [view, report, reportLoading]);

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

    async function loadReport() {
        setReportLoading(true);

        try {
            const response = await window.axios.get('/api/products/report');
            setReport(response.data);
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractErrorMessage(error, 'Unable to generate the inventory report.'),
            });
        } finally {
            setReportLoading(false);
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

            if (view === 'reports' || report) {
                await loadReport();
            }
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

    function openDeletePrompt(product) {
        setDeleteTarget(product);
    }

    function closeDeletePrompt() {
        if (deleting) {
            return;
        }

        setDeleteTarget(null);
    }

    async function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);

        try {
            const response = await window.axios.delete(`/api/products/${deleteTarget.id}`);
            setMessage({ type: 'success', text: response.data.message });

            if (activeProduct?.id === deleteTarget.id) {
                setActiveProduct(null);
            }

            const shouldGoBack = products.length === 1 && page > 1;
            const nextPage = shouldGoBack ? page - 1 : page;
            setPage(nextPage);
            setDeleteTarget(null);
            await loadProducts(nextPage, deferredSearch);

            if (view === 'reports' || report) {
                await loadReport();
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: extractErrorMessage(error, 'Unable to delete the product.'),
            });
        } finally {
            setDeleting(false);
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

    function handleOpenReports() {
        setView('reports');
        void loadReport();
    }

    function handleExportCsv() {
        if (!report?.products?.length) {
            setMessage({
                type: 'error',
                text: 'Generate the report first so there is data to export.',
            });
            return;
        }

        const rows = [
            ['SKU', 'Name', 'Category', 'Price', 'Quantity', 'Inventory Value', 'Date Added', 'Status'],
            ...report.products.map((product) => [
                escapeCsv(product.sku),
                escapeCsv(product.name),
                escapeCsv(product.category || 'Uncategorized'),
                Number(product.price).toFixed(2),
                product.quantity,
                (Number(product.price) * Number(product.quantity)).toFixed(2),
                product.date_added || '',
                product.quantity < 5 ? 'Low Stock' : 'Available',
            ]),
        ];

        const csvContent = rows.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    function handlePrintReport() {
        if (!report) {
            setMessage({
                type: 'error',
                text: 'Generate the report first so there is something to print.',
            });
            return;
        }

        const printable = window.open('', '_blank', 'width=1100,height=800');

        if (!printable) {
            setMessage({
                type: 'error',
                text: 'Your browser blocked the print preview window.',
            });
            return;
        }

        printable.document.write(buildPrintableReport(report, currency));
        printable.document.close();
        printable.focus();
        printable.print();
    }

    return (
        <div className="app-shell">
            <div className="app-backdrop" />
            <header className="topbar">
                <div>
                    <p className="eyebrow">React Frontend</p>
                    <h1>StockTrack Inventory Hub</h1>
                </div>
                <div className="topbar-actions">
                    <p className="topbar-copy">
                        Monitor products, generate inventory reports, and manage stock from one workspace.
                    </p>
                    <div className="session-chip">
                        <span>{authUser?.name ?? 'Admin User'}</span>
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
                        <span className="hero-badge">Inventory command center</span>
                        <h2>Track stock movement, surface risks, and turn live inventory into decision-ready reports.</h2>
                        <p>
                            Use the dashboard for daily product management, then switch to reports when you need a
                            printable summary for audits, meetings, or operations reviews.
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
                    <div className="panel workspace-toolbar">
                        <div className="workspace-nav">
                            <button
                                className={`workspace-tab${view === 'dashboard' ? ' workspace-tab-active' : ''}`}
                                type="button"
                                onClick={() => setView('dashboard')}
                            >
                                Dashboard
                            </button>
                            <button
                                className={`workspace-tab${view === 'reports' ? ' workspace-tab-active' : ''}`}
                                type="button"
                                onClick={handleOpenReports}
                            >
                                Reports
                            </button>
                        </div>

                        {view === 'dashboard' ? (
                            <div className="toolbar">
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
                                <div className="toolbar-actions">
                                    <button className="ghost-button" type="button" onClick={handleOpenReports}>
                                        Generate Report
                                    </button>
                                    <button className="primary-button" type="button" onClick={openCreateForm}>
                                        Add Product
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="report-toolbar">
                                <div>
                                    <p className="eyebrow">Inventory reports</p>
                                    <h3>Business view</h3>
                                </div>
                                <div className="toolbar-actions">
                                    <button className="ghost-button" type="button" onClick={() => void loadReport()} disabled={reportLoading}>
                                        {reportLoading ? 'Refreshing...' : 'Refresh Report'}
                                    </button>
                                    <button className="ghost-button" type="button" onClick={handleExportCsv}>
                                        Export CSV
                                    </button>
                                    <button className="primary-button" type="button" onClick={handlePrintReport}>
                                        Print Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {message ? <FlashMessage message={message} /> : null}

                    {view === 'dashboard' ? (
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
                                                            <button type="button" className="danger-button" onClick={() => openDeletePrompt(product)}>Delete</button>
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
                    ) : (
                        <ReportsPanel
                            report={report}
                            loading={reportLoading}
                            currency={currency}
                            onInspectProduct={handleSelectProduct}
                        />
                    )}
                </section>

                <aside className="panel details-panel">
                    {view === 'dashboard' ? (
                        <>
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
                        </>
                    ) : (
                        <ReportSidebar report={report} loading={reportLoading} currency={currency} />
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

            {deleteTarget ? (
                <div className="modal-backdrop" onClick={closeDeletePrompt}>
                    <div className="modal-card confirm-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">Delete product</p>
                                <h3>Remove this item?</h3>
                            </div>
                        </div>
                        <p className="confirm-copy">
                            You are about to delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
                        </p>
                        <div className="modal-actions confirm-actions">
                            <button className="ghost-button" type="button" onClick={closeDeletePrompt} disabled={deleting}>
                                Cancel
                            </button>
                            <button className="primary-button danger-button-solid" type="button" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Product'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function ReportsPanel({ report, loading, currency, onInspectProduct }) {
    if (loading) {
        return <section className="panel inventory-table-wrap"><div className="empty-state">Generating report...</div></section>;
    }

    if (!report) {
        return (
            <section className="panel inventory-table-wrap">
                <div className="empty-state">
                    <strong>No report data yet.</strong>
                    <span>Use Generate Report to build your latest inventory summary.</span>
                </div>
            </section>
        );
    }

    return (
        <section className="report-grid">
            <article className="panel report-summary-card">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Executive summary</p>
                        <h3>Inventory snapshot</h3>
                    </div>
                    <span className="table-meta">Generated {formatDateTime(report.summary.generatedAt)}</span>
                </div>
                <div className="report-kpi-grid">
                    <ReportKpi label="Total products" value={report.summary.totalProducts} />
                    <ReportKpi label="Categories" value={report.summary.categories} />
                    <ReportKpi label="Units on hand" value={report.summary.totalUnits} />
                    <ReportKpi label="Inventory value" value={currency.format(report.summary.inventoryValue)} />
                </div>
            </article>

            <article className="panel report-chart-card">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Category mix</p>
                        <h3>Value by category</h3>
                    </div>
                </div>
                <div className="category-bars">
                    {report.categoryBreakdown.length === 0 ? (
                        <div className="empty-state compact-empty">No categories yet.</div>
                    ) : (
                        report.categoryBreakdown.map((item) => (
                            <CategoryBar key={item.category} item={item} currency={currency} maxValue={report.categoryBreakdown[0]?.value || 1} />
                        ))
                    )}
                </div>
            </article>

            <article className="panel report-table-card">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Restock watch</p>
                        <h3>Low stock items</h3>
                    </div>
                    <span className="table-meta">{report.lowStockItems.length} flagged</span>
                </div>
                {report.lowStockItems.length === 0 ? (
                    <div className="empty-state compact-empty">
                        <strong>Great shape.</strong>
                        <span>No items are below the low stock threshold.</span>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table className="inventory-table report-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Qty</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.lowStockItems.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <button type="button" className="product-cell" onClick={() => onInspectProduct(product.id)}>
                                                <ProductThumb product={product} />
                                                <span>
                                                    <strong>{product.name}</strong>
                                                    <small>{product.sku}</small>
                                                </span>
                                            </button>
                                        </td>
                                        <td>{product.category || 'Uncategorized'}</td>
                                        <td><span className="quantity-pill">{product.quantity}</span></td>
                                        <td>{currency.format(product.price * product.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>

            <article className="panel report-table-card">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Full listing</p>
                        <h3>Printable inventory register</h3>
                    </div>
                    <span className="table-meta">{report.products.length} rows</span>
                </div>
                <div className="table-scroll">
                    <table className="inventory-table report-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th>Date Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.products.map((product) => (
                                <tr key={product.id} className={product.quantity < 5 ? 'is-low-stock' : ''}>
                                    <td>{product.sku}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category || 'Uncategorized'}</td>
                                    <td>{currency.format(product.price)}</td>
                                    <td>{product.quantity}</td>
                                    <td>{currency.format(product.price * product.quantity)}</td>
                                    <td>{formatDate(product.date_added)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </article>
        </section>
    );
}

function ReportSidebar({ report, loading, currency }) {
    if (loading) {
        return <div className="empty-state details-empty">Preparing report insights...</div>;
    }

    if (!report) {
        return (
            <div className="empty-state details-empty">
                <strong>Report preview</strong>
                <span>Generate a report to see operational highlights here.</span>
            </div>
        );
    }

    const highestCategory = report.categoryBreakdown[0] ?? null;

    return (
        <div className="report-sidebar">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Business view</p>
                    <h3>Report highlights</h3>
                </div>
            </div>

            <article className="insight-card">
                <span>Highest value category</span>
                <strong>{highestCategory?.category ?? 'No data yet'}</strong>
                <p>{highestCategory ? currency.format(highestCategory.value) : 'Add products to unlock category insights.'}</p>
            </article>

            <article className="insight-card">
                <span>Restock urgency</span>
                <strong>{report.lowStockItems.length} items need attention</strong>
                <p>
                    {report.lowStockItems.length > 0
                        ? 'These products are below the low-stock threshold and should be reviewed soon.'
                        : 'No urgent restocks at the moment.'}
                </p>
            </article>

            <div className="details-description">
                <span>Recently added</span>
                <div className="report-mini-list">
                    {report.recentProducts.map((product) => (
                        <div key={product.id} className="mini-row">
                            <strong>{product.name}</strong>
                            <small>{formatDate(product.date_added)}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ReportKpi({ label, value }) {
    return (
        <article className="report-kpi">
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}

function CategoryBar({ item, currency, maxValue }) {
    const width = Math.max(14, Math.round((item.value / maxValue) * 100));

    return (
        <div className="category-bar">
            <div className="category-bar-copy">
                <strong>{item.category}</strong>
                <small>{item.products} products • {item.units} units</small>
            </div>
            <div className="category-bar-track">
                <div className="category-bar-fill" style={{ width: `${width}%` }} />
            </div>
            <span>{currency.format(item.value)}</span>
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

function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function escapeCsv(value) {
    const stringValue = String(value ?? '');
    return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildPrintableReport(report, currency) {
    const rows = report.products
        .map(
            (product) => `
                <tr>
                    <td>${escapeHtml(product.sku)}</td>
                    <td>${escapeHtml(product.name)}</td>
                    <td>${escapeHtml(product.category || 'Uncategorized')}</td>
                    <td>${currency.format(product.price)}</td>
                    <td>${product.quantity}</td>
                    <td>${currency.format(product.price * product.quantity)}</td>
                    <td>${escapeHtml(formatDate(product.date_added))}</td>
                </tr>`,
        )
        .join('');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>StockTrack Inventory Report</title>
        <style>
            body { font-family: Arial, sans-serif; color: #173328; padding: 32px; }
            h1, h2 { margin: 0 0 12px; }
            .meta { color: #5a6c62; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
            .card { border: 1px solid #d6ddd7; border-radius: 12px; padding: 16px; }
            .card span { display: block; color: #5a6c62; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #e4e8e5; padding: 10px; text-align: left; }
            th { text-transform: uppercase; font-size: 12px; color: #5a6c62; letter-spacing: 0.08em; }
        </style>
    </head>
    <body>
        <h1>StockTrack Inventory Report</h1>
        <p class="meta">Generated ${escapeHtml(formatDateTime(report.summary.generatedAt))}</p>
        <div class="grid">
            <div class="card"><span>Total products</span><strong>${report.summary.totalProducts}</strong></div>
            <div class="card"><span>Categories</span><strong>${report.summary.categories}</strong></div>
            <div class="card"><span>Units on hand</span><strong>${report.summary.totalUnits}</strong></div>
            <div class="card"><span>Inventory value</span><strong>${currency.format(report.summary.inventoryValue)}</strong></div>
        </div>
        <h2>Inventory Register</h2>
        <table>
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Date Added</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </body>
    </html>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

createRoot(document.getElementById('app')).render(<App />);
