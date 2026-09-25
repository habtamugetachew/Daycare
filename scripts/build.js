const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building frontend...');
execSync('npm run build --prefix frontend', { stdio: 'inherit' });

const srcDist = path.join(__dirname, '..', 'frontend', 'dist');
const rootDist = path.join(__dirname, '..', 'dist');

if (fs.existsSync(srcDist)) {
  console.log('📦 Mirroring frontend/dist to root dist/ for Netlify compatibility...');
  if (fs.existsSync(rootDist)) {
    fs.rmSync(rootDist, { recursive: true, force: true });
  }
  fs.cpSync(srcDist, rootDist, { recursive: true });
  console.log('✅ Build mirrored successfully!');
} else {
  console.error('❌ frontend/dist not found after build!');
  process.exit(1);
}
