# Exam Compass 🧭

**AI-Powered Student Preparation Platform**

Exam Compass is a comprehensive, gamified, and AI-driven dashboard designed to help students prepare for competitive exams. It features intelligent syllabus tracking, mock test generation, personalized study plans, and revision document management.

---

## 🚀 Tech Stack

### Core Frameworks
-   **React 19**: Frontend UI library.
-   **Vite**: Next-generation frontend tooling and build system.
-   **TypeScript**: Static type checking.

### Styling & Animation
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Framer Motion**: Production-ready animation library for React.
-   **Lucide React**: Beautiful, consistent icons.

### State Management & Backend
-   **Zustand**: Lightweight state management.
-   **Supabase**: Open Source Firebase alternative (Auth, Database, Storage).

### AI Integrations
-   **Google Gemini (via @google/generative-ai)**: Multimodal AI model.
-   **Groq SDK**: Ultra-fast AI inference.
-   **OpenAI**: Compatible integration layer.

---

## ✨ Key Features

1.  **Smart Syllabus Tracker**: Detailed topic breakdown with weightage analysis ([High], [Medium], [Low]).
2.  **AI Mock Generator**: Creates custom tests based on specific topics and difficulty.
3.  **Smart Documents**: Generate persistent revision notes and PYQs (Previous Year Questions) from raw text using AI. Supports Markdown.
4.  **Decision Simulator**: Gamified 'Choose Your Own Adventure' scenarios to test strategic thinking.
5.  **Study Plan Generator**: Weekly schedules tailored to user performance.
6.  **Peer Benchmarking**: Compare progress tailored to your prep level.
7.  **Analytics**: Visual insights into progress and weak areas.
8.  **Gamified Profile**: XP, Streaks, and Levels (Aspirant -> Scholar -> Top Ranker).
9.  **Themes**: Multiple visual modes (Glassmorphism, Zen, Gamified, etc.).

---

## 🛠️ Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd exam-compass
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following keys:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key (optional)
```

### 4. Database Setup (Supabase)
Run the provided SQL scripts in your Supabase SQL Editor to set up the schema:
-   `documents` table (for Smart Documents)
-   `syllabus` table
-   `profiles` table
-   (Refer to `db_documents.sql` in artifacts for the Documents schema)

### 5. Run Development Server
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

---

## 🏗️ Build & Deploy

To create a production build:

```bash
npm run build
```

This will compile TypeScript and generate static assets in the `dist` folder, ready for deployment on Vercel, Netlify, or any static host.

---

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components (Hero, ThemeSwitcher, etc.)
├── layouts/          # Dashbboard and Main Layouts
├── lib/              # Utilities (AI, Supabase clients)
├── pages/            # Route Pages
│   ├── auth/         # Login/Register
│   └── dashboard/    # Core Features (Analytics, Documents, Syllabus...)
├── store/            # Global State (Zustand)
└── index.css         # Tailwind & Custom Theme Styles
```

---

## 🎨 Themes

The application supports dynamic theming via CSS variables and Tailwind.
-   **Glass Future**: Default translucent gradients.
-   **Zen Minimalist**: High contrast, no distractions.
-   **Gamified**: Dark mode with neon accents.
-   **Light (Glass White)**: Bright, clean aesthetic.
-   **Full Glass**: Ultra-immersive dark transparency.

Switch themes via the **Profile Modal**.
