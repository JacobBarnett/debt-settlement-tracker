<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * A handful of realistic rows so the dashboard has something to show on a
     * fresh install.
     */
    public function run(): void
    {
        $clients = [
            ['name' => 'Marcus Hale', 'email' => 'marcus.hale@example.com', 'enrolled_debt' => 24800.00, 'settled_amount' => 9200.00, 'status' => 'negotiating'],
            ['name' => 'Priya Raman', 'email' => 'priya.raman@example.com', 'enrolled_debt' => 12400.00, 'settled_amount' => 12400.00, 'status' => 'settled'],
            ['name' => 'Devon Brooks', 'email' => 'devon.brooks@example.com', 'enrolled_debt' => 38150.50, 'settled_amount' => 4500.00, 'status' => 'enrolled'],
            ['name' => 'Ana Castillo', 'email' => 'ana.castillo@example.com', 'enrolled_debt' => 7600.00, 'settled_amount' => 2280.00, 'status' => 'negotiating'],
            ['name' => 'Tom Whitfield', 'email' => 'tom.whitfield@example.com', 'enrolled_debt' => 15900.00, 'settled_amount' => 0.00, 'status' => 'cancelled'],
        ];

        foreach ($clients as $client) {
            Client::updateOrCreate(['email' => $client['email']], $client);
        }
    }
}
