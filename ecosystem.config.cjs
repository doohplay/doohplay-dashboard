module.exports = {
  apps: [
    {
      name: 'doohplay-financial-worker',
      script: 'node',
      args: [
        'node_modules/ts-node/dist/bin.js',
        '-P',
        'tsconfig.scripts.json',
        'scripts/worker-financial-jobs.ts',
      ],
      cwd: 'C:/DOOHPLAY/dashboard',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
