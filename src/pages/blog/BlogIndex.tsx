import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Footer } from '../../components/Footer';
import { ArrowRight, Clock } from 'lucide-react';

// Hardcoded for the pilot phase. In the future, we can write a script 
// that parses the markdown frontmatter to generate this list automatically.
export const blogs = [
    {
        id: 'class-10-science-pyq-strategy',
        title: "CBSE Class 10 Science: The 10 Most Repeated Questions in the Last 5 Years",
        description: "Master your Class 10 Science Board Exam. We analyzed the last 5 years of Previous Year Questions (PYQs) and found the exact patterns CBSE loves to repeat.",
        category: "Board Exams",
        date: "February 28, 2024",
        readTime: "8 min read"
    },
    {
        id: 'jee-mains-high-weightage-chapters',
        title: "JEE Mains 2026: The 20 'High-Weightage, Low-Effort' Chapters You Must Target",
        description: "Stop wasting time on hard chapters that rarely appear. Discover the 20 High-Weightage, Low-Effort chapters that guarantee a massive boost to your JEE Mains 2026 percentile.",
        category: "JEE & NEET",
        date: "March 1, 2024",
        readTime: "10 min read"
    },
    {
        id: 'ai-exam-prep-future',
        title: "How AI is Changing the Way Indian Students Prepare for Competitive Exams",
        description: "From static PDFs to dynamic, personalized study paths. Explore how Artificial Intelligence is fundamentally revolutionizing JEE, NEET, and UPSC preparation.",
        category: "EdTech",
        date: "March 2, 2024",
        readTime: "7 min read"
    },
    {
        id: 'class-10-30-day-timetable',
        title: "The Perfect Timetable for the Last 30 Days Before Your Class 10 Boards",
        description: "Panic setting in? Here is the exact, hour-by-hour 30-day master schedule to secure 95%+ in your CBSE Class 10 Board Exams.",
        category: "Board Exams",
        date: "March 3, 2024",
        readTime: "9 min read"
    },
    {
        id: 'ai-study-hack-pomodoro',
        title: "Pomodoro 2.0: Modifying the Classic Timer for 3-Hour Exam Endurance",
        description: "The traditional 25-minute Pomodoro timer is actually destroying your ability to sit for a 3-hour JEE or NEET exam. Here is how to fix it.",
        category: "Study Hacks",
        date: "March 4, 2024",
        readTime: "6 min read"
    },
    {
        id: 'upsc-optional-selection-guide',
        title: "How to Choose Your UPSC Optional Subject (Data-Driven Guide for 2026)",
        description: "Stop guessing. We analyzed the success rates, syllabus overlap, and scoring potential of the top UPSC optional subjects to help you make the right choice.",
        category: "Civil Services",
        date: "March 5, 2024",
        readTime: "12 min read"
    }
];

export const BlogIndex: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-text-main pt-24 pb-20 px-6">
            <SEO
                title="Exam Compass Blog | AI Exam Prep Tips & Strategies"
                description="Expert strategies, syllabus breakdowns, and exam preparation tips for JEE, NEET, UPSC, and CBSE Class 10-12 students."
            />

            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                        Master Your <span className="text-primary">Exams</span>
                    </h1>
                    <p className="text-xl text-text-muted">
                        Data-driven strategies, syllabus breakdowns, and technology insights from the Exam Compass team.
                    </p>
                </header>

                <div className="flex flex-col gap-8">
                    {blogs.map((blog) => (
                        <Link
                            to={`/blog/${blog.id}`}
                            key={blog.id}
                            className="group block p-6 md:p-8 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                        >
                            <div className="flex items-center gap-4 mb-4 text-sm text-text-muted">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold tracking-wide">
                                    {blog.category}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{blog.readTime}</span>
                                </div>
                                <span className="hidden sm:inline">• {blog.date}</span>
                            </div>

                            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                                {blog.title}
                            </h2>
                            <p className="text-text-muted mb-6 line-clamp-2 md:line-clamp-none">
                                {blog.description}
                            </p>

                            <div className="flex items-center gap-2 text-primary font-bold">
                                Read Article <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};
