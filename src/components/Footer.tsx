import { Link } from 'react-router-dom';
import { SOCIAL_LINKS } from '../lib/constants';
import { Twitter, Instagram } from 'lucide-react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative border-t border-white/10 bg-black/95 backdrop-blur-xl min-h-[400px] overflow-hidden">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="relative max-w-7xl mx-auto px-6 py-12">
                {/* Top Section */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="text-xl md:text-2xl font-bold text-white tracking-tighter inline-block mb-3">
                            Exam<span className="text-[#a855f7]">Compass</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            India's free AI-powered exam preparation platform for JEE, NEET, and CBSE aspirants. 9,000+ verified PYQs.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href={SOCIAL_LINKS.discord.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#5865F2] transition-colors" title="Join Discord">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                            </a>
                            <a href={SOCIAL_LINKS.twitter.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-400 transition-colors" title="Follow on X">
                                <Twitter size={18} />
                            </a>
                            <a href={SOCIAL_LINKS.threads.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" title="Follow on Threads">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
                            </a>
                            <a href={SOCIAL_LINKS.instagram.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 transition-colors" title="Follow on Instagram">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Competitive Exams */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Competitive Exams</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'JEE Mains 2026', href: '/jee-mains' },
                                { name: 'JEE Advanced 2026', href: '/jee-advanced' },
                                { name: 'NEET UG 2026', href: '/neet' },
                            ].map(link => (
                                <li key={link.name}>
                                    <Link to={link.href} className="text-gray-500 hover:text-white text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Board Exams */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Board Exams</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'Class 12 Boards', href: '/class-12' },
                                { name: 'Class 11 Prep', href: '/class-11' },
                                { name: 'Class 10 Boards', href: '/class-10' },
                                { name: 'Class 9 Foundation', href: '/class-9' },
                                { name: 'Class 8 Foundation', href: '/class-8' },
                            ].map(link => (
                                <li key={link.name}>
                                    <Link to={link.href} className="text-gray-500 hover:text-white text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Resources</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'Revision Notes', href: '/blog' },
                                { name: 'AI Mock Tests', href: '/dashboard/mock' },
                                { name: 'PYQ Practice', href: '/jee-mains' },
                                { name: 'About Us', href: '/about' },
                                { name: 'Contact', href: '/contact' },
                            ].map(link => (
                                <li key={link.href}>
                                    <Link to={link.href} className="text-gray-500 hover:text-white text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'Privacy Policy', href: '/privacy' },
                                { name: 'Terms of Service', href: '/terms' },
                            ].map(link => (
                                <li key={link.href}>
                                    <Link to={link.href} className="text-gray-500 hover:text-white text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* SEO Bottom Section — Rich internal link text for crawlers */}
                <div className="border-t border-white/10 pt-6">
                    <p className="text-gray-500/80 text-xs leading-relaxed mb-4">
                        Exam Compass is India's free AI-powered exam preparation platform. Practice <Link to="/jee-mains" className="text-gray-400 hover:text-white transition-colors">JEE Mains</Link>, <Link to="/jee-advanced" className="text-gray-400 hover:text-white transition-colors">JEE Advanced</Link>, <Link to="/neet" className="text-gray-400 hover:text-white transition-colors">NEET UG</Link>, and <Link to="/class-12" className="text-gray-400 hover:text-white transition-colors">CBSE Board</Link> exams with 9,000+ verified NTA Previous Year Questions, unlimited AI mock tests, and personalized study plans. All free, forever.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-gray-600 text-xs">
                            © {currentYear} Exam Compass. All rights reserved.
                        </p>
                        <p className="text-gray-600 text-xs">
                            Built with ❤️ in India by <Link to="/about" className="text-gray-500 hover:text-white transition-colors">Ayush Kumar</Link>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
