<?php

namespace App\Http\Requests;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'settled_amount' => ['sometimes', 'numeric', 'min:0'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['enrolled', 'negotiating', 'settled', 'cancelled']),
            ],
        ];
    }

    /**
     * Enforce the settled/enrolled relationship across a partial update.
     *
     * A plain 'lte:enrolled_debt' rule is not enough here: either field may be
     * absent from the payload, in which case the comparison has to fall back to
     * the value already stored on the client.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $client = $this->route('client');

            if (! $client instanceof Client) {
                return;
            }

            // If either field already failed its own rules, the comparison
            // below would only add a confusing second error.
            if ($validator->errors()->hasAny(['enrolled_debt', 'settled_amount'])) {
                return;
            }

            $enrolledDebt = (float) $this->input('enrolled_debt', $client->enrolled_debt);
            $settledAmount = (float) $this->input('settled_amount', $client->settled_amount);

            if ($settledAmount > $enrolledDebt) {
                $validator->errors()->add(
                    'settled_amount',
                    'The settled amount cannot exceed the enrolled debt.',
                );
            }
        });
    }
}
