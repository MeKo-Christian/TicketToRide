package main

import (
	"context"
	"os"

	"github.com/MeKo-Christian/TicketToRide/apps/server/internal/cli"
)

func main() {
	if err := cli.Root().ExecuteContext(context.Background()); err != nil {
		os.Exit(1)
	}
}
