<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ClientController extends Controller
{
    /**
     * GET /api/clients
     */
    public function index(): AnonymousResourceCollection
    {
        $clients = Client::query()->latest()->get();

        return ClientResource::collection($clients);
    }

    /**
     * POST /api/clients
     *
     * Validation lives in StoreClientRequest, so by the time this runs the
     * payload is already known to be good.
     */
    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = Client::create($request->validated());

        return ClientResource::make($client)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * GET /api/clients/{client}
     */
    public function show(Client $client): ClientResource
    {
        return ClientResource::make($client);
    }

    /**
     * PUT/PATCH /api/clients/{client}
     */
    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $client->update($request->validated());

        return ClientResource::make($client);
    }

    /**
     * DELETE /api/clients/{client}
     */
    public function destroy(Client $client): Response
    {
        $client->delete();

        return response()->noContent();
    }
}
