package hosts

import (
	"regexp"
	"strings"
	"time"

	"switch-hosts-wails/internal/db"
)

// FindBy searches for text in hosts content
func FindBy(keyword string, options *FindOptions) ([]*FindItem, error) {
	opts := &FindOptions{}
	if options != nil {
		opts = options
	}

	items := []*FindItem{}
	basicData, err := GetBasicData()
	if err != nil {
		return nil, err
	}

	for _, item := range Flatten(basicData.List) {
		if item.Type == HostsTypeFolder || item.Type == HostsTypeGroup {
			continue
		}

		content, err := GetHostsContent(item.ID)
		if err != nil || content == "" {
			continue
		}

		positions := findPositionsInContent(content, keyword, opts)
		if len(positions) > 0 {
			splitters := make([]*FindSplitter, len(positions))
			for i, pos := range positions {
				splitters[i] = &FindSplitter{
					Start:   pos.Start,
					End:     pos.End,
					Before:  pos.Before,
					Match:   pos.Match,
					After:   pos.After,
					Replace: pos.Match,
				}
			}
			items = append(items, &FindItem{
				ItemID:    item.ID,
				ItemTitle: item.Title,
				ItemType:  item.Type,
				Positions: positions,
				Splitters: splitters,
			})
		}
	}

	return items, nil
}

func findPositionsInContent(content, keyword string, opts *FindOptions) []FindPosition {
	positions := []FindPosition{}
	lines := strings.Split(content, "\n")

	var pattern *regexp.Regexp
	var err error

	if opts.IsRegexp {
		flags := ""
		if opts.IsIgnoreCase {
			flags = "(?i)"
		}
		pattern, err = regexp.Compile(flags + keyword)
	} else {
		searchKeyword := keyword
		if opts.IsIgnoreCase {
			searchKeyword = strings.ToLower(keyword)
		}
		pattern = regexp.MustCompile(regexp.QuoteMeta(searchKeyword))
	}

	if err != nil {
		return positions
	}

	linePos := 0
	for lineNum, line := range lines {
		indices := pattern.FindAllStringIndex(line, -1)
		if opts.IsIgnoreCase && !opts.IsRegexp {
			line = strings.ToLower(line)
		}

		for _, idx := range indices {
			start := linePos + idx[0]
			end := linePos + idx[1]
			match := content[start:end]

			before := ""
			if start > 0 {
				beforeStart := start - 20
				if beforeStart < 0 {
					beforeStart = 0
				}
				before = content[beforeStart:start]
			}

			after := ""
			if end < len(content) {
				afterEnd := end + 20
				if afterEnd > len(content) {
					afterEnd = len(content)
				}
				after = content[end:afterEnd]
			}

			positions = append(positions, FindPosition{
				Start:      start,
				End:        end,
				Line:       lineNum + 1,
				LinePos:    idx[0],
				EndLine:    lineNum + 1,
				EndLinePos: idx[1],
				Before:     before,
				Match:      match,
				After:      after,
			})
		}
		linePos += len(line) + 1 // +1 for newline
	}

	return positions
}

// FindInContent searches for keyword in a specific hosts content
func FindInContent(content, keyword string, opts *FindOptions) []FindPosition {
	return findPositionsInContent(content, keyword, opts)
}

// ReplaceInContent replaces text in hosts content
func ReplaceInContent(content string, splitters []*FindSplitter) string {
	result := content
	offset := 0

	for _, splitter := range splitters {
		start := splitter.Start + offset
		end := splitter.End + offset
		if start < 0 || end > len(result) || start > end {
			continue
		}
		if splitter.Replace != "" {
			result = result[:start] + splitter.Replace + result[end:]
			offset += len(splitter.Replace) - (splitter.End - splitter.Start)
		}
	}

	return result
}

// AddFindHistory adds a search history entry
func AddFindHistory(keyword string) error {
	id := nowStringID()
	return db.SetConfig("find_history_"+id, keyword)
}

// GetFindHistory gets search history
func GetFindHistory(limit int) ([]string, error) {
	config, err := db.GetAllConfig()
	if err != nil {
		return nil, err
	}

	var history []string
	for key, value := range config {
		if strings.HasPrefix(key, "find_history_") {
			history = append(history, value)
		}
	}

	if len(history) > limit {
		history = history[:limit]
	}
	return history, nil
}

func nowStringID() string {
	return time.Now().Format("20060102150405.000")
}
