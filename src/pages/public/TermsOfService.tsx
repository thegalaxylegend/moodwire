import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { SITE_URL } from '../../lib/siteConfig';

export const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title="Terms of Service | Exam Compass"
                description="Read the Exam Compass Terms of Service. Understand the rules and guidelines for using our AI-powered exam preparation platform."
                canonical={`${SITE_URL}/terms`}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Terms of Service",
                    "url": `${SITE_URL}/terms`,
                    "publisher": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": SITE_URL
                    }
                }}
            />
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Terms of Service
                </h1>
                <p className="text-gray-400 text-sm mb-12">Last updated: March 5, 2026</p>

                <article className="prose prose-invert max-w-none space-y-8">
                <article className="prose prose-invert max-w-none space-y-12 text-gray-300">
                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">1. Contractual Framework</h2>
                        <p className="leading-relaxed text-lg">
                            By accessing and using Exam Compass (examcompass.pages.dev), you are entering into a legally binding agreement with Exam Compass ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our AI-powered exam preparation services, including all software, data, and content delivered via the platform.
                        </p>
                        <p className="leading-relaxed text-lg">
                            If you are under the age of 18, you represent that you have reviewed these Terms with your parent or legal guardian and that they have consented to your use of the platform. If you do not agree to these Terms in their entirety, you are strictly prohibited from accessing the Site or using any of our services.
                        </p>
                    </section>

                    <section className="bg-white/5 p-8 rounded-3xl border border-white/10">
                        <h2 className="text-3xl font-bold text-white mb-6">2. Scope of AI-Driven Services</h2>
                        <p className="leading-relaxed mb-6">
                            Exam Compass provides a dynamic, adaptive learning environment. The "Service" includes:
                        </p>
                        <ul className="space-y-4 list-none p-0">
                            {[
                                "AI-curated mock tests for JEE, NEET, UPSC, and other examinations.",
                                "Real-time performance analytics and selection probability modeling.",
                                "Categorized Previous Year Question (PYQ) databases with AI-generated solutions.",
                                "Personalized study roadmaps driven by Large Language Model (LLM) insights."
                            ].map(item => (
                                <li key={item} className="flex gap-3 items-start">
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">3. Intellectual Property and Usage Rights</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-blue-400 mb-2">3.1 Proprietary AI Models</h3>
                                <p className="leading-relaxed">
                                    All algorithms, including our Selection Probability Engine and Adaptive Difficulty Scaler, are the exclusive intellectual property of Exam Compass. You are granted a limited, non-exclusive, non-transferable license to use these tools for personal, non-commercial educational purposes.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-blue-400 mb-2">3.2 Content Ownership</h3>
                                <p className="leading-relaxed">
                                    While PYQs are sourced from public examination bodies (NTA, CBSE, etc.), the structural organization, AI-generated explanations, and unique UI/UX of Exam Compass are protected by copyright laws. Automated scraping or mass-downloading of our question bank is a violation of these terms and will result in an immediate permanent ban.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">4. Prohibited Conduct (Anti-Cheating Policy)</h2>
                        <p className="leading-relaxed mb-6">
                            To maintain the integrity of our benchmarking and selection probability data, users are strictly prohibited from:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 border border-white/10 rounded-2xl bg-white/5">
                                <h4 className="font-bold text-red-400 mb-2">Technical Tampering</h4>
                                <p className="text-sm text-gray-400">Reverse engineering our API, injecting malicious code, or attempting to bypass security layers for unauthorized access to premium analytics.</p>
                            </div>
                            <div className="p-6 border border-white/10 rounded-2xl bg-white/5">
                                <h4 className="font-bold text-red-400 mb-2">Data Manipulation</h4>
                                <p className="text-sm text-gray-400">Using automated bots to complete mock tests, which skews our global difficulty heatmaps and selection predictors.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">5. Disclaimers and Limitation of Liability</h2>
                        <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/20 italic">
                            <p className="leading-relaxed text-gray-400">
                                Exam Compass is provided "as is." We utilize highly advanced AI models, but we do not guarantee that the AI-generated explanations are 100% error-free. The Selection Probability score is an estimation based on historical data and current user trends; it is NOT a guarantee of admission to any institution. 
                            </p>
                            <p className="mt-4 leading-relaxed text-gray-400">
                                Exam Compass and its founder shall not be held liable for any academic disappointment, loss of data, or any direct or indirect damages resulting from the use of the platform.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-white mb-6">6. Monetization and Ads</h2>
                        <p className="leading-relaxed">
                            To provide these high-end tools for free, we display ads via Google AdSense. You agree not to use ad-blocking software that intentionally disrupts the platform's ability to generate revenue. Support of the platform's ads is what keeps the AI engine running for students who cannot afford expensive coaching.
                        </p>
                    </section>

                    <section className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6">7. Jurisdictional Authority</h2>
                        <p className="leading-relaxed">
                            These Terms are governed by the IT Act of India. Any legal proceedings related to Exam Compass shall be handled within the jurisdiction of the courts in Darbhanga, Bihar, India. We reserve the right to modify these terms at any time; continued use of the platform constitutes "Active Consent" to all modifications.
                        </p>
                    </section>
                </article>
                </article>
            </main>

            <Footer />
        </div>
    );
};
