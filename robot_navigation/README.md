# 🤖 Robot Navigation Planner – STRIPS / Goal-Stack Planning

A modern, interactive AI web application demonstrating **STRIPS (Stanford Research Institute Problem Solver)** and **Goal-Stack Planning** for 2D grid robot navigation.

Built with **Python Flask** for the planning backend and **HTML5, CSS3, and JavaScript** for the interactive frontend UI.

---

## 📌 Features

- **STRIPS Operator Representation**: Fully models `MOVE-UP`, `MOVE-DOWN`, `MOVE-LEFT`, and `MOVE-RIGHT` with explicit preconditions, add lists, and delete lists.
- **Goal-Stack Planning Engine**: Solves grid navigation by recursively satisfying sub-goals, managing preconditions, and avoiding obstacles and looping states.
- **Interactive 2D Grid**: Custom grid dimensions (Rows x Cols), drag-and-drop / click-to-place start, goal, and obstacle cells.
- **Goal Stack & STRIPS Trace Visualizer**: Displays stack snapshots and step-by-step precondition/effect verifications for every action.
- **Interactive Simulation Controls**: Play, Pause, Step Forward/Back, Restart, and Speed Slider controls to animate the robot traversing the plan.
- **Pre-loaded Example Scenario**: One-click standard demo scenario matching college AI practical requirements.

---

## 🛠 Project Structure

```
robot_navigation/
│
├── app.py              # Flask Web Server & API Routes
├── planner.py          # STRIPS & Goal-Stack Planning Logic Engine
├── templates/
│   └── index.html      # Main Dashboard User Interface
├── static/
│   ├── style.css       # Sleek Glassmorphism & High-Tech AI Styling
│   └── script.js       # Frontend Grid & Simulation Controller
└── README.md           # Documentation & Practical Demonstration Guide
```

---

## 🚀 Quick Start Guide

### 1. Requirements
- Python 3.8+
- Flask (`pip install flask`)

### 2. Running the Application

Navigate to the project directory and run `app.py`:

```bash
cd robot_navigation
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🎓 STRIPS & Goal-Stack Planning Concepts

### 1. STRIPS Representation
In STRIPS, each action consists of:
- **Name**: e.g., `MOVE-RIGHT`
- **Preconditions**:
  - `At(Robot, (r, c))` (Robot is at current cell)
  - `InBounds(r, c+1)` (Destination is inside grid boundaries)
  - `Free(r, c+1)` (Destination is not blocked by an obstacle)
- **Effects**:
  - **Delete List**: `At(Robot, (r, c))`
  - **Add List**: `At(Robot, (r, c+1))`

### 2. Goal-Stack Planning Algorithm
1. Initialize stack with top-level goal `At(Robot, (goal_r, goal_c))`.
2. Inspect top stack element:
   - If it is a predicate `At(Robot, pos)` that holds true in current world state, pop it.
   - If predicate is false, select action `A` that produces `At(Robot, pos)` and push `A` and its preconditions onto the stack.
   - If top element is an action `A` whose preconditions are met, execute `A`, apply effects to current state, record step, and pop action.
3. Repeat until goal stack is empty and target position is reached.

---

## 🧪 Demonstration Example

### Initial State
- **Grid Size**: 4 Rows x 5 Columns
- **Robot Start**: `(1, 1)`
- **Goal Position**: `(4, 5)`
- **Obstacles**: `(1,4)`, `(2,2)`, `(2,4)`, `(4,1)`, `(4,3)`

### How to Run Demo:
1. Click **"Load Example"** on the left setup panel.
2. Click **"Generate Plan"** to calculate the goal-stack navigation sequence.
3. Inspect the **Goal Stack Trace** and **Step-by-step Precondition & Effect Breakdown**.
4. Click **"Run Simulation"** to watch the robot navigate in real-time!
