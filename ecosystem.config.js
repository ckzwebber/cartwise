module.exports = {
  apps: [
    {
      name: 'listasmart-backend',
      script: 'dist/main.js',
      cwd: '/home/deploy/apps/lista-smart-backend',

      env: {
        NODE_ENV: 'production',
        PORT: '3003',
      },
    },
  ],
};
