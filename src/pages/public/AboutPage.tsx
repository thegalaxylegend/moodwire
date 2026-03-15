import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AboutAuthor } from '../../components/seo/AboutAuthor';
import { Link } from 'react-router-dom';
import { Brain, Target, BarChart2, Zap } from 'lucide-react';

export const AboutPage = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title="About Exam Compass | AI-Powered Exam Preparation Platform"
                description="Learn about Exam Compass — an AI-powered exam preparation platform built by a Class 11 student from KV Darbhanga, Bihar. Discover our mission to make exam prep data-driven and accessible."
                canonical="https://examcompass.web.app/about"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "AboutPage",
                    "name": "About Exam Compass",
                    "url": "https://examcompass.web.app/about",
                    "mainEntity": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": "https://examcompass.web.app",
                        "logo": "https://examcompass.web.app/exa-logo.png",
                        "description": "AI-powered exam preparation platform for JEE, NEET, UPSC, and CBSE Class 6-12.",
                        "founder": {
                            "@type": "Person",
                            "name": "Ayush",
                            "jobTitle": "Founder & Student Developer"
                        }
                    }
                }}
            />
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
                <h1 className="text-5xl md:text-8xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 tracking-tighter">
                    Built for the Next Generation of Toppers.
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mb-20 leading-relaxed font-light">
                    Exam Compass is more than just a test series. It is an intelligent ecosystem designed to replace the "brute-force" study methods of the past with data-driven precision.
                </p>

                {/* The Problem Section */}
                <section className="mb-24">
                    <h2 className="text-4xl font-bold text-white mb-10 tracking-tight">The Problem We Solve</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <p className="text-gray-300 leading-relaxed text-lg">
                                India has one of the most competitive education systems in the world. Every year, over 2.5 crore students appear for various competitive exams. Most of these students spend lakhs of rupees on coaching centers that use a "one-size-fits-all" approach.
                            </p>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                If you are weak in Organic Chemistry but strong in Physics, why should you solve the same mock test as someone with the opposite profile? Standard testing is inefficient. It wastes your most precious resource: **Time.**
                            </p>
                            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <h4 className="text-red-400 font-bold mb-2">The Efficiency Gap</h4>
                                <p className="text-sm text-gray-400">Average students spend 40% of their study time on topics they already know. We eliminate this waste.</p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl opacity-50" />
                            <div className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <h3 className="text-2xl font-bold mb-6 text-purple-400">The Student Reality</h3>
                                <ul className="space-y-4">
                                    {[
                                        "High coaching fees (₹1.5L+ per year)",
                                        "Lack of personalized feedback",
                                        "Anxiety due to unknown competition levels",
                                        "Vast, unmanageable syllabus"
                                    ].map(item => (
                                        <li key={item} className="flex items-center gap-3 text-gray-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className="mb-24 py-16 border-y border-white/5">
                    <h2 className="text-4xl font-bold text-white mb-10 tracking-tight">The AI Journey</h2>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 leading-relaxed text-lg mb-6">
                            Exam Compass started as a small local script built to track personal mistakes during JEE preparation in KV Darbhanga, Bihar. Our founder, Ayush, realized that the data generated from just 10 mock tests could predict which chapters would cause failure in the final exam. 
                        </p>
                        <p className="text-gray-300 leading-relaxed text-lg mb-6">
                            By 2024, that script evolved into a full-scale AI platform. We integrated Large Language Models (LLMs) like Llama 3 and Gemini to provide instant doubt resolution. But we didn't stop there. We built a proprietary "Selection Probability" algorithm that doesn't just look at your marks, but at your **consistency, speed, and accuracy under pressure.**
                        </p>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            Today, Exam Compass serves students across every state in India, providing JEE, NEET, and UPSC aspirants with the same level of data analytics used by top-tier hedge funds and tech companies—all for free.
                        </p>
                    </div>
                </section>

                {/* Tech Stack Section */}
                <section className="mb-24">
                    <h2 className="text-4xl font-bold text-white mb-10 tracking-tight">Our Core Technology</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                            <Zap className="text-yellow-400 mb-6" size={40} />
                            <h3 className="text-xl font-bold mb-4">Adaptive Engine</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Our engine uses a modified IRT (Item Response Theory) model to calculate the exact difficulty of a question based on thousands of student attempts. It then serves you questions at your "Growth Zone"—not too easy, not too hard.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                            <Brain className="text-purple-400 mb-6" size={40} />
                            <h3 className="text-xl font-bold mb-4">Exa AI Mentor</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Powered by Groq-hosted Llama 3.3, Exa provides sub-second responses to complex technical doubts. It is trained specifically on Indian competitive exam patterns to avoid generic or irrelevant answers.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                            <BarChart2 className="text-blue-400 mb-6" size={40} />
                            <h3 className="text-xl font-bold mb-4">Fatigue Analytics</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                We track the time taken per question to identify when "Brain Fatigue" sets in. Our platform will literally tell you when to take a break so you don't build bad study habits or make "silly mistakes" due to tiredness.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Founder Section */}
                <section className="mb-24">
                    <div className="flex items-center gap-4 mb-10">
                        <h2 className="text-4xl font-bold text-white tracking-tight">The Founder's Vision</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <AboutAuthor />
                    <div className="mt-12 p-10 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                        <blockquote className="text-2xl italic text-gray-200 font-serif leading-relaxed mb-8">
                            "Education in India should not be a test of how much money your parents have. It should be a test of how much fire you have in your heart. Exam Compass is my contribution to making that a reality."
                        </blockquote>
                        <p className="text-white font-bold">— Ayush, Founder of Exam Compass</p>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="text-center py-24 bg-white/5 rounded-[4rem] border border-white/10 mb-20 overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-purple-500/5 blur-[120px]" />
                    <div className="relative z-10 px-6">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">Ready to Study Smarter?</h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
                            Join 50,000+ students who are already using AI to beat the competition. Your first mock test is waiting.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/login" rel="nofollow" className="px-12 py-6 bg-white text-black rounded-2xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
                                Start Free Now <Target size={20} />
                            </Link>
                            <Link to="/blog" className="px-12 py-6 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                                Read Study Hacks
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
