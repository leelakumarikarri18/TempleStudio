package handler

import (
	"net/http"

	studio "github.com/leelakumarikarri18/TempleStudio"
)

var app = studio.NewHandler()

// Handler is the Vercel Go Function entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
