<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $enrolledDebt = $this->faker->randomFloat(2, 2500, 60000);

        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'enrolled_debt' => $enrolledDebt,
            // Settled somewhere between nothing and most of the balance.
            'settled_amount' => $this->faker->randomFloat(2, 0, $enrolledDebt * 0.8),
            'status' => $this->faker->randomElement([
                'enrolled',
                'negotiating',
                'settled',
                'cancelled',
            ]),
        ];
    }
}
