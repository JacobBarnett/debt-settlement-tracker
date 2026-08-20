import { useCallback, useEffect, useRef, useState } from "react";
import type { Client, Payoff } from "../types";
import { projectPayoff } from "../api/payoff";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatMonths,
} from "../format";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { PayoffChart } from "./PayoffChart";

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
}

const DEFAULT_MONTHLY_PAYMENT = 500;

export function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
  const [monthlyPayment, setMonthlyPayment] = useState(
    String(DEFAULT_MONTHLY_PAYMENT),
  );
  const [payoff, setPayoff] = useState<Payoff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identifies the most recent projection request so that a slow earlier
  // response cannot overwrite a newer one when Recalculate is clicked twice.
  const latestRequest = useRef(0);

  const loadProjection = useCallback(
    async (payment: number) => {
      const requestId = ++latestRequest.current;
      setLoading(true);
      setError(null);

      try {
        const projection = await projectPayoff({
          enrolled_debt: client.enrolled_debt,
          settled_amount: client.settled_amount,
          monthly_payment: payment,
        });

        if (requestId !== latestRequest.current) return;
        setPayoff(projection);
      } catch (err) {
        if (requestId !== latestRequest.current) return;

        setPayoff(null);
        setError(
          err instanceof Error
            ? err.message
            : "Could not reach the payoff service.",
        );
      } finally {
        if (requestId === latestRequest.current) setLoading(false);
      }
    },
    [client.enrolled_debt, client.settled_amount],
  );

  // Project once on open with the default payment.
  useEffect(() => {
    void loadProjection(DEFAULT_MONTHLY_PAYMENT);
  }, [loadProjection]);

  // Close on Escape, the behaviour a keyboard user expects from a dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${client.name} payoff details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2 className="modal__title">{client.name}</h2>
            <p className="modal__sub">{client.email}</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal__summary">
          <div className="stat">
            <span className="stat__label">Enrolled debt</span>
            <span className="stat__value">
              {formatCurrency(client.enrolled_debt)}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Settled</span>
            <span className="stat__value">
              {formatCurrency(client.settled_amount)}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Remaining</span>
            <span className="stat__value">
              {formatCurrency(client.remaining_balance)}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Status</span>
            <StatusBadge status={client.status} />
          </div>
        </div>

        <ProgressBar percentage={client.progress_percentage} />

        <section className="projection">
          <div className="projection__head">
            <h3 className="projection__title">Projected payoff timeline</h3>
            <span className="projection__source">via Go service</span>
          </div>

          <div className="projection__controls">
            <label className="field">
              <span className="field__label">Monthly payment</span>
              <input
                className="field__input"
                type="number"
                min="1"
                step="10"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
              />
            </label>
            <button
              className="btn btn--primary"
              onClick={() => void loadProjection(Number(monthlyPayment))}
              disabled={loading}
            >
              {loading ? "Calculating…" : "Recalculate"}
            </button>
          </div>

          {error && <div className="alert alert--error">{error}</div>}

          {payoff && !error && (
            <>
              <div className="projection__stats">
                <div className="stat">
                  <span className="stat__label">Months remaining</span>
                  <span className="stat__value">
                    {formatMonths(payoff.months_remaining)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat__label">Estimated payoff</span>
                  <span className="stat__value">
                    {formatDate(payoff.estimated_payoff_date)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat__label">Total remaining</span>
                  <span className="stat__value">
                    {formatCurrencyPrecise(payoff.total_remaining)}
                  </span>
                </div>
              </div>

              <PayoffChart
                schedule={payoff.schedule}
                enrolledDebt={client.enrolled_debt}
              />

              {payoff.schedule.length > 0 && (
                <div className="schedule">
                  <table className="table table--compact">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Date</th>
                        <th className="table__num">Projected settled</th>
                        <th className="table__num">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoff.schedule.map((month) => (
                        <tr key={month.month}>
                          <td>{month.month}</td>
                          <td>{formatDate(month.date)}</td>
                          <td className="table__num">
                            {formatCurrencyPrecise(month.projected_settled)}
                          </td>
                          <td className="table__num">
                            {formatCurrencyPrecise(month.remaining_balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
