<?php

namespace Tests\Feature;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_client_with_valid_data(): void
    {
        $response = $this->postJson('/api/clients', [
            'name' => 'Marcus Hale',
            'email' => 'marcus.hale@example.com',
            'enrolled_debt' => 24800.00,
            'settled_amount' => 9200.00,
            'status' => 'negotiating',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Marcus Hale')
            // json_decode turns a whole-number float into an int, so compare
            // numerically rather than with assertJsonPath's strict ===.
            ->assertJsonPath('data.enrolled_debt', fn ($value) => (float) $value === 24800.0)
            ->assertJsonPath('data.settled_amount', fn ($value) => (float) $value === 9200.0)
            ->assertJsonPath('data.status', 'negotiating')
            // 9200 / 24800 = 37.10%, calculated by the model accessor.
            ->assertJsonPath('data.progress_percentage', 37.1)
            ->assertJsonPath('data.remaining_balance', fn ($value) => (float) $value === 15600.0);

        $this->assertDatabaseHas('clients', [
            'email' => 'marcus.hale@example.com',
            'enrolled_debt' => 24800.00,
        ]);
    }

    public function test_it_rejects_invalid_client_data(): void
    {
        $response = $this->postJson('/api/clients', [
            'name' => '',
            'email' => 'not-an-email',
            'enrolled_debt' => -500,
            'settled_amount' => 'abc',
            'status' => 'bogus-status',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'enrolled_debt',
                'settled_amount',
                'status',
            ]);

        $this->assertDatabaseCount('clients', 0);
    }

    public function test_it_rejects_a_settled_amount_above_the_enrolled_debt(): void
    {
        $response = $this->postJson('/api/clients', [
            'name' => 'Over Settled',
            'email' => 'over.settled@example.com',
            'enrolled_debt' => 5000,
            'settled_amount' => 6000,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['settled_amount']);
    }

    public function test_it_rejects_a_duplicate_email(): void
    {
        Client::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/clients', [
            'name' => 'Second Signup',
            'email' => 'taken@example.com',
            'enrolled_debt' => 1000,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_it_lists_clients(): void
    {
        Client::factory()->count(3)->create();

        $response = $this->getJson('/api/clients');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    [
                        'id',
                        'name',
                        'email',
                        'enrolled_debt',
                        'settled_amount',
                        'remaining_balance',
                        'progress_percentage',
                        'status',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);
    }

    public function test_it_updates_a_client(): void
    {
        $client = Client::factory()->create([
            'enrolled_debt' => 10000,
            'settled_amount' => 2500,
            'status' => 'enrolled',
        ]);

        $response = $this->putJson("/api/clients/{$client->id}", [
            'settled_amount' => 10000,
            'status' => 'settled',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'settled')
            ->assertJsonPath('data.progress_percentage', fn ($value) => (float) $value === 100.0);
    }

    public function test_it_deletes_a_client(): void
    {
        $client = Client::factory()->create();

        $this->deleteJson("/api/clients/{$client->id}")->assertNoContent();

        $this->assertDatabaseMissing('clients', ['id' => $client->id]);
    }
}
