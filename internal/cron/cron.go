package cron

import (
	"log"
	"sync"
	"time"

	"switch-hosts-wails/internal/hosts"
)

// Cron represents a cron scheduler
type Cron struct {
	tasks    map[string]*task
	mu       sync.Mutex
	stopChan chan struct{}
}

type task struct {
	id       string
	interval time.Duration
	lastRun  time.Time
	enabled  bool
}

// Global cron instance
var globalCron *Cron

// Start starts the global cron
func Start() {
	if globalCron != nil {
		return
	}
	globalCron = &Cron{
		tasks:    make(map[string]*task),
		stopChan: make(chan struct{}),
	}
	go globalCron.run()
	log.Println("Cron started")
}

// Stop stops the global cron
func Stop() {
	if globalCron == nil {
		return
	}
	close(globalCron.stopChan)
	globalCron = nil
	log.Println("Cron stopped")
}

func (c *Cron) run() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-c.stopChan:
			return
		case <-ticker.C:
			c.checkAndRun()
		}
	}
}

func (c *Cron) checkAndRun() {
	c.mu.Lock()
	defer c.mu.Unlock()

	data, err := hosts.GetBasicData()
	if err != nil {
		log.Printf("Cron: failed to get hosts data: %v", err)
		return
	}

	now := time.Now()
	for _, item := range hosts.Flatten(data.List) {
		if item.Type != hosts.HostsTypeRemote || item.URL == "" {
			continue
		}

		if item.RefreshInterval <= 0 {
			continue
		}

		interval := time.Duration(item.RefreshInterval) * time.Second
		lastRefresh := item.LastRefreshMs

		if lastRefresh == 0 {
			// Never refreshed, do it now
			c.runTask(item.ID, interval)
			continue
		}

		lastRun := time.UnixMilli(lastRefresh)
		if now.Sub(lastRun) >= interval {
			c.runTask(item.ID, interval)
		}
	}
}

func (c *Cron) runTask(id string, interval time.Duration) {
	item, err := hosts.GetItem(id)
	if err != nil || item == nil {
		return
	}

	log.Printf("Cron: refreshing remote hosts %s", item.Title)
	result, err := hosts.RefreshRemoteHosts(id, item)
	if err != nil {
		log.Printf("Cron: failed to refresh %s: %v", item.Title, err)
		return
	}

	if !result.Success {
		log.Printf("Cron: failed to refresh %s: %s", item.Title, result.Message)
	}
}

// AddTask adds a cron task
func AddTask(id string, interval time.Duration) {
	if globalCron == nil {
		return
	}
	globalCron.mu.Lock()
	defer globalCron.mu.Unlock()

	globalCron.tasks[id] = &task{
		id:       id,
		interval: interval,
		lastRun:  time.Now(),
		enabled:  true,
	}
}

// RemoveTask removes a cron task
func RemoveTask(id string) {
	if globalCron == nil {
		return
	}
	globalCron.mu.Lock()
	defer globalCron.mu.Unlock()

	delete(globalCron.tasks, id)
}

// EnableTask enables a cron task
func EnableTask(id string, enabled bool) {
	if globalCron == nil {
		return
	}
	globalCron.mu.Lock()
	defer globalCron.mu.Unlock()

	if t, ok := globalCron.tasks[id]; ok {
		t.enabled = enabled
	}
}
