// PM2 Ecosystem File — BOT Printer Listener
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "bot-printer",
      script: "index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      // Auto-restart on crash
      autorestart: true,
      // Wait 5s before restarting after crash
      restart_delay: 5000,
      // Max 15 restarts — then stop (prevents infinite crash loop)
      max_restarts: 15,
      // Watch for file changes (disable in production)
      watch: false,
      // Log settings
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      // Merge stdout and stderr into one log
      merge_logs: true,
    },
  ],
};
