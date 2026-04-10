<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $products = Product::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('date_added')
            ->orderBy('name')
            ->paginate(9)
            ->withQueryString();

        return response()->json([
            'data' => $products->getCollection()->map(fn (Product $product) => $this->serializeProduct($product))->values(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'stats' => $this->stats(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProduct($request);
        $validated['image_path'] = $this->storeImage($request);

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Product added successfully.',
            'data' => $this->serializeProduct($product->fresh()),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeProduct($product),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validateProduct($request, $product);

        if ($request->boolean('remove_image') && $product->image_path) {
            $this->deleteImage($product->image_path);
            $validated['image_path'] = null;
        }

        $newImagePath = $this->storeImage($request);

        if ($newImagePath) {
            $this->deleteImage($product->image_path);
            $validated['image_path'] = $newImagePath;
        }

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $this->serializeProduct($product->fresh()),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->deleteImage($product->image_path);
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }

    protected function validateProduct(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'sku' => [
                'required',
                'string',
                'max:50',
                Rule::unique('products', 'sku')->ignore($product?->id),
            ],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'min:0'],
            'date_added' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:512000'],
            'remove_image' => ['nullable', 'boolean'],
        ]);
    }

    protected function storeImage(Request $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        $directory = public_path('uploads/products');
        File::ensureDirectoryExists($directory);

        $file = $request->file('image');
        $filename = uniqid('product_', true).'.'.$file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/products/'.$filename;
    }

    protected function deleteImage(?string $imagePath): void
    {
        if (! $imagePath) {
            return;
        }

        $absolutePath = public_path($imagePath);

        if (File::exists($absolutePath)) {
            File::delete($absolutePath);
        }
    }

    protected function stats(): array
    {
        return [
            'totalProducts' => Product::count(),
            'lowStockProducts' => Product::where('quantity', '<', 5)->count(),
            'totalUnits' => Product::sum('quantity'),
            'inventoryValue' => (float) Product::selectRaw('COALESCE(SUM(price * quantity), 0) as total')->value('total'),
        ];
    }

    protected function serializeProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'category' => $product->category,
            'price' => (float) $product->price,
            'quantity' => $product->quantity,
            'date_added' => optional($product->date_added)->format('Y-m-d'),
            'description' => $product->description,
            'image_path' => $product->image_path,
            'image_url' => $product->image_path ? URL::to($product->image_path) : null,
            'created_at' => optional($product->created_at)?->toISOString(),
            'updated_at' => optional($product->updated_at)?->toISOString(),
        ];
    }
}
