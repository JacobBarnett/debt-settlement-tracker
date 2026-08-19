<?php

namespace App\Http\Requests;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Updates are partial, so every field is optional - but anything that is
     * present has to satisfy the same rules as on create.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                // Ignore this client's own row when checking uniqueness.
                Rule::unique(Client::class)->ignore($this->route('client')),
            ],
            'enrolled_debt' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'settled_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['enrolled', 'negotiating', 'settled', 'cancelled']),
            ],
        ];
    }
}
