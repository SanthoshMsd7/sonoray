module.exports = {
  apps: [
    {
      name: 'sonoray-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start',
      shell: true,
      env: {
        PORT: 5000
      }
    },
    {
      name: 'sonoray-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start',
      shell: true,
      env: {
        PORT: 3000
      }
    }
  ]
};
