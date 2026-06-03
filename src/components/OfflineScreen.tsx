import { WifiOff, BookOpen, RefreshCw, Lightbulb } from 'lucide-react';

const STUDY_TIPS = [
  'Review your weakest topics using the notes you saved earlier.',
  'Solve 5 questions from memory — no hints, just intuition.',
  'Recall one full concept map of a chapter you studied last week.',
  'Write down every formula you remember for your upcoming exam.',
  'Think through a PYQ you got wrong and explain why the answer is correct.',
];

const randomTip = STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)];

/**
 * OfflineScreen — shown when the Capacitor Network plugin detects no connectivity.
 *
 * Displayed instead of a raw WebView "ERR_INTERNET_DISCONNECTED" error page.
 * This is a store QA requirement for OPPO App Market and Vivo App Store.
 */
export const OfflineScreen = () => {
  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0f] px-6"
      role="alert"
      aria-live="assertive"
    >
      {/* Glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[320px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
        <div className="size-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
          <WifiOff className="text-purple-400" size={40} strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            No internet connection detected. Check your Wi-Fi or mobile data
            and try again.
          </p>
        </div>

        {/* Study tip card */}
        <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-yellow-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
              Study Tip
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{randomTip}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold py-4 rounded-xl transition-all duration-200"
          >
            <RefreshCw size={18} />
            Retry Connection
          </button>
          <a
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-gray-300 hover:text-white font-semibold py-4 rounded-xl transition-all duration-200 text-sm"
          >
            <BookOpen size={16} />
            View Saved Notes
          </a>
        </div>

        {/* Branding */}
        <p className="text-xs text-gray-600 mt-2">Exam Compass</p>
      </div>
    </div>
  );
};
