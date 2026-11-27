package studio

import (
	"bytes"
	"embed"
	"encoding/json"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strings"
	"time"
)

// Embedding the web application makes every required file part of the Go
// function. This avoids relying on Vercel's working directory or file tracing.
//
//go:embed static data/temples.json
var files embed.FS

type appHandler struct{}

// NewHandler is shared by Vercel and the local Go server.
func NewHandler() http.Handler { return appHandler{} }

func (appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	requestPath := r.URL.Path
	if routedPath := r.URL.Query().Get("__path"); routedPath != "" {
		requestPath = "/" + strings.TrimPrefix(routedPath, "/")
	} else if requestPath == "/api/index" {
		// The root rewrite has an empty __path value.
		requestPath = "/"
	}

	switch requestPath {
	case "/api/health":
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":      true,
			"runtime": "go",
			"storage": "browser",
			"export":  "browser-media-recorder",
		})
		return
	case "/api/temples":
		serveEmbedded(w, r, "data/temples.json", "application/json; charset=utf-8", "public, max-age=300, s-maxage=3600")
		return
	case "/", "/index.html":
		serveEmbedded(w, r, "static/index.html", "text/html; charset=utf-8", "public, max-age=0, must-revalidate")
		return
	}

	if strings.HasPrefix(requestPath, "/api/") {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "API route not found"})
		return
	}

	clean := path.Clean("/" + requestPath)
	if strings.Contains(clean, "..") {
		http.NotFound(w, r)
		return
	}
	name := "static/" + strings.TrimPrefix(clean, "/")
	cache := "public, max-age=0, must-revalidate"
	if strings.HasPrefix(clean, "/assets/") {
		cache = "public, max-age=31536000, immutable"
	}
	serveEmbedded(w, r, name, mime.TypeByExtension(path.Ext(name)), cache)
}

func serveEmbedded(w http.ResponseWriter, r *http.Request, name, contentType, cache string) {
	b, err := fs.ReadFile(files, name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", cache)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeContent(w, r, path.Base(name), time.Time{}, bytes.NewReader(b))
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
