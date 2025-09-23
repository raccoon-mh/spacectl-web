package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"spacectl-web/server/internal/config"
	"spacectl-web/server/internal/constants"
	"spacectl-web/server/internal/grpc"
	"spacectl-web/server/internal/handlers"
	customMiddleware "spacectl-web/server/internal/middleware"
	"spacectl-web/server/internal/routes"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

//go:embed web/*
var webFiles embed.FS

// printLogo prints the ASCII art logo
func printLogo() {
	lines := []string{
		"                                    __  __                   __  ",
		"   _________  ____ _________  _____/ /_/ /    _      _____  / /_ ",
		"  / ___/ __ \\/ __ `/ ___/ _ \\/ ___/ __/ /____| | /| / / _ \\/ __ \\",
		" (__  ) /_/ / /_/ / /__/  __/ /__/ /_/ /_____/ |/ |/ /  __/ /_/ /",
		"/____/ .___/\\__,_/\\___/\\___/\\___/\\__/_/      |__/|__/\\___/_.___/ ",
		"    /_/                                                          ",
	}

	for _, line := range lines {
		fmt.Println(line)
	}
	fmt.Println("____________________________________O/____________________________")
	fmt.Println("                                    O\\")
	fmt.Println("High performance, minimalist Go web framework Echo")
	fmt.Println("")

}

func main() {
	// Define command line flags
	configFile := flag.String("config", constants.DefaultConfigFile, "Path to config.yaml file")
	port := flag.String("port", constants.DefaultPort, "Port to listen on")
	help := flag.Bool("help", false, "Show help message")
	flag.Parse()

	// Show help if requested
	if *help {
		fmt.Println("SpaceONE gRPC API Server")
		fmt.Println("Usage:")
		flag.PrintDefaults()
		fmt.Println("\nExample:")
		fmt.Println("  ./spacectl-web --config ~/.spaceone/environments/<YOUR_ENV>.yml --port 8080")
		os.Exit(0)
	}

	// Print ASCII art logo
	printLogo()

	// Check if config file exists
	if _, err := os.Stat(*configFile); os.IsNotExist(err) {
		log.Fatalf("Config file not found: %s", *configFile)
	}

	// Load configuration file
	cfg, err := config.LoadConfig(*configFile)
	if err != nil {
		log.Fatalf("Failed to load config file '%s': %v", *configFile, err)
	}

	// Create service discovery
	serviceDiscovery := grpc.NewServiceDiscovery(cfg)
	defer serviceDiscovery.Close()

	// Create gRPC client manager
	grpcManager := grpc.NewClientManager(cfg, serviceDiscovery)
	defer grpcManager.Close()

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true

	// Setup middleware
	var myLoggerConfig = middleware.LoggerConfig{
		Format:           `[${time_rfc3339}] ${method} [${status}] : ${uri} ${error} [${latency_human}]` + "\n",
		CustomTimeFormat: "2006-01-02 15:04:05",
	}
	e.Use(middleware.LoggerWithConfig(myLoggerConfig))
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(customMiddleware.GRPCMiddleware(grpcManager))

	// Create handlers
	handler := handlers.NewHandler(grpcManager, serviceDiscovery, cfg, *configFile)

	// Setup routes
	routes.SetupRoutes(e, handler)

	// Setup web file serving
	setupWebFiles(e)

	// Start server on specified port
	serverAddr := ":" + *port
	log.Printf(constants.LogServerStarting, *port)
	e.Logger.Fatal(e.Start(serverAddr))
}

// setupWebFiles configures web file serving for the web client
func setupWebFiles(e *echo.Echo) {
	// Create a sub-filesystem for web files
	webFS, err := fs.Sub(webFiles, "web")
	if err != nil {
		log.Fatalf("Failed to create static filesystem: %v", err)
	}

	// Create HTTP file system
	httpFS := http.FS(webFS)

	// Serve static files (CSS, JS, etc.) - these are in static/static/ subdirectory
	e.GET("/static/*", func(c echo.Context) error {
		path := c.Request().URL.Path
		// Remove /static prefix and add static/ prefix to match the embedded structure
		filePath := "static" + path[7:] // Remove "/static" (7 chars) and add "static/"

		file, err := webFS.Open(filePath)
		if err != nil {
			return c.String(http.StatusNotFound, "File not found")
		}
		defer file.Close()

		// Set appropriate content type
		if path[len(path)-4:] == ".css" {
			c.Response().Header().Set("Content-Type", "text/css")
		} else if path[len(path)-3:] == ".js" {
			c.Response().Header().Set("Content-Type", "application/javascript")
		}

		return c.Stream(http.StatusOK, "", file)
	})

	// Serve favicon and other root files
	e.GET("/favicon.ico", echo.WrapHandler(http.FileServer(httpFS)))
	e.GET("/logo192.png", echo.WrapHandler(http.FileServer(httpFS)))
	e.GET("/logo512.png", echo.WrapHandler(http.FileServer(httpFS)))
	e.GET("/manifest.json", echo.WrapHandler(http.FileServer(httpFS)))
	e.GET("/robots.txt", echo.WrapHandler(http.FileServer(httpFS)))

	// Serve index.html for all non-API routes (SPA routing)
	e.GET("/*", func(c echo.Context) error {
		path := c.Request().URL.Path

		// If the request is for an API route, return 404
		if len(path) >= 4 && path[:4] == "/api" {
			return c.String(http.StatusNotFound, "API endpoint not found")
		}

		// Serve index.html for all other routes
		indexFile, err := webFS.Open("index.html")
		if err != nil {
			return c.String(http.StatusInternalServerError, "Failed to load index.html")
		}
		defer indexFile.Close()

		return c.Stream(http.StatusOK, "text/html", indexFile)
	})
}
