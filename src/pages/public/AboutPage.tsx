import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AboutAuthor } from '../../components/seo/AboutAuthor';
import { Link } from 'react-router-dom';
import { Brain, Target, BarChart2, BookOpen, Zap, Users } from 'lucide-react';

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
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    About Exam Compass
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mb-16 leading-relaxed">
                    India's most advanced AI-powered exam preparation ecosystem — built by a student, for students.
                </p>

                {/* Mission Section */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <p className="text-gray-300 leading-relaxed text-lg mb-4">
                            Every year, over 2 crore Indian students sit for competitive examinations like JEE, NEET, and UPSC. Most rely on generic test series, expensive coaching, and sheer brute-force studying. We believe there is a better way.
                        </p>
                        <p className="text-gray-300 leading-relaxed text-lg mb-4">
                            Exam Compass was created to democratize intelligent exam preparation. Our AI engine doesn't just test you — it learns your weaknesses, tracks your patterns, and generates personalized mock exams that target exactly where you need improvement. Every feature was designed from real study experience, not corporate boardrooms.
                        </p>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            We are committed to keeping Exam Compass accessible to every student, regardless of their financial background. Our platform is free to use and always will be for core features, supported by advertising revenue.
                        </p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8">What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Brain, title: 'AI Mock Test Generator', desc: 'Adaptive tests that target your weak areas with 9,000+ verified PYQs.' },
                            { icon: Target, title: 'Selection Probability', desc: 'Real-time AI-calculated probability of clearing your target exam.' },
                            { icon: BarChart2, title: 'Performance Analytics', desc: 'Track accuracy, speed, and fatigue across subjects and topics.' },
                            { icon: BookOpen, title: 'Complete Syllabus Maps', desc: 'Chapter-wise breakdowns for JEE, NEET, UPSC, GATE, CLAT, BITSAT, and CBSE.' },
                            { icon: Zap, title: 'Personalized Roadmaps', desc: 'AI-generated study plans based on your individual performance patterns.' },
                            { icon: Users, title: 'Peer Benchmarking', desc: 'Compare your performance against thousands of other aspirants anonymously.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                                <Icon className="text-purple-400 mb-4" size={28} />
                                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Exams Covered */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-6">Exams We Cover</h2>
                    <p className="text-gray-300 leading-relaxed mb-6">
                        Our platform provides comprehensive preparation materials for India's most competitive examinations:
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {['JEE Mains', 'JEE Advanced', 'NEET UG', 'UPSC CSE', 'CLAT', 'GATE', 'BITSAT', 'Class 12 CBSE', 'Class 11', 'Class 10 CBSE', 'Class 9', 'Class 8', 'Class 7', 'Class 6'].map(exam => (
                            <span key={exam} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                                {exam}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Founder Section */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-8">The Founder</h2>
                    <AboutAuthor />
                </section>

                {/* CTA */}
                <section className="text-center py-12 border-t border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Your Preparation?</h2>
                    <p className="text-gray-400 mb-8">Join thousands of students already using AI to prepare smarter.</p>
                    <Link to="/login" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                        Get Started Free
                    </Link>
                </section>
            </main>

            <Footer />
        </div>
    );
};
