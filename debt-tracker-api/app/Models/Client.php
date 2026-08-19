<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    /** @use HasFactory<\Database\Factories\ClientFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'enrolled_debt',
        'settled_amount',
        'status',
    ];

    /**
     * Cast the money columns to float so JSON responses carry numbers rather
     * than the strings MySQL returns for DECIMAL.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enrolled_debt' => 'float',
            'settled_amount' => 'float',
        ];
    }

    /**
     * Share of the enrolled debt that has been settled, 0-100.
     */
    public function getProgressPercentageAttribute(): float
    {
        if ($this->enrolled_debt <= 0) {
            return 0.0;
        }

        $percentage = ($this->settled_amount / $this->enrolled_debt) * 100;

        // Bad data should never render a progress bar past the end of its track.
        return round(min($percentage, 100), 2);
    }

    /**
     * Dollars still owed on the enrolled debt.
     */
    public function getRemainingBalanceAttribute(): float
    {
        return round(max($this->enrolled_debt - $this->settled_amount, 0), 2);
    }
}
