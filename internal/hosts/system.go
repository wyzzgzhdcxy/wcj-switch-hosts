package hosts

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"switch-hosts-wails/internal/db"
)

const (
	ContentStartMarker = "# --- SWITCHHOSTS_CONTENT_START ---"
)

// GetSystemHostsPath returns the system hosts file path
func GetSystemHostsPath() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(os.Getenv("windir"), "system32", "drivers", "etc", "hosts")
	}
	return "/etc/hosts"
}

// GetSystemHosts reads the system hosts file
func GetSystemHosts() (string, error) {
	path := GetSystemHostsPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return normalizeLineEndings(string(data)), nil
}

// SetSystemHosts writes to the system hosts file
func SetSystemHosts(content string, options *WriteOptions) (*OperationResult, error) {
	path := GetSystemHostsPath()
	oldContent, err := GetSystemHosts()
	if err != nil {
		return &OperationResult{Success: false, Message: err.Error()}, err
	}

	// Get write mode from config
	writeMode, _ := db.GetConfig("write_mode")
	useAppendMode := writeMode == "append"

	var finalContent string
	if useAppendMode {
		finalContent = makeAppendContent(oldContent, content)
	} else {
		finalContent = content
	}

	// Check if content is the same using MD5
	if md5Hash(finalContent) == md5Hash(oldContent) {
		return &OperationResult{Success: true}, nil
	}

	// Try direct write first
	err = os.WriteFile(path, []byte(finalContent), 0644)
	if err == nil {
		// Save history
		saveHostsHistory(path, oldContent, finalContent)
		Emit("system_hosts_updated")
		runCmdAfterHostsApply()
		return &OperationResult{Success: true}, nil
	}

	// Check if it's a permission error
	if !os.IsPermission(err) {
		return &OperationResult{Success: false, Message: err.Error(), Code: "write_error"}, err
	}

	// On Windows, admin privileges are needed
	if runtime.GOOS == "windows" {
		return &OperationResult{
			Success: false,
			Message: "需要管理员权限",
			Code:    "no_access",
		}, nil
	}

	// On Unix, try sudo
	sudoPassword := ""
	if options != nil {
		sudoPassword = options.SudoPSwd
	}

	if sudoPassword == "" {
		return &OperationResult{
			Success: false,
			Message: "需要 sudo 权限",
			Code:    "need_sudo",
		}, nil
	}

	// Write using sudo
	err = writeWithSudo(path, finalContent, sudoPassword)
	if err != nil {
		return &OperationResult{Success: false, Message: err.Error(), Code: "sudo_failed"}, err
	}

	// Save history
	saveHostsHistory(path, oldContent, finalContent)
	Emit("system_hosts_updated")
	runCmdAfterHostsApply()
	return &OperationResult{Success: true}, nil
}

func makeAppendContent(oldContent, newContent string) string {
	// Normalize line endings
	oldContent = normalizeLineEndings(oldContent)

	// Find the marker and remove everything after it
	index := strings.Index(oldContent, ContentStartMarker)
	if index > -1 {
		oldContent = strings.TrimRight(oldContent[:index], " \t\n\r")
	}

	if newContent == "" {
		return oldContent + "\n"
	}

	return fmt.Sprintf("%s\n\n%s\n\n%s", oldContent, ContentStartMarker, newContent)
}

func writeWithSudo(path, content, password string) error {
	// Create temp file
	tmpFile, err := os.CreateTemp(os.TempDir(), "hosts_*")
	if err != nil {
		return err
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)

	if _, err := tmpFile.WriteString(content); err != nil {
		return err
	}
	tmpFile.Close()

	// Build sudo command
	cmd := exec.Command("sh", "-c",
		fmt.Sprintf(`echo '%s' | sudo -S chmod 777 %s && cat '%s' > %s && sudo -S chmod 644 %s`,
			password, path, tmpPath, path, path))

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("sudo failed: %s, %v", string(output), err)
	}

	return nil
}

func md5Hash(content string) string {
	return fmt.Sprintf("%x", md5.Sum([]byte(content)))
}

func saveHostsHistory(path, oldContent, newContent string) {
	now := time.Now().UnixMilli()
	historyID := fmt.Sprintf("history_%d", now)

	// Save old content as history
	db.AddHistory(historyID+"_old", "system", oldContent, now)
	db.AddHistory(historyID+"_new", "system", newContent, now)

	// Update history limit
	historyLimit, _ := db.GetConfig("history_limit")
	limit := 100
	if historyLimit != "" {
		fmt.Sscanf(historyLimit, "%d", &limit)
	}

	// Clean old history if needed
	cleanHistoryIfNeeded(limit)
}

func cleanHistoryIfNeeded(limit int) {
	history, err := db.GetHistory("system", limit*2)
	if err != nil || len(history) <= limit {
		return
	}

	// Delete oldest entries
	for i := limit; i < len(history); i++ {
		if id, ok := history[i]["id"].(string); ok {
			db.DeleteHistory(id)
		}
	}
}

func runCmdAfterHostsApply() {
	cmd, _ := db.GetConfig("cmd_after_hosts_apply")
	if cmd == "" {
		return
	}

	exec.Command("sh", "-c", cmd).Run()
}

func normalizeLineEndings(content string) string {
	content = strings.ReplaceAll(content, "\r\n", "\n")
	content = strings.ReplaceAll(content, "\r", "\n")
	return content
}

// restoreLineEndings restores line endings for the platform
func restoreLineEndings(content string) string {
	if runtime.GOOS == "windows" {
		content = strings.ReplaceAll(content, "\n", "\r\n")
	}
	return content
}

// GetLineEndingForPlatform returns the line ending for the current platform
func GetLineEndingForPlatform() string {
	if runtime.GOOS == "windows" {
		return "\r\n"
	}
	return "\n"
}

// GetHostsContent gets the content of a hosts entry by ID
func GetHostsContent(id string) (string, error) {
	// System hosts
	if id == "0" {
		return GetSystemHosts()
	}

	// Get from database
	content, err := db.GetHostsContent(id)
	if err != nil {
		return "", err
	}
	return content, nil
}

// SetHostsContent sets the content of a hosts entry by ID
func SetHostsContent(id, content string) error {
	content = normalizeLineEndings(content)
	return db.SetHostsContent(id, content)
}

// RefreshRemoteHosts refreshes a remote hosts entry
func RefreshRemoteHosts(id string, item *HostsListObject) (*OperationResult, error) {
	if item.URL == "" {
		return &OperationResult{Success: false, Message: "No URL provided"}, nil
	}

	var content string

	if strings.HasPrefix(item.URL, "file://") {
		// Local file
		filePath := strings.TrimPrefix(item.URL, "file://")
		data, err := os.ReadFile(filePath)
		content = string(data)
		if err != nil {
			return &OperationResult{Success: false, Message: err.Error()}, err
		}
	} else {
		// HTTP/HTTPS
		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Get(item.URL)
		if err != nil {
			return &OperationResult{Success: false, Message: err.Error()}, err
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return &OperationResult{Success: false, Message: err.Error()}, err
		}
		content = string(body)
	}

	oldContent, _ := GetHostsContent(id)
	if content != oldContent {
		if err := SetHostsContent(id, content); err != nil {
			return &OperationResult{Success: false, Message: err.Error()}, err
		}
		Emit("hosts_content_changed", id)
	}

	// Update last refresh time
	item.LastRefresh = time.Now().Format("2006-01-02 15:04:05")
	item.LastRefreshMs = time.Now().UnixMilli()

	return &OperationResult{Success: true, Data: item}, nil
}

// FetchRemoteContent fetches content from a remote URL
func FetchRemoteContent(url string) (string, error) {
	if strings.HasPrefix(url, "file://") {
		filePath := strings.TrimPrefix(url, "file://")
		data, err := os.ReadFile(filePath)
		return string(data), err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// GetFinalContent gets the final content of a hosts item (including folder/group resolution)
func GetFinalContent(item *HostsListObject, allItems []*HostsListObject) (string, error) {
	switch item.Type {
	case HostsTypeLocal, HostsTypeRemote:
		return GetHostsContent(item.ID)

	case HostsTypeFolder:
		var buf bytes.Buffer
		if item.Children != nil {
			for _, child := range item.Children {
				if child.On {
					childContent, err := GetFinalContent(child, allItems)
					if err != nil {
						return "", err
					}
					if childContent != "" {
						if child.Title != "" {
							buf.WriteString(fmt.Sprintf("# file: %s\n", child.Title))
						}
						buf.WriteString(childContent)
						buf.WriteString("\n\n")
					}
				}
			}
		}
		return strings.TrimSpace(buf.String()), nil

	case HostsTypeGroup:
		var buf bytes.Buffer
		for _, includeID := range item.Include {
			includeItem := FindItemByID(allItems, includeID)
			if includeItem != nil && includeItem.On {
				content, err := GetFinalContent(includeItem, allItems)
				if err != nil {
					return "", err
				}
				if content != "" {
					if includeItem.Title != "" {
						buf.WriteString(fmt.Sprintf("# file: %s\n", includeItem.Title))
					}
					buf.WriteString(content)
					buf.WriteString("\n\n")
				}
			}
		}
		return strings.TrimSpace(buf.String()), nil

	default:
		return "", nil
	}
}

// ApplyHosts applies the selected hosts to system hosts
func ApplyHosts(items []*HostsListObject) (*OperationResult, error) {
	var buf bytes.Buffer

	for _, item := range items {
		if item.On {
			content, err := GetFinalContent(item, items)
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

	finalContent := strings.TrimSpace(buf.String())
	return SetSystemHosts(finalContent, nil)
}

// CheckAccess checks if the hosts file is writable
func CheckAccess() bool {
	path := GetSystemHostsPath()
	err := os.WriteFile(path, nil, 0644)
	if err != nil {
		// Check if it's a permission error
		if os.IsPermission(err) {
			return false
		}
		// Other error (like path not exist) - still might be writable with elevation
		return false
	}
	return true
}

// GetHostsHistory returns the hosts history
func GetHostsHistory(hostsID string, limit int) ([]*HostsHistoryObject, error) {
	items, err := db.GetHistory(hostsID, limit)
	if err != nil {
		return nil, err
	}

	history := make([]*HostsHistoryObject, 0, len(items))
	for _, item := range items {
		if id, ok := item["id"].(string); ok {
			content, _ := item["content"].(string)
			addTimeMs, _ := item["add_time_ms"].(int64)
			history = append(history, &HostsHistoryObject{
				ID:        id,
				Content:   content,
				AddTimeMs: addTimeMs,
			})
		}
	}

	return history, nil
}

// DeleteHostsHistory deletes a history entry
func DeleteHostsHistory(historyID string) error {
	return db.DeleteHistory(historyID)
}

// ClearHostsHistory clears all history for a hosts
func ClearHostsHistory(hostsID string) error {
	return db.ClearHistory(hostsID)
}

// FindPositionsInContent finds all positions of keyword in content
func FindPositionsInContent(content, keyword string, isRegexp, isIgnoreCase bool) []FindPosition {
	return findPositionsInContent(content, keyword, &FindOptions{
		IsRegexp:    isRegexp,
		IsIgnoreCase: isIgnoreCase,
	})
}
