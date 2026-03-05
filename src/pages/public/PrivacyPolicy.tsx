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
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Welcome to Exam Compass ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website at examcompass.web.app (the "Site") and use our AI-powered exam preparation platform. By accessing or using Exam Compass, you agree to the terms of this Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3">2.1 Personal Information</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            When you register for an account, we may collect your name, email address, class/grade level, target examination, and study preferences. This information is used solely to personalize your exam preparation experience and generate adaptive mock tests.
                        </p>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3">2.2 Usage Data</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We automatically collect certain information when you visit our Site, including your browser type, operating system, pages visited, time spent on pages, and mock test performance data. This data helps us improve our platform's functionality and AI-driven recommendations.
                        </p>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3">2.3 Cookies and Tracking Technologies</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Exam Compass uses cookies and similar tracking technologies to enhance your browsing experience. These include essential cookies for site functionality, analytics cookies (Google Analytics) for understanding user behaviour, and advertising cookies (Google AdSense) for displaying relevant advertisements. You can manage your cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>To provide and maintain our exam preparation services</li>
                            <li>To personalize your learning experience and generate adaptive mock tests</li>
                            <li>To analyze usage patterns and improve our platform</li>
                            <li>To display relevant advertisements through Google AdSense</li>
                            <li>To track website performance through Google Analytics (measurement ID: G-7MWNJDZ5D0)</li>
                            <li>To communicate with you about updates and new features</li>
                            <li>To detect, prevent, and address technical issues</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We use the following third-party services that may collect and process your data:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li><strong className="text-white">Google AdSense</strong> — We display advertisements through Google AdSense (Publisher ID: ca-pub-4067685297246069). Google may use cookies to serve ads based on your prior visits to our site and other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
                            <li><strong className="text-white">Google Analytics</strong> — We use Google Analytics to track and report website traffic. Google Analytics collects data such as pages visited, session duration, and user demographics.</li>
                            <li><strong className="text-white">Firebase Authentication</strong> — We use Firebase for user authentication and data storage. Firebase is operated by Google and is subject to Google's privacy policies.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Storage and Security</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Your data is stored securely through Firebase (Google Cloud) infrastructure. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Depending on your jurisdiction, you may have the right to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Access, update, or delete your personal information</li>
                            <li>Opt out of personalized advertising</li>
                            <li>Request a copy of your data</li>
                            <li>Withdraw consent for data processing</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            To exercise any of these rights, please contact us at the email address provided on our Contact page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Children's Privacy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Exam Compass is designed for students, including those under 18 years of age. We do not knowingly collect excessive personal information from children. We collect only the minimum data necessary to provide our educational services. If you are a parent or guardian and believe your child has provided us with inappropriate personal information, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about this Privacy Policy, please visit our <a href="/contact" className="text-purple-400 hover:underline">Contact Page</a> or reach out to us via email.
                        </p>
                    </section>
                </article>
            </main>

            <Footer />
        </div>
    );
};
