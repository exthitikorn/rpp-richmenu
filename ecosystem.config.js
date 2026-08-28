module.exports = {
  apps: [
    {
      name: "rpp-richmenu",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        // PORT comes from .env (Next.js loads it on `next start`). Default 3000.
      },
    },
  ],
};
