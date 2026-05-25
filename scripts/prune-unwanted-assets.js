import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

const targets = [
  path.join(DIST_DIR, 'blog'),
  path.join(DIST_DIR, 'blog-images'),
  path.join(DIST_DIR, 'rss.xml'),
  path.join(DIST_DIR, 'feed.xml'),
  path.join(DIST_DIR, 'sitemap-blogs.xml')
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${path.relative(DIST_DIR, target) || path.basename(target)}`);
  }
}