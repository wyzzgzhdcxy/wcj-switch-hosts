package config

import (
	"switch-hosts-wails/internal/db"
	"encoding/json"
	"os"
	"path/filepath"
)

// ThemeType represents the theme
type ThemeType string

const (
	ThemeLight  ThemeType = "light"
	ThemeDark   ThemeType = "dark"
	ThemeSystem ThemeType = "system"
)

// WriteModeType represents the write mode
type WriteModeType string

const (
	WriteModeOverwrite WriteModeType = "overwrite"
	WriteModeAppend    WriteModeType = "append"
)

// ProtocolType represents the proxy protocol
type ProtocolType string

const (
	ProtocolHTTP  ProtocolType = "http"
	ProtocolHTTPS ProtocolType = "https"
)

// ConfigsType represents all configuration options
type ConfigsType struct {
	// UI
	LeftPanelShow        bool   `json:"left_panel_show"`
	LeftPanelWidth       int    `json:"left_panel_width"`
	UseSystemWindowFrame bool   `json:"use_system_window_frame"`

	// Preferences
	WriteMode                 string   `json:"write_mode"`
	HistoryLimit              int      `json:"history_limit"`
	Locale                    string   `json:"locale"`
	Theme                     string   `json:"theme"`
	ChoiceMode                int      `json:"choice_mode"`
	ShowTitleOnTray           bool     `json:"show_title_on_tray"`
	HideAtLaunch              bool     `json:"hide_at_launch"`
	SendUsageData             bool     `json:"send_usage_data"`
	CmdAfterHostsApply        string   `json:"cmd_after_hosts_apply"`
	RemoveDuplicateRecords    bool     `json:"remove_duplicate_records"`
	HideDockIcon              bool     `json:"hide_dock_icon"`
	UseProxy                  bool     `json:"use_proxy"`
	ProxyProtocol             string   `json:"proxy_protocol"`
	ProxyHost                 string   `json:"proxy_host"`
	ProxyPort                 int      `json:"proxy_port"`
	HTTAPIOn                  bool     `json:"http_api_on"`
	HTTAPIOnlyLocal           bool     `json:"http_api_only_local"`
	TrayMiniWindow            bool     `json:"tray_mini_window"`
	MultiChoseFolderSwitchAll bool     `json:"multi_chose_folder_switch_all"`
	AutoDownloadUpdate        bool     `json:"auto_download_update"`

	// Other
	Env string `json:"env"`
}

var DefaultConfigs = &ConfigsType{
	// UI
	LeftPanelShow:        true,
	LeftPanelWidth:       270,
	UseSystemWindowFrame: false,

	// Preferences
	WriteMode:                 "append",
	HistoryLimit:              50,
	Locale:                    "en",
	Theme:                     "system",
	ChoiceMode:                2,
	ShowTitleOnTray:           false,
	HideAtLaunch:              false,
	SendUsageData:             false,
	CmdAfterHostsApply:        "",
	RemoveDuplicateRecords:    false,
	HideDockIcon:              false,
	UseProxy:                  false,
	ProxyProtocol:             "http",
	ProxyHost:                 "",
	ProxyPort:                 0,
	HTTAPIOn:                  false,
	HTTAPIOnlyLocal:           true,
	TrayMiniWindow:            true,
	MultiChoseFolderSwitchAll: false,
	AutoDownloadUpdate:        true,

	// Other
	Env: "PROD",
}

var configs *ConfigsType

// InitConfig initializes the config
func InitConfig(configDir string) error {
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	configs = &ConfigsType{}
	*configs = *DefaultConfigs
	configs.load(configDir)
	return nil
}

func (c *ConfigsType) load(configDir string) {
	configFile := filepath.Join(configDir, "config.json")
	data, err := os.ReadFile(configFile)
	if err != nil {
		return
	}
	json.Unmarshal(data, c)
}

// Save saves the config to disk
func (c *ConfigsType) Save(configDir string) error {
	configFile := filepath.Join(configDir, "config.json")
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configFile, data, 0644)
}

// GetConfigs returns the configs instance
func GetConfigs() *ConfigsType {
	if configs == nil {
		configs = &ConfigsType{}
		*configs = *DefaultConfigs
	}
	return configs
}

// GetConfig returns a config value by key
func GetConfig(key string) (string, error) {
	c := GetConfigs()
	switch key {
	case "left_panel_show":
		return boolToString(c.LeftPanelShow), nil
	case "left_panel_width":
		return intToString(c.LeftPanelWidth), nil
	case "use_system_window_frame":
		return boolToString(c.UseSystemWindowFrame), nil
	case "write_mode":
		return c.WriteMode, nil
	case "history_limit":
		return intToString(c.HistoryLimit), nil
	case "locale":
		return c.Locale, nil
	case "theme":
		return c.Theme, nil
	case "choice_mode":
		return intToString(c.ChoiceMode), nil
	case "show_title_on_tray":
		return boolToString(c.ShowTitleOnTray), nil
	case "hide_at_launch":
		return boolToString(c.HideAtLaunch), nil
	case "send_usage_data":
		return boolToString(c.SendUsageData), nil
	case "cmd_after_hosts_apply":
		return c.CmdAfterHostsApply, nil
	case "remove_duplicate_records":
		return boolToString(c.RemoveDuplicateRecords), nil
	case "hide_dock_icon":
		return boolToString(c.HideDockIcon), nil
	case "use_proxy":
		return boolToString(c.UseProxy), nil
	case "proxy_protocol":
		return c.ProxyProtocol, nil
	case "proxy_host":
		return c.ProxyHost, nil
	case "proxy_port":
		return intToString(c.ProxyPort), nil
	case "http_api_on":
		return boolToString(c.HTTAPIOn), nil
	case "http_api_only_local":
		return boolToString(c.HTTAPIOnlyLocal), nil
	case "tray_mini_window":
		return boolToString(c.TrayMiniWindow), nil
	case "multi_chose_folder_switch_all":
		return boolToString(c.MultiChoseFolderSwitchAll), nil
	case "auto_download_update":
		return boolToString(c.AutoDownloadUpdate), nil
	case "env":
		return c.Env, nil
	default:
		return db.GetConfig(key)
	}
}

// SetConfig sets a config value by key
func SetConfig(key string, value string) error {
	c := GetConfigs()
	switch key {
	case "left_panel_show":
		c.LeftPanelShow = stringToBool(value)
	case "left_panel_width":
		c.LeftPanelWidth = stringToInt(value)
	case "use_system_window_frame":
		c.UseSystemWindowFrame = stringToBool(value)
	case "write_mode":
		c.WriteMode = value
	case "history_limit":
		c.HistoryLimit = stringToInt(value)
	case "locale":
		c.Locale = value
	case "theme":
		c.Theme = value
	case "choice_mode":
		c.ChoiceMode = stringToInt(value)
	case "show_title_on_tray":
		c.ShowTitleOnTray = stringToBool(value)
	case "hide_at_launch":
		c.HideAtLaunch = stringToBool(value)
	case "send_usage_data":
		c.SendUsageData = stringToBool(value)
	case "cmd_after_hosts_apply":
		c.CmdAfterHostsApply = value
	case "remove_duplicate_records":
		c.RemoveDuplicateRecords = stringToBool(value)
	case "hide_dock_icon":
		c.HideDockIcon = stringToBool(value)
	case "use_proxy":
		c.UseProxy = stringToBool(value)
	case "proxy_protocol":
		c.ProxyProtocol = value
	case "proxy_host":
		c.ProxyHost = value
	case "proxy_port":
		c.ProxyPort = stringToInt(value)
	case "http_api_on":
		c.HTTAPIOn = stringToBool(value)
	case "http_api_only_local":
		c.HTTAPIOnlyLocal = stringToBool(value)
	case "tray_mini_window":
		c.TrayMiniWindow = stringToBool(value)
	case "multi_chose_folder_switch_all":
		c.MultiChoseFolderSwitchAll = stringToBool(value)
	case "auto_download_update":
		c.AutoDownloadUpdate = stringToBool(value)
	case "env":
		c.Env = value
	default:
		return db.SetConfig(key, value)
	}
	return nil
}

// GetConfigAll returns all config values
func GetConfigAll() (map[string]interface{}, error) {
	c := GetConfigs()
	result := map[string]interface{}{
		"left_panel_show":                  c.LeftPanelShow,
		"left_panel_width":                 c.LeftPanelWidth,
		"use_system_window_frame":          c.UseSystemWindowFrame,
		"write_mode":                       c.WriteMode,
		"history_limit":                    c.HistoryLimit,
		"locale":                           c.Locale,
		"theme":                            c.Theme,
		"choice_mode":                      c.ChoiceMode,
		"show_title_on_tray":               c.ShowTitleOnTray,
		"hide_at_launch":                   c.HideAtLaunch,
		"send_usage_data":                  c.SendUsageData,
		"cmd_after_hosts_apply":            c.CmdAfterHostsApply,
		"remove_duplicate_records":         c.RemoveDuplicateRecords,
		"hide_dock_icon":                   c.HideDockIcon,
		"use_proxy":                        c.UseProxy,
		"proxy_protocol":                   c.ProxyProtocol,
		"proxy_host":                       c.ProxyHost,
		"proxy_port":                       c.ProxyPort,
		"http_api_on":                      c.HTTAPIOn,
		"http_api_only_local":              c.HTTAPIOnlyLocal,
		"tray_mini_window":                 c.TrayMiniWindow,
		"multi_chose_folder_switch_all":    c.MultiChoseFolderSwitchAll,
		"auto_download_update":             c.AutoDownloadUpdate,
		"env":                              c.Env,
	}
	return result, nil
}

// Helper functions for type conversion
func boolToString(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

func stringToBool(s string) bool {
	return s == "true" || s == "1"
}

func intToString(i int) string {
	return string(rune(i))
}

func stringToInt(s string) int {
	var i int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			i = i*10 + int(c-'0')
		}
	}
	return i
}
