// Command payoff-service runs the debt settlement payoff projection API.
package main

import (
	"flag"
	"log"
	"net/http"
	"time"

	"github.com/JacobBarnett/debt-settlement-tracker/payoff-service/internal/httpapi"
)

func main() {
	addr := flag.String("addr", ":8081", "host:port to listen on")
	flag.Parse()

	srv := &http.Server{
		Addr:              *addr,
		Handler:           httpapi.NewServer(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("payoff service listening on %s", *addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server stopped: %v", err)
	}
}
