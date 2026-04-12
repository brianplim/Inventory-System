<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }

    public function test_admin_can_open_admin_page(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk();
        $response->assertSee('StockTrack React Inventory');
    }

    public function test_viewer_can_open_viewer_page(): void
    {
        $viewer = User::factory()->create([
            'role' => 'viewer',
        ]);

        $response = $this->actingAs($viewer)->get('/viewer');

        $response->assertOk();
        $response->assertSee('StockTrack Product Viewer');
    }

    public function test_login_redirects_users_to_their_role_dashboard(): void
    {
        User::create([
            'name' => 'Viewer Account',
            'email' => 'viewer@example.com',
            'role' => 'viewer',
            'password' => Hash::make('secret123'),
        ]);

        $response = $this->post('/login', [
            'email' => 'viewer@example.com',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/viewer');
        $this->assertAuthenticated();
    }

    public function test_admin_can_create_a_product(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin)->postJson('/api/products', [
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

    public function test_viewer_cannot_create_a_product(): void
    {
        $viewer = User::factory()->create([
            'role' => 'viewer',
        ]);

        $response = $this->actingAs($viewer)->postJson('/api/products', [
            'sku' => 'PRD-100',
            'name' => 'Mechanical Keyboard',
            'price' => '89.99',
            'quantity' => 12,
            'date_added' => '2026-04-08',
        ]);

        $response->assertForbidden();
    }

    public function test_authenticated_users_can_search_products(): void
    {
        $viewer = User::factory()->create([
            'role' => 'viewer',
        ]);

        Product::create([
            'sku' => 'PRD-200',
            'name' => 'Office Chair',
            'category' => 'Furniture',
            'price' => 149.99,
            'quantity' => 3,
            'date_added' => '2026-04-07',
        ]);

        Product::create([
            'sku' => 'PRD-201',
            'name' => 'Desk Lamp',
            'category' => 'Lighting',
            'price' => 25.50,
            'quantity' => 9,
            'date_added' => '2026-04-06',
        ]);

        $response = $this->actingAs($viewer)->getJson('/api/products?search=Chair');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Office Chair');
    }
}
