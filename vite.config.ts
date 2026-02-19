
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Copy assets/library to public/library during build
const copyLibraryFiles = () => {
  const src = path.resolve(__dirname, 'assets', 'library');
  const dest = path.resolve(__dirname, 'public', 'library');
  
  if (fs.existsSync(src)) {
    const copyRecursive = (srcPath: string, destPath: string) => {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      const files = fs.readdirSync(srcPath);
      files.forEach(file => {
        const srcFile = path.join(srcPath, file);
        const destFile = path.join(destPath, file);
        if (fs.statSync(srcFile).isDirectory()) {
          copyRecursive(srcFile, destFile);
        } else {
          fs.copyFileSync(srcFile, destFile);
        }
      });
    };
    copyRecursive(src, dest);
  }
};

copyLibraryFiles();

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000
  }
});
