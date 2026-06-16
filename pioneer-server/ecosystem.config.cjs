module.exports = {
  apps: [{
    name: "lust-pioneer-service",
    script: "./server.mjs",
    cwd: "/opt/lust-pioneer",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "350M",
    env: { NODE_ENV: "production" }
  }]
};
