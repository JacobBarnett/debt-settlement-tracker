package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/JacobBarnett/debt-settlement-tracker/payoff-service/internal/payoff"
)

func TestHandleProjectPayoff(t *testing.T) {
	body := `{"enrolled_debt":12000,"settled_amount":2000,"monthly_payment":500}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/project-payoff", strings.NewReader(body))

	NewServer().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}

	var got payoff.Projection
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatalf("decoding response failed: %v", err)
	}
	if got.MonthsRemaining != 20 {
		t.Errorf("months_remaining = %d, want 20", got.MonthsRemaining)
	}
	if origin := rec.Header().Get("Access-Control-Allow-Origin"); origin != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q, want %q", origin, "*")
	}
}

func TestHandleProjectPayoffRejectsInvalidPlan(t *testing.T) {
	body := `{"enrolled_debt":0,"settled_amount":0,"monthly_payment":500}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/project-payoff", strings.NewReader(body))

	NewServer().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusUnprocessableEntity)
	}
}

func TestPreflightSucceeds(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodOptions, "/api/project-payoff", nil)

	NewServer().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNoContent)
	}
}
