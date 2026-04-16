package hosts

import (
	"sort"
)

// Flatten flattens the hosts list tree
func Flatten(list []*HostsListObject) []*HostsListObject {
	var result []*HostsListObject
	for _, item := range list {
		result = append(result, item)
		if item.Children != nil {
			result = append(result, Flatten(item.Children)...)
		}
	}
	return result
}

// FindItemByID finds an item by ID in the list
func FindItemByID(list []*HostsListObject, id string) *HostsListObject {
	for _, item := range Flatten(list) {
		if item.ID == id {
			return item
		}
	}
	return nil
}

// UpdateOneItem updates a single item in the list
func UpdateOneItem(list []*HostsListObject, item *HostsListObject) []*HostsListObject {
	newList := DeepCopyList(list)
	target := FindItemByID(newList, item.ID)
	if target != nil {
		*target = *item
	}
	return newList
}

// DeepCopyList creates a deep copy of the hosts list
func DeepCopyList(list []*HostsListObject) []*HostsListObject {
	if list == nil {
		return nil
	}
	result := make([]*HostsListObject, len(list))
	for i, item := range list {
		result[i] = DeepCopyItem(item)
	}
	return result
}

// DeepCopyItem creates a deep copy of a hosts item
func DeepCopyItem(item *HostsListObject) *HostsListObject {
	if item == nil {
		return nil
	}
	cp := *item
	if item.Children != nil {
		cp.Children = DeepCopyList(item.Children)
	}
	if item.Include != nil {
		cp.Include = make([]string, len(item.Include))
		copy(cp.Include, item.Include)
	}
	return &cp
}

// DeleteItemByID deletes an item by ID from the list
func DeleteItemByID(list []*HostsListObject, id string) []*HostsListObject {
	for i, item := range list {
		if item.ID == id {
			return append(list[:i], list[i+1:]...)
		}
		if item.Children != nil {
			item.Children = DeleteItemByID(item.Children, id)
		}
	}
	return list
}

// SetOnStateOfItem sets the on/off state of an item
func SetOnStateOfItem(list []*HostsListObject, id string, on bool, defaultChoiceMode FolderModeType, multiChoseFolderSwitchAll bool) []*HostsListObject {
	newList := DeepCopyList(list)
	item := FindItemByID(newList, id)
	if item == nil {
		return newList
	}

	item.On = on

	if multiChoseFolderSwitchAll {
		switchFolderChild(item, on)
		if !isInTopLevel(list, id) {
			switchItemParentIsON(newList, item, on)
		}
	}

	if !on {
		return newList
	}

	if isInTopLevel(list, id) {
		if defaultChoiceMode == FolderModeSingle {
			for _, other := range newList {
				if other.ID != id {
					other.On = false
					if multiChoseFolderSwitchAll {
						switchFolderChild(other, false)
					}
				}
			}
		}
	} else {
		parent := GetParentOfItem(newList, id)
		if parent != nil {
			folderMode := parent.FolderMode
			if folderMode == FolderModeDefault {
				folderMode = defaultChoiceMode
			}
			if folderMode == FolderModeSingle && parent.Children != nil {
				for _, child := range parent.Children {
					if child.ID != id {
						child.On = false
						if multiChoseFolderSwitchAll {
							switchFolderChild(child, false)
						}
					}
				}
			}
		}
	}

	return newList
}

func isInTopLevel(list []*HostsListObject, id string) bool {
	for _, item := range list {
		if item.ID == id {
			return true
		}
	}
	return false
}

func switchFolderChild(item *HostsListObject, on bool) *HostsListObject {
	if item.Type != HostsTypeFolder {
		return item
	}
	if item.FolderMode == FolderModeSingle {
		return item
	}
	if item.Children != nil {
		for _, child := range item.Children {
			child.On = on
			if child.Type == HostsTypeFolder {
				switchFolderChild(child, on)
			}
		}
	}
	return item
}

func switchItemParentIsON(list []*HostsListObject, item *HostsListObject, on bool) {
	parent := GetParentOfItem(list, item.ID)
	if parent == nil {
		return
	}
	if parent.FolderMode == FolderModeSingle {
		return
	}
	if !on {
		parent.On = false
	} else if parent.Children != nil {
		parentOn := true
		for _, child := range parent.Children {
			if !child.On {
				parentOn = false
				break
			}
		}
		parent.On = parentOn
	}
	if !isInTopLevel(list, parent.ID) {
		switchItemParentIsON(list, parent, on)
	}
}

// GetParentOfItem gets the parent of an item
func GetParentOfItem(list []*HostsListObject, itemID string) *HostsListObject {
	if isInTopLevel(list, itemID) {
		return nil
	}
	flat := Flatten(list)
	for _, p := range flat {
		if p.Children != nil {
			for _, child := range p.Children {
				if child.ID == itemID {
					return p
				}
			}
		}
	}
	return nil
}

// GetNextSelectedItem gets the next selected item
func GetNextSelectedItem(tree []*HostsListObject, predicate func(*HostsListObject) bool) *HostsListObject {
	flat := Flatten(tree)
	var idx1, idx2 int = -1, -1
	for i, item := range flat {
		if predicate(item) {
			if idx1 == -1 {
				idx1 = i
			}
			idx2 = i
		}
	}
	if idx2+1 < len(flat) {
		return flat[idx2+1]
	}
	if idx1 > 0 {
		return flat[idx1-1]
	}
	return nil
}

// CleanHostsList normalizes the hosts list
func CleanHostsList(data *HostsBasicData) *HostsBasicData {
	list := Flatten(data.List)
	for _, item := range list {
		if item.Type == HostsTypeFolder && item.Children == nil {
			item.Children = []*HostsListObject{}
		}
		if item.Type == HostsTypeGroup && item.Include == nil {
			item.Include = []string{}
		}
		if item.Type == HostsTypeFolder || item.Type == HostsTypeGroup {
			item.Content = ""
		}
	}
	return data
}

// SortList sorts the hosts list
func SortList(list []*HostsListObject, by func(a, b *HostsListObject) bool) {
	sort.Slice(list, func(i, j int) bool {
		return by(list[i], list[j])
	})
	for _, item := range list {
		if item.Children != nil {
			SortList(item.Children, by)
		}
	}
}

// MoveItemBefore moves an item before another item
func MoveItemBefore(list []*HostsListObject, sourceID, targetID string) []*HostsListObject {
	if sourceID == targetID {
		return list
	}

	newList := DeepCopyList(list)
	source := FindItemByID(newList, sourceID)
	if source == nil {
		return newList
	}

	// Remove source from list
	newList = DeleteItemByID(newList, sourceID)

	// Find target and insert before it
	target := FindItemByID(newList, targetID)
	if target == nil {
		// Target not found, append to end
		newList = append(newList, source)
		return newList
	}

	// Find index of target
	for i, item := range newList {
		if item.ID == targetID {
			// Insert before target
			newList = append(newList[:i], append([]*HostsListObject{source}, newList[i:]...)...)
			break
		}
	}

	return newList
}

// MoveItemAfter moves an item after another item
func MoveItemAfter(list []*HostsListObject, sourceID, targetID string) []*HostsListObject {
	if sourceID == targetID {
		return list
	}

	newList := DeepCopyList(list)
	source := FindItemByID(newList, sourceID)
	if source == nil {
		return newList
	}

	// Remove source from list
	newList = DeleteItemByID(newList, sourceID)

	// Find target and insert after it
	target := FindItemByID(newList, targetID)
	if target == nil {
		// Target not found, append to end
		newList = append(newList, source)
		return newList
	}

	// Find index of target and insert after
	for i, item := range newList {
		if item.ID == targetID {
			// Insert after target
			if i == len(newList)-1 {
				newList = append(newList, source)
			} else {
				newList = append(newList[:i+1], append([]*HostsListObject{source}, newList[i+1:]...)...)
			}
			break
		}
	}

	return newList
}

// MoveItemInto moves an item into a folder
func MoveItemInto(list []*HostsListObject, sourceID, folderID string) []*HostsListObject {
	if sourceID == folderID {
		return list
	}

	newList := DeepCopyList(list)
	source := FindItemByID(newList, sourceID)
	if source == nil {
		return newList
	}

	// Remove source from current location
	newList = DeleteItemByID(newList, sourceID)

	// Find target folder
	folder := FindItemByID(newList, folderID)
	if folder == nil || folder.Type != HostsTypeFolder {
		// Folder not found or not a folder, append to end
		newList = append(newList, source)
		return newList
	}

	// Add to folder's children
	if folder.Children == nil {
		folder.Children = []*HostsListObject{}
	}
	folder.Children = append(folder.Children, source)
	folder.FolderOpen = true

	return newList
}

// AddItemToList adds a new item to the list
func AddItemToList(list []*HostsListObject, parentID string, item *HostsListObject) []*HostsListObject {
	newList := DeepCopyList(list)

	if parentID == "" {
		// Add to top level
		return append(newList, item)
	}

	parent := FindItemByID(newList, parentID)
	if parent == nil {
		// Parent not found, add to top level
		return append(newList, item)
	}

	if parent.Type == HostsTypeFolder {
		if parent.Children == nil {
			parent.Children = []*HostsListObject{}
		}
		parent.Children = append(parent.Children, item)
		parent.FolderOpen = true
	} else {
		// Not a folder, add to top level
		newList = append(newList, item)
	}

	return newList
}
