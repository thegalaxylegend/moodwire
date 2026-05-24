# 🔒 Fix XSS in ConceptMap using DOMPurify

## 🎯 What
The `ConceptMap` component in `src/pages/dashboard/ConceptMap.tsx` was vulnerable to Cross-Site Scripting (XSS). It was rendering Mermaid-generated SVG code directly using `dangerouslySetInnerHTML` without proper sanitization.

## ⚠️ Risk
If an attacker could manipulate the syllabus topics or their dependencies (which are used to generate the Mermaid graph), they could inject malicious scripts into the resulting SVG code. Since this SVG was injected unchecked into the DOM via `dangerouslySetInnerHTML`, the malicious scripts would execute in the victim's browser context. This could lead to session hijacking, data theft, or unauthorized actions performed on behalf of the user.

## 🛡️ Solution
Integrated `DOMPurify`, a fast, highly tolerant XSS sanitizer for HTML, MathML and SVG. By wrapping the `svgCode` with `DOMPurify.sanitize(svgCode)` before passing it to `dangerouslySetInnerHTML`, we ensure that any potentially malicious payloads are stripped out while preserving the legitimate visualization structure.
