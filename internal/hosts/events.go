package hosts

import (
	"sync"
)

type eventHandler func(args ...interface{})

var (
	eventMu     sync.RWMutex
	eventStore  = make(map[string][]eventHandler)
	eventLock   sync.Mutex
)

// On registers an event handler
func On(event string, handler eventHandler) {
	eventMu.Lock()
	defer eventMu.Unlock()
	eventStore[event] = append(eventStore[event], handler)
}

// Off removes an event handler
func Off(event string, handler eventHandler) {
	eventMu.Lock()
	defer eventMu.Unlock()
	handlers := eventStore[event]
	for i, h := range handlers {
		if &h == &handler {
			eventStore[event] = append(handlers[:i], handlers[i+1:]...)
			break
		}
	}
}

// Emit emits an event
func Emit(event string, args ...interface{}) {
	eventMu.RLock()
	defer eventMu.RUnlock()
	handlers := eventStore[event]
	for _, handler := range handlers {
		go handler(args...)
	}
}
