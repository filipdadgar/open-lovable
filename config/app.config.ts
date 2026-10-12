// Application Configuration
// This file contains all configurable settings for the application

export const appConfig = {
  // Vercel Sandbox Configuration
  vercelSandbox: {
    // Sandbox timeout in minutes
    timeoutMinutes: 15,

    // Convert to milliseconds for Vercel Sandbox API
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },

    // Development server port (Vercel Sandbox typically uses 3000 for Next.js/React)
    devPort: 3000,

    // Time to wait for dev server to be ready (in milliseconds)
    devServerStartupDelay: 7000,

    // Time to wait for CSS rebuild (in milliseconds)
    cssRebuildDelay: 2000,

    // Working directory in sandbox
    workingDirectory: '/app',

    // Default runtime for sandbox
    runtime: 'node22' // Available: node22, python3.13, v0-next-shadcn, cua-ubuntu-xfce
  },

  // E2B Sandbox Configuration
  e2b: {
    // Sandbox timeout in minutes
    timeoutMinutes: 30,

    // Convert to milliseconds for E2B API
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },

    // Development server port (E2B uses 5173 for Vite)
    vitePort: 5173,

    // Time to wait for Vite dev server to be ready (in milliseconds)
    viteStartupDelay: 10000,

    // Working directory in sandbox
    workingDirectory: '/home/user/app',
  },
  
  // AI Model Configuration
  ai: {
    // Default AI model
    // NOTE: changed from upstream's 'google/gemini-3-pro-preview'. First tried Groq
    // (openai/gpt-oss-120b) since this deployment only configures GROQ_API_KEY, but
    // Groq's free tier is hard-capped at 8,000 tokens/minute ACCOUNT-WIDE - confirmed
    // identical across every text model reachable on this account (gpt-oss-120b,
    // gpt-oss-20b, qwen3.8-27b all returned the same 8000 TPM limit header; llama-3.1-8b
    // -instant/llama-3.3-70b-versatile aren't even reachable on this account, 404). This
    // app's generation requests routinely need ~35K+ tokens (full scraped page content),
    // so no Groq model works regardless of size. Switched to OpenRouter instead: its free
    // tier is request-count limited (20/min, 50-1000/day), not token-volume limited, so a
    // single large request is fine. Picked for explicit code specialization + credible lab.
    defaultModel: 'openrouter/cohere/north-mini-code:free',

    // Available models
    availableModels: [
      'openai/gpt-5',
      'openrouter/cohere/north-mini-code:free',
      'anthropic/claude-sonnet-4-20250514',
      'google/gemini-3-pro-preview'
    ],

    // Model display names
    modelDisplayNames: {
      'openai/gpt-5': 'GPT-5',
      'openrouter/cohere/north-mini-code:free': 'Cohere North Mini Code (OpenRouter, free)',
      'anthropic/claude-sonnet-4-20250514': 'Sonnet 4',
      'google/gemini-3-pro-preview': 'Gemini 3 Pro (Preview)'
    } as Record<string, string>,

    // Model API configuration
    // Unused by this deployment: lib/ai/provider-manager.ts (the only consumer of this
    // field) has no importers anywhere in the app - the actual routes
    // (generate-ai-code-stream, analyze-edit-intent) each do their own prefix-based
    // provider dispatch independently. Left empty rather than removed, in case a future
    // upstream change starts using it.
    modelApiConfig: {},
    
    // Temperature settings for non-reasoning models
    defaultTemperature: 0.7,
    
    // Max tokens for code generation
    maxTokens: 8000,
    
    // Max tokens for truncation recovery
    truncationRecoveryMaxTokens: 4000,
  },
  
  // Code Application Configuration
  codeApplication: {
    // Delay after applying code before refreshing iframe (milliseconds)
    defaultRefreshDelay: 2000,
    
    // Delay when packages are installed (milliseconds)
    packageInstallRefreshDelay: 5000,
    
    // Enable/disable automatic truncation recovery
    enableTruncationRecovery: false, // Disabled - too many false positives
    
    // Maximum number of truncation recovery attempts per file
    maxTruncationRecoveryAttempts: 1,
  },
  
  // UI Configuration
  ui: {
    // Show/hide certain UI elements
    showModelSelector: true,
    showStatusIndicator: true,
    
    // Animation durations (milliseconds)
    animationDuration: 200,
    
    // Toast notification duration (milliseconds)
    toastDuration: 3000,
    
    // Maximum chat messages to keep in memory
    maxChatMessages: 100,
    
    // Maximum recent messages to send as context
    maxRecentMessagesContext: 20,
  },
  
  // Development Configuration
  dev: {
    // Enable debug logging
    enableDebugLogging: true,
    
    // Enable performance monitoring
    enablePerformanceMonitoring: false,
    
    // Log API responses
    logApiResponses: true,
  },
  
  // Package Installation Configuration
  packages: {
    // Use --legacy-peer-deps flag for npm install
    useLegacyPeerDeps: true,
    
    // Package installation timeout (milliseconds)
    installTimeout: 60000,
    
    // Auto-restart Vite after package installation
    autoRestartVite: true,
  },
  
  // File Management Configuration
  files: {
    // Excluded file patterns (files to ignore)
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '*.log',
      '.DS_Store'
    ],
    
    // Maximum file size to read (bytes)
    maxFileSize: 1024 * 1024, // 1MB
    
    // File extensions to treat as text
    textFileExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.css', '.scss', '.sass',
      '.html', '.xml', '.svg',
      '.json', '.yml', '.yaml',
      '.md', '.txt', '.env',
      '.gitignore', '.dockerignore'
    ],
  },
  
  // API Endpoints Configuration (for external services)
  api: {
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    
    // Request timeout (milliseconds)
    requestTimeout: 30000,
  }
};

// Type-safe config getter
export function getConfig<K extends keyof typeof appConfig>(key: K): typeof appConfig[K] {
  return appConfig[key];
}

// Helper to get nested config values
export function getConfigValue(path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], appConfig as any);
}

export default appConfig;