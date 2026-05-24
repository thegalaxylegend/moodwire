const fs = require('fs');
const file = 'src/components/Hero.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure proper Variants import from framer-motion
if (!content.includes('import { Variants } from \'framer-motion\'')) {
    content = content.replace(/import { motion } from 'framer-motion';/, "import { motion, Variants } from 'framer-motion';");
}

// Add the Variants type to the containerVariants and itemVariants declarations
content = content.replace(/const containerVariants = {/, 'const containerVariants: Variants = {');
content = content.replace(/const itemVariants = {/, 'const itemVariants: Variants = {');

fs.writeFileSync(file, content);
console.log("Patched Hero.tsx types");
