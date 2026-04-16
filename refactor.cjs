const fs = require('fs');

const path = 'c:/Users/Admin/Downloads/Desktop/src/pages/dashboard/MockGenerator.tsx';
const content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');

const newLines = [];
let bottomHalf = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('type Question = {')) {
        newLines.push(`// Extract components`);
        newLines.push(`import { MockLoading } from './mock/MockLoading';`);
        newLines.push(`import { MockPreview } from './mock/MockPreview';`);
        newLines.push(`import { MockResults } from './mock/MockResults';`);
        newLines.push(`import { MockExamEngine } from './mock/MockExamEngine';`);
        newLines.push(`import { MockHistory } from './mock/MockHistory';\n`);
    }

    if (line.trim() === "if (step === 'loading' || step === 'config') {") {
        bottomHalf = true;
        break; // Stop taking old lines
    }
    
    newLines.push(line);
}

const renderLogic = `    if (step === 'loading' || step === 'config') {
        return (
            <>
                {alertModalComponent}
                <MockLoading
                    progress={generationProgress}
                    message={loadingMessage}
                    step={step}
                    onCancel={handleExit}
                />
            </>
        );
    }

    if (step === 'result') {
        return (
            <MockResults
                score={score}
                questions={questions as any}
                answers={answers}
                topicOrExam={mode === 'topic' ? (urlTopic || 'Specific Topic') : (user?.targetExam || 'General')}
                userName={user?.name || 'Anonymous'}
                targetExam={user?.targetExam || 'General'}
                onReview={() => {
                    setStep('review');
                    setCurrentQ(0);
                    setTimeRemaining(0);
                }}
                onDashboard={() => navigate('/dashboard')}
                onRetake={() => {
                    setStep('config');
                    setQuestions([]);
                }}
            />
        );
    }

    if (step === 'preview') {
        return (
            <MockPreview
                questionsCount={questions.length}
                timeRemaining={timeRemaining}
                topicOrExam={mode === 'topic' ? (urlTopic || 'Specific Topic') : (user?.targetExam || 'General Proficiency')}
                isTimedExam={isTimedExam}
                onStart={() => {
                    setStep('exam');
                    if (isTimedExam) {
                        setTimeRemaining(mode === 'quick' ? 30 * 60 : 180 * 60);
                    } else {
                        setTimeRemaining(0);
                    }
                }}
                onCancel={handleExit}
            />
        );
    }

    if (step === 'exam' || step === 'review') {
        return (
            <MockExamEngine
                state={{
                    questions: questions as any,
                    answers,
                    currentQ,
                    step,
                    fatigueNotice,
                    isTimedExam,
                    timeRemaining,
                    currentAbility,
                    aiModalOpen,
                    isVerifying,
                    aiExplanation,
                    isSpeaking,
                    aiChatHistory: aiChatHistory as any,
                    aiInput,
                    isAiThinking,
                    mode
                }}
                actions={{
                    setFatigueNotice,
                    handlePause,
                    handleSubmitExam,
                    setStep,
                    handleAnswer,
                    handleAskAI,
                    setIsSpeaking,
                    setCurrentQ,
                    handlePrevQ,
                    handleNextQ,
                    setAiModalOpen,
                    setAiInput,
                    handleSendAiMessage
                }}
            />
        );
    }

    if (step === 'history') {
        return (
            <MockHistory
                user={user}
                onBack={() => {
                    sessionStorage.removeItem('active_test_session');
                    setStep('config');
                }}
                onResume={handleResume}
            />
        );
    }

    // Fallback Loader
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-text-muted animate-pulse">Synchronizing Session...</p>
        </div>
    );
};
`;

newLines.push(renderLogic);

fs.writeFileSync(path, newLines.join('\\n'), 'utf8');
console.log('Successfully refactored MockGenerator lines.');
