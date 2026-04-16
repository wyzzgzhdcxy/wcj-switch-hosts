package db

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDB initializes the database
func InitDB(dataDir string) error {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return err
	}

	dbPath := filepath.Join(dataDir, "switchhosts.db")
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	if err = createTables(); err != nil {
		return err
	}

	return nil
}

func createTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS hosts_content (
			id TEXT PRIMARY KEY,
			content TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS hosts_tree (
			id TEXT PRIMARY KEY,
			parent_id TEXT,
			data TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS hosts_history (
			id TEXT PRIMARY KEY,
			hosts_id TEXT,
			content TEXT,
			add_time_ms INTEGER
		)`,
		`CREATE TABLE IF NOT EXISTS config (
			key TEXT PRIMARY KEY,
			value TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS cmd_history (
			id TEXT PRIMARY KEY,
			stdout TEXT,
			stderr TEXT,
			add_time_ms INTEGER
		)`,
		`CREATE TABLE IF NOT EXISTS trashcan (
			id TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			add_time_ms INTEGER,
			parent_id TEXT
		)`,
	}

	for _, table := range tables {
		if _, err := DB.Exec(table); err != nil {
			return err
		}
	}

	return nil
}

// GetHostsContent gets hosts content by ID
func GetHostsContent(id string) (string, error) {
	var content string
	err := DB.QueryRow("SELECT content FROM hosts_content WHERE id = ?", id).Scan(&content)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return content, err
}

// SetHostsContent sets hosts content by ID
func SetHostsContent(id, content string) error {
	_, err := DB.Exec(`
		INSERT INTO hosts_content (id, content) VALUES (?, ?)
		ON CONFLICT(id) DO UPDATE SET content = excluded.content`,
		id, content)
	return err
}

// GetAllHostsTree gets all hosts tree data
func GetAllHostsTree() ([]string, error) {
	rows, err := DB.Query("SELECT data FROM hosts_tree")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []string
	for rows.Next() {
		var data string
		if err := rows.Scan(&data); err != nil {
			return nil, err
		}
		results = append(results, data)
	}
	return results, nil
}

// SetHostsTreeItem sets a hosts tree item
func SetHostsTreeItem(id, parentID string, data interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return err
	}
	_, err = DB.Exec(`
		INSERT INTO hosts_tree (id, parent_id, data) VALUES (?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET parent_id = excluded.parent_id, data = excluded.data`,
		id, parentID, string(dataJSON))
	return err
}

// DeleteHostsTreeItem deletes a hosts tree item
func DeleteHostsTreeItem(id string) error {
	_, err := DB.Exec("DELETE FROM hosts_tree WHERE id = ?", id)
	return err
}

// GetConfig gets a config value
func GetConfig(key string) (string, error) {
	var value string
	err := DB.QueryRow("SELECT value FROM config WHERE key = ?", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

// SetConfig sets a config value
func SetConfig(key, value string) error {
	_, err := DB.Exec(`
		INSERT INTO config (key, value) VALUES (?, ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		key, value)
	return err
}

// GetAllConfig gets all config key-value pairs
func GetAllConfig() (map[string]string, error) {
	rows, err := DB.Query("SELECT key, value FROM config")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		result[key] = value
	}
	return result, nil
}

// GetHistory gets hosts history
func GetHistory(hostsID string, limit int) ([]map[string]interface{}, error) {
	rows, err := DB.Query(`
		SELECT id, content, add_time_ms FROM hosts_history
		WHERE hosts_id = ? ORDER BY add_time_ms DESC LIMIT ?`,
		hostsID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id, content string
		var addTimeMs int64
		if err := rows.Scan(&id, &content, &addTimeMs); err != nil {
			return nil, err
		}
		results = append(results, map[string]interface{}{
			"id":          id,
			"content":     content,
			"add_time_ms": addTimeMs,
		})
	}
	return results, nil
}

// AddHistory adds a history record
func AddHistory(id, hostsID, content string, addTimeMs int64) error {
	_, err := DB.Exec(`
		INSERT INTO hosts_history (id, hosts_id, content, add_time_ms) VALUES (?, ?, ?, ?)`,
		id, hostsID, content, addTimeMs)
	return err
}

// DeleteHistory deletes a history record
func DeleteHistory(id string) error {
	_, err := DB.Exec("DELETE FROM hosts_history WHERE id = ?", id)
	return err
}

// ClearHistory clears all history for a hosts
func ClearHistory(hostsID string) error {
	_, err := DB.Exec("DELETE FROM hosts_history WHERE hosts_id = ?", hostsID)
	return err
}

// GetTrashcanItems gets all trashcan items
func GetTrashcanItems() ([]map[string]interface{}, error) {
	rows, err := DB.Query("SELECT id, data, add_time_ms, parent_id FROM trashcan ORDER BY add_time_ms DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id, data string
		var addTimeMs int64
		var parentID sql.NullString
		if err := rows.Scan(&id, &data, &addTimeMs, &parentID); err != nil {
			return nil, err
		}
		item := map[string]interface{}{
			"id":          id,
			"data":        data,
			"add_time_ms": addTimeMs,
		}
		if parentID.Valid {
			item["parent_id"] = parentID.String
		}
		results = append(results, item)
	}
	return results, nil
}

// AddToTrashcan adds an item to trashcan
func AddToTrashcan(id string, data interface{}, addTimeMs int64, parentID string) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return err
	}
	_, err = DB.Exec(`
		INSERT INTO trashcan (id, data, add_time_ms, parent_id) VALUES (?, ?, ?, ?)`,
		id, string(dataJSON), addTimeMs, parentID)
	return err
}

// DeleteFromTrashcan deletes an item from trashcan
func DeleteFromTrashcan(id string) error {
	_, err := DB.Exec("DELETE FROM trashcan WHERE id = ?", id)
	return err
}

// ClearTrashcan clears all trashcan items
func ClearTrashcan() error {
	_, err := DB.Exec("DELETE FROM trashcan")
	return err
}

// Close closes the database
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// ClearHostsTree clears all hosts tree items
func ClearHostsTree() error {
	_, err := DB.Exec("DELETE FROM hosts_tree")
	return err
}

// ClearHostsContent clears all hosts content
func ClearHostsContent() error {
	_, err := DB.Exec("DELETE FROM hosts_content")
	return err
}
