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

        $response->assertRedirect(route('products.index'));
    }

    public function test_product_can_be_created(): void
    {
        $response = $this->post(route('products.store'), [
            'sku' => 'PRD-100',
            'name' => 'Mechanical Keyboard',
            'category' => 'Peripherals',
            'price' => '89.99',
            'quantity' => 12,
            'date_added' => '2026-04-08',
            'description' => 'RGB keyboard for gaming and work.',
        ]);

        $response->assertRedirect(route('products.index'));

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

        $response = $this->get(route('products.index', ['search' => 'Chair']));

        $response->assertOk();
        $response->assertSee('Office Chair');
        $response->assertDontSee('Desk Lamp');
    }
}
