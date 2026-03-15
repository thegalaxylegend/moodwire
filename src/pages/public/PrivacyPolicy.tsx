import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title="Privacy Policy | Exam Compass"
                description="Read the Exam Compass Privacy Policy. Learn how we collect, use, and protect your personal data, including information about cookies, analytics, and third-party advertising."
                canonical="https://examcompass.web.app/privacy"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Privacy Policy",
                    "url": "https://examcompass.web.app/privacy",
                    "publisher": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": "https://examcompass.web.app"
                    }
                }}
            />
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Privacy Policy
                </h1>
                <p className="text-gray-400 text-sm mb-12">Last updated: March 5, 2026</p>

                <article className="prose prose-invert max-w-none space-y-8">
                <article className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">1. Comprehensive Data Stewardship</h2>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            At Exam Compass, we recognize that your study patterns, performance metrics, and personal preferences are highly sensitive pieces of information. This Privacy Policy is designed to provide complete transparency into our data lifecycle—from the moment you land on our site to the deep-learning processing of your mock test results. 
                        </p>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            We operate on the principle of "Privacy by Design." This means that every AI feature, from the Percentile Predictor to the Selection Probability tracker, is built with the minimum data footprint necessary. We do not sell your personal data to third-party coaching centers or lead-generation firms. Our mission is your success, not the commoditization of your academic journey.
                        </p>
                    </section>

                    <section className="bg-white/5 p-8 rounded-3xl border border-white/10">
                        <h2 className="text-3xl font-bold text-white mb-6">2. Advanced Data Collection Taxonomy</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-purple-400 mb-2">2.1 Academic Identity Data</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    When you register, we collect your authentication credentials via Firebase (Email, Name). More importantly, we collect "Academic Metadata": your target exam (JEE, NEET, etc.), current grade, and subject-wise proficiency scores. This data allows our AI, "Exa," to calibrate your study plan.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-pink-400 mb-2">2.2 Behavioral Neuro-Analytics</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    As you solve questions, we track "Time-to-Resolve" (TTR) and "Fatigue Variance." These are behavioral data points that help us detect when you are losing focus. This metadata is processed in real-time to suggest breaks, ensuring high-quality study sessions.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-blue-400 mb-2">2.3 Technical Environment Data</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    To optimize our high-performance dashboards, we track device types, browser versions, and network latency. This ensures that the math-rendering engines (MathJax/KaTeX) work perfectly on your specific hardware.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">3. Algorithmic Processing & Usage</h2>
                        <p className="text-gray-300 leading-relaxed text-lg mb-6">
                            The data we collect is fed into our proprietary Adaptive Learning Engine. Unlike static prep sites, Exam Compass uses your history to generate a "Knowledge Graph." 
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                            {[
                                "Personalizing the difficulty of mock test questions.",
                                "Calculating your real-time Selection Probability.",
                                "Indexing high-yield chapters based on your mistakes.",
                                "Generating AI-voice explanations for complex solutions."
                            ].map(usage => (
                                <li key={usage} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-gray-300 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    {usage}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">4. Strategic Third-Party Integrations</h2>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            To maintain a free platform for all students, we partner with industry-leading infrastructure providers. Each partner is strictly vetted for GDPR and IT Act compliance.
                        </p>
                        <div className="space-y-6">
                            <div className="p-6 border border-white/10 rounded-2xl">
                                <h4 className="font-bold text-white mb-2">Google AdSense (Monetization)</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    We use Google AdSense (ca-pub-4067685297246069) to serve contextual ads. Google may use "DART cookies" to serve ads based on your interests across the web. You can opt-out via Google's Privacy & Terms page. No personally identifiable study data is shared with advertisers.
                                </p>
                            </div>
                            <div className="p-6 border border-white/10 rounded-2xl">
                                <h4 className="font-bold text-white mb-2">Google Analytics 4 (Behavioral Insights)</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    GA4 helps us understand which exam sections are most popular. We use "G-7MWNJDZ5D0" to track aggregated user flows. Your IP address is anonymized before processing.
                                </p>
                            </div>
                            <div className="p-6 border border-white/10 rounded-2xl">
                                <h4 className="font-bold text-white mb-2">Firebase (Core Infrastructure)</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    All performance data is encrypted at rest and in transit using Google Cloud's Firebase security layer. This is the industry gold standard for data protection.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">5. Data Retention & The Right to be Forgotten</h2>
                        <p className="text-gray-300 leading-relaxed text-lg mb-4">
                            We retain academic data for the duration of your examination cycle (typically 1-3 years). However, we believe in radical student control. 
                        </p>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            If you decide to stop using Exam Compass, you have the right to request a "Full Wipe." Upon verification, we will purge all your performance history, authentication data, and preference flags from our production databases within 30 days. Contact our privacy officer via the site's official channel for such requests.
                        </p>
                    </section>

                    <section className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6">6. Safety for Minors</h2>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            A significant portion of our users are under 18. We follow the COPPA (Children's Online Privacy Protection Act) guidelines, even though we operate primarily in India. We do not permit social networking or public messaging between students, preventing potential predatory behavior or cyberbullying. Exam Compass remains a "Pure Study Environment."
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">7. Policy Evolution</h2>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            As our AI models evolve, the types of data we process may change. We will notify you via a dashboard alert 14 days before any significant change to our processing logic. Your continued use of the platform after such notice constitutes acceptance of the new framework.
                        </p>
                    </section>
                </article>
                </article>
            </main>

            <Footer />
        </div>
    );
};
