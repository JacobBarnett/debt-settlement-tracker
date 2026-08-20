<?php

namespace App\Http\Requests;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    /**
     * No auth layer yet, so every caller is allowed through. This is the hook
     * where a policy check belongs once authentication is added.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(Client::class)],
            'enrolled_debt' => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            // 'sometimes' rather than 'nullable': both columns are NOT NULL with a
            // database default, so an omitted field is fine but an explicit null
            // has to be rejected here instead of failing at insert time.
            'settled_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                // A client cannot have settled more than they enrolled.
                'lte:enrolled_debt',
            ],
            'status' => [
                'sometimes',
                Rule::in(['enrolled', 'negotiating', 'settled', 'cancelled']),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'enrolled_debt.min' => 'The enrolled debt must be greater than zero.',
            'settled_amount.lte' => 'The settled amount cannot exceed the enrolled debt.',
        ];
    }
}
