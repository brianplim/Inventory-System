@extends('layouts.app')

@section('content')
    <div class="glass-card p-4 p-lg-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <p class="text-uppercase text-muted small mb-1">Update</p>
                <h1 class="h3 mb-0">Edit Product</h1>
            </div>
            <span class="badge badge-soft rounded-pill px-3 py-2">{{ $product->sku }}</span>
        </div>

        <form action="{{ route('products.update', $product) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            @php($buttonText = 'Update Product')
            @include('products._form', ['product' => $product])
        </form>
    </div>
@endsection
