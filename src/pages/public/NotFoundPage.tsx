import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const NotFoundPage = () => {
    return (
        <>
            <SEO
                title="Page Not Found"
                description="The page you are looking for does not exist."
                noindex={true}
            />
            <Navbar />
            <main id="main-content" className="min-h-screen flex items-center justify-center px-4 pt-20">
                <div className="text-center max-w-md">
                    <h1 className="text-7xl font-bold text-white mb-4">404</h1>
                    <p className="text-xl text-gray-400 mb-8">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="px-6 py-3 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Go Home
                        </Link>
                        <Link
                            to="/blog"
                            className="px-6 py-3 rounded-full border border-white/20 text-gray-300 font-semibold hover:bg-white/5 transition-colors"
                        >
                            Read Blog
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};
