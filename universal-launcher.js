const { spawn } = require('child_process');
const path = require('path');

const apps = [
  {
    name: 'backend',
    cwd: path.join(__dirname, 'backend'),
    command: 'npm',
    args: ['run', 'dev']
  },
  {
    name: 'frontend',
    cwd: path.join(__dirname, 'frontend'),
    command: 'npm',
    args: ['run', 'start']
  }
];

apps.forEach(app => {
  console.log(`Starting ${app.name}...`);
  const child = spawn(app.command, app.args, {
    cwd: app.cwd,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, PORT: app.name === 'backend' ? 5000 : 3000 }
  });

  child.on('exit', (code) => {
    console.log(`${app.name} exited with code ${code}`);
  });
});
