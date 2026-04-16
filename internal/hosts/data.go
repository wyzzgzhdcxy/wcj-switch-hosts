package hosts

import (
	"encoding/json"
	"time"

	"switch-hosts-wails/internal/db"
)

// GetBasicData gets the basic hosts data
func GetBasicData() (*HostsBasicData, error) {
	// Get tree data from db
	treeData, err := db.GetAllHostsTree()
	if err != nil {
		return nil, err
	}

	list := []*HostsListObject{}
	for _, data := range treeData {
		var item HostsListObject
		if err := json.Unmarshal([]byte(data), &item); err == nil {
			list = append(list, &item)
		}
	}

	// If list is empty, initialize with system hosts
	if len(list) == 0 {
		list = []*HostsListObject{
			{
				ID:    "0",
				Title: "System Hosts",
				Type:  HostsTypeLocal,
				IsSys: true,
			},
		}
	}

	// Get trashcan
	trashcanItems, err := db.GetTrashcanItems()
	if err != nil {
		return nil, err
	}

	trashcan := []*TrashcanObject{}
	for _, item := range trashcanItems {
		if dataStr, ok := item["data"].(string); ok {
			var data HostsListObject
			if json.Unmarshal([]byte(dataStr), &data) == nil {
				addTimeMs, _ := item["add_time_ms"].(int64)
				parentID, _ := item["parent_id"].(string)
				trashcan = append(trashcan, &TrashcanObject{
					ID:        item["id"].(string),
					Data:      &data,
					AddTimeMs: addTimeMs,
					ParentID:  parentID,
				})
			}
		}
	}

	return &HostsBasicData{
		List:     list,
		Trashcan: trashcan,
		Version:  [4]int{1, 0, 0, 0},
	}, nil
}

// SetList sets the hosts list
func SetList(list []*HostsListObject) error {
	// First clear all existing tree items
	db.ClearHostsTree()

	// Then insert new items
	for _, item := range list {
		if err := saveTreeItemRecursive("", item); err != nil {
			return err
		}
	}

	Emit("hosts_list_changed")
	return nil
}

func saveTreeItemRecursive(parentID string, item *HostsListObject) error {
	data, err := json.Marshal(item)
	if err != nil {
		return err
	}
	if err := db.SetHostsTreeItem(item.ID, parentID, string(data)); err != nil {
		return err
	}

	// Save children
	if item.Children != nil {
		for _, child := range item.Children {
			if err := saveTreeItemRecursive(item.ID, child); err != nil {
				return err
			}
		}
	}

	return nil
}

// GetItem gets a single item by ID
func GetItem(id string) (*HostsListObject, error) {
	basicData, err := GetBasicData()
	if err != nil {
		return nil, err
	}
	return FindItemByID(basicData.List, id), nil
}

// AddItem adds a new item to the list
func AddItem(parentID string, item *HostsListObject) error {
	data, err := json.Marshal(item)
	if err != nil {
		return err
	}
	return db.SetHostsTreeItem(item.ID, parentID, string(data))
}

// DeleteItem deletes an item
func DeleteItem(id string) error {
	return db.DeleteHostsTreeItem(id)
}

// MoveToTrashcan moves an item to trashcan
func MoveToTrashcan(id string) error {
	basicData, err := GetBasicData()
	if err != nil {
		return err
	}
	item := FindItemByID(basicData.List, id)
	if item == nil {
		return nil
	}

	parent := GetParentOfItem(basicData.List, id)
	parentID := ""
	if parent != nil {
		parentID = parent.ID
	}

	data, _ := json.Marshal(item)
	db.AddToTrashcan(id, string(data), time.Now().UnixMilli(), parentID)

	return DeleteItem(id)
}

// RestoreFromTrashcan restores an item from trashcan
func RestoreFromTrashcan(id string) error {
	items, _ := db.GetTrashcanItems()
	for _, item := range items {
		if item["id"] == id {
			if dataStr, ok := item["data"].(string); ok {
				var data HostsListObject
				if json.Unmarshal([]byte(dataStr), &data) == nil {
					parentID, _ := item["parent_id"].(string)
					db.SetHostsTreeItem(data.ID, parentID, item["data"])
					db.DeleteFromTrashcan(id)
					Emit("hosts_list_changed")
				}
			}
			break
		}
	}
	return nil
}

// DeleteFromTrashcan permanently deletes an item from trashcan
func DeleteFromTrashcan(id string) error {
	return db.DeleteFromTrashcan(id)
}

// ToggleItem toggles an item's on/off state
func ToggleItem(id string, on bool, defaultChoiceMode FolderModeType) error {
	basicData, err := GetBasicData()
	if err != nil {
		return err
	}

	// Get multi_chose_folder_switch_all from config
	multiChoseFolderSwitchAll := false
	if val, _ := db.GetConfig("multi_chose_folder_switch_all"); val == "true" || val == "1" {
		multiChoseFolderSwitchAll = true
	}

	newList := SetOnStateOfItem(basicData.List, id, on, defaultChoiceMode, multiChoseFolderSwitchAll)
	return SetList(newList)
}

// GetTrashcanList returns all items in trashcan
func GetTrashcanList() ([]*TrashcanObject, error) {
	items, err := db.GetTrashcanItems()
	if err != nil {
		return nil, err
	}

	result := make([]*TrashcanObject, 0, len(items))
	for _, item := range items {
		if dataStr, ok := item["data"].(string); ok {
			var data HostsListObject
			if json.Unmarshal([]byte(dataStr), &data) == nil {
				addTimeMs, _ := item["add_time_ms"].(int64)
				parentID, _ := item["parent_id"].(string)
				id, _ := item["id"].(string)
				result = append(result, &TrashcanObject{
					ID:        id,
					Data:      &data,
					AddTimeMs: addTimeMs,
					ParentID:  parentID,
				})
			}
		}
	}

	return result, nil
}

// ClearTrashcan clears all items from trashcan
func ClearTrashcan() error {
	return db.ClearTrashcan()
}

// UpdateItem updates a single item
func UpdateItem(item *HostsListObject) error {
	basicData, err := GetBasicData()
	if err != nil {
		return err
	}

	newList := UpdateOneItem(basicData.List, item)
	return SetList(newList)
}

// MoveItem moves an item in the tree
func MoveItem(sourceID, targetID string, moveType string) error {
	basicData, err := GetBasicData()
	if err != nil {
		return err
	}

	var newList []*HostsListObject

	switch moveType {
	case "before":
		newList = MoveItemBefore(basicData.List, sourceID, targetID)
	case "after":
		newList = MoveItemAfter(basicData.List, sourceID, targetID)
	case "into":
		newList = MoveItemInto(basicData.List, sourceID, targetID)
	default:
		return nil
	}

	return SetList(newList)
}
