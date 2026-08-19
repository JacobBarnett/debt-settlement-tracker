<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Client
 */
class ClientResource extends JsonResource
{
    /**
     * Shape the JSON the frontend consumes. Accessors are exposed here so the
     * client never recalculates progress itself.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'enrolled_debt' => (float) $this->enrolled_debt,
            'settled_amount' => (float) $this->settled_amount,
            'remaining_balance' => $this->remaining_balance,
            'progress_percentage' => $this->progress_percentage,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
