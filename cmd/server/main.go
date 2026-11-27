package main

import (
	"log"
	"net/http"
	"os"

	"github.com/leelakumarikarri18/TempleStudio/studio"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Temple Shorts Studio: http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, studio.NewHandler()))
}
