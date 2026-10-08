/**
 * AI Golf Shot & Course Strategy Planner – STRIPS / Goal-Stack Controller with Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let state = {
        rows: 4,
        cols: 5,
        start: [1, 1],
        goal: [4, 5],
        obstacles: [
            [1, 4],
            [2, 2],
            [2, 4],
            [4, 1],
            [4, 3]
        ],
        clickMode: 'obstacle', // 'obstacle', 'start', 'goal'
        currentPlan: null,
        simStepIndex: 0,
        simTimer: null,
        simSpeed: 400,
        isSimulating: false
    };

    // --- DOM Elements ---
    const gridBoard = document.getElementById('grid-board');
    const inputRows = document.getElementById('grid-rows');
    const inputCols = document.getElementById('grid-cols');
    const inputStartR = document.getElementById('start-r');
    const inputStartC = document.getElementById('start-c');
    const inputGoalR = document.getElementById('goal-r');
    const inputGoalC = document.getElementById('goal-c');

    const btnApplyGrid = document.getElementById('btn-update-grid');
    const btnGenerate = document.getElementById('btn-generate');
    const btnExample = document.getElementById('btn-example');
    const btnReset = document.getElementById('btn-reset');

    const btnRun = document.getElementById('btn-run');
    const btnPause = document.getElementById('btn-pause');
    const btnStepNext = document.getElementById('btn-step-next');
    const btnStepPrev = document.getElementById('btn-step-prev');
    const btnRestart = document.getElementById('btn-restart');
    const speedSlider = document.getElementById('speed-slider');

    const statusBadge = document.getElementById('grid-status-badge');
    const summaryInitial = document.getElementById('summary-initial');
    const summaryGoal = document.getElementById('summary-goal');
    const summaryDistance = document.getElementById('summary-distance');
    const summaryCurrentAction = document.getElementById('summary-current-action');
    const summaryStatus = document.getElementById('summary-status');

    const goalStackContainer = document.getElementById('goal-stack-container');
    const planListContainer = document.getElementById('plan-list-container');
    const stepCountBadge = document.getElementById('step-count-badge');
    const modeButtons = document.querySelectorAll('.mode-btn');

    // --- Custom Interactive Cursor Physics ---
    initCyberCursor();

    function initCyberCursor() {
        const dot = document.getElementById('cursor-dot');
        const follower = document.getElementById('cursor-follower');

        if (!dot || !follower) return;

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        });

        function animateCursor() {
            followerX += (mouseX - followerX) * 0.18;
            followerY += (mouseY - followerY) * 0.18;
            follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        window.addEventListener('mousedown', () => follower.classList.add('active-click'));
        window.addEventListener('mouseup', () => follower.classList.remove('active-click'));

        attachCursorEvents();
    }

    function attachCursorEvents() {
        const follower = document.getElementById('cursor-follower');
        if (!follower) return;

        const targets = document.querySelectorAll('button, input, .grid-cell, .mode-btn, .interactive-target, .step-card, .concept-box');
        targets.forEach(target => {
            target.removeEventListener('mouseenter', onTargetHover);
            target.removeEventListener('mouseleave', onTargetLeave);

            target.addEventListener('mouseenter', onTargetHover);
            target.addEventListener('mouseleave', onTargetLeave);
        });

        function onTargetHover() {
            follower.classList.add('hovered');
        }
        function onTargetLeave() {
            follower.classList.remove('hovered');
        }
    }

    // --- Event Listeners Initialization ---
    initEvents();
    renderGrid();
    updateInputFields();

    function initEvents() {
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.clickMode = btn.getAttribute('data-mode');
            });
        });

        btnApplyGrid.addEventListener('click', () => {
            const r = parseInt(inputRows.value) || 4;
            const c = parseInt(inputCols.value) || 5;

            state.rows = Math.max(2, Math.min(15, r));
            state.cols = Math.max(2, Math.min(15, c));

            if (state.start[0] > state.rows) state.start[0] = state.rows;
            if (state.start[1] > state.cols) state.start[1] = state.cols;
            if (state.goal[0] > state.rows) state.goal[0] = state.rows;
            if (state.goal[1] > state.cols) state.goal[1] = state.cols;

            state.obstacles = state.obstacles.filter(obs => obs[0] <= state.rows && obs[1] <= state.cols);

            updateInputFields();
            resetPlanState();
            renderGrid();
        });

        [inputStartR, inputStartC].forEach(el => {
            el.addEventListener('change', () => {
                state.start = [parseInt(inputStartR.value) || 1, parseInt(inputStartC.value) || 1];
                resetPlanState();
                renderGrid();
            });
        });

        [inputGoalR, inputGoalC].forEach(el => {
            el.addEventListener('change', () => {
                state.goal = [parseInt(inputGoalR.value) || 1, parseInt(inputGoalC.value) || 1];
                resetPlanState();
                renderGrid();
            });
        });

        btnGenerate.addEventListener('click', generatePlan);
        btnExample.addEventListener('click', loadExample);
        btnReset.addEventListener('click', resetGrid);

        btnRun.addEventListener('click', startSimulation);
        btnPause.addEventListener('click', pauseSimulation);
        btnStepNext.addEventListener('click', stepNext);
        btnStepPrev.addEventListener('click', stepPrev);
        btnRestart.addEventListener('click', restartSimulation);

        speedSlider.addEventListener('input', (e) => {
            state.simSpeed = 1100 - parseInt(e.target.value);
            if (state.isSimulating) {
                pauseSimulation();
                startSimulation();
            }
        });
    }

    // --- Golf Grid Rendering ---
    function renderGrid() {
        gridBoard.style.gridTemplateRows = `repeat(${state.rows}, 68px)`;
        gridBoard.style.gridTemplateColumns = `repeat(${state.cols}, 68px)`;
        gridBoard.innerHTML = '';

        for (let r = 1; r <= state.rows; r++) {
            for (let c = 1; c <= state.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell interactive-target';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.style.animationDelay = `${(r * 0.05) + (c * 0.02)}s`;

                const coord = document.createElement('span');
                coord.className = 'cell-coord';
                coord.textContent = `${r},${c}`;
                cell.appendChild(coord);

                const isStart = state.start[0] === r && state.start[1] === c;
                const isGoal = state.goal[0] === r && state.goal[1] === c;
                const isObstacle = state.obstacles.some(o => o[0] === r && o[1] === c);

                const iconSpan = document.createElement('span');
                iconSpan.className = 'cell-icon';

                let currentSimPos = null;
                if (state.currentPlan && state.currentPlan.path && state.currentPlan.path.length > 0) {
                    currentSimPos = state.currentPlan.path[state.simStepIndex];
                }

                const isActiveGolfer = currentSimPos && currentSimPos[0] === r && currentSimPos[1] === c;

                if (isActiveGolfer) {
                    cell.classList.add('cell-active');
                    iconSpan.textContent = '🏌️';
                } else if (isObstacle) {
                    cell.classList.add('cell-obstacle');
                    iconSpan.textContent = '🌲';
                } else if (isStart) {
                    cell.classList.add('cell-start');
                    iconSpan.textContent = '🏌️';
                } else if (isGoal) {
                    cell.classList.add('cell-goal');
                    iconSpan.textContent = '🚩';
                }

                // Planned golf stroke path
                if (state.currentPlan && state.currentPlan.path) {
                    const pathIndex = state.currentPlan.path.findIndex(p => p[0] === r && p[1] === c);
                    if (pathIndex >= 0 && !isObstacle) {
                        if (!isActiveGolfer && !isStart && !isGoal) {
                            cell.classList.add('cell-path');
                        }
                        if (pathIndex > 0) {
                            const badge = document.createElement('span');
                            badge.className = 'path-step-badge';
                            badge.textContent = `${pathIndex * 10}m`;
                            cell.appendChild(badge);
                        }
                    }
                }

                cell.appendChild(iconSpan);
                cell.addEventListener('click', () => handleCellClick(r, c));

                gridBoard.appendChild(cell);
            }
        }

        summaryInitial.textContent = `GolfBall at (${state.start[0]},${state.start[1]})`;
        summaryGoal.textContent = `Target at (${state.goal[0]},${state.goal[1]})`;
        if (summaryDistance) {
            summaryDistance.textContent = state.currentPlan ? `${state.currentPlan.total_distance_meters || 0} Meters` : '0 Meters';
        }

        attachCursorEvents();
    }

    function handleCellClick(r, c) {
        if (state.isSimulating) return;

        if (state.clickMode === 'obstacle') {
            if ((r === state.start[0] && c === state.start[1]) || (r === state.goal[0] && c === state.goal[1])) {
                return;
            }
            const existingIdx = state.obstacles.findIndex(o => o[0] === r && o[1] === c);
            if (existingIdx >= 0) {
                state.obstacles.splice(existingIdx, 1);
            } else {
                state.obstacles.push([r, c]);
            }
        } else if (state.clickMode === 'start') {
            state.obstacles = state.obstacles.filter(o => !(o[0] === r && o[1] === c));
            state.start = [r, c];
            updateInputFields();
        } else if (state.clickMode === 'goal') {
            state.obstacles = state.obstacles.filter(o => !(o[0] === r && o[1] === c));
            state.goal = [r, c];
            updateInputFields();
        }

        resetPlanState();
        renderGrid();
    }

    function updateInputFields() {
        inputRows.value = state.rows;
        inputCols.value = state.cols;
        inputStartR.value = state.start[0];
        inputStartC.value = state.start[1];
        inputGoalR.value = state.goal[0];
        inputGoalC.value = state.goal[1];
    }

    function resetPlanState() {
        pauseSimulation();
        state.currentPlan = null;
        state.simStepIndex = 0;

        summaryCurrentAction.textContent = '-';
        if (summaryDistance) summaryDistance.textContent = '0 Meters';
        summaryStatus.textContent = 'Ready';
        summaryStatus.className = 'status-tag';

        statusBadge.className = 'status-badge badge-ready';
        statusBadge.innerHTML = '<i class="fa-solid fa-circle-info"></i> Ready to compute';

        stepCountBadge.textContent = '0 Strokes';
        goalStackContainer.innerHTML = '<div class="stack-empty">Stack empty. Click "Calculate Shot Strategy" to inspect STRIPS stack.</div>';
        planListContainer.innerHTML = '<div class="plan-placeholder">No shot plan generated yet. Select course hazards and click "Calculate Shot Strategy".</div>';

        btnRun.disabled = true;
        btnPause.disabled = true;
        btnStepNext.disabled = true;
        btnStepPrev.disabled = true;
        btnRestart.disabled = true;
    }

    // --- API Calls ---
    async function generatePlan() {
        resetPlanState();

        statusBadge.className = 'status-badge badge-ready';
        statusBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating shots...';
        summaryStatus.textContent = 'Calculating...';

        try {
            const response = await fetch('/api/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rows: state.rows,
                    cols: state.cols,
                    start: state.start,
                    goal: state.goal,
                    obstacles: state.obstacles
                })
            });

            const data = await response.json();

            if (data.success) {
                state.currentPlan = data;
                renderPlanResults(data);
                renderGrid();
            } else {
                statusBadge.className = 'status-badge badge-error';
                statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${data.message}`;
                summaryStatus.textContent = 'No Path Found';
                summaryStatus.className = 'status-tag text-rose';

                planListContainer.innerHTML = `
                    <div class="step-card" style="border-color: var(--accent-rose);">
                        <div class="step-title" style="color: var(--accent-rose);">
                            <i class="fa-solid fa-circle-xmark"></i> Strategy Blocked
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">
                            ${data.message}
                        </p>
                    </div>
                `;
            }
        } catch (err) {
            statusBadge.className = 'status-badge badge-error';
            statusBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Server Error`;
            console.error(err);
        }
    }

    async function loadExample() {
        try {
            const response = await fetch('/api/example');
            const example = await response.json();

            state.rows = example.rows;
            state.cols = example.cols;
            state.start = example.start;
            state.goal = example.goal;
            state.obstacles = example.obstacles;

            updateInputFields();
            renderGrid();
            generatePlan();
        } catch (err) {
            console.error(err);
        }
    }

    function resetGrid() {
        state.obstacles = [];
        resetPlanState();
        renderGrid();
    }

    // --- Render Plan & Goal Stack Results ---
    function renderPlanResults(data) {
        if (data.already_at_goal) {
            statusBadge.className = 'status-badge badge-success';
            statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Ball in Hole! ⛳';
            summaryStatus.textContent = 'Hole in One!';
            planListContainer.innerHTML = '<div class="plan-placeholder">Golf ball is already in the target hole.</div>';
            triggerCelebrationConfetti();
            return;
        }

        const dist = data.total_distance_meters || (data.steps.length * 10);
        statusBadge.className = 'status-badge badge-success';
        statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Strategy Found (${data.steps.length} Strokes, ${dist}m)`;
        summaryStatus.textContent = 'Strategy Generated';

        stepCountBadge.textContent = `${data.steps.length} Strokes (${dist}m)`;
        if (summaryDistance) summaryDistance.textContent = `${dist} Meters`;

        planListContainer.innerHTML = '';
        data.steps.forEach((step, idx) => {
            const card = document.createElement('div');
            card.className = 'step-card interactive-target';
            card.id = `step-card-${idx}`;

            const preconditionsHtml = step.preconditions.map(p => `
                <div class="precond-item">
                    <i class="fa-solid fa-check satisfied"></i>
                    <span>${p.description}</span>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="step-header">
                    <span class="step-title"><i class="fa-solid fa-golf-ball-tee"></i> ${step.action} (10m)</span>
                    <span class="step-num">Stroke ${step.step_number}</span>
                </div>
                <div class="precond-list">
                    ${preconditionsHtml}
                </div>
                <div class="effect-box">
                    <strong>Effects:</strong> Leaves (${step.from_pos[0]},${step.from_pos[1]}) → Advances 10m to (${step.to_pos[0]},${step.to_pos[1]})
                </div>
            `;

            planListContainer.appendChild(card);
        });

        btnRun.disabled = false;
        btnStepNext.disabled = false;
        btnRestart.disabled = false;

        if (data.steps.length > 0) {
            updateGoalStackUI(data.steps[0].stack_snapshot);
        }

        attachCursorEvents();
    }

    function updateGoalStackUI(snapshot) {
        if (!snapshot || snapshot.length === 0) return;
        goalStackContainer.innerHTML = '';
        snapshot.slice().reverse().forEach(item => {
            const el = document.createElement('div');
            el.className = 'stack-item';
            if (item.startsWith('STROKE:') || item.startsWith('ACTION:')) {
                el.classList.add('action-item');
                el.innerHTML = `<i class="fa-solid fa-golf-ball-tee"></i> ${item}`;
            } else {
                el.innerHTML = `<i class="fa-solid fa-bullseye"></i> ${item}`;
            }
            goalStackContainer.appendChild(el);
        });
    }

    // --- Simulation Controller ---
    function startSimulation() {
        if (!state.currentPlan || !state.currentPlan.path) return;
        state.isSimulating = true;
        btnRun.disabled = true;
        btnPause.disabled = false;
        btnStepNext.disabled = false;
        btnStepPrev.disabled = false;

        state.simTimer = setInterval(() => {
            if (state.simStepIndex < state.currentPlan.steps.length) {
                state.simStepIndex++;
                updateSimulationUI();
            } else {
                pauseSimulation();
                statusBadge.className = 'status-badge badge-success';
                statusBadge.innerHTML = '🎉 Ball in Hole!';
                summaryStatus.textContent = 'Target Reached!';
                triggerCelebrationConfetti();
            }
        }, state.simSpeed);
    }

    function pauseSimulation() {
        state.isSimulating = false;
        if (state.simTimer) clearInterval(state.simTimer);
        btnRun.disabled = false;
        btnPause.disabled = true;
    }

    function stepNext() {
        if (!state.currentPlan || state.simStepIndex >= state.currentPlan.steps.length) return;
        state.simStepIndex++;
        updateSimulationUI();
        if (state.simStepIndex === state.currentPlan.steps.length) {
            triggerCelebrationConfetti();
        }
    }

    function stepPrev() {
        if (!state.currentPlan || state.simStepIndex <= 0) return;
        state.simStepIndex--;
        updateSimulationUI();
    }

    function restartSimulation() {
        pauseSimulation();
        state.simStepIndex = 0;
        updateSimulationUI();
    }

    function updateSimulationUI() {
        renderGrid();

        const steps = state.currentPlan ? state.currentPlan.steps : [];

        document.querySelectorAll('.step-card').forEach(c => c.classList.remove('active-step'));

        if (state.simStepIndex > 0 && state.simStepIndex <= steps.length) {
            const currStep = steps[state.simStepIndex - 1];
            summaryCurrentAction.textContent = currStep.action;

            const card = document.getElementById(`step-card-${state.simStepIndex - 1}`);
            if (card) {
                card.classList.add('active-step');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            updateGoalStackUI(currStep.stack_snapshot);
            summaryStatus.textContent = `Executing Stroke ${state.simStepIndex}/${steps.length} (${state.simStepIndex * 10}m)`;
        } else if (state.simStepIndex === 0) {
            summaryCurrentAction.textContent = '-';
            summaryStatus.textContent = 'Ready to hit';
            if (steps.length > 0) updateGoalStackUI(steps[0].stack_snapshot);
        } else {
            summaryCurrentAction.textContent = 'HOLE IN ONE! ⛳';
            summaryStatus.textContent = 'Target Reached!';
            updateGoalStackUI([`SATISFIED: At(GolfBall, (${state.goal[0]},${state.goal[1]}))`]);
        }
    }

    // --- Celebration Confetti Trigger ---
    function triggerCelebrationConfetti() {
        const container = document.getElementById('celebration-overlay');
        if (!container) return;
        container.innerHTML = '';

        const colors = ['#10b981', '#34d399', '#38bdf8', '#f59e0b', '#c084fc', '#ffffff'];

        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            p.style.left = `${Math.random() * 100}vw`;
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDelay = `${Math.random() * 0.4}s`;
            p.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(p);
        }

        setTimeout(() => {
            container.innerHTML = '';
        }, 3500);
    }
});
