const sample1 = `<div [class](/blog/theory-of-computation-class-12-notes)="quick-summary">`;
const sample2 = `{
 "heading": "✏️ 3 Solved PYQs",
 "body": "- **Q1:** ..." }`;

console.log("Testing HTML repair...");
const htmlFixed = sample1.replace(/<div\s+\[class\].*?="(.*?)">/g, '<div class="$1">');
console.log("Original:", sample1);
console.log("Fixed:", htmlFixed);

console.log("\nTesting JSON extraction...");
const jsonMatch = sample2.match(/"heading"\s*:\s*"(.*?)"[\s\S]*?"body"\s*:\s*"(.*?)(?:"\s*,|"\s*\}|$)/s);
if (jsonMatch) {
    console.log("Heading:", jsonMatch[1]);
    console.log("Body excerpt:", jsonMatch[2].substring(0, 30));
} else {
    console.log("JSON Match FAILED");
}
