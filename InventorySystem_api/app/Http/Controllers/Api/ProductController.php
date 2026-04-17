<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
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

    public function report(): JsonResponse
    {
        $products = Product::query()
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $serializedProducts = $products
            ->map(fn (Product $product) => $this->serializeProduct($product))
            ->values();

        $categoryBreakdown = $products
            ->groupBy(fn (Product $product) => $product->category ?: 'Uncategorized')
            ->map(function ($items, $category) {
                $units = (int) $items->sum('quantity');
                $value = (float) $items->sum(fn (Product $product) => (float) $product->price * $product->quantity);

                return [
                    'category' => $category,
                    'products' => $items->count(),
                    'units' => $units,
                    'value' => round($value, 2),
                ];
            })
            ->sortByDesc('value')
            ->values();

        $lowStockItems = $products
            ->filter(fn (Product $product) => $product->quantity < 5)
            ->sortBy('quantity')
            ->values()
            ->map(fn (Product $product) => $this->serializeProduct($product))
            ->values();

        $recentProducts = $products
            ->sortByDesc(fn (Product $product) => optional($product->date_added)?->timestamp ?? 0)
            ->take(5)
            ->values()
            ->map(fn (Product $product) => $this->serializeProduct($product))
            ->values();

        return response()->json([
            'summary' => array_merge($this->stats(), [
                'categories' => $categoryBreakdown->count(),
                'generatedAt' => now()->toIso8601String(),
            ]),
            'categoryBreakdown' => $categoryBreakdown,
            'lowStockItems' => $lowStockItems,
            'recentProducts' => $recentProducts,
            'products' => $serializedProducts,
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

    public function purchase(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $purchase = DB::transaction(function () use ($request, $product, $validated) {
            /** @var Product $lockedProduct */
            $lockedProduct = Product::query()->lockForUpdate()->findOrFail($product->id);
            $quantity = (int) $validated['quantity'];

            if ($lockedProduct->quantity < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => "Only {$lockedProduct->quantity} unit(s) are currently available.",
                ]);
            }

            $lockedProduct->decrement('quantity', $quantity);
            $lockedProduct->refresh();

            return Purchase::create([
                'user_id' => $request->user()->id,
                'product_id' => $lockedProduct->id,
                'quantity' => $quantity,
                'unit_price' => $lockedProduct->price,
                'total_price' => (float) $lockedProduct->price * $quantity,
                'purchased_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Purchase completed successfully.',
            'data' => [
                'purchase' => $this->serializePurchase($purchase->fresh('product')),
                'product' => $this->serializeProduct($purchase->product->fresh()),
            ],
            'stats' => $this->stats(),
        ]);
    }

    public function purchases(Request $request): JsonResponse
    {
        $latestPurchase = Purchase::query()
            ->with('product')
            ->where('user_id', $request->user()->id)
            ->latest('purchased_at')
            ->first();

        $purchases = Purchase::query()
            ->with('product')
            ->where('user_id', $request->user()->id)
            ->latest('purchased_at')
            ->limit(8)
            ->get()
            ->map(fn (Purchase $purchase) => $this->serializePurchase($purchase))
            ->values();

        return response()->json([
            'data' => $purchases,
            'summary' => [
                'productsBought' => (int) Purchase::query()
                    ->where('user_id', $request->user()->id)
                    ->distinct('product_id')
                    ->count('product_id'),
                'unitsBought' => (int) Purchase::query()
                    ->where('user_id', $request->user()->id)
                    ->sum('quantity'),
                'totalSpent' => (float) Purchase::query()
                    ->where('user_id', $request->user()->id)
                    ->sum('total_price'),
                'lastPurchaseAt' => optional($latestPurchase?->purchased_at)?->toIso8601String(),
                'lastPurchaseProduct' => $latestPurchase?->product?->name,
                'lastPurchaseAmount' => (float) ($latestPurchase?->total_price ?? 0),
            ],
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

    protected function serializePurchase(Purchase $purchase): array
    {
        return [
            'id' => $purchase->id,
            'quantity' => $purchase->quantity,
            'unit_price' => (float) $purchase->unit_price,
            'total_price' => (float) $purchase->total_price,
            'purchased_at' => optional($purchase->purchased_at)?->toISOString(),
            'product' => $purchase->relationLoaded('product') && $purchase->product
                ? $this->serializeProduct($purchase->product)
                : null,
        ];
    }
}
