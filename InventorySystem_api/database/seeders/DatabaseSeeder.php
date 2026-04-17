<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate([
            'email' => 'admin@stocktrack.test',
        ], [
            'name' => 'StockTrack Admin',
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);

        User::query()->updateOrCreate([
            'role' => 'viewer',
        ], [
            'email' => 'user@stocktrack.test',
            'name' => 'StockTrack User',
            'password' => Hash::make('password123'),
        ]);
    }
}
