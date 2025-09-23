package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v2"
)

// Config represents the configuration structure for config.yaml
type Config struct {
	Token     string            `yaml:"token"`
	Endpoints map[string]string `yaml:"endpoints"`
}

// LoadConfig loads and parses the config.yaml file
func LoadConfig(filename string) (*Config, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config.yaml: %w", err)
	}

	return &config, nil
}
