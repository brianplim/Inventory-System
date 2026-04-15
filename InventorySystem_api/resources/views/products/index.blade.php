@extends('layouts.app')

@section('content')
    <section class="hero-card p-4 p-lg-5 mb-4">
        <div class="row align-items-center g-4">
            <div class="col-lg-7">
                <p class="text-uppercase text-muted small mb-2">Dashboard</p>
                <h1 class="display-6 fw-bold mb-3">Stay in control of every product in your inventory.</h1>
                <p class="text-muted mb-0">Track stock levels, search products quickly, and keep your catalog organized with a clean Laravel CRUD workflow.</p>
            </div>
            <div class="col-lg-5">
                <div class="row g-3">
                    <div class="col-6">
                        <div class="stat-chip p-3 h-100">
                            <div class="text-muted small">Products</div>
                            <div class="fs-3 fw-bold">{{ $stats['totalProducts'] }}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-chip p-3 h-100 {{ $stats['lowStockProducts'] > 0 ? 'low-stock' : '' }}">
                            <div class="text-muted small">Low Stock</div>
                            <div class="fs-3 fw-bold">{{ $stats['lowStockProducts'] }}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-chip p-3 h-100">
                            <div class="text-muted small">Units</div>
                            <div class="fs-3 fw-bold">{{ $stats['totalUnits'] }}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-chip p-3 h-100">
                            <div class="text-muted small">Inventory Value</div>
                            <div class="fs-5 fw-bold">${{ number_format((float) $stats['inventoryValue'], 2) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="row">
        <div class="col-12 col-lg-9 col-xl-8">
            <section class="glass-card px-4 pt-3 pb-4 mb-4">
                <div class="row gx-3 gy-3 align-items-end">
                    <div class="col-lg-8">
                        <form action="{{ route('products.index') }}" method="GET" class="row gx-2 gy-2 align-items-end">
                            <div class="col-md">
                                <label class="form-label" for="search">Search Products</label>
                                <input id="search" type="text" name="search" class="form-control" value="{{ $search }}" placeholder="Search by product name, SKU, or category">
                            </div>
                            <div class="col-md-auto d-flex align-items-end gap-2">
                                <button type="submit" class="btn btn-dark flex-grow-1">Search</button>
                                @if ($search !== '')
                                    <a href="{{ route('products.index') }}" class="btn btn-outline-secondary">Clear</a>
                                @endif
                            </div>
                        </form>
                    </div>
                    <div class="col-lg-4 text-lg-end">
                        <a href="{{ route('products.create') }}" class="btn btn-success px-4">Add Product</a>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <section class="glass-card overflow-hidden">
        <div class="table-responsive">
            <table class="table align-middle mb-0">
                <thead>
                    <tr>
                        <th class="ps-4">Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Date Added</th>
                        <th class="text-end pe-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($products as $product)
                        <tr class="{{ $product->quantity < 5 ? 'low-stock' : '' }}">
                            <td class="ps-4">
                                <div class="d-flex align-items-center gap-3">
                                    @if ($product->image_path)
                                        <img src="{{ asset($product->image_path) }}" alt="{{ $product->name }}" class="product-thumb">
                                    @else
                                        <div class="product-placeholder">{{ strtoupper(substr($product->name, 0, 1)) }}</div>
                                    @endif
                                    <div>
                                        <div class="fw-semibold">{{ $product->name }}</div>
                                        <div class="text-muted small">{{ $product->sku }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{{ $product->category ?: 'Uncategorized' }}</td>
                            <td>${{ number_format((float) $product->price, 2) }}</td>
                            <td>
                                <span class="fw-semibold">{{ $product->quantity }}</span>
                                @if ($product->quantity < 5)
                                    <span class="badge text-dark ms-2" style="background-color: #f7d57d;">Low stock</span>
                                @endif
                            </td>
                            <td>{{ $product->date_added->format('M d, Y') }}</td>
                            <td class="text-end pe-4">
                                <a href="{{ route('products.show', $product) }}" class="btn btn-sm btn-outline-dark">View</a>
                                <a href="{{ route('products.edit', $product) }}" class="btn btn-sm btn-outline-success">Edit</a>
                                <form action="{{ route('products.destroy', $product) }}" method="POST" class="d-inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger" onclick="return confirm('Delete this product?')">Delete</button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center py-5">
                                <div class="fw-semibold mb-1">No products found.</div>
                                <div class="text-muted">Add your first item to start building the inventory.</div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <div class="mt-4">
        {{ $products->links() }}
    </div>
@endsection
