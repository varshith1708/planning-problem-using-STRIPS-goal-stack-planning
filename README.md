# ⛳ AI Golf Shot & Course Strategy Planner – STRIPS / Goal-Stack Planning

A modern, interactive web application demonstrating **STRIPS (Stanford Research Institute Problem Solver)** and **Goal-Stack Planning** for AI Golf Shot Strategy and Course Distance Navigation (in Meters).

Built with **Python Flask** for the STRIPS planning backend and **HTML5, CSS3, and JavaScript** for the interactive frontend UI.

---

## 📌 Features

- **STRIPS Operator Representation**: Models 4-directional golf shot strokes (`STROKE-NORTH`, `STROKE-SOUTH`, `STROKE-WEST`, `STROKE-EAST`) with explicit preconditions, add lists, and delete lists.
- **Meter Distance Calculation**: Each fairway cell represents 10 meters. Calculates total shot distance (e.g. 7 strokes = 70 meters).
- **Goal-Stack Planning Engine**: Solves golf course navigation by recursively satisfying sub-goals, managing preconditions, and avoiding water hazards and tree obstacles.
- **Interactive Course Editor**: Custom grid dimensions (Rows × Cols), drag-and-drop / click-to-place golfer tee 🏌️, target hole 🚩, and hazards 🌲.
- **Goal Stack & STRIPS Trace Visualizer**: Displays stack snapshots and step-by-step precondition/effect verifications for every stroke.
- **Interactive Simulation Controls**: Hit Simulation, Pause, Step Forward/Back, Restart, and Speed Slider controls to animate the shot trajectory.
- **Celebratory Hole-In-One Effect**: Confetti particle explosion when reaching the target flag.

---

## 🛠 Project Structure

```
.
├── app.py                  # Main Flask Web Server Launcher
├── robot_navigation/
│   ├── app.py              # Flask Web API Routes & Endpoints
│   ├── planner.py          # STRIPS & Goal-Stack Golf Planning Engine
│   ├── templates/
│   │   └── index.html      # Main Interface Dashboard
│   └── static/
│       ├── style.css       # Emerald Golf Fairway Styling & Animations
│       └── script.js       # Interactive Grid & Simulation Controller
└── README.md               # Project Documentation
```

---

## 🚀 Quick Start Guide

### 1. Requirements
- Python 3.8+
- Flask (`pip install flask`)

### 2. Running the Application

Run `app.py`:

```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🎓 STRIPS & Goal-Stack Planning Concepts

### 1. STRIPS Representation
In STRIPS, each stroke action consists of:
- **Name**: e.g., `STROKE-EAST`
- **Preconditions**:
  - `At(GolfBall, (r, c))` (Golf ball is at current cell)
  - `InBounds(r, c+1)` (Fairway cell exists inside course bounds)
  - `Free(r, c+1)` (Fairway cell is clear of tree/water hazards)
- **Effects**:
  - **Delete List**: `At(GolfBall, (r, c))`
  - **Add List**: `At(GolfBall, (r, c+1))`

### 2. Goal-Stack Planning Algorithm
1. Initialize stack with top-level goal `At(GolfBall, (goal_r, goal_c))`.
2. Inspect top stack element:
   - If predicate `At(GolfBall, pos)` holds true in current state, pop it.
   - If false, select stroke action `A` producing `At(GolfBall, pos)` and push `A` and its preconditions onto the stack.
   - If top element is an action `A` whose preconditions are met, execute `A`, apply Add/Delete effects to state, record step, and pop action.
3. Repeat until goal stack is empty and ball reaches the target hole.
