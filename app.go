package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"switch-hosts-wails/internal/config"
	"switch-hosts-wails/internal/hosts"
	"switch-hosts-wails/internal/i18n"
	"switch-hosts-wails/internal/migrate"
)

// App struct
type App struct {
	ctx context.Context
}

var (
	dataDir   string
	configDir string
)

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize directories
	if runtime.GOOS == "windows" {
		dataDir = filepath.Join(os.Getenv("APPDATA"), "SwitchHosts")
		configDir = filepath.Join(os.Getenv("APPDATA"), "SwitchHosts")
	} else {
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, ".SwitchHosts")
		configDir = filepath.Join(home, ".SwitchHosts")
	}

	os.MkdirAll(dataDir, 0755)
	os.MkdirAll(configDir, 0755)

	// Initialize components
	config.InitConfig(configDir)
	hosts.InitDB(filepath.Join(dataDir, "data"))
	i18n.Init(config.GetConfigs().Locale)

	log.Printf("SwitchHosts Wails started")
	log.Printf("Data dir: %s", dataDir)
	log.Printf("Config dir: %s", configDir)
}

// ==================== Hosts Operations ====================

// GetBasicData returns the basic hosts data
func (a *App) GetBasicData() (*hosts.HostsBasicData, error) {
	return hosts.GetBasicData()
}

// GetHostsContent returns the content of a hosts entry
func (a *App) GetHostsContent(id string) (string, error) {
	return hosts.GetHostsContent(id)
}

// SetHostsContent sets the content of a hosts entry
func (a *App) SetHostsContent(id, content string) error {
	return hosts.SetHostsContent(id, content)
}

// GetSystemHosts returns the system hosts content
func (a *App) GetSystemHosts() (string, error) {
	return hosts.GetSystemHosts()
}

// SetSystemHosts sets the system hosts content
func (a *App) SetSystemHosts(content, sudoPassword string) (*hosts.OperationResult, error) {
	return hosts.SetSystemHosts(content, &hosts.WriteOptions{SudoPSwd: sudoPassword})
}

// GetSystemHostsPath returns the system hosts file path
func (a *App) GetSystemHostsPath() string {
	return hosts.GetSystemHostsPath()
}

// RefreshRemoteHosts refreshes a remote hosts entry
func (a *App) RefreshRemoteHosts(id string) (*hosts.OperationResult, error) {
	item, err := hosts.GetItem(id)
	if err != nil || item == nil {
		return &hosts.OperationResult{Success: false, Message: "Item not found"}, err
	}
	return hosts.RefreshRemoteHosts(id, item)
}

// ToggleItem toggles a hosts item on/off
func (a *App) ToggleItem(id string, on bool) error {
	cfg := config.GetConfigs()
	return hosts.ToggleItem(id, on, hosts.FolderModeType(cfg.ChoiceMode))
}

// GetItem returns a single hosts item
func (a *App) GetItem(id string) (*hosts.HostsListObject, error) {
	return hosts.GetItem(id)
}

// SetList sets the hosts list
func (a *App) SetList(list []*hosts.HostsListObject) error {
	return hosts.SetList(list)
}

// MoveToTrashcan moves an item to trashcan
func (a *App) MoveToTrashcan(id string) error {
	return hosts.MoveToTrashcan(id)
}

// RestoreFromTrashcan restores an item from trashcan
func (a *App) RestoreFromTrashcan(id string) error {
	return hosts.RestoreFromTrashcan(id)
}

// ClearTrashcan clears the trashcan
func (a *App) ClearTrashcan() error {
	return hosts.ClearTrashcan()
}

// GetTrashcanList returns the trashcan list
func (a *App) GetTrashcanList() ([]*hosts.TrashcanObject, error) {
	data, err := hosts.GetBasicData()
	if err != nil {
		return nil, err
	}
	return data.Trashcan, nil
}

// AddItem adds a new hosts item
func (a *App) AddItem(parentID string, item *hosts.HostsListObject) error {
	return hosts.AddItem(parentID, item)
}

// DeleteItem deletes a hosts item
func (a *App) DeleteItem(id string) error {
	return hosts.DeleteItem(id)
}

// ==================== Find Operations ====================

// FindBy searches for text in hosts
func (a *App) FindBy(keyword string, isRegexp, isIgnoreCase bool) ([]*hosts.FindItem, error) {
	opts := &hosts.FindOptions{
		IsRegexp:    isRegexp,
		IsIgnoreCase: isIgnoreCase,
	}
	return hosts.FindBy(keyword, opts)
}

// ReplaceHostsContent replaces content in a hosts entry
func (a *App) ReplaceHostsContent(id, content string, splitters []*hosts.FindSplitter) error {
	newContent := hosts.ReplaceInContent(content, splitters)
	return hosts.SetHostsContent(id, newContent)
}

// GetFindHistory returns search history
func (a *App) GetFindHistory(limit int) ([]string, error) {
	return hosts.GetFindHistory(limit)
}

// AddFindHistory adds a search history entry
func (a *App) AddFindHistory(keyword string) error {
	return hosts.AddFindHistory(keyword)
}

// ==================== History Operations ====================

// GetHostsHistory returns the history for a hosts entry
func (a *App) GetHostsHistory(id string, limit int) ([]map[string]interface{}, error) {
	return hosts.GetHistory(id, limit)
}

// DeleteHostsHistory deletes a history entry
func (a *App) DeleteHostsHistory(historyID string) error {
	return hosts.DeleteHistory(historyID)
}

// ClearHostsHistory clears history for a hosts entry
func (a *App) ClearHostsHistory(id string) error {
	return hosts.ClearHistory(id)
}

// ==================== Config Operations ====================

// GetConfig returns a config value
func (a *App) GetConfig(key string) (interface{}, error) {
	return config.GetConfig(key)
}

// SetConfig sets a config value
func (a *App) SetConfig(key string, value interface{}) error {
	var strValue string
	switch v := value.(type) {
	case string:
		strValue = v
	case float64:
		strValue = string(rune(int(v)))
	case bool:
		if v {
			strValue = "true"
		} else {
			strValue = "false"
		}
	default:
		strValue = ""
	}
	err := config.SetConfig(key, strValue)
	if err != nil {
		return err
	}
	// Save config to disk
	return config.GetConfigs().Save(configDir)
}

// GetAllConfig returns all config values
func (a *App) GetAllConfig() (map[string]interface{}, error) {
	return config.GetConfigAll()
}

// ==================== System Operations ====================

// GetDataDir returns the data directory
func (a *App) GetDataDir() string {
	return dataDir
}

// GetDefaultDataDir returns the default data directory
func (a *App) GetDefaultDataDir() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(os.Getenv("APPDATA"), "SwitchHosts")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".SwitchHosts")
}

// Quit quits the application
func (a *App) Quit() {
	os.Exit(0)
}

// Minimize minimizes the window to tray
func (a *App) Minimize() {
	// For now just hide - tray functionality will be added
}

// ==================== I18n Operations ====================

// GetI18n returns the i18n translations
func (a *App) GetI18n() map[string]string {
	return i18n.GetTranslations()
}

// GetLocale returns the current locale
func (a *App) GetLocale() string {
	return config.GetConfigs().Locale
}

// SetLocale sets the current locale
func (a *App) SetLocale(locale string) error {
	err := config.SetConfig("locale", locale)
	if err != nil {
		return err
	}
	i18n.Init(locale)
	return config.GetConfigs().Save(configDir)
}

// ==================== Utility ====================

// GetPlatform returns the platform
func (a *App) GetPlatform() string {
	return runtime.GOOS
}

// ==================== Migration Operations ====================

// CheckMigration checks if migration is needed
func (a *App) CheckMigration() bool {
	return migrate.CheckMigration()
}

// MigrateData migrates data from v3 to v4
func (a *App) MigrateData() error {
	oldData, err := migrate.ReadOldData()
	if err != nil {
		return err
	}
	return migrate.ImportV3Data(oldData)
}

// ExportData exports the current data as JSON
func (a *App) ExportData() (string, error) {
	data, err := migrate.ExportData()
	if err != nil {
		return "", err
	}
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// ImportData imports data from JSON
func (a *App) ImportData(jsonData string) error {
	var data migrate.ImportData
	if err := json.Unmarshal([]byte(jsonData), &data); err != nil {
		return err
	}
	if data.Data == nil {
		return fmt.Errorf("invalid data format")
	}
	return migrate.ImportDataFromMap(data.Data)
}

// ==================== Apply Hosts ====================

// ApplyHosts applies selected hosts to system hosts
func (a *App) ApplyHosts() (*hosts.OperationResult, error) {
	basicData, err := hosts.GetBasicData()
	if err != nil {
		return &hosts.OperationResult{Success: false, Message: err.Error()}, err
	}
	return hosts.ApplyHosts(basicData.List)
}

// GetFinalContent gets the final merged content of all enabled hosts
func (a *App) GetFinalContent() (string, error) {
	basicData, err := hosts.GetBasicData()
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	for _, item := range basicData.List {
		if item.On {
			content, err := hosts.GetFinalContent(item, basicData.List)
			if err != nil {
				continue
			}
			if content != "" {
				if item.Title != "" {
					buf.WriteString(fmt.Sprintf("# === %s ===\n", item.Title))
				}
				buf.WriteString(content)
				buf.WriteString("\n\n")
			}
		}
	}

	return strings.TrimSpace(buf.String()), nil
}
