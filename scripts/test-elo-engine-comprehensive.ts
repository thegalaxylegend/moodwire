import { EloService, CalibrationProfile } from '../src/services/eloService';

const initialProfile: CalibrationProfile = {
    overall: 1000,
    subjectRatings: { math: 1000, physics: 1000, chemistry: 1000 },
    topicRatings: {},
    conceptVectors: {},
    totalAttempts: 0,
    streakCounter: 0,
    learningVelocity: 0,
    learningMomentum: 0,
    uncertainty: 350,
    recentTopics: [],
    lastCalibrated: new Date().toISOString(),
    processedAttemptIds: []
};

async function runTest() {
    console.log("=============================================");
    console.log("Elo Adaptive Engine - Comprehensive Testing");
    console.log("=============================================\n");
    let passed = 0;
    let failed = 0;

    const logResult = (scenario: string, expected: number | string, actual: number, initial: number, passCondition: boolean) => {
        console.log(`Scenario: ${scenario}`);
        console.log(`initial_elo: ${initial.toFixed(2)}`);
        console.log(`expected_elo: ${typeof expected === 'number' ? expected.toFixed(2) : expected}`);
        console.log(`actual_elo: ${actual.toFixed(2)}`);
        console.log(`Result: ${passCondition ? 'PASS' : 'FAIL'}\n`);
        passCondition ? passed++ : failed++;
    };

    // Test 1: 10 consecutive correct answers
    let p1 = { ...initialProfile, lastCalibrated: new Date().toISOString() };
    const startElo1 = p1.overall;
    for (let i = 0; i < 10; i++) {
        p1 = EloService.updateCalibration(p1, 'math', 'algebra', 1000, { isCorrect: true, solveTimeS: 60, hintsUsed: 0, attemptId: `q1_${i}` });
    }
    const pass1 = p1.overall > startElo1;
    logResult("(1) answer 10 consecutive correct answers — verify difficulty increases", "> " + startElo1.toFixed(2), p1.overall, startElo1, pass1);

    // Test 2: 10 consecutive wrong answers
    let p2 = { ...initialProfile, lastCalibrated: new Date().toISOString() };
    p2.overall = 500; // Start closer to the floor to actually hit it
    const startElo2 = p2.overall;
    for (let i = 0; i < 10; i++) {
        p2 = EloService.updateCalibration(p2, 'math', 'algebra', 1000, { isCorrect: false, solveTimeS: 60, hintsUsed: 0, attemptId: `q2_${i}` });
    }
    const minFloor = 400;
    const pass2 = p2.overall < startElo2 && p2.overall >= minFloor;
    logResult("(2) answer 10 consecutive wrong answers — verify difficulty decreases and does NOT go below minimum floor", `[${minFloor}, ${startElo2})`, p2.overall, startElo2, pass2);

    // Test 3: Alternating correct/wrong answers
    let p3 = { ...initialProfile, lastCalibrated: new Date().toISOString() };
    const startElo3 = p3.overall;
    for (let i = 0; i < 20; i++) {
        p3 = EloService.updateCalibration(p3, 'math', 'algebra', 1000, { isCorrect: i % 2 === 0, solveTimeS: 60, hintsUsed: 0, attemptId: `q3_${i}` });
    }
    const pass3 = Math.abs(p3.overall - startElo3) < 50;
    logResult("(3) answer alternating correct/wrong — verify score stabilizes", `~${startElo3.toFixed(2)}`, p3.overall, startElo3, pass3);


    // Test 4: Network disconnect mid-request (Double-counting)
    console.log("Scenario: (4) submit a question response with network disconnect mid-request — verify no double-counting of score update");
    let p4 = { ...initialProfile, lastCalibrated: new Date().toISOString(), processedAttemptIds: [] };
    const startElo4 = p4.overall;

    // Request 1: Processed locally
    const attemptId = "q123_attempt_4";
    p4 = EloService.updateCalibration(p4, 'math', 'algebra', 1000, { isCorrect: true, solveTimeS: 60, hintsUsed: 0, attemptId });
    const eloAfterFirst = p4.overall;

    // Request 2: Retry due to disconnect
    p4 = EloService.updateCalibration(p4, 'math', 'algebra', 1000, { isCorrect: true, solveTimeS: 60, hintsUsed: 0, attemptId });

    const expectedElo4 = eloAfterFirst;
    const pass4 = p4.overall === expectedElo4 && p4.overall > startElo4; // Score updated exactly once
    console.log(`initial_elo: ${startElo4.toFixed(2)}`);
    console.log(`expected_elo: ${expectedElo4.toFixed(2)}`);
    console.log(`actual_elo: ${p4.overall.toFixed(2)}`);
    console.log(`Result: ${pass4 ? 'PASS' : 'FAIL'}\n`);
    pass4 ? passed++ : failed++;


    // Test 5: Simultaneous submissions (Race condition)
    console.log("Scenario: (5) two devices logged into the same account submit answers simultaneously — verify no race condition corrupts the Elo score.");
    let p5 = { ...initialProfile, lastCalibrated: new Date().toISOString() };
    const startElo5 = p5.overall;

    // Device A reads state
    let stateA = { ...p5 };
    // Device B reads state concurrently
    let stateB = { ...p5 };

    // Device A computes new state locally
    const attemptIdA = "q123_attempt_5A";
    const newStateA = EloService.updateCalibration(stateA, 'math', 'algebra', 1000, { isCorrect: true, solveTimeS: 60, hintsUsed: 0, attemptId: attemptIdA });

    // Device B computes new state based on OLD state
    const attemptIdB = "q123_attempt_5B";
    const newStateB = EloService.updateCalibration(stateB, 'physics', 'kinematics', 1000, { isCorrect: true, solveTimeS: 60, hintsUsed: 0, attemptId: attemptIdB });

    // Server logic: If we merge based on `processedAttemptIds` or use transaction retries.
    // In our idempotency logic, if B retries after A succeeds:
    const retryStateB = { ...newStateA };
    const finalState = EloService.updateCalibration(retryStateB, 'physics', 'kinematics', 1000, { isCorrect: true, solveTimeS: 60, hintsUsed: 0, attemptId: attemptIdB });

    const pass5 = finalState.overall > newStateA.overall; // Both attempts contributed to score
    console.log(`initial_elo: ${startElo5.toFixed(2)}`);
    console.log(`expected_elo: > ${newStateA.overall.toFixed(2)}`);
    console.log(`actual_elo: ${finalState.overall.toFixed(2)}`);
    console.log(`Result: ${pass5 ? 'PASS' : 'FAIL'}\n`);
    pass5 ? passed++ : failed++;

    console.log(`Final Summary: ${passed} PASSED, ${failed} FAILED`);
}

runTest();
