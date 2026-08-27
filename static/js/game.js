/**
 * Red & Black Cyber Gamer Edition Tic Tac Toe Controller
 * Features: Solo VS AI & 2-Player Multiplayer Friend Mode, 10-Second Speed Move Timer (Timeout = Opponent Win), Start Launcher, Avatar Selector, Live AI Terminal Ticker, Web Audio Synthesizer
 */

document.addEventListener('DOMContentLoaded', () => {
  // Screen Elements
  const startScreen = document.getElementById('startScreen');
  const arenaScreen = document.getElementById('arenaScreen');
  const enterArenaBtn = document.getElementById('enterArenaBtn');
  const mainMenuBtn = document.getElementById('mainMenuBtn');

  // Mode Elements
  const btnModeAi = document.getElementById('btnModeAi');
  const btnModeMulti = document.getElementById('btnModeMulti');
  const diffSection = document.getElementById('diffSection');
  const p2ProfileSection = document.getElementById('p2ProfileSection');

  // Profile Elements
  const gamerNameInput = document.getElementById('gamerNameInput');
  const gamer2NameInput = document.getElementById('gamer2NameInput');
  const avatarPickerP1 = document.getElementById('avatarPickerP1');
  const avatarPickerP2 = document.getElementById('avatarPickerP2');

  // HUD Elements
  const hudPlayerAvatar = document.getElementById('hudPlayerAvatar');
  const hudPlayerName = document.getElementById('hudPlayerName');
  const hudPlayerSymbolBadge = document.getElementById('hudPlayerSymbolBadge');
  const hudP2Avatar = document.getElementById('hudP2Avatar');
  const hudP2Name = document.getElementById('hudP2Name');
  const hudAiDiffBadge = document.getElementById('hudAiDiffBadge');
  const scoreLabelPlayer = document.getElementById('scoreLabelPlayer');
  const scoreLabelP2 = document.getElementById('scoreLabelP2');

  // 10-Second Timer Elements
  const timerTitle = document.getElementById('timerTitle');
  const timerSeconds = document.getElementById('timerSeconds');
  const timerBarFill = document.getElementById('timerBarFill');
  const timerContainer = document.querySelector('.timer-container');

  // Game Board Elements
  const cells = document.querySelectorAll('.cell');
  const statusEl = document.getElementById('statusMessage');
  const terminalText = document.getElementById('terminalText');
  const scorePlayerEl = document.getElementById('scorePlayer');
  const scoreAiEl = document.getElementById('scoreAi');
  const scoreTiesEl = document.getElementById('scoreTies');
  
  const diffBtns = document.querySelectorAll('.diff-btn');
  const symbolBtns = document.querySelectorAll('[data-symbol]');
  const starterBtns = document.querySelectorAll('[data-starter]');
  
  const resetBtn = document.getElementById('resetBtn');
  const clearScoresBtn = document.getElementById('clearScoresBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalIcon = document.getElementById('modalIcon');
  const modalPlayAgain = document.getElementById('modalPlayAgain');

  // Audio Context Synthesizer
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'player_move') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'ai_move') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.18, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.2);
      });
    } else if (type === 'lose') {
      const notes = [440, 370, 311, 220];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.18, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
    } else if (type === 'draw') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  // Game State
  let gameMode = 'ai'; // 'ai' or 'multiplayer'
  let p1Avatar = '⚡';
  let p2Avatar = '🎯';
  let p1Name = 'PLAYER 1';
  let p2Name = 'PLAYER 2';

  let board = Array(9).fill(null);
  let p1Symbol = 'X';
  let p2Symbol = 'O'; // or aiSymbol
  let difficulty = 'hard';
  let firstTurn = 'player'; // 'player' (P1) or 'ai' (P2/AI)
  let currentTurn = 'X';
  let isGameOver = false;
  let isAiThinking = false;

  // 10-Second Move Timer State
  const TIME_LIMIT = 10;
  let timerInterval = null;
  let secondsRemaining = TIME_LIMIT;

  let scores = {
    player: parseInt(localStorage.getItem('ttt_score_player') || '0', 10),
    ai: parseInt(localStorage.getItem('ttt_score_ai') || '0', 10),
    ties: parseInt(localStorage.getItem('ttt_score_ties') || '0', 10)
  };

  function stopMoveTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function getCurrentTurnName() {
    if (gameMode === 'multiplayer') {
      return (currentTurn === p1Symbol) ? p1Name : p2Name;
    } else {
      return (currentTurn === p1Symbol) ? p1Name : 'CYBER AI';
    }
  }

  function startMoveTimer() {
    stopMoveTimer();
    secondsRemaining = TIME_LIMIT;
    
    if (isGameOver) {
      timerSeconds.textContent = '00s';
      timerBarFill.style.width = '0%';
      timerContainer.classList.remove('urgent');
      return;
    }

    const activeName = getCurrentTurnName();
    timerTitle.textContent = `⏳ ${activeName.toUpperCase()} TIMER`;
    timerSeconds.textContent = `${secondsRemaining}s`;
    timerBarFill.style.width = '100%';
    timerContainer.classList.remove('urgent');

    const startTime = Date.now();
    const duration = TIME_LIMIT * 1000;

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, duration - elapsed);
      secondsRemaining = Math.ceil(remainingMs / 1000);
      const pct = (remainingMs / duration) * 100;

      timerSeconds.textContent = `${String(secondsRemaining).padStart(2, '0')}s`;
      timerBarFill.style.width = `${pct.toFixed(1)}%`;

      if (secondsRemaining <= 3) {
        timerContainer.classList.add('urgent');
      } else {
        timerContainer.classList.remove('urgent');
      }

      if (remainingMs <= 0) {
        stopMoveTimer();
        handleMoveTimeout();
      }
    }, 100);
  }

  function handleMoveTimeout() {
    if (isGameOver) return;

    const timedOutSymbol = currentTurn;
    const winnerSymbol = (timedOutSymbol === p1Symbol) ? p2Symbol : p1Symbol;
    const timedOutName = (timedOutSymbol === p1Symbol) ? p1Name : (gameMode === 'multiplayer' ? p2Name : 'CYBER AI');
    const winnerName = (winnerSymbol === p1Symbol) ? p1Name : (gameMode === 'multiplayer' ? p2Name : 'CYBER AI');

    updateTerminal(`⏰ TIME OUT! ${timedOutName} ran out of time (10s limit). ${winnerName} wins!`);
    handleGameOver(winnerSymbol, null, true);
  }

  function updateTerminal(msg) {
    terminalText.textContent = msg;
  }

  function updateScoreboardUI() {
    scorePlayerEl.textContent = scores.player;
    scoreAiEl.textContent = scores.ai;
    scoreTiesEl.textContent = scores.ties;

    localStorage.setItem('ttt_score_player', scores.player);
    localStorage.setItem('ttt_score_ai', scores.ai);
    localStorage.setItem('ttt_score_ties', scores.ties);
  }

  function updateStatusUI() {
    if (isGameOver) return;
    if (isAiThinking) {
      statusEl.innerHTML = `🤖 CYBER AI (${difficulty.toUpperCase()}) COMPUTING...`;
      updateTerminal(`AI evaluating board via Minimax Alpha-Beta pruning...`);
    } else {
      const activeName = getCurrentTurnName();
      statusEl.innerHTML = `${activeName.toUpperCase()} TURN <span class="turn-badge ${currentTurn}">${currentTurn}</span>`;
      updateTerminal(`Waiting for ${activeName}'s move (10s limit)...`);
    }
  }

  function renderBoard() {
    cells.forEach((cell, i) => {
      cell.className = 'cell';
      cell.innerHTML = '';
      if (board[i] !== null) {
        cell.classList.add('taken', `symbol-${board[i]}`);
        const span = document.createElement('span');
        span.className = 'cell-symbol';
        span.textContent = board[i];
        cell.appendChild(span);
      }
      if (isGameOver || isAiThinking) {
        cell.classList.add('disabled');
      }
    });
  }

  function resetGame() {
    stopMoveTimer();
    board = Array(9).fill(null);
    isGameOver = false;
    isAiThinking = false;
    
    currentTurn = (firstTurn === 'player') ? p1Symbol : p2Symbol;
    
    modalOverlay.classList.remove('active');
    renderBoard();
    updateStatusUI();

    startMoveTimer();

    if (gameMode === 'ai' && currentTurn === p2Symbol) {
      triggerAiMove();
    }
  }

  async function handleCellClick(e) {
    initAudio();
    const index = parseInt(e.currentTarget.dataset.index, 10);

    if (isGameOver || isAiThinking || board[index] !== null) {
      return;
    }

    if (gameMode === 'ai' && currentTurn !== p1Symbol) {
      return; // Not player's turn in AI mode
    }

    stopMoveTimer();
    
    // Apply Move
    const activeSymbol = currentTurn;
    const activeName = getCurrentTurnName();
    board[index] = activeSymbol;
    
    playSound(activeSymbol === p1Symbol ? 'player_move' : 'ai_move');
    updateTerminal(`${activeName} placed ${activeSymbol} at cell ${index + 1}`);
    renderBoard();

    // Check winner
    const winner = checkLocalWinner();
    if (winner) {
      handleGameOver(winner.winner, winner.combo);
      return;
    }

    // Switch turns
    currentTurn = (currentTurn === p1Symbol) ? p2Symbol : p1Symbol;
    
    if (gameMode === 'ai' && currentTurn === p2Symbol) {
      isAiThinking = true;
      updateStatusUI();
      renderBoard();
      startMoveTimer();
      await triggerAiMove();
    } else {
      updateStatusUI();
      renderBoard();
      startMoveTimer();
    }
  }

  async function triggerAiMove() {
    isAiThinking = true;
    updateStatusUI();
    renderBoard();

    try {
      await new Promise(res => setTimeout(res, 350));

      const response = await fetch('/api/ai-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: board,
          difficulty: difficulty,
          ai_symbol: p2Symbol,
          player_symbol: p1Symbol
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      
      if (data.move !== null && data.move !== undefined) {
        board[data.move] = p2Symbol;
        playSound('ai_move');
        updateTerminal(`Cyber AI placed ${p2Symbol} at cell ${data.move + 1}`);
      }

      renderBoard();

      if (data.winner) {
        handleGameOver(data.winner, data.winning_combo);
      } else {
        currentTurn = p1Symbol;
        isAiThinking = false;
        updateStatusUI();
        renderBoard();
        startMoveTimer();
      }
    } catch (err) {
      console.error('Error fetching AI move:', err);
      isAiThinking = false;
      currentTurn = p1Symbol;
      updateStatusUI();
      renderBoard();
      startMoveTimer();
    }
  }

  const COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function checkLocalWinner() {
    for (let combo of COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], combo };
      }
    }
    if (!board.includes(null)) {
      return { winner: 'draw', combo: null };
    }
    return null;
  }

  function handleGameOver(winner, combo, isTimeout = false) {
    stopMoveTimer();
    isGameOver = true;
    isAiThinking = false;

    if (combo) {
      combo.forEach(idx => {
        cells[idx].classList.add('winning-cell');
      });
    }

    setTimeout(() => {
      if (winner === p1Symbol) {
        scores.player++;
        playSound('win');
        modalIcon.textContent = isTimeout ? '⏱️' : '🏆';
        modalTitle.textContent = isTimeout ? 'TIMEOUT VICTORY!' : 'VICTORY!';
        modalTitle.className = 'modal-title win';
        modalSubtitle.textContent = isTimeout 
          ? `${(gameMode === 'multiplayer' ? p2Name : 'CYBER AI').toUpperCase()} RAN OUT OF TIME! ${p1Name.toUpperCase()} WINS.` 
          : `${p1Name.toUpperCase()} VICTORY! OUTSTANDING PLAY.`;
        updateTerminal(`MATCH ENDED: ${p1Name} WINS!`);
      } else if (winner === p2Symbol) {
        scores.ai++;
        playSound(gameMode === 'multiplayer' ? 'win' : 'lose');
        modalIcon.textContent = isTimeout ? '⏱️' : (gameMode === 'multiplayer' ? '🏆' : '🤖');
        const p2WinTitle = gameMode === 'multiplayer' ? `${p2Name.toUpperCase()} WINS!` : 'DEFEAT!';
        modalTitle.textContent = isTimeout ? 'TIMEOUT VICTORY!' : p2WinTitle;
        modalTitle.className = 'modal-title lose';
        modalSubtitle.textContent = isTimeout
          ? `${p1Name.toUpperCase()} RAN OUT OF TIME (10s LIMIT)! ${p2Name.toUpperCase()} CLAIMS VICTORY.`
          : (gameMode === 'multiplayer' 
            ? `${p2Name.toUpperCase()} OUTMANEUVERED ${p1Name.toUpperCase()}!`
            : (difficulty === 'hard' ? 'HARD MINIMAX AI IS MATHEMATICALLY UNBEATABLE!' : 'THE CYBER AI TOOK THIS ROUND.'));
        updateTerminal(`MATCH ENDED: ${p2Name} WINS!`);
      } else {
        scores.ties++;
        playSound('draw');
        modalIcon.textContent = '🤝';
        modalTitle.textContent = 'STALEMATE!';
        modalTitle.className = 'modal-title draw';
        modalSubtitle.textContent = 'PERFECT MATCH BETWEEN EQUAL MINDS.';
        updateTerminal(`MATCH ENDED: DRAW!`);
      }

      updateScoreboardUI();
      modalOverlay.classList.add('active');
    }, 500);
  }

  // Mode Selection Listener
  btnModeAi.addEventListener('click', () => {
    playSound('click');
    btnModeAi.classList.add('active');
    btnModeMulti.classList.remove('active');
    gameMode = 'ai';
    diffSection.classList.remove('hidden');
    p2ProfileSection.classList.add('hidden');
  });

  btnModeMulti.addEventListener('click', () => {
    playSound('click');
    btnModeMulti.classList.add('active');
    btnModeAi.classList.remove('active');
    gameMode = 'multiplayer';
    diffSection.classList.add('hidden');
    p2ProfileSection.classList.remove('hidden');
  });

  // Avatar Selection Listeners
  avatarPickerP1.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      avatarPickerP1.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      p1Avatar = btn.dataset.avatar;
    });
  });

  avatarPickerP2.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      avatarPickerP2.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      p2Avatar = btn.dataset.avatar;
    });
  });

  // Enter Arena Screen Transition
  enterArenaBtn.addEventListener('click', () => {
    playSound('click');
    p1Name = gamerNameInput.value.trim() || 'PLAYER 1';
    
    if (gameMode === 'multiplayer') {
      p2Name = gamer2NameInput.value.trim() || 'PLAYER 2';
      hudP2Avatar.textContent = p2Avatar;
      hudP2Name.textContent = p2Name.toUpperCase();
      hudAiDiffBadge.textContent = '2P FRIEND';
      scoreLabelPlayer.textContent = p1Name.toUpperCase();
      scoreLabelP2.textContent = p2Name.toUpperCase();
    } else {
      p2Name = 'CYBER AI';
      hudP2Avatar.textContent = '🤖';
      hudP2Name.textContent = 'CYBER AI';
      hudAiDiffBadge.textContent = `${difficulty.toUpperCase()} MINIMAX`;
      scoreLabelPlayer.textContent = p1Name.toUpperCase();
      scoreLabelP2.textContent = 'CYBER AI';
    }

    hudPlayerAvatar.textContent = p1Avatar;
    hudPlayerName.textContent = p1Name.toUpperCase();
    hudPlayerSymbolBadge.textContent = `MARK: ${p1Symbol}`;

    startScreen.classList.remove('active');
    arenaScreen.classList.add('active');

    resetGame();
  });

  // Main Menu Return
  mainMenuBtn.addEventListener('click', () => {
    playSound('click');
    stopMoveTimer();
    arenaScreen.classList.remove('active');
    startScreen.classList.add('active');
  });

  // Event Listeners
  cells.forEach(cell => cell.addEventListener('click', handleCellClick));

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
    });
  });

  symbolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      symbolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      p1Symbol = btn.dataset.symbol;
      p2Symbol = (p1Symbol === 'X') ? 'O' : 'X';
    });
  });

  starterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      starterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      firstTurn = btn.dataset.starter;
    });
  });

  resetBtn.addEventListener('click', resetGame);
  modalPlayAgain.addEventListener('click', resetGame);

  clearScoresBtn.addEventListener('click', () => {
    playSound('click');
    scores = { player: 0, ai: 0, ties: 0 };
    updateScoreboardUI();
  });

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? '🔊 AUDIO: ON' : '🔇 AUDIO: OFF';
  });

  // Initial Setup
  updateScoreboardUI();
});
