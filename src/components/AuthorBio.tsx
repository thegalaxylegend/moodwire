
import React from 'react';
import { Linkedin, Twitter } from 'lucide-react';

interface AuthorBioProps {
    name: string;
    role: string;
    image?: string;
    bio: string;
    credentials?: string[];
    linkedin?: string;
    twitter?: string;
}

export const AuthorBio: React.FC<AuthorBioProps> = ({
    name,
    role,
    image,
    bio,
    credentials,
    linkedin,
    twitter
}) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-12 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-500/20 flex-shrink-0 border-2 border-purple-500/30">
                    {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-purple-300">
                            {name.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                            <p className="text-purple-400 text-sm font-medium">{role}</p>
                        </div>
                        <div className="flex items-center gap-3 justify-center">
                            {linkedin && (
                                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-blue-400 transition-all">
                                    <Linkedin size={18} />
                                </a>
                            )}
                            {twitter && (
                                <a href={twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-sky-400 transition-all">
                                    <Twitter size={18} />
                                </a>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                        {bio}
                    </p>

                    {credentials && credentials.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {credentials.map((cred, i) => (
                                <span key={i} className="text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                                    {cred}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* E-E-A-T Marker for Crawlers */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
                    AI-Verified Resource
                </div>
                <div className="text-[11px] text-gray-500 italic">
                    Curated for the Latest Pattern
                </div>
            </div>
        </div>
    );
};
