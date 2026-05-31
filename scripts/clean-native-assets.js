import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

const targetDirs = [
  path.resolve(cwd, 'android/app/src/main/assets/public'),
  path.resolve(cwd, 'ios/App/App/public')
];
const patternsToRemove = [
  'sherpa-onnx-wasm-main-tts.wasm',
  'espeak-ng-data.tar.bz2',
  'espeak-ng-data',
  'assets',
  'local-db.json',
  'question-db.json',
  'seo-manifest.json',
  'schema-data.json',
  'slug-registry.json',
  'real-questions.json',
  'topic-content-db.json',
  'blog',
  'jee-mains',
  'jee-advanced',
  'neet',
  'class-10',
  'class-11',
  'class-12',
  'class-8',
  'class-9',
  'blog-images',
  'blogs',
  'founder',
  'images',
  'jules-reports',
  'models',
  'about',
  'contact',
  'privacy',
  'terms',
  'founder.jpg',
  'og-image.png',
  'server'
];

function cleanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  console.log(`Cleaning heavy assets in: ${dirPath}`);
  
  // Clean direct children
  for (const pattern of patternsToRemove) {
    const fullPath = path.join(dirPath, pattern);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`  - Removed: ${pattern}`);
    }
  }

  // Handle recursive wildcards (e.g. *.apk, *.xml)
  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.apk' || ext === '.xml') {
        const fullPath = path.join(dirPath, file);
        if (fs.existsSync(fullPath)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`  - Removed file by extension: ${file}`);
        }
      }
    }
  } catch (err) {
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.apk' || ext === '.xml') {
          fs.rmSync(path.join(dirPath, file), { force: true });
          console.log(`  - Removed: ${file}`);
        }
      }
    } catch (_) {}
  }
}

for (const dir of targetDirs) {
  cleanDir(dir);
}
console.log('Native assets cleaning complete!');
