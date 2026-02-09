
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowLeft, CheckCircle, Brain } from 'lucide-react';
import { slugify } from '../../lib/utils';

export const QuestionPage = () => {
    const { exam } = useParams();
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';

    // 1. Mock Data (In real app, fetch by slug from Firestore/DB)
    // We simulate a static question for SEO demo purposes.
    const question = {
        title: "Calculate the work done by centripetal force",
        body: "A particle moves in a circle of radius R with a constant speed v. What is the work done by the centripetal force in one complete revolution?",
        options: [
            "2πRmv²",
            "mv²/R",
            "Zero",
            "mv²R"
        ],
        correctAnswer: "Zero",
        explanation: "Work done is defined as the dot product of Force and Displacement (W = F·d = Fd cosθ). For centripetal force, the force vector is always directed towards the center, while the displacement vector is tangential to the circle. The angle θ between them is always 90°. Since cos(90°) = 0, the Work Done is Zero.",
        topic: "Work, Energy and Power",
        subject: "Physics",
        difficulty: "Medium",
        year: "2023"
    };

    const pageTitle = `${question.title} - ${formattedExam} ${question.subject} Question`;
    const description = `Practice this ${formattedExam} ${question.subject} question on ${question.topic}. Correct Answer: ${question.correctAnswer}. Get detailed AI explanations.`;

    // 2. JSON-LD Structured Data for Google Rich Results
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": pageTitle,
        "educationLevel": "High School",
        "hasPart": {
            "@type": "Question",
            "name": question.body,
            "educationLevel": "High School",
            "suggestedAnswer": {
                "@type": "Answer",
                "text": ` The correct answer is ${question.correctAnswer}. ${question.explanation}`
            },
            "acceptedAnswer": {
                "@type": "Answer",
                "text": question.correctAnswer
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={pageTitle}
                description={description}
                canonical={`https://examcompass.web.app/${exam}/q/${slugify(question.title)}`}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <Link to={`/${exam}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} /> Back to {formattedExam}
                </Link>

                <div className="glass-card bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Brain size={150} />
                    </div>

                    <div className="flex gap-3 mb-6">
                        <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                            {question.subject}
                        </span>
                        <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                            {question.topic}
                        </span>
                        <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 text-sm border border-yellow-500/30">
                            PYQ {question.year}
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
                        Q. {question.body}
                    </h1>

                    <div className="grid gap-4 mb-8">
                        {question.options.map((opt, i) => (
                            <div key={i} className={`p-4 rounded-xl border transition-all ${opt === question.correctAnswer
                                ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold'
                                : 'bg-black/20 border-white/10 text-gray-400'
                                }`}>
                                <span className="mr-4 text-white/50">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                                {opt === question.correctAnswer && <CheckCircle size={20} className="inline float-right" />}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 border-l-4 border-purple-500">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Brain size={20} className="text-purple-400" />
                            AI Explanation
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                            {question.explanation}
                        </p>
                    </div>

                    <div className="mt-10 text-center">
                        <Link to={`/dashboard/mock?exam=${exam}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                            Practice More Questions Like This
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
