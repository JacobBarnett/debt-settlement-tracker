import { useState, type FormEvent } from "react";
import { CLIENT_STATUSES, type ClientStatus, type NewClient } from "../types";

interface AddClientFormProps {
  onSubmit: (client: NewClient) => Promise<void>;
  fieldErrors: Record<string, string[]>;
}

const emptyForm = {
  name: "",
  email: "",
  enrolled_debt: "",
  settled_amount: "",
  status: "enrolled" as ClientStatus,
};

export function AddClientForm({ onSubmit, fieldErrors }: AddClientFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof emptyForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        // The API is the source of truth for validation, so send what was
        // typed and let it reject anything malformed.
        enrolled_debt: Number(form.enrolled_debt),
        settled_amount: Number(form.settled_amount || 0),
        status: form.status,
      });
      setForm(emptyForm);
    } catch {
      // Errors surface through fieldErrors and the page-level banner.
    } finally {
      setSubmitting(false);
    }
  }

  const errorFor = (field: string) => fieldErrors[field]?.[0];

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2 className="card__title">Add a client</h2>

      <div className="form__grid">
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="field__input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Doe"
          />
          {errorFor("name") && (
            <span className="field__error">{errorFor("name")}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="field__input"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@example.com"
          />
          {errorFor("email") && (
            <span className="field__error">{errorFor("email")}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Enrolled debt</span>
          <input
            className="field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.enrolled_debt}
            onChange={(e) => update("enrolled_debt", e.target.value)}
            placeholder="18500"
          />
          {errorFor("enrolled_debt") && (
            <span className="field__error">{errorFor("enrolled_debt")}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Settled amount</span>
          <input
            className="field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.settled_amount}
            onChange={(e) => update("settled_amount", e.target.value)}
            placeholder="0"
          />
          {errorFor("settled_amount") && (
            <span className="field__error">{errorFor("settled_amount")}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Status</span>
          <select
            className="field__input"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errorFor("status") && (
            <span className="field__error">{errorFor("status")}</span>
          )}
        </label>

        <div className="field field--action">
          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Add client"}
          </button>
        </div>
      </div>
    </form>
  );
}
