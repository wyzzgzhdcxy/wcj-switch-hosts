package migrate

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"switch-hosts-wails/internal/db"
	"switch-hosts-wails/internal/hosts"
)

// VersionType represents the version
type VersionType [4]int

// ImportData represents the data to import
type ImportData struct {
	Data    *hosts.HostsBasicData `json:"data"`
	Version VersionType           `json:"version"`
}

// CheckMigration checks if migration is needed
func CheckMigration() bool {
	dataDir := getDataDir()
	fn := filepath.Join(dataDir, "data.json")
	_, err := os.Stat(fn)
	return err == nil
}

// ReadOldData reads the old v3 data
func ReadOldData() (*hosts.HostsBasicData, error) {
	dataDir := getDataDir()
	fn := filepath.Join(dataDir, "data.json")

	data, err := os.ReadFile(fn)
	if err != nil {
		return nil, err
	}

	var oldData hosts.HostsBasicData
	if err := json.Unmarshal(data, &oldData); err != nil {
		return nil, err
	}

	// Clean the data
	oldData.List = cleanHostsList(oldData.List)

	return &oldData, nil
}

// ImportV3Data imports data from v3 format
func ImportV3Data(oldData *hosts.HostsBasicData) error {
	// Clear existing hosts content and tree
	db.ClearHostsContent()
	db.ClearHostsTree()

	// Flatten the list to get all hosts items
	allItems := hosts.Flatten(oldData.List)

	// Save each hosts content
	for _, item := range allItems {
		if item.ID != "0" && item.Content != "" {
			db.SetHostsContent(item.ID, item.Content)
		}
		item.Content = "" // Clear content from tree item
	}

	// Save the tree structure
	for _, item := range oldData.List {
		saveTreeItemRecursive("", item)
	}

	// Set version
	db.SetConfig("version", fmt.Sprintf("%d.%d.%d.%d", 1, 0, 0, 0))

	return nil
}

// ExportData exports the current data
func ExportData() (*ImportData, error) {
	data, err := hosts.GetBasicData()
	if err != nil {
		return nil, err
	}

	return &ImportData{
		Data:    data,
		Version: [4]int{1, 0, 0, 0},
	}, nil
}

// ImportDataFromFile imports data from a file
func ImportDataFromFile(filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	var importData ImportData
	if err := json.Unmarshal(data, &importData); err != nil {
		return err
	}

	if importData.Data == nil {
		return fmt.Errorf("invalid data format")
	}

	return ImportDataFromMap(importData.Data)
}

// ImportDataFromMap imports data from a HostsBasicData struct
func ImportDataFromMap(data *hosts.HostsBasicData) error {
	// Clear existing data
	db.ClearHostsContent()
	db.ClearHostsTree()

	// Flatten and save hosts content
	allItems := hosts.Flatten(data.List)
	for _, item := range allItems {
		if item.ID != "0" && item.Content != "" {
			db.SetHostsContent(item.ID, item.Content)
		}
		item.Content = ""
	}

	// Save tree structure
	for _, item := range data.List {
		saveTreeItemRecursive("", item)
	}

	return nil
}

func saveTreeItemRecursive(parentID string, item *hosts.HostsListObject) error {
	data, err := json.Marshal(item)
	if err != nil {
		return err
	}
	if err := db.SetHostsTreeItem(item.ID, parentID, string(data)); err != nil {
		return err
	}

	if item.Children != nil {
		for _, child := range item.Children {
			if err := saveTreeItemRecursive(item.ID, child); err != nil {
				return err
			}
		}
	}

	return nil
}

func cleanHostsList(list []*hosts.HostsListObject) []*hosts.HostsListObject {
	for _, item := range hosts.Flatten(list) {
		if item.Type == hosts.HostsTypeFolder && item.Children == nil {
			item.Children = []*hosts.HostsListObject{}
		}
		if item.Type == hosts.HostsTypeGroup && item.Include == nil {
			item.Include = []string{}
		}
		if item.Type == hosts.HostsTypeFolder || item.Type == hosts.HostsTypeGroup {
			item.Content = ""
		}
	}
	return list
}

func getDataDir() string {
	home, _ := os.UserHomeDir()
	if home == "" {
		home = os.Getenv("APPDATA")
	}
	return filepath.Join(home, ".SwitchHosts")
}
