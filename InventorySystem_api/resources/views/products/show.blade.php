@extends('layouts.app')

@section('content')
    <div class="row g-4">
        <div class="col-lg-4">
            <div class="glass-card p-4 h-100">
                @if ($product->image_path)
                    <img src="{{ asset($product->image_path) }}" alt="{{ $product->name }}" class="img-fluid rounded-4 mb-4 w-100" style="aspect-ratio: 1 / 1; object-fit: cover;">
                @else
                    <div class="rounded-4 d-flex align-items-center justify-content-center mb-4" style="aspect-ratio: 1 / 1; background: linear-gradient(135deg, #d8eadc, #f3d9b7); font-size: 4rem; font-weight: 700; color: #123524;">
                        {{ strtoupper(substr($product->name, 0, 1)) }}
                    </div>
                @endif

                <span class="badge badge-soft rounded-pill px-3 py-2 mb-3">{{ $product->category ?: 'Uncategorized' }}</span>
                <h1 class="h3 mb-2">{{ $product->name }}</h1>
                <p class="text-muted mb-3">{{ $product->sku }}</p>
                <div class="d-flex gap-2">
                    <a href="{{ route('products.edit', $product) }}" class="btn btn-success">Edit Product</a>
                    <a href="{{ route('products.index') }}" class="btn btn-outline-secondary">Back</a>
                </div>
            </div>
        </div>

        <div class="col-lg-8">
            <div class="glass-card p-4 p-lg-5">
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="border rounded-4 p-3 bg-white h-100">
                            <div class="text-muted small">Price</div>
                            <div class="fs-4 fw-bold">${{ number_format((float) $product->price, 2) }}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="border rounded-4 p-3 h-100 {{ $product->quantity < 5 ? 'danger-soft' : 'bg-white' }}">
                            <div class="text-muted small">Quantity</div>
                            <div class="fs-4 fw-bold">{{ $product->quantity }}</div>
                            @if ($product->quantity < 5)
                                <div class="small text-danger">Restock recommended soon.</div>
                            @endif
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="border rounded-4 p-3 bg-white h-100">
                            <div class="text-muted small">Date Added</div>
                            <div class="fw-semibold">{{ $product->date_added->format('F d, Y') }}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="border rounded-4 p-3 bg-white h-100">
                            <div class="text-muted small">Stock Status</div>
                            <div class="fw-semibold">{{ $product->quantity < 5 ? 'Low Stock' : 'Available' }}</div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="border rounded-4 p-4 bg-white h-100">
                            <div class="text-muted small mb-2">Description</div>
                            <div class="mb-0">{{ $product->description ?: 'No description added for this product yet.' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
