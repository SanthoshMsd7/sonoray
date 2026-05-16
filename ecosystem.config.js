module.exports = {
  apps: [
    {
      name: 'ultaserve-backend',
      cwd: './backend',
      script: 'npx',
      args: 'ts-node src/index.ts',
      shell: true,
      env: {
        DATABASE_URL: 'mysql://root:root@localhost:3306/ultaserve_erp',
        PORT: 5000,
        JWT_SECRET: 'your_secret_key_here'
      }
    },
    {
      name: 'ultaserve-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'next start',
      shell: true,
      env: {
        PORT: 3000
      }
    }
  ]
};
