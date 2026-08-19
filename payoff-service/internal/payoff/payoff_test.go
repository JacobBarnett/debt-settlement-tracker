package payoff

import (
	"errors"
	"testing"
	"time"
)

// start is a fixed clock so schedule dates are deterministic.
var start = time.Date(2026, time.January, 15, 0, 0, 0, 0, time.UTC)

func TestProjectEvenSplit(t *testing.T) {
	got, err := Project(Request{EnrolledDebt: 12000, SettledAmount: 2000, MonthlyPayment: 500}, start)
	if err != nil {
		t.Fatalf("Project() returned unexpected error: %v", err)
	}

	if want := 20; got.MonthsRemaining != want {
		t.Errorf("MonthsRemaining = %d, want %d", got.MonthsRemaining, want)
	}
	if want := 10000.0; got.TotalRemaining != want {
		t.Errorf("TotalRemaining = %v, want %v", got.TotalRemaining, want)
	}
	if want := "2027-09-15"; got.EstimatedPayoffDate != want {
		t.Errorf("EstimatedPayoffDate = %q, want %q", got.EstimatedPayoffDate, want)
	}
	if len(got.Schedule) != got.MonthsRemaining {
		t.Fatalf("len(Schedule) = %d, want %d", len(got.Schedule), got.MonthsRemaining)
	}

	first := got.Schedule[0]
	if first.ProjectedSettled != 2500 || first.RemainingBalance != 9500 {
		t.Errorf("first month = %+v, want settled 2500 / remaining 9500", first)
	}

	// The plan must land exactly on zero, never overshoot the enrolled debt.
	last := got.Schedule[len(got.Schedule)-1]
	if last.ProjectedSettled != 12000 || last.RemainingBalance != 0 {
		t.Errorf("final month = %+v, want settled 12000 / remaining 0", last)
	}
}

func TestProjectPartialFinalPayment(t *testing.T) {
	// 5000 owed at 1200/month is 4.17 months, so it rounds up to 5 with the
	// last payment covering only the 200 that is left.
	got, err := Project(Request{EnrolledDebt: 5000, SettledAmount: 0, MonthlyPayment: 1200}, start)
	if err != nil {
		t.Fatalf("Project() returned unexpected error: %v", err)
	}

	if want := 5; got.MonthsRemaining != want {
		t.Errorf("MonthsRemaining = %d, want %d", got.MonthsRemaining, want)
	}

	last := got.Schedule[len(got.Schedule)-1]
	if last.ProjectedSettled != 5000 || last.RemainingBalance != 0 {
		t.Errorf("final month = %+v, want settled 5000 / remaining 0", last)
	}
}

func TestProjectAlreadySettled(t *testing.T) {
	got, err := Project(Request{EnrolledDebt: 8000, SettledAmount: 8000, MonthlyPayment: 0}, start)
	if err != nil {
		t.Fatalf("Project() returned unexpected error: %v", err)
	}

	if got.MonthsRemaining != 0 {
		t.Errorf("MonthsRemaining = %d, want 0", got.MonthsRemaining)
	}
	if len(got.Schedule) != 0 {
		t.Errorf("len(Schedule) = %d, want 0", len(got.Schedule))
	}
	if want := "2026-01-15"; got.EstimatedPayoffDate != want {
		t.Errorf("EstimatedPayoffDate = %q, want %q", got.EstimatedPayoffDate, want)
	}
}

func TestProjectInvalidInput(t *testing.T) {
	cases := map[string]Request{
		"zero enrolled debt":       {EnrolledDebt: 0, SettledAmount: 0, MonthlyPayment: 500},
		"negative settled amount":  {EnrolledDebt: 5000, SettledAmount: -1, MonthlyPayment: 500},
		"settled exceeds enrolled": {EnrolledDebt: 5000, SettledAmount: 6000, MonthlyPayment: 500},
		"no monthly payment":       {EnrolledDebt: 5000, SettledAmount: 0, MonthlyPayment: 0},
		"payment too small":        {EnrolledDebt: 5000, SettledAmount: 0, MonthlyPayment: 1},
	}

	for name, req := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := Project(req, start); !errors.Is(err, ErrInvalidRequest) {
				t.Errorf("Project() error = %v, want ErrInvalidRequest", err)
			}
		})
	}
}
