<?php

namespace Tests\Unit;

use App\Models\Client;
use PHPUnit\Framework\TestCase;

class ClientProgressTest extends TestCase
{
    public function test_it_calculates_progress_percentage(): void
    {
        $client = new Client(['enrolled_debt' => 20000, 'settled_amount' => 5000]);

        $this->assertSame(25.0, $client->progress_percentage);
        $this->assertSame(15000.0, $client->remaining_balance);
    }

    public function test_it_caps_progress_at_one_hundred_percent(): void
    {
        // Guards the progress bar against bad data overflowing its track.
        $client = new Client(['enrolled_debt' => 1000, 'settled_amount' => 2500]);

        $this->assertSame(100.0, $client->progress_percentage);
        $this->assertSame(0.0, $client->remaining_balance);
    }

    public function test_it_handles_zero_enrolled_debt_without_dividing_by_zero(): void
    {
        $client = new Client(['enrolled_debt' => 0, 'settled_amount' => 0]);

        $this->assertSame(0.0, $client->progress_percentage);
    }
}
