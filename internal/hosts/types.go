package hosts

// HostsType represents the type of hosts entry
type HostsType string

const (
	HostsTypeLocal   HostsType = "local"
	HostsTypeRemote  HostsType = "remote"
	HostsTypeGroup   HostsType = "group"
	HostsTypeFolder  HostsType = "folder"
)

// FolderModeType represents the folder selection mode
type FolderModeType int

const (
	FolderModeDefault  FolderModeType = 0
	FolderModeSingle   FolderModeType = 1 // 单选
	FolderModeMultiple FolderModeType = 2 // 多选
)

// TrashcanType represents trashcan item type
type TrashcanType string

const (
	TrashcanTypeTrashcan TrashcanType = "trashcan"
)

// HostsListObject represents a hosts list item
type HostsListObject struct {
	ID              string              `json:"id"`
	Title           string              `json:"title,omitempty"`
	On              bool                `json:"on,omitempty"`
	Type            HostsType           `json:"type,omitempty"`
	URL             string              `json:"url,omitempty"`
	LastRefresh     string              `json:"last_refresh,omitempty"`
	LastRefreshMs   int64               `json:"last_refresh_ms,omitempty"`
	RefreshInterval int                 `json:"refresh_interval,omitempty"`
	Include         []string            `json:"include,omitempty"`
	FolderMode      FolderModeType      `json:"folder_mode,omitempty"`
	FolderOpen      bool                `json:"folder_open,omitempty"`
	Children        []*HostsListObject  `json:"children,omitempty"`
	IsSys           bool                `json:"is_sys,omitempty"`
	Content         string              `json:"content,omitempty"`

	// For tree node data compatibility
	CanSelect      bool `json:"can_select,omitempty"`
	CanDrag        bool `json:"can_drag,omitempty"`
	CanDropBefore  bool `json:"can_drop_before,omitempty"`
	CanDropIn      bool `json:"can_drop_in,omitempty"`
	CanDropAfter   bool `json:"can_drop_after,omitempty"`
	IsCollapsed    bool `json:"is_collapsed,omitempty"`
}

// TrashcanObject represents an item in trashcan
type TrashcanObject struct {
	ID        string           `json:"id"`
	Data      *HostsListObject `json:"data"`
	AddTimeMs int64            `json:"add_time_ms"`
	ParentID  string           `json:"parent_id,omitempty"`
}

// HostsBasicData represents the basic hosts data
type HostsBasicData struct {
	List     []*HostsListObject `json:"list"`
	Trashcan []*TrashcanObject `json:"trashcan"`
	Version  [4]int            `json:"version"`
}

// HostsContentObject represents hosts content
type HostsContentObject struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

// OperationResult represents an operation result
type OperationResult struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// CommandRunResult represents a command execution result
type CommandRunResult struct {
	ID        string `json:"_id,omitempty"`
	Success   bool   `json:"success"`
	Stdout    string `json:"stdout"`
	Stderr    string `json:"stderr"`
	AddTimeMs int64  `json:"add_time_ms"`
}

// HostsHistoryObject represents a history entry
type HostsHistoryObject struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	AddTimeMs int64  `json:"add_time_ms"`
	Label     string `json:"label,omitempty"`
}

// FindPosition represents a find position in content
type FindPosition struct {
	Start      int    `json:"start"`
	End        int    `json:"end"`
	Line       int    `json:"line"`
	LinePos    int    `json:"line_pos"`
	EndLine    int    `json:"end_line"`
	EndLinePos int    `json:"end_line_pos"`
	Before     string `json:"before"`
	Match      string `json:"match"`
	After      string `json:"after"`
}

// FindSplitter represents a find split
type FindSplitter struct {
	Start   int    `json:"start"`
	End     int    `json:"end"`
	Before  string `json:"before"`
	Match   string `json:"match"`
	After   string `json:"after"`
	Replace string `json:"replace,omitempty"`
}

// FindItem represents a find result item
type FindItem struct {
	ItemID    string           `json:"item_id"`
	ItemTitle string           `json:"item_title"`
	ItemType  HostsType        `json:"item_type"`
	Positions []FindPosition   `json:"positions"`
	Splitters []*FindSplitter `json:"splitters"`
}

// FindOptions represents find options
type FindOptions struct {
	IsRegexp    bool
	IsIgnoreCase bool
}

// WriteOptions represents hosts write options
type WriteOptions struct {
	SudoPSwd string `json:"sudo_pswd,omitempty"`
}

// ImportResult represents import result
type ImportResult struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}
