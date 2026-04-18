package tray

import (
	"log"
	"os"
	"path/filepath"
	"runtime"
)

// Tray represents the system tray
type Tray struct {
	visible bool
	title   string
}

// NewTray creates a new tray instance
func NewTray() *Tray {
	return &Tray{
		visible: true,
		title:   "SwitchHosts",
	}
}

// Show shows the tray
func (t *Tray) Show() {
	t.visible = true
	log.Println("Tray: shown")
}

// Hide hides the tray
func (t *Tray) Hide() {
	t.visible = false
	log.Println("Tray: hidden")
}

// IsVisible returns whether the tray is visible
func (t *Tray) IsVisible() bool {
	return t.visible
}

// SetTitle sets the tray title
func (t *Tray) SetTitle(title string) {
	t.title = title
	log.Printf("Tray title: %s", title)
}

// GetTitle returns the tray title
func (t *Tray) GetTitle() string {
	return t.title
}

// GetIconPath returns the appropriate icon path for the platform
func GetIconPath() string {
	// Try to find icon in various locations
	possiblePaths := []string{}

	// Get the directory where the executable is located
	exeDir, err := os.Executable()
	if err == nil {
		possiblePaths = append(possiblePaths, filepath.Join(filepath.Dir(exeDir), "assets", "icon.png"))
		possiblePaths = append(possiblePaths, filepath.Join(filepath.Dir(exeDir), "icon.png"))
	}

	// For development, check relative paths
	if runtime.GOOS == "windows" {
		possiblePaths = append(possiblePaths, filepath.Join("build", "windows", "icon.ico"))
	} else if runtime.GOOS == "darwin" {
		possiblePaths = append(possiblePaths, filepath.Join("build", "darwin", "icon.icns"))
	} else {
		possiblePaths = append(possiblePaths, filepath.Join("build", "icon.png"))
	}

	for _, p := range possiblePaths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}

	return ""
}
