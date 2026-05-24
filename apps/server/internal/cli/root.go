// Package cli wires cobra commands and viper config for the server.
package cli

import (
	"github.com/spf13/cobra"
)

func Root() *cobra.Command {
	root := &cobra.Command{
		Use:   "ttr-server",
		Short: "Ticket to Ride Hannover multiplayer relay server",
	}
	root.AddCommand(serveCmd())
	return root
}
