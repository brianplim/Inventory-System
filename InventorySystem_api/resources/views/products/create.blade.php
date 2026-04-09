@extends('layouts.app')

@section('content')
    <div class="glass-card p-4 p-lg-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <p class="text-uppercase text-muted small mb-1">Create</p>
                <h1 class="h3 mb-0">Add New Product</h1>
            </div>
            <span class="badge badge-soft rounded-pill px-3 py-2">StockTrack</span>
        </div>

        <form action="{{ route('products.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            @php($buttonText = 'Save Product')
            @include('products._form', ['product' => null])
        </form>
    </div>
@endsection
