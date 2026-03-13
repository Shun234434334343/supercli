const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const localRepoPath = '/home/jarancibia/ai/gifcap';

function run(cmd, cwd = process.cwd()) {
  console.log(`Executing: ${cmd} in ${cwd}`);
  try {
    return execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to execute: ${cmd}`);
    process.exit(1);
  }
}

console.log('--- GifCap Setup ---');

if (fs.existsSync(localRepoPath)) {
  console.log(`Found local gifcap repository at ${localRepoPath}`);
  console.log('Linking local repository for development...');
  
  // Ensure dependencies are installed in the repo
  if (!fs.existsSync(path.join(localRepoPath, 'node_modules'))) {
    console.log('Installing local dependencies...');
    run('npm install', localRepoPath);
  }
  
  // Link the repo
  run('npm link', localRepoPath);
  console.log('Success: Local gifcap linked.');
} else {
  console.log('Local repository not found. Installing from npm...');
  run('npm install -g gifcap');
}

// Final check
try {
  const version = execSync('gifcap --version').toString().trim();
  console.log(`Verified: gifcap ${version} is available.`);
} catch (e) {
  console.error('Error: gifcap binary not found after installation.');
  process.exit(1);
}
