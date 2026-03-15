import { Link } from 'react-router-dom';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-white/10 bg-black/80 backdrop-blur-sm min-h-[400px]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="text-xl md:text-2xl font-bold text-white tracking-tighter inline-block mb-3">
                            Exam<span className="text-[#a855f7]">Compass</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            AI-powered exam preparation for Indian students. Practice smarter, not harder.
                        </p>
                    </div>

                    {/* Exams */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Exams</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'JEE Mains', href: '/jee-mains' },
                                { name: 'NEET', href: '/neet' },
                                { name: 'UPSC', href: '/upsc' },
                                { name: 'GATE', href: '/gate' },
                                { name: 'CLAT', href: '/clat' },
                            ].map(link => (
                                <li key={link.name}>
                                    <Link to={link.href} className="text-gray-500 hover:text-white text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Revision Hub for Crawlability */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Revision Hub</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'Class 12', href: '/class-12' },
                                { name: 'Class 11', href: '/class-11' },
                                { name: 'Class 10', href: '/class-10' },
                                { name: 'Class 9', href: '/class-9' },
                                { name: 'Class 8', href: '/class-8' },
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
                                { name: 'Blog', href: '/blog' },
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

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-xs">
                        © {currentYear} Exam Compass. All rights reserved.
                    </p>
                    <p className="text-gray-600 text-xs">
                        Built with ❤️ in India
                    </p>
                </div>
            </div>
        </footer>
    );
};
