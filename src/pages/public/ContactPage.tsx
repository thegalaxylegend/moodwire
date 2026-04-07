import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { Mail, MapPin, Clock, MessageSquare, HelpCircle } from 'lucide-react';
import { SITE_URL } from '../../lib/siteConfig';
import { motion } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';

const FAQ_ITEMS = [
    { q: 'Is Exam Compass free to use?', a: 'Yes! Exam Compass is completely free. Our AI-powered mock tests, PYQ practice, analytics, and study roadmaps are available at no cost to all students.' },
    { q: 'Which exams does Exam Compass support?', a: 'We support JEE Mains, JEE Advanced, NEET UG, and CBSE board exams for Classes 8 through 12.' },
    { q: 'How does the AI Mock Test Generator work?', a: 'Our adaptive engine analyzes your past performance to identify weak areas, then generates personalized mock tests from our database of 9,000+ verified Previous Year Questions (PYQs) to maximize your improvement.' },
    { q: 'Can I use Exam Compass on my phone?', a: 'Absolutely! Exam Compass is a Progressive Web App (PWA) that works on any device — desktop, tablet, or mobile. You can even install it for offline access.' },
    { q: 'How do I report a bug or suggest a feature?', a: 'Email us at mrayushkr444@gmail.com with details. For bugs, please include steps to reproduce the issue. We typically respond within 24–48 hours.' },
];

export const ContactPage = () => {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_ITEMS.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a
            }
        }))
    };

    const { tier } = usePerformance();
    const isLow = tier === 'low';

    return (
        <div className={`min-h-screen bg-black text-white selection:bg-purple-500/30 perf-tier-${tier}`}>
            <SEO
                title="Contact Us | Exam Compass"
                description="Get in touch with the Exam Compass team. Contact us for questions, feedback, bug reports, or partnership inquiries about our AI-powered exam preparation platform."
                canonical={`${SITE_URL}/contact`}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "ContactPage",
                    "name": "Contact Exam Compass",
                    "url": `${SITE_URL}/contact`,
                    "mainEntity": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": SITE_URL,
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer support",
                            "email": "mrayushkr444@gmail.com",
                            "availableLanguage": ["English", "Hindi"]
                        }
                    }
                }}
            />
            <Navbar />

            <motion.main 
                initial={isLow ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="pt-32 pb-20 px-6 max-w-4xl mx-auto will-change-transform"
            >
                <div className="mb-6">
                    <Breadcrumbs />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Contact Us
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mb-16 leading-relaxed">
                    Have a question, feedback, or found a bug? We'd love to hear from you.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <Mail className="text-purple-400" size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Email</h3>
                                <p className="text-gray-300 text-sm">For general inquiries and support</p>
                                <a href="mailto:mrayushkr444@gmail.com" className="text-purple-400 hover:underline text-sm mt-1 inline-block">
                                    mrayushkr444@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="text-purple-400" size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Location</h3>
                                <p className="text-gray-300 text-sm">Darbhanga, Bihar, India</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <Clock className="text-purple-400" size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Response Time</h3>
                                <p className="text-gray-300 text-sm">We typically respond within 24–48 hours</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="text-purple-400" size={24} />
                            <h2 className="text-xl font-bold text-white">Get In Touch</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            Whether you have a question about our AI-powered exam preparation tools, want to report a bug, suggest a new feature, or explore partnership opportunities — we're here to help.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <h4 className="text-sm font-semibold text-purple-400 mb-1">Bug Reports</h4>
                                <p className="text-gray-400 text-sm">Found something that doesn't work? Let us know with steps to reproduce.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <h4 className="text-sm font-semibold text-purple-400 mb-1">Feature Requests</h4>
                                <p className="text-gray-400 text-sm">Have an idea that would help your preparation? We're always building.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <h4 className="text-sm font-semibold text-purple-400 mb-1">Partnerships</h4>
                                <p className="text-gray-400 text-sm">Interested in collaborating? Reach out at the email above.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <HelpCircle className="text-purple-400" size={24} />
                        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {FAQ_ITEMS.map((item, i) => (
                            <details key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <summary className="text-white font-semibold cursor-pointer list-none flex items-center justify-between">
                                    {item.q}
                                    <span className="text-purple-400 group-open:rotate-45 transition-transform text-xl">+</span>
                                </summary>
                                <p className="text-gray-300 mt-4 leading-relaxed faq-answer">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* FAQ Schema */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            </motion.main>

            <Footer />
        </div>
    );
};
