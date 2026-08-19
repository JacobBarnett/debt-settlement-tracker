// Package httpapi exposes the payoff projection logic over HTTP.
package httpapi

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/JacobBarnett/debt-settlement-tracker/payoff-service/internal/payoff"
)

// maxBodyBytes bounds the request body. The payload is three numbers, so
// anything larger is a mistake or an attack.
const maxBodyBytes = 4 << 10

// errorResponse is the JSON body returned for any non-2xx response.
type errorResponse struct {
	Error string `json:"error"`
}

// Server holds the handler dependencies. now is injected so tests can pin the
// clock; production wires it to time.Now.
type Server struct {
	now func() time.Time
}

// NewServer returns an http.Handler with every route and middleware attached.
func NewServer() http.Handler {
	s := &Server{now: time.Now}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/project-payoff", s.handleProjectPayoff)
	mux.HandleFunc("GET /health", s.handleHealth)

	return withCORS(mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleProjectPayoff(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	var req payoff.Request
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "request body must be valid JSON: "+err.Error())
		return
	}

	projection, err := payoff.Project(req, s.now())
	if err != nil {
		// A validation failure is the client's problem; anything else is ours.
		if errors.Is(err, payoff.ErrInvalidRequest) {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		log.Printf("projection failed: %v", err)
		writeError(w, http.StatusInternalServerError, "could not calculate projection")
		return
	}

	writeJSON(w, http.StatusOK, projection)
}

// withCORS allows the React frontend, served from a different origin in local
// development, to call this service directly.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Max-Age", "86400")

		// Answer the preflight without touching the router.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		// The status line is already sent, so all we can do is record it.
		log.Printf("writing response failed: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}
