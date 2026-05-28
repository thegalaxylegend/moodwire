import fs from 'fs';

const latexQuestions = [
  {
    "id": "q_frac_1",
    "text": "Evaluate the integral $\\int \\frac{1}{x^2 + 1} dx$ from 0 to 1.",
    "expression": "$\\int \\frac{1}{x^2 + 1} dx$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_frac_2",
    "text": "Solve for x: $\\frac{2x - 3}{4} = \\frac{x + 1}{3}$",
    "expression": "$\\frac{2x - 3}{4} = \\frac{x + 1}{3}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_frac_3",
    "text": "Simplify the expression: $$\\frac{a^2 - b^2}{a - b}$$",
    "expression": "$$\\frac{a^2 - b^2}{a - b}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_frac_4",
    "text": "The limit as x approaches 0 of $\\frac{\\sin(x)}{x}$ is:",
    "expression": "$\\frac{\\sin(x)}{x}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_frac_5",
    "text": "Calculate the derivative of $f(x) = \\frac{x^2}{x+1}$",
    "expression": "$f(x) = \\frac{x^2}{x+1}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_int_1",
    "text": "Find the indefinite integral: $\\int e^x \\sin(x) dx$",
    "expression": "$\\int e^x \\sin(x) dx$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_int_2",
    "text": "Evaluate the definite integral $$\\int_{0}^{\\pi/2} \\cos(x) dx$$",
    "expression": "$$\\int_{0}^{\\pi/2} \\cos(x) dx$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_int_3",
    "text": "What is the area under the curve $y = x^2$ from x = 1 to x = 3? $$\\int_1^3 x^2 dx$$",
    "expression": "$$\\int_1^3 x^2 dx$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_int_4",
    "text": "Compute $\\int x \\ln(x) dx$ using integration by parts.",
    "expression": "$\\int x \\ln(x) dx$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_int_5",
    "text": "The value of $\\int_{0}^{\\infty} e^{-x^2} dx$ is:",
    "expression": "$\\int_{0}^{\\infty} e^{-x^2} dx$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sum_1",
    "text": "Find the sum of the infinite geometric series: $\\sum_{n=0}^{\\infty} (\\frac{1}{2})^n$",
    "expression": "$\\sum_{n=0}^{\\infty} (\\frac{1}{2})^n$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sum_2",
    "text": "Evaluate $$\\sum_{i=1}^{n} i^2$$",
    "expression": "$$\\sum_{i=1}^{n} i^2$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sum_3",
    "text": "What is the Taylor series expansion of $e^x$ around x=0? $\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}$",
    "expression": "$\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sum_4",
    "text": "Calculate $\\sum_{k=1}^{5} k!$",
    "expression": "$\\sum_{k=1}^{5} k!$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sum_5",
    "text": "Identify the pattern: $$\\sum_{n=1}^{k} \\frac{1}{n(n+1)}$$",
    "expression": "$$\\sum_{n=1}^{k} \\frac{1}{n(n+1)}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_vec_1",
    "text": "Find the dot product of $\\vec{u} = \\langle 1, 2, 3 \\rangle$ and $\\vec{v} = \\langle 4, 5, 6 \\rangle$",
    "expression": "$\\vec{u} = \\langle 1, 2, 3 \\rangle$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_vec_2",
    "text": "Calculate the cross product $$\\vec{a} \\times \\vec{b}$$",
    "expression": "$$\\vec{a} \\times \\vec{b}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_vec_3",
    "text": "What is the magnitude of the vector $\\vec{w} = 3\\hat{i} - 4\\hat{j}$?",
    "expression": "$\\vec{w} = 3\\hat{i} - 4\\hat{j}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_vec_4",
    "text": "Determine the angle between $\\vec{p}$ and $\\vec{q}$.",
    "expression": "$\\vec{p}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_vec_5",
    "text": "Express the force vector as $$\\vec{F} = m\\vec{a}$$",
    "expression": "$$\\vec{F} = m\\vec{a}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_hat_1",
    "text": "A unit vector is represented as $\\hat{n}$. If $\\vec{v} = \\langle 3, 4 \\rangle$, what is $\\hat{v}$?",
    "expression": "$\\hat{n}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_hat_2",
    "text": "The standard basis vectors are $\\hat{i}, \\hat{j}, \\hat{k}$.",
    "expression": "$\\hat{i}, \\hat{j}, \\hat{k}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sqrt_1",
    "text": "Solve for x: $\\sqrt{x + 5} = 4$",
    "expression": "$\\sqrt{x + 5} = 4$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sqrt_2",
    "text": "Simplify $$\\sqrt{50} + \\sqrt{18}$$",
    "expression": "$$\\sqrt{50} + \\sqrt{18}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_sqrt_3",
    "text": "What is the value of $\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$?",
    "expression": "$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_mat_1",
    "text": "Find the determinant of the matrix: $$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$$",
    "expression": "$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_mat_2",
    "text": "Multiply the following matrices: $A = \\begin{bmatrix} 1 & -1 \\\\ 0 & 2 \\end{bmatrix}$, $B = \\begin{bmatrix} 3 \\\\ 1 \\end{bmatrix}$",
    "expression": "$\\begin{bmatrix} 1 & -1 \\\\ 0 & 2 \\end{bmatrix}$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_mat_3",
    "text": "Calculate the inverse of $$\\begin{vmatrix} 2 & 1 \\\\ 1 & 1 \\end{vmatrix}$$",
    "expression": "$$\\begin{vmatrix} 2 & 1 \\\\ 1 & 1 \\end{vmatrix}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_complex_1",
    "text": "Evaluate the complex expression $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$",
    "expression": "$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  },
  {
    "id": "q_complex_2",
    "text": "Verify Euler's formula: $e^{i\\pi} + 1 = 0$",
    "expression": "$e^{i\\pi} + 1 = 0$",
    "render_ok": true,
    "overflow_detected": false,
    "tts_ok": true
  }
];

fs.writeFileSync('latex_test_logs.json', JSON.stringify(latexQuestions, null, 2));
console.log('Created 30 simulated LaTeX test logs.');
