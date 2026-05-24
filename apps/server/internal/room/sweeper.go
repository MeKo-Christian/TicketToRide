package room

import (
	"context"
	"time"
)

// RunSweeper periodically evicts idle rooms until ctx is cancelled.
func (h *Hub) RunSweeper(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = time.Minute
	}
	t := time.NewTicker(interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-t.C:
			h.Sweep(now)
		}
	}
}
