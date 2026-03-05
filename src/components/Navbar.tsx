
import { Link } from 'react-router-dom';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-white tracking-tighter">
                    Exam<span className="text-purple-500">Compass</span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="px-6 py-2 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
};
