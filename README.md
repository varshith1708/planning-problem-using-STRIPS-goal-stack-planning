# Arcade Cyberpunk Tic Tac Toe AI (Python Flask)

A full-stack Tic Tac Toe web application built with **Python Flask** and **JavaScript**, featuring an AI opponent with three difficulty levels (**Easy**, **Medium**, and **Unbeatable Hard Minimax**). Styled with a striking **Red & Black Arcade Cyberpunk theme** with CRT scanlines, Orbitron typography, and an 8-bit retro sound synthesizer.

---

## 📁 Project Structure

```
├── app.py                  # Python Flask server & Minimax AI engine
├── templates/
│   └── index.html          # HTML structure & Arcade Cyberpunk layout
├── static/
│   ├── css/
│   │   └── style.css       # Red & Black design system (CRT scanlines, neon laser grid)
│   └── js/
│       └── game.js         # Game controller, Web Audio synthesizer & AJAX API calls
└── README.md               # Project documentation
```

---

## ⚡ Features

1. **Python Flask Backend (`app.py`)**:
   - **Hard Mode**: Uses the **Minimax Algorithm with Alpha-Beta Pruning**. It evaluates game trees recursively (`10 - depth`) and is **mathematically impossible to beat**.
   - **Medium Mode**: Checks for 1-move immediate wins and blocks before using a mix of optimal and random moves.
   - **Easy Mode**: Casual gameplay with open-cell moves.
   - **API Route (`POST /api/ai-move`)**: Receives the board state from the frontend and returns the computed AI move.

2. **Arcade Cyberpunk Red & Black Interface**:
   - Glowing laser grid (`#ff003c`) with crosshair textures.
   - Arcade HUD displaying scores (`P1 YOU`, `DRAWS`, `CYBER AI`).
   - Neon logo marquee with Orbitron fonts.
   - Customized symbol picker (`X Red` vs `O Silver White`) and turn order starter.

3. **8-Bit Sound Synthesizer (`static/js/game.js`)**:
   - Synthesizes laser sound effects, AI response blips, and victory fanfares directly in the browser via Web Audio API.

---

## 🚀 How to Run the Application

1. **Install Flask**:
   ```bash
   pip install flask
   ```

2. **Start the Flask Server**:
   ```bash
   python app.py
   ```

3. **Open in Web Browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000)
