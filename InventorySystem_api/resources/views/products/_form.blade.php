<div class="row g-4">
    <div class="col-md-6">
        <label class="form-label" for="sku">SKU</label>
        <input id="sku" type="text" name="sku" class="form-control @error('sku') is-invalid @enderror" value="{{ old('sku', $product->sku ?? '') }}" placeholder="PRD-001" required>
        @error('sku')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-6">
        <label class="form-label" for="name">Product Name</label>
        <input id="name" type="text" name="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', $product->name ?? '') }}" placeholder="Wireless Mouse" required>
        @error('name')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-4">
        <label class="form-label" for="category">Category</label>
        <input id="category" type="text" name="category" class="form-control @error('category') is-invalid @enderror" value="{{ old('category', $product->category ?? '') }}" placeholder="Accessories">
        @error('category')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-4">
        <label class="form-label" for="price">Price</label>
        <div class="input-group">
            <span class="input-group-text">$</span>
            <input id="price" type="number" step="0.01" min="0" name="price" class="form-control @error('price') is-invalid @enderror" value="{{ old('price', isset($product) ? number_format((float) $product->price, 2, '.', '') : '') }}" required>
        </div>
        @error('price')
            <div class="invalid-feedback d-block">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-4">
        <label class="form-label" for="quantity">Quantity</label>
        <input id="quantity" type="number" min="0" name="quantity" class="form-control @error('quantity') is-invalid @enderror" value="{{ old('quantity', $product->quantity ?? 0) }}" required>
        @error('quantity')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-6">
        <label class="form-label" for="date_added">Date Added</label>
        <input id="date_added" type="date" name="date_added" class="form-control @error('date_added') is-invalid @enderror" value="{{ old('date_added', isset($product) && $product->date_added ? $product->date_added->format('Y-m-d') : now()->format('Y-m-d')) }}" required>
        @error('date_added')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-6">
        <label class="form-label" for="image">Product Image</label>
        <input id="image" type="file" name="image" class="form-control @error('image') is-invalid @enderror" accept="image/*">
        @error('image')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror

        @if (! empty($product?->image_path))
            <div class="form-check mt-2">
                <input class="form-check-input" type="checkbox" name="remove_image" value="1" id="remove_image">
                <label class="form-check-label" for="remove_image">Remove current image</label>
            </div>
        @endif
    </div>

    <div class="col-12">
        <label class="form-label" for="description">Description</label>
        <textarea id="description" name="description" rows="4" class="form-control @error('description') is-invalid @enderror" placeholder="Short product notes, supplier details, or usage info">{{ old('description', $product->description ?? '') }}</textarea>
        @error('description')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>
</div>

<div class="mt-4 d-flex gap-2">
    <button type="submit" class="btn btn-success px-4">{{ $buttonText }}</button>
    <a href="{{ route('products.index') }}" class="btn btn-outline-secondary">Cancel</a>
</div>
