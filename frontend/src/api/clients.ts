import { CLIENTS_API_URL } from "./config";
import { ValidationError, type Client, type NewClient } from "../types";

/** Laravel API Resources wrap both collections and single records in `data`. */
interface Wrapped<T> {
  data: T;
}

async function parseOrThrow<T>(response: Response): Promise<T> {
  if (response.status === 422) {
    const body = await response.json().catch(() => ({}));
    throw new ValidationError(
      body.message ?? "The submitted data was invalid.",
      body.errors ?? {},
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.message ?? `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export async function fetchClients(): Promise<Client[]> {
  const response = await fetch(`${CLIENTS_API_URL}/clients`, {
    headers: { Accept: "application/json" },
  });
  const body = await parseOrThrow<Wrapped<Client[]>>(response);
  return body.data;
}

export async function createClient(payload: NewClient): Promise<Client> {
  const response = await fetch(`${CLIENTS_API_URL}/clients`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const body = await parseOrThrow<Wrapped<Client>>(response);
  return body.data;
}

export async function updateClient(
  id: number,
  payload: Partial<NewClient>,
): Promise<Client> {
  const response = await fetch(`${CLIENTS_API_URL}/clients/${id}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const body = await parseOrThrow<Wrapped<Client>>(response);
  return body.data;
}

export async function deleteClient(id: number): Promise<void> {
  const response = await fetch(`${CLIENTS_API_URL}/clients/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Could not delete client (status ${response.status})`);
  }
}
