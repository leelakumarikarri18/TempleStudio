package studio

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRoutes(t *testing.T) {
	tests := []struct {
		path, contentType, contains string
		status                      int
	}{
		{"/", "text/html", "Andhra Temples", http.StatusOK},
		{"/app.js", "text/javascript", "refreshLayout", http.StatusOK},
		{"/export.js", "text/javascript", "avc1.424028", http.StatusOK},
		{"/style.css", "text/css", ":root", http.StatusOK},
		{"/assets/content-template.png", "image/png", "", http.StatusOK},
		{"/api/temples", "application/json", "Tirumala Venkateswara", http.StatusOK},
		{"/api/health", "application/json", `"runtime":"go"`, http.StatusOK},
		{"/api/index?__path=api/health", "application/json", `"runtime":"go"`, http.StatusOK},
		{"/api/index?__path=assets/content-template.png", "image/png", "", http.StatusOK},
		{"/api/index?__path=", "text/html", "Andhra Temples", http.StatusOK},
		{"/api/missing", "application/json", "API route not found", http.StatusNotFound},
		{"/missing", "text/plain", "404 page not found", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, tt.path, nil)
			w := httptest.NewRecorder()
			NewHandler().ServeHTTP(w, r)
			if w.Code != tt.status {
				t.Fatalf("status = %d, want %d; body: %s", w.Code, tt.status, w.Body.String())
			}
			if got := w.Header().Get("Content-Type"); !strings.HasPrefix(got, tt.contentType) {
				t.Fatalf("content type = %q, want prefix %q", got, tt.contentType)
			}
			if tt.contains != "" && !strings.Contains(w.Body.String(), tt.contains) {
				t.Fatalf("body does not contain %q", tt.contains)
			}
		})
	}
}

func TestRejectsPost(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/api/temples", nil)
	w := httptest.NewRecorder()
	NewHandler().ServeHTTP(w, r)
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}
