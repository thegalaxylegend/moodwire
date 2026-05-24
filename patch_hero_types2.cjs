const fs = require('fs');
const file = 'src/components/Hero.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix type import
content = content.replace(/import { motion, Variants } from 'framer-motion';/, "import { motion } from 'framer-motion';\nimport type { Variants } from 'framer-motion';");

fs.writeFileSync(file, content);
console.log("Patched Hero.tsx types again");
