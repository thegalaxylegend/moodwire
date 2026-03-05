import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Mail, MapPin, Clock, MessageSquare } from 'lucide-react';

export const ContactPage = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title="Contact Us | Exam Compass"
                description="Get in touch with the Exam Compass team. Contact us for questions, feedback, bug reports, or partnership inquiries about our AI-powered exam preparation platform."
                canonical="https://examcompass.web.app/contact"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "ContactPage",
                    "name": "Contact Exam Compass",
                    "url": "https://examcompass.web.app/contact",
                    "mainEntity": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": "https://examcompass.web.app",
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer support",
                            "availableLanguage": ["English", "Hindi"]
                        }
                    }
                }}
            />
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
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
            </main>

            <Footer />
        </div>
    );
};
