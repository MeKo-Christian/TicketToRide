package cli

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/MeKo-Christian/TicketToRide/apps/server/internal/room"
	"github.com/MeKo-Christian/TicketToRide/apps/server/internal/ws"
)

func serveCmd() *cobra.Command {
	v := viper.New()
	v.SetEnvPrefix("TTR")
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	v.AutomaticEnv()

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Run the multiplayer relay server",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := v.BindPFlags(cmd.Flags()); err != nil {
				return err
			}
			cfg := serveConfigFrom(v)
			return runServe(cmd.Context(), cfg)
		},
	}

	cmd.Flags().Int("port", 8080, "HTTP port to listen on")
	cmd.Flags().StringSlice("cors-origin", []string{"http://localhost:5173"}, "Allowed origins for WS (comma-separated)")
	cmd.Flags().Duration("room-ttl", time.Hour, "Idle TTL before a room is swept")
	cmd.Flags().Duration("sweep-interval", time.Minute, "How often the idle-room sweeper runs")
	cmd.Flags().Int("max-rooms", 500, "Maximum concurrent rooms")
	cmd.Flags().String("log-level", "info", "Log level: debug|info|warn|error")
	return cmd
}

type serveConfig struct {
	Port          int
	CORSOrigins   []string
	RoomTTL       time.Duration
	SweepInterval time.Duration
	MaxRooms      int
	LogLevel      string
}

func serveConfigFrom(v *viper.Viper) serveConfig {
	return serveConfig{
		Port:          v.GetInt("port"),
		CORSOrigins:   v.GetStringSlice("cors-origin"),
		RoomTTL:       v.GetDuration("room-ttl"),
		SweepInterval: v.GetDuration("sweep-interval"),
		MaxRooms:      v.GetInt("max-rooms"),
		LogLevel:      v.GetString("log-level"),
	}
}

func runServe(ctx context.Context, cfg serveConfig) error {
	logger := newLogger(cfg.LogLevel)

	hub := room.NewHub(room.Config{MaxRooms: cfg.MaxRooms, TTL: cfg.RoomTTL})

	wsSrv := ws.NewServer(hub, ws.ServerConfig{
		AllowedOrigins: cfg.CORSOrigins,
		Logger:         logger,
	})

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           wsSrv.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	sweepCtx, cancelSweep := context.WithCancel(ctx)
	defer cancelSweep()
	go hub.RunSweeper(sweepCtx, cfg.SweepInterval)

	sigCtx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		logger.Info("listening", "port", cfg.Port, "origins", cfg.CORSOrigins)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case <-sigCtx.Done():
		logger.Info("shutdown requested")
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

func newLogger(level string) *slog.Logger {
	var lvl slog.Level
	switch strings.ToLower(level) {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl}))
}
