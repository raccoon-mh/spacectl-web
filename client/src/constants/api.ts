// API Configuration Constants
export const API_CONFIG = {
    // Development environment
    DEV: {
        HOST: 'localhost',
        PORT: 8080,
        PROTOCOL: 'http',
    },
    // Production environment
    PROD: {
        HOST: 'localhost',
        PORT: 8080,
        PROTOCOL: 'http',
    }
} as const;

// Get API base URL based on environment
export const getApiBaseUrl = (): string => {
    // Check if REACT_APP_API_URL is set (from environment variables)
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // Fallback to default configuration
    const isDev = process.env.NODE_ENV === 'development';
    const config = isDev ? API_CONFIG.DEV : API_CONFIG.PROD;

    return `${config.PROTOCOL}://${config.HOST}:${config.PORT}`;
};

// Default API base URL
export const API_BASE_URL = getApiBaseUrl();

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
    console.log('   API Configuration:');
    console.log(`   Base URL: ${API_BASE_URL}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   REACT_APP_API_URL: ${process.env.REACT_APP_API_URL || 'not set'}`);
}
