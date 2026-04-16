package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"switch-hosts-wails/internal/hosts"
)

const (
	httpAPIPort = 50761
)

// Server represents the HTTP API server
type Server struct {
	mux      *http.ServeMux
	server   *http.Server
	onlyLocal bool
}

// NewServer creates a new API server
func NewServer(onlyLocal bool) *Server {
	s := &Server{
		mux:      http.NewServeMux(),
		onlyLocal: onlyLocal,
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	s.mux.HandleFunc("/api/list", s.handleList)
	s.mux.HandleFunc("/api/toggle", s.handleToggle)
	s.mux.HandleFunc("/api/content/", s.handleContent)
	s.mux.HandleFunc("/api/system-hosts", s.handleSystemHosts)
	s.mux.HandleFunc("/", s.handleNotFound)
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	data, err := hosts.GetBasicData()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	// Return only the list (not trashcan) for simpler response
	response := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"list":    data.List,
			"version": data.Version,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleToggle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	defer r.Body.Close()

	var request struct {
		ID string `json:"id"`
		On bool   `json:"on"`
	}

	if err := json.Unmarshal(body, &request); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	err = hosts.ToggleItem(request.ID, request.On, 0)
	response := map[string]interface{}{
		"success": err == nil,
		"error":   err.Error(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleContent(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/content/")

	// Remove trailing slash if present
	path = strings.TrimSuffix(path, "/")

	if path == "" {
		http.Error(w, "ID required", 400)
		return
	}

	switch r.Method {
	case http.MethodGet:
		content, err := hosts.GetHostsContent(path)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write([]byte(content))

	case http.MethodPost:
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		defer r.Body.Close()

		err = hosts.SetHostsContent(path, string(body))
		response := map[string]interface{}{
			"success": err == nil,
			"error":   err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)

	default:
		http.Error(w, "Method not allowed", 405)
	}
}

func (s *Server) handleSystemHosts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		content, err := hosts.GetSystemHosts()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write([]byte(content))

	default:
		http.Error(w, "Method not allowed", 405)
	}
}

func (s *Server) handleNotFound(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(404)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   "Not found",
	})
}

// Start starts the API server
func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", httpAPIPort)
	if s.onlyLocal {
		addr = "127.0.0.1:" + string(rune(httpAPIPort))
	}

	s.server = &http.Server{
		Addr:    addr,
		Handler: s.mux,
	}

	return s.server.ListenAndServe()
}

// Stop stops the API server
func (s *Server) Stop() error {
	if s.server != nil {
		return s.server.Close()
	}
	return nil
}
