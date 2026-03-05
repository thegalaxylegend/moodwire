import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title="Terms of Service | Exam Compass"
                description="Read the Exam Compass Terms of Service. Understand the rules and guidelines for using our AI-powered exam preparation platform."
                canonical="https://examcompass.web.app/terms"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Terms of Service",
                    "url": "https://examcompass.web.app/terms",
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
                    Terms of Service
                </h1>
                <p className="text-gray-400 text-sm mb-12">Last updated: March 5, 2026</p>

                <article className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            By accessing and using Exam Compass (examcompass.web.app), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use our platform. These terms apply to all visitors, users, and others who access or use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Exam Compass is a free, AI-powered exam preparation platform providing mock tests, previous year question (PYQ) practice, syllabus analytics, and personalized study plans for competitive examinations including JEE Mains, JEE Advanced, NEET, UPSC, CLAT, GATE, BITSAT, and CBSE Class 6–12 board examinations. The platform uses artificial intelligence to generate adaptive content tailored to individual student performance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To access certain features, you may be required to create an account using Google Authentication or email/password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Use the platform for any unlawful purpose or in violation of any applicable laws</li>
                            <li>Scrape, copy, or redistribute our question databases, content, or AI-generated materials without explicit written permission</li>
                            <li>Attempt to interfere with, compromise, or disrupt the platform's infrastructure</li>
                            <li>Use automated bots or scripts to access the platform without authorization</li>
                            <li>Impersonate another person or misrepresent your affiliation with any entity</li>
                            <li>Upload or transmit malicious code, viruses, or harmful software</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
                        <p className="text-gray-300 leading-relaxed">
                            All content on Exam Compass — including but not limited to text, graphics, logos, UI design, AI-generated questions, explanations, analytics dashboards, and software — is the property of Exam Compass and is protected by Indian and international intellectual property laws. Previous Year Questions (PYQs) are sourced from publicly available examination papers conducted by NTA, CBSE, and other examination authorities. Our value-addition includes AI-generated explanations, categorization, difficulty analysis, and adaptive test generation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Advertisements</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Exam Compass displays third-party advertisements through Google AdSense. These advertisements help support the free operation of our platform. We are not responsible for the content, accuracy, or opinions expressed in third-party advertisements. Your interactions with advertisers found on the Site are solely between you and the advertiser.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimer of Warranties</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Exam Compass is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely secure. We do not guarantee any specific exam results or outcomes from using our platform. The AI-generated content, probability scores, and study recommendations are for informational and educational purposes only.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To the maximum extent permitted by applicable law, Exam Compass and its founder shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of profits, or any damages arising from your use or inability to use the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Modifications</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We reserve the right to modify or replace these Terms of Service at any time. Material changes will be communicated by posting the updated terms on this page. Your continued use of the platform after any changes constitutes your acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Governing Law</h2>
                        <p className="text-gray-300 leading-relaxed">
                            These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Darbhanga, Bihar, India.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
                        <p className="text-gray-300 leading-relaxed">
                            For any questions regarding these Terms of Service, please visit our <a href="/contact" className="text-purple-400 hover:underline">Contact Page</a>.
                        </p>
                    </section>
                </article>
            </main>

            <Footer />
        </div>
    );
};
