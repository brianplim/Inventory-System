<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_page_loads(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('StockTrack React Inventory');
    }

    public function test_product_can_be_created(): void
    {
        $response = $this->postJson('/api/products', [
            'sku' => 'PRD-100',
            'name' => 'Mechanical Keyboard',
            'category' => 'Peripherals',
            'price' => '89.99',
            'quantity' => 12,
            'date_added' => '2026-04-08',
            'description' => 'RGB keyboard for gaming and work.',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.sku', 'PRD-100');

        $this->assertDatabaseHas('products', [
            'sku' => 'PRD-100',
            'name' => 'Mechanical Keyboard',
            'category' => 'Peripherals',
            'quantity' => 12,
        ]);
    }

    public function test_products_can_be_searched(): void
    {
        \App\Models\Product::create([
            'sku' => 'PRD-200',
            'name' => 'Office Chair',
            'category' => 'Furniture',
            'price' => 149.99,
            'quantity' => 3,
            'date_added' => '2026-04-07',
        ]);

        \App\Models\Product::create([
            'sku' => 'PRD-201',
            'name' => 'Desk Lamp',
            'category' => 'Lighting',
            'price' => 25.50,
            'quantity' => 9,
            'date_added' => '2026-04-06',
        ]);

        $response = $this->getJson('/api/products?search=Chair');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Office Chair');
    }
}
