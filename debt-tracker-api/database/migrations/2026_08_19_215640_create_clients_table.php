<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            // Money is stored as DECIMAL, never float, so cents stay exact.
            $table->decimal('enrolled_debt', 12, 2);
            $table->decimal('settled_amount', 12, 2)->default(0);
            $table->enum('status', ['enrolled', 'negotiating', 'settled', 'cancelled'])
                ->default('enrolled');
            $table->timestamps();

            // The dashboard lists by status, so support that filter up front.
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
