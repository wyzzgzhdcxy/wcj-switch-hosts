package hosts

import (
	"switch-hosts-wails/internal/db"
)

// InitDB initializes the database
func InitDB(dataDir string) error {
	return db.InitDB(dataDir)
}

// GetHistory gets history for a hosts entry
func GetHistory(hostsID string, limit int) ([]map[string]interface{}, error) {
	return db.GetHistory(hostsID, limit)
}

// DeleteHistory deletes a history entry
func DeleteHistory(historyID string) error {
	return db.DeleteHistory(historyID)
}

// ClearHistory clears all history for a hosts entry
func ClearHistory(hostsID string) error {
	return db.ClearHistory(hostsID)
}
