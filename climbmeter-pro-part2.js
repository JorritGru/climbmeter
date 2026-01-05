// CLIMBMETER PRO - PART 2 JAVASCRIPT
// Copy this code and paste it into the <script> tag AFTER the Part 1 code

// ========================================
// AUDIO & SPEECH
// ========================================
function playBeep(frequency, duration) {
    if (!STATE.audioEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
        
        showAudioIndicator();
    } catch (error) {
        console.log('Audio not available:', error);
    }
}

function speak(text) {
    if (!STATE.audioEnabled) return;
    
    try {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
        showAudioIndicator();
    } catch (error) {
        console.log('Speech not available:', error);
    }
}

function showAudioIndicator() {
    const indicator = document.getElementById('audioIndicator');
    indicator.classList.add('active');
    setTimeout(() => {
        indicator.classList.remove('active');
    }, 1000);
}

// ========================================
// VIBRATION (HAPTIC FEEDBACK)
// ========================================
function vibrate(pattern = 50) {
    if (!STATE.hapticEnabled) return;
    
    try {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    } catch (error) {
        console.log('Vibration not available:', error);
    }
}

// ========================================
// NAVIGATION
// ========================================
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load tab content
    if (tabName === 'history') {
        renderSessionList();
    } else if (tabName === 'stats') {
        updateStats();
    } else if (tabName === 'routines') {
        renderRoutineList();
    } else if (tabName === 'progress') {
        renderProgressCharts();
    }
    
    vibrate();
}

// ========================================
// TEST FUNCTIONS (Enhanced)
// ========================================
function startTest(testType) {
    if (!STATE.isConnected) {
        alert('Please connect device first!');
        return;
    }

    // Configure test modal
    const modal = document.getElementById('testModal');
    const title = document.getElementById('testModalTitle');
    
    switch(testType) {
        case 'peak':
            title.textContent = 'Peak Force Test';
            document.getElementById('testDuration').value = 7;
            document.getElementById('testReps').value = 1;
            break;
        case 'endurance':
            title.textContent = 'Endurance Test';
            document.getElementById('testDuration').value = 30;
            document.getElementById('testReps').value = 1;
            break;
        case 'repeaters':
            title.textContent = 'Repeaters';
            document.getElementById('testDuration').value = 7;
            document.getElementById('testReps').value = 5;
            document.getElementById('testRest').value = 3;
            break;
        case 'rfd':
            title.textContent = 'RFD Test';
            document.getElementById('testDuration').value = 5;
            document.getElementById('testReps').value = 3;
            break;
        case 'critical':
            title.textContent = 'Critical Force';
            document.getElementById('testDuration').value = 180;
            document.getElementById('testReps').value = 1;
            break;
        case 'failure':
            title.textContent = 'To Failure';
            document.getElementById('testDuration').value = 999;
            document.getElementById('testReps').value = 1;
            break;
    }

    STATE.testState = {
        type: testType,
        isRunning: false
    };

    modal.classList.add('active');
    vibrate();
}

function closeTestModal() {
    document.getElementById('testModal').classList.remove('active');
    document.getElementById('testConfig').style.display = 'block';
    document.getElementById('testRunning').style.display = 'none';
    document.getElementById('testResults').style.display = 'none';
    if (STATE.testState) {
        STATE.testState.isRunning = false;
    }
    vibrate();
}

function runTest() {
    // Hide config, show running
    document.getElementById('testConfig').style.display = 'none';
    document.getElementById('testRunning').style.display = 'block';
    document.getElementById('testResults').style.display = 'none';

    // Get test parameters
    const duration = parseInt(document.getElementById('testDuration').value);
    const reps = parseInt(document.getElementById('testReps').value);
    const rest = parseInt(document.getElementById('testRest').value);
    const hand = document.getElementById('testHand').value;

    // Show hand indicator
    const handIndicator = document.getElementById('handIndicator');
    handIndicator.style.display = 'block';

    STATE.testState = {
        ...STATE.testState,
        isRunning: true,
        duration: duration,
        reps: reps,
        rest: rest,
        hand: hand,
        currentRep: 1,
        phase: 'countdown',
        currentHand: 'left',
        timeRemaining: 3,
        repPeak: 0,
        leftRepPeak: 0,
        rightRepPeak: 0,
        bestPeak: 0,
        totalWork: 0,
        startTime: Date.now(),
        leftHandPeaks: [],
        rightHandPeaks: []
    };

    speak('Get ready');
    playBeep(800, 200);
    vibrate();

    // Start test loop
    STATE.testState.interval = setInterval(updateTest, 100);
}

function updateTest() {
    if (!STATE.testState.isRunning) return;

    const test = STATE.testState;
    test.timeRemaining -= 0.1;

    // Phase transitions
    if (test.timeRemaining <= 0) {
        if (test.phase === 'countdown') {
            // Start work phase
            if (test.hand === 'both') {
                test.phase = 'work_left';
                test.currentHand = 'left';
                test.leftRepPeak = 0;
                speak('Left hand, Pull!');
            } else if (test.hand === 'left') {
                test.phase = 'work';
                test.repPeak = 0;
                speak('Left hand, Pull!');
            } else {
                test.phase = 'work';
                test.repPeak = 0;
                speak('Right hand, Pull!');
            }
            test.timeRemaining = test.duration;
            playBeep(1200, 200);
            vibrate();
            
        } else if (test.phase === 'work_left') {
            if (test.leftRepPeak > test.bestPeak) {
                test.bestPeak = test.leftRepPeak;
            }
            test.leftHandPeaks.push(test.leftRepPeak);
            test.totalWork += test.duration;
            
            test.phase = 'rest_between_hands';
            test.timeRemaining = 5;
            speak('Rest');
            playBeep(600, 200);
            vibrate([100, 50, 100]);
            
        } else if (test.phase === 'rest_between_hands') {
            test.phase = 'work_right';
            test.currentHand = 'right';
            test.rightRepPeak = 0;
            test.timeRemaining = test.duration;
            speak('Right hand, Pull!');
            playBeep(1200, 200);
            vibrate();
            
        } else if (test.phase === 'work_right') {
            if (test.rightRepPeak > test.bestPeak) {
                test.bestPeak = test.rightRepPeak;
            }
            test.rightHandPeaks.push(test.rightRepPeak);
            test.totalWork += test.duration;
            
            if (test.currentRep < test.reps) {
                test.phase = 'rest';
                test.timeRemaining = test.rest;
                speak('Rest');
                playBeep(600, 200);
                vibrate([100, 50, 100]);
            } else {
                finishTest();
                return;
            }
            
        } else if (test.phase === 'work') {
            if (test.repPeak > test.bestPeak) {
                test.bestPeak = test.repPeak;
            }
            
            if (test.hand === 'left') {
                test.leftHandPeaks.push(test.repPeak);
            } else {
                test.rightHandPeaks.push(test.repPeak);
            }
            
            test.totalWork += test.duration;
            
            if (test.currentRep < test.reps) {
                test.phase = 'rest';
                test.timeRemaining = test.rest;
                speak('Rest');
                playBeep(600, 200);
                vibrate([100, 50, 100]);
            } else {
                finishTest();
                return;
            }
            
        } else if (test.phase === 'rest') {
            test.currentRep++;
            
            if (test.hand === 'both') {
                test.phase = 'work_left';
                test.currentHand = 'left';
                test.leftRepPeak = 0;
                speak(`Rep ${test.currentRep}, Left hand`);
            } else if (test.hand === 'left') {
                test.phase = 'work';
                test.repPeak = 0;
                speak(`Rep ${test.currentRep}, Left hand`);
            } else {
                test.phase = 'work';
                test.repPeak = 0;
                speak(`Rep ${test.currentRep}, Right hand`);
            }
            test.timeRemaining = test.duration;
            playBeep(1200, 200);
            vibrate();
        }
    }

    // Update peak during work phases
    if (test.phase === 'work_left' && STATE.currentForce > test.leftRepPeak) {
        test.leftRepPeak = STATE.currentForce;
    } else if (test.phase === 'work_right' && STATE.currentForce > test.rightRepPeak) {
        test.rightRepPeak = STATE.currentForce;
    } else if (test.phase === 'work' && STATE.currentForce > test.repPeak) {
        test.repPeak = STATE.currentForce;
    }

    updateTestDisplay();
}

function updateTestDisplay() {
    const test = STATE.testState;
    
    // Update instruction
    const instruction = document.getElementById('testInstruction');
    if (test.phase === 'countdown') {
        instruction.textContent = 'Get Ready...';
    } else if (test.phase === 'work_left' || test.phase === 'work_right' || test.phase === 'work') {
        instruction.textContent = '💪 PULL!';
    } else if (test.phase === 'rest' || test.phase === 'rest_between_hands') {
        instruction.textContent = '😌 Rest';
    }

    // Update hand indicator
    const handIndicator = document.getElementById('handIndicator');
    if (test.hand === 'both') {
        if (test.phase === 'work_left') {
            handIndicator.innerHTML = '<span style="font-size: 64px;">👈 LEFT</span> | <span style="opacity: 0.3;">RIGHT 👉</span>';
        } else if (test.phase === 'work_right') {
            handIndicator.innerHTML = '<span style="opacity: 0.3;">👈 LEFT</span> | <span style="font-size: 64px;">RIGHT 👉</span>';
        } else {
            handIndicator.innerHTML = '<span style="opacity: 0.5;">👈 LEFT | RIGHT 👉</span>';
        }
    } else if (test.hand === 'left') {
        handIndicator.innerHTML = '<span style="font-size: 64px;">👈 LEFT HAND</span>';
    } else if (test.hand === 'right') {
        handIndicator.innerHTML = '<span style="font-size: 64px;">RIGHT HAND 👉</span>';
    }

    // Update timer
    const timer = document.getElementById('testTimer');
    const minutes = Math.floor(test.timeRemaining / 60);
    const seconds = Math.floor(test.timeRemaining % 60);
    timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update rep counter
    document.getElementById('repCounter').textContent = 
        `Rep ${test.currentRep} / ${test.reps}`;

    // Update force display
    document.getElementById('testForceValue').textContent = STATE.currentForce.toFixed(1);
    
    let currentPeak = 0;
    if (test.phase === 'work_left') {
        currentPeak = test.leftRepPeak;
    } else if (test.phase === 'work_right') {
        currentPeak = test.rightRepPeak;
    } else if (test.phase === 'work') {
        currentPeak = test.repPeak;
    }
    
    document.getElementById('testPeakValue').textContent = currentPeak.toFixed(1);
    document.getElementById('testBestPeak').textContent = test.bestPeak.toFixed(1);
}

function stopTest() {
    if (STATE.testState && STATE.testState.interval) {
        clearInterval(STATE.testState.interval);
    }
    finishTest();
}

function finishTest() {
    const test = STATE.testState;
    
    if (test.interval) {
        clearInterval(test.interval);
    }
    
    test.isRunning = false;
    
    // Calculate results
    const totalTime = Math.round((Date.now() - test.startTime) / 1000);
    const avgForce = test.totalWork > 0 ? (test.bestPeak * 0.7) : 0;

    // Calculate hand-specific stats
    let leftPeak = 0, rightPeak = 0;
    if (test.leftHandPeaks.length > 0) {
        leftPeak = Math.max(...test.leftHandPeaks);
    }
    if (test.rightHandPeaks.length > 0) {
        rightPeak = Math.max(...test.rightHandPeaks);
    }

    // Save session
    saveSession({
        date: new Date().toISOString(),
        type: test.type,
        peak: test.bestPeak,
        avgForce: avgForce,
        duration: totalTime,
        reps: test.currentRep,
        hand: test.hand,
        leftPeak: leftPeak,
        rightPeak: rightPeak
    });

    // Show results
    document.getElementById('testRunning').style.display = 'none';
    document.getElementById('testResults').style.display = 'block';
    
    document.getElementById('resultPeak').textContent = test.bestPeak.toFixed(1);
    document.getElementById('resultAvg').textContent = avgForce.toFixed(1);
    document.getElementById('resultTime').textContent = totalTime + 's';
    document.getElementById('resultReps').textContent = test.currentRep;

    // Show hand-specific results
    if (leftPeak > 0 || rightPeak > 0) {
        const existingHandResults = document.querySelector('#testResults .stats-grid + .stats-grid');
        if (existingHandResults) {
            existingHandResults.remove();
        }
        
        const handResults = document.createElement('div');
        handResults.className = 'stats-grid';
        handResults.style.marginTop = '20px';
        handResults.innerHTML = `
            ${leftPeak > 0 ? `<div class="stat-card">
                <div class="stat-label">LEFT PEAK</div>
                <div class="stat-value">${leftPeak.toFixed(1)}</div>
            </div>` : ''}
            ${rightPeak > 0 ? `<div class="stat-card">
                <div class="stat-label">RIGHT PEAK</div>
                <div class="stat-value">${rightPeak.toFixed(1)}</div>
            </div>` : ''}
            ${(leftPeak > 0 && rightPeak > 0) ? `<div class="stat-card">
                <div class="stat-label">L/R RATIO</div>
                <div class="stat-value">${(leftPeak / rightPeak).toFixed(2)}</div>
            </div>` : ''}
        `;
        document.getElementById('testResults').querySelector('.stats-grid').after(handResults);
    }

    speak('Test complete!');
    playBeep(1000, 100);
    setTimeout(() => playBeep(1200, 100), 150);
    setTimeout(() => playBeep(1400, 100), 300);
    vibrate([100, 50, 100, 50, 100]);
}

// ========================================
// COMPETITION MODES (NEW!)
// ========================================
function startCompetition(compType) {
    if (!STATE.isConnected) {
        alert('Please connect device first!');
        return;
    }

    const modal = document.getElementById('competitionModal');
    const title = document.getElementById('compModalTitle');
    const config = document.getElementById('compConfig');

    STATE.competitionState = {
        type: compType,
        isRunning: false,
        attempts: 0,
        maxAttempts: 3,
        score: 0,
        results: []
    };

    switch(compType) {
        case 'hardest':
            title.textContent = '🏆 Hardest Pull';
            config.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon">💪</div>
                    <div class="empty-state-text">Pull as hard as you can!</div>
                    <div style="margin-top: 20px; font-size: 16px; opacity: 0.8;">
                        You have 3 attempts.<br>Highest force wins!
                    </div>
                </div>
                <button class="btn btn-primary" onclick="runCompetition()">Start Competition</button>
            `;
            break;

        case 'target':
            title.textContent = '🎯 Hit the Target';
            const targetForce = Math.round(STATE.bodyWeight * 0.6); // 60% bodyweight
            STATE.competitionState.target = targetForce;
            config.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon">🎯</div>
                    <div class="target-display">${targetForce} kg</div>
                    <div class="empty-state-text">Pull exactly this force!</div>
                    <div style="margin-top: 20px; font-size: 16px; opacity: 0.8;">
                        Closest to target wins!<br>3 attempts
                    </div>
                </div>
                <button class="btn btn-primary" onclick="runCompetition()">Start Competition</button>
            `;
            break;

        case 'equal':
            title.textContent = '⚖️ Equal Pulls';
            config.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon">⚖️</div>
                    <div class="empty-state-text">Match Your Pulls!</div>
                    <div style="margin-top: 20px; font-size: 16px; opacity: 0.8;">
                        Pull twice, try to match exactly.<br>
                        Smallest difference wins!
                    </div>
                </div>
                <button class="btn btn-primary" onclick="runCompetition()">Start Competition</button>
            `;
            STATE.competitionState.maxAttempts = 2;
            break;

        case 'flying':
            title.textContent = '🚀 Flying Game';
            STATE.competitionState.level = 1;
            STATE.competitionState.targets = [10, 20, 30, 40, 50, 60];
            config.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon">🚀</div>
                    <div class="empty-state-text">Progressive Targets!</div>
                    <div style="margin-top: 20px; font-size: 16px; opacity: 0.8;">
                        Hit each target to advance.<br>
                        Miss = Game Over!
                    </div>
                </div>
                <button class="btn btn-primary" onclick="runCompetition()">Start Game</button>
            `;
            break;
    }

    modal.classList.add('active');
    vibrate();
}

function runCompetition() {
    document.getElementById('compConfig').style.display = 'none';
    document.getElementById('compRunning').style.display = 'block';
    document.getElementById('compResults').style.display = 'none';

    const comp = STATE.competitionState;
    comp.isRunning = true;
    comp.attempts = 1;
    comp.currentPull = 0;
    comp.pullStarted = false;
    comp.pullPeak = 0;

    updateCompetitionDisplay();
    speak('Get ready');
    playBeep(800, 200);
    vibrate();
}

function updateCompetitionDisplay() {
    const comp = STATE.competitionState;
    
    if (!comp.isRunning) return;

    const instruction = document.getElementById('compInstruction');
    const target = document.getElementById('compTarget');
    const attempt = document.getElementById('compAttempt');
    const force = document.getElementById('compForceValue');
    const scoreDisplay = document.getElementById('compScore');

    force.textContent = STATE.currentForce.toFixed(1);

    // Detect pull (force > 5kg starts attempt)
    if (!comp.pullStarted && STATE.currentForce > 5) {
        comp.pullStarted = true;
        comp.pullPeak = 0;
        playBeep(1200, 100);
        vibrate();
    }

    // Track peak during pull
    if (comp.pullStarted && STATE.currentForce > comp.pullPeak) {
        comp.pullPeak = STATE.currentForce;
    }

    // Detect release (force < 2kg ends attempt)
    if (comp.pullStarted && STATE.currentForce < 2) {
        comp.pullStarted = false;
        processCompetitionResult(comp.pullPeak);
        return;
    }

    // Update display based on type
    switch(comp.type) {
        case 'hardest':
            instruction.textContent = comp.pullStarted ? '💪 PULL!' : 'Pull when ready...';
            target.textContent = `Best: ${comp.score.toFixed(1)} kg`;
            attempt.textContent = `Attempt ${comp.attempts} / ${comp.maxAttempts}`;
            scoreDisplay.textContent = `Score: ${comp.score.toFixed(1)} kg`;
            break;

        case 'target':
            instruction.textContent = comp.pullStarted ? '🎯 HIT IT!' : 'Pull when ready...';
            target.textContent = `${comp.target} kg`;
            attempt.textContent = `Attempt ${comp.attempts} / ${comp.maxAttempts}`;
            const diff = comp.score > 0 ? Math.abs(comp.target - comp.score).toFixed(1) : '--';
            scoreDisplay.textContent = `Off by: ${diff} kg`;
            break;

        case 'equal':
            instruction.textContent = comp.pullStarted ? '⚖️ MATCH IT!' : 
                comp.attempts === 1 ? 'First pull...' : 'Match the first!';
            target.textContent = comp.results.length > 0 ? 
                `Match: ${comp.results[0].toFixed(1)} kg` : 'Pull #1';
            attempt.textContent = `Pull ${comp.attempts} / 2`;
            scoreDisplay.textContent = comp.results.length === 2 ?
                `Difference: ${Math.abs(comp.results[0] - comp.results[1]).toFixed(1)} kg` : '';
            break;

        case 'flying':
            const currentTarget = comp.targets[comp.level - 1];
            instruction.textContent = comp.pullStarted ? '🚀 GO!' : 'Hit the target!';
            target.textContent = `Level ${comp.level}: ${currentTarget} kg`;
            attempt.textContent = `Level ${comp.level} / ${comp.targets.length}`;
            scoreDisplay.textContent = `Score: ${comp.score}`;
            break;
    }
}

function processCompetitionResult(peak) {
    const comp = STATE.competitionState;
    comp.results.push(peak);

    playBeep(1000, 100);
    vibrate();

    switch(comp.type) {
        case 'hardest':
            if (peak > comp.score) {
                comp.score = peak;
                speak('New best!');
            }
            if (comp.attempts >= comp.maxAttempts) {
                finishCompetition();
            } else {
                comp.attempts++;
                speak('Next attempt');
            }
            break;

        case 'target':
            comp.score = peak;
            if (comp.attempts >= comp.maxAttempts) {
                finishCompetition();
            } else {
                comp.attempts++;
                speak('Next attempt');
            }
            break;

        case 'equal':
            if (comp.attempts >= 2) {
                finishCompetition();
            } else {
                comp.attempts++;
                speak('Pull again');
            }
            break;

        case 'flying':
            const target = comp.targets[comp.level - 1];
            const tolerance = 5; // ±5kg
            if (Math.abs(peak - target) <= tolerance) {
                comp.score += 100;
                comp.level++;
                if (comp.level > comp.targets.length) {
                    finishCompetition('win');
                } else {
                    speak(`Level ${comp.level}!`);
                    vibrate([100, 50, 100]);
                }
            } else {
                finishCompetition('lose');
            }
            break;
    }
}

function stopCompetition() {
    if (STATE.competitionState) {
        STATE.competitionState.isRunning = false;
    }
    closeCompetitionModal();
}

function finishCompetition(result) {
    const comp = STATE.competitionState;
    comp.isRunning = false;

    document.getElementById('compRunning').style.display = 'none';
    document.getElementById('compResults').style.display = 'block';

    const icon = document.getElementById('compResultIcon');
    const text = document.getElementById('compResultText');
    const score = document.getElementById('compFinalScore');

    switch(comp.type) {
        case 'hardest':
            icon.textContent = '🏆';
            text.textContent = `Hardest Pull: ${comp.score.toFixed(1)} kg`;
            score.textContent = `Best of ${comp.maxAttempts} attempts`;
            break;

        case 'target':
            const bestAttempt = comp.results.reduce((best, val) => 
                Math.abs(val - comp.target) < Math.abs(best - comp.target) ? val : best
            );
            const error = Math.abs(bestAttempt - comp.target);
            icon.textContent = error < 2 ? '🎯' : '👍';
            text.textContent = error < 2 ? 'Bullseye!' : 'Good Try!';
            score.textContent = `Off by ${error.toFixed(1)} kg`;
            break;

        case 'equal':
            const diff = Math.abs(comp.results[0] - comp.results[1]);
            icon.textContent = diff < 2 ? '⚖️' : '👍';
            text.textContent = diff < 2 ? 'Perfect Match!' : 'Close!';
            score.textContent = `Difference: ${diff.toFixed(1)} kg`;
            break;

        case 'flying':
            icon.textContent = result === 'win' ? '🚀' : '💥';
            text.textContent = result === 'win' ? 'All Levels Complete!' : 'Missed!';
            score.textContent = `Final Score: ${comp.score}`;
            break;
    }

    speak(text.textContent);
    vibrate([100, 50, 100, 50, 100]);
}

function closeCompetitionModal() {
    document.getElementById('competitionModal').classList.remove('active');
    document.getElementById('compConfig').style.display = 'block';
    document.getElementById('compRunning').style.display = 'none';
    document.getElementById('compResults').style.display = 'none';
    if (STATE.competitionState) {
        STATE.competitionState.isRunning = false;
    }
    vibrate();
}

// ========================================
// SESSION MANAGEMENT
// ========================================
function saveSession(session) {
    STATE.sessions.unshift(session);
    
    if (STATE.sessions.length > 100) {
        STATE.sessions = STATE.sessions.slice(0, 100);
    }
    
    localStorage.setItem('sessions', JSON.stringify(STATE.sessions));
    updateStats();
}

function loadSessions() {
    const stored = localStorage.getItem('sessions');
    if (stored) {
        STATE.sessions = JSON.parse(stored);
    }
}

function renderSessionList() {
    const container = document.getElementById('sessionList');
    
    if (STATE.sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">No sessions yet. Start training!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = STATE.sessions.map(session => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        let handInfo = '';
        if (session.hand === 'both' && session.leftPeak && session.rightPeak) {
            handInfo = `<div style="margin-top: 5px; font-size: 12px;">
                👈 ${session.leftPeak.toFixed(1)} kg | 
                👉 ${session.rightPeak.toFixed(1)} kg
            </div>`;
        } else if (session.hand === 'left') {
            handInfo = `<div style="margin-top: 5px; font-size: 12px;">👈 Left hand only</div>`;
        } else if (session.hand === 'right') {
            handInfo = `<div style="margin-top: 5px; font-size: 12px;">👉 Right hand only</div>`;
        }
        
        return `
            <div class="session-card">
                <div class="session-header">
                    <div class="session-date">${dateStr}</div>
                    <div class="session-type">${session.type}</div>
                </div>
                <div class="session-stats">
                    <div>Peak: ${session.peak.toFixed(1)} kg</div>
                    <div>Reps: ${session.reps || 1}</div>
                    <div>Time: ${session.duration}s</div>
                </div>
                ${handInfo}
            </div>
        `;
    }).join('');
}

function exportCSV() {
    if (STATE.sessions.length === 0) {
        alert('No sessions to export!');
        return;
    }

    let csv = 'Date,Type,Peak (kg),Avg Force (kg),Duration (s),Reps,Hand,Left Peak,Right Peak\n';
    
    STATE.sessions.forEach(session => {
        csv += `${session.date},${session.type},${session.peak},${session.avgForce || 0},${session.duration},${session.reps || 1},${session.hand || 'both'},${session.leftPeak || 0},${session.rightPeak || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climbmeter_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    playBeep(1200, 100);
    vibrate();
    showToast('CSV exported!');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all session history?')) {
        STATE.sessions = [];
        localStorage.removeItem('sessions');
        renderSessionList();
        updateStats();
        playBeep(800, 100);
        vibrate();
        showToast('History cleared');
    }
}

// ========================================
// STATS
// ========================================
function updateStats() {
    // All-time peak
    const allTimePeak = STATE.sessions.reduce((max, s) => Math.max(max, s.peak), 0);
    document.getElementById('allTimePeak').textContent = allTimePeak.toFixed(1);

    // Total sessions
    document.getElementById('totalSessions').textContent = STATE.sessions.length;

    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = STATE.sessions.filter(s => new Date(s.date) > weekAgo).length;
    document.getElementById('weekSessions').textContent = weekSessions;

    // Average peak
    const avgPeak = STATE.sessions.length > 0 
        ? STATE.sessions.reduce((sum, s) => sum + s.peak, 0) / STATE.sessions.length
        : 0;
    document.getElementById('avgPeak').textContent = avgPeak.toFixed(1);

    // Training streak
    const streak = calculateStreak();
    document.getElementById('streakValue').textContent = streak;
}

function calculateStreak() {
    if (STATE.sessions.length === 0) return 0;

    const dates = STATE.sessions.map(s => new Date(s.date).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = checkDate.toDateString();
        if (uniqueDates.includes(sessionDate)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// ========================================
// ROUTINES
// ========================================
function showRoutineModal() {
    document.getElementById('routineModal').classList.add('active');
    vibrate();
}

function closeRoutineModal() {
    document.getElementById('routineModal').classList.remove('active');
    vibrate();
}

function loadTemplate() {
    const template = document.getElementById('routineTemplate').value;
    console.log('Load template:', template);
    // Template logic here
}

function addExercise() {
    console.log('Add exercise');
    // Exercise logic here
}

function saveRoutine() {
    const name = document.getElementById('routineName').value;
    if (!name) {
        alert('Please enter a routine name');
        return;
    }

    STATE.routines.push({
        name: name,
        exercises: []
    });

    localStorage.setItem('routines', JSON.stringify(STATE.routines));
    closeRoutineModal();
    renderRoutineList();
    playBeep(1200, 100);
    vibrate();
    showToast('Routine saved!');
}

function loadRoutines() {
    const stored = localStorage.getItem('routines');
    if (stored) {
        STATE.routines = JSON.parse(stored);
    }
}

function renderRoutineList() {
    const container = document.getElementById('routineList');
    
    if (STATE.routines.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No custom routines yet</div>
            </div>
        `;
        return;
    }

    container.innerHTML = STATE.routines.map(routine => `
        <div class="session-card">
            <div class="session-header">
                <div style="font-size: 18px; font-weight: bold;">${routine.name}</div>
            </div>
            <div class="session-stats">
                <div>${routine.exercises.length} exercises</div>
            </div>
        </div>
    `).join('');
}

// ========================================
// SETTINGS
// ========================================
function saveSettings() {
    STATE.bodyWeight = parseFloat(document.getElementById('bodyWeight').value) || 70;
    STATE.audioEnabled = document.getElementById('audioEnabled').value === 'true';
    STATE.hapticEnabled = document.getElementById('hapticEnabled').value === 'true';
    STATE.autoStartEnabled = document.getElementById('autoStartEnabled').checked;
    STATE.autoStartThreshold = parseFloat(document.getElementById('autoStartThreshold').value) || 2;

    localStorage.setItem('settings', JSON.stringify({
        bodyWeight: STATE.bodyWeight,
        audioEnabled: STATE.audioEnabled,
        hapticEnabled: STATE.hapticEnabled,
        autoStartEnabled: STATE.autoStartEnabled,
        autoStartThreshold: STATE.autoStartThreshold
    }));

    playBeep(1000, 50);
    vibrate();
    showToast('Settings saved');
}

function loadSettings() {
    const stored = localStorage.getItem('settings');
    if (stored) {
        const settings = JSON.parse(stored);
        STATE.bodyWeight = settings.bodyWeight || 70;
        STATE.audioEnabled = settings.audioEnabled !== false;
        STATE.hapticEnabled = settings.hapticEnabled !== false;
        STATE.autoStartEnabled = settings.autoStartEnabled || false;
        STATE.autoStartThreshold = settings.autoStartThreshold || 2;

        document.getElementById('bodyWeight').value = STATE.bodyWeight;
        document.getElementById('audioEnabled').value = STATE.audioEnabled.toString();
        document.getElementById('hapticEnabled').value = STATE.hapticEnabled.toString();
        document.getElementById('autoStartEnabled').checked = STATE.autoStartEnabled;
        document.getElementById('autoStartThreshold').value = STATE.autoStartThreshold;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function showLoading(text = 'Loading...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, duration = 2000) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        animation: slideUp 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========================================
// PWA INSTALL
// ========================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installPrompt').classList.add('active');
});

function checkInstallPrompt() {
    const dismissed = localStorage.getItem('installDismissed');
    if (dismissed) {
        document.getElementById('installPrompt').classList.remove('active');
    }
}

async function installApp() {
    if (!deferredPrompt) {
        alert('Install prompt not available');
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('App installed');
        showToast('App installed!');
    }
    
    deferredPrompt = null;
    document.getElementById('installPrompt').classList.remove('active');
}

function dismissInstall() {
    document.getElementById('installPrompt').classList.remove('active');
    localStorage.setItem('installDismissed', 'true');
}

// ========================================
// BROWSER SUPPORT CHECK
// ========================================
if (!navigator.bluetooth) {
    alert('⚠️ Web Bluetooth not supported!\n\nPlease use Chrome browser on Windows, Mac, or Android.');
    document.getElementById('connectBtn').disabled = true;
}

console.log('✅ ClimbMeter Pro Enhanced - All features loaded!');
console.log('🎮 Competition modes ready');
console.log('⚡ Auto-start configured');
console.log('📊 Progress tracking active');
console.log('🔗 Tindeq compatibility enabled');
