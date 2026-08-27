/* ==========================================================================
   DDLS - 800L Water Tank Digital Display Level System (JavaScript Controller)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const clockDisplay = document.getElementById('clockDisplay');
    const alertBanner = document.getElementById('alertBanner');
    const alertBannerTitle = document.getElementById('alertBannerTitle');
    const alertBannerMessage = document.getElementById('alertBannerMessage');
    const btnMuteSound = document.getElementById('btnMuteSound');
    const btnDismissAlert = document.getElementById('btnDismissAlert');

    // Tank Graphic Elements
    const liquidBody = document.getElementById('liquidBody');
    const thresholdLine = document.getElementById('thresholdLine');
    const thresholdLabel = document.getElementById('thresholdLabel');
    const surfaceVolumeBadge = document.getElementById('surfaceVolumeBadge');
    const inflowStream = document.getElementById('inflowWaterStream');
    const outflowStream = document.getElementById('outflowWaterStream');

    // Division Nodes
    const node200 = document.getElementById('node200');
    const node400 = document.getElementById('node400');
    const node600 = document.getElementById('node600');
    const node800 = document.getElementById('node800');

    // Metrics Elements
    const metricLevel = document.getElementById('metricLevel');
    const metricPercent = document.getElementById('metricPercent');
    const metricLimit = document.getElementById('metricLimit');
    const metricLimitSub = document.getElementById('metricLimitSub');
    const stateText = document.getElementById('stateText');
    const stateSub = document.getElementById('stateSub');
    const stateIcon = document.getElementById('stateIcon');

    // Controls Elements
    const limitForm = document.getElementById('limitForm');
    const inputAlertLimit = document.getElementById('inputAlertLimit');
    const levelSlider = document.getElementById('levelSlider');

    const btnInflow = document.getElementById('btnInflow');
    const btnOutflow = document.getElementById('btnOutflow');
    const btnStopPumps = document.getElementById('btnStopPumps');

    // Sound alert toggle state
    let isSoundMuted = false;
    let isAlertDismissed = false;
    let audioCtx = null;
    let lastAlertState = false;

    // Live Clock Update
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toLocaleTimeString();
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Sound Generator using Web Audio API
    function playBeepSound() {
        if (isSoundMuted) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.log('Web Audio play error:', e);
        }
    }

    // Main Function to Fetch and Render Flask Tank Status
    async function fetchTankStatus() {
        try {
            const res = await fetch('/api/status');
            if (!res.ok) return;
            const data = await res.json();
            renderTankUI(data);
        } catch (err) {
            console.error('Error fetching tank status:', err);
        }
    }

    // Render Tank Graphics & System Metrics
    function renderTankUI(data) {
        const current = data.current_level;
        const limit = data.alert_limit;
        const total = data.total_capacity; // 800
        const percentage = data.percentage; // 0..100
        const isAlert = data.is_alert;

        // 1. Update Tank Liquid Height & Color
        liquidBody.style.height = `${percentage}%`;
        surfaceVolumeBadge.textContent = `${current.toFixed(1)} L`;

        if (isAlert) {
            liquidBody.className = 'liquid-body alert-state';
        } else if (current >= (limit * 0.85)) {
            liquidBody.className = 'liquid-body warning-state';
        } else {
            liquidBody.className = 'liquid-body';
        }

        // 2. Update Dynamic Threshold Line Position
        const thresholdPercent = (limit / total) * 100.0;
        thresholdLine.style.bottom = `${thresholdPercent}%`;
        thresholdLabel.textContent = `ALERT LIMIT: ${limit.toFixed(0)}L`;

        // 3. Update Metrics Display
        metricLevel.textContent = current.toFixed(1);
        metricPercent.textContent = `${percentage.toFixed(1)}% Full`;
        metricLimit.textContent = limit.toFixed(0);
        metricLimitSub.textContent = `Alert triggers \u2265 ${limit.toFixed(0)}L`;

        // 4. Division Nodes Status (200L, 400L, 600L, 800L)
        updateNode(node200, current >= 200, isAlert && current >= 200);
        updateNode(node400, current >= 400, isAlert && current >= 400);
        updateNode(node600, current >= 600, isAlert && current >= 600);
        updateNode(node800, current >= 800, isAlert && current >= 800);

        // 5. Update Controls UI without disrupting active typing
        if (document.activeElement !== inputAlertLimit) {
            inputAlertLimit.value = limit;
        }
        if (document.activeElement !== levelSlider) {
            levelSlider.value = current;
        }

        // Update active class on preset buttons
        document.querySelectorAll('.btn-preset').forEach(btn => {
            const btnLimit = parseFloat(btn.dataset.limit);
            if (btnLimit === limit) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('.btn-level').forEach(btn => {
            const btnLevel = parseFloat(btn.dataset.level);
            if (btnLevel === current) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 6. Update Pump Stream Animations
        if (data.inflow_active) {
            inflowStream.classList.remove('hidden');
            outflowStream.classList.add('hidden');
            btnInflow.classList.add('active');
            btnOutflow.classList.remove('active');
        } else if (data.outflow_active) {
            outflowStream.classList.remove('hidden');
            inflowStream.classList.add('hidden');
            btnOutflow.classList.add('active');
            btnInflow.classList.remove('active');
        } else {
            inflowStream.classList.add('hidden');
            outflowStream.classList.add('hidden');
            btnInflow.classList.remove('active');
            btnOutflow.classList.remove('active');
        }

        // 7. System Status Card Text & Alert Banner Logic
        if (isAlert) {
            stateText.textContent = 'ALERT!';
            stateText.className = 'metric-value text-danger';
            stateSub.textContent = `Limit (${limit}L) Exceeded`;
            stateIcon.textContent = '🚨';

            if (!isAlertDismissed) {
                alertBanner.classList.remove('hidden');
                alertBannerTitle.textContent = `HIGH WATER LEVEL ALERT TRIGGERED (${current.toFixed(0)}L)`;
                alertBannerMessage.textContent = `Water volume (${current.toFixed(1)} Ltrs) reached or exceeded set alert threshold (${limit.toFixed(0)} Ltrs)!`;
            }

            // Play sound alert when entering alert state
            if (!lastAlertState) {
                playBeepSound();
            }
        } else {
            stateText.textContent = 'SAFE';
            stateText.className = 'metric-value text-success';
            stateSub.textContent = 'Normal Operation';
            stateIcon.textContent = '🛡️';

            alertBanner.classList.add('hidden');
            isAlertDismissed = false; // Reset dismissal when falling back below limit
        }

        lastAlertState = isAlert;
    }

    function updateNode(nodeElem, isActive, isAlert) {
        if (!nodeElem) return;
        if (isActive) {
            nodeElem.classList.add('active');
        } else {
            nodeElem.classList.remove('active');
        }
        if (isAlert) {
            nodeElem.classList.add('alert-triggered');
        } else {
            nodeElem.classList.remove('alert-triggered');
        }
    }

    // API Post Helper
    async function postData(url, body) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.status) renderTankUI(data.status);
        } catch (err) {
            console.error(`Error posting to ${url}:`, err);
        }
    }

    // Event Listeners for Controls
    
    // 1. Submit Custom Threshold Form
    limitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const limitVal = parseFloat(inputAlertLimit.value);
        if (!isNaN(limitVal)) {
            isAlertDismissed = false;
            postData('/api/set_limit', { limit: limitVal });
        }
    });

    // 2. Click Quick Threshold Preset Buttons (e.g., 200L, 400L, 600L, 800L)
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const limitVal = parseFloat(btn.dataset.limit);
            if (!isNaN(limitVal)) {
                inputAlertLimit.value = limitVal;
                isAlertDismissed = false;
                postData('/api/set_limit', { limit: limitVal });
            }
        });
    });

    // 3. Manual Slider Level Control
    levelSlider.addEventListener('input', (e) => {
        const levelVal = parseFloat(e.target.value);
        surfaceVolumeBadge.textContent = `${levelVal.toFixed(1)} L`;
        postData('/api/set_level', { level: levelVal });
    });

    // 4. Click Preset Level Buttons (0L, 200L, 400L, 600L, 800L)
    document.querySelectorAll('.btn-level').forEach(btn => {
        btn.addEventListener('click', () => {
            const levelVal = parseFloat(btn.dataset.level);
            if (!isNaN(levelVal)) {
                levelSlider.value = levelVal;
                postData('/api/set_level', { level: levelVal });
            }
        });
    });

    // 5. Automated Pump Buttons (Fill / Drain / Stop)
    btnInflow.addEventListener('click', () => {
        postData('/api/toggle_flow', { action: 'inflow_on' });
    });

    btnOutflow.addEventListener('click', () => {
        postData('/api/toggle_flow', { action: 'outflow_on' });
    });

    btnStopPumps.addEventListener('click', () => {
        postData('/api/toggle_flow', { action: 'stop_all' });
    });

    // 6. Mute Sound & Dismiss Alert Buttons
    btnMuteSound.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        btnMuteSound.textContent = isSoundMuted ? '🔇 Unmute Sound' : '🔊 Mute Sound';
    });

    btnDismissAlert.addEventListener('click', () => {
        isAlertDismissed = true;
        alertBanner.classList.add('hidden');
    });

    // Start Polling Flask Loop (every 500ms for continuous pump updates)
    setInterval(fetchTankStatus, 500);
    fetchTankStatus();
});
