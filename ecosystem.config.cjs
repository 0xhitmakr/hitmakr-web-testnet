module.exports = {
    apps: [{
      name: 'hitmakr-web-testnet',
      script: './node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env_production: {
        NODE_ENV: 'production'
      },
      exp_backoff_restart_delay: 100,
      node_args: '--experimental-modules --experimental-json-modules'
    }]
};