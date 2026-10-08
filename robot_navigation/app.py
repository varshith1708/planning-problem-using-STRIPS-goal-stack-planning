import os
from flask import Flask, render_template, request, jsonify
from planner import GoalStackPlanner

# Initialize Flask App
# Specify template and static folders explicitly to ensure reliability
app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
    static_folder=os.path.join(os.path.dirname(__file__), 'static')
)


@app.route('/')
def index():
    """Render the main UI page."""
    return render_template('index.html')


@app.route('/api/plan', methods=['POST'])
def generate_plan():
    """
    Generate STRIPS / Goal-Stack navigation plan based on user input.
    Payload format:
    {
        "rows": 4,
        "cols": 5,
        "start": [1, 1],
        "goal": [4, 5],
        "obstacles": [[1, 4], [2, 2], [2, 4], [4, 1], [4, 3]]
    }
    """
    try:
        data = request.get_json(force=True)
        rows = int(data.get('rows', 4))
        cols = int(data.get('cols', 5))
        
        start_list = data.get('start', [1, 1])
        goal_list = data.get('goal', [4, 5])
        obstacles_list = data.get('obstacles', [])
        
        start = (int(start_list[0]), int(start_list[1]))
        goal = (int(goal_list[0]), int(goal_list[1]))
        obstacles = [(int(obs[0]), int(obs[1])) for obs in obstacles_list]
        
        planner = GoalStackPlanner(rows, cols, start, goal, obstacles)
        result = planner.plan()
        
        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error while generating plan: {str(e)}",
            "steps": [],
            "path": []
        }), 400


@app.route('/api/example', methods=['GET', 'POST'])
def load_example():
    """
    Returns the standard example scenario from the project requirements.
    """
    example_data = {
        "rows": 4,
        "cols": 5,
        "start": [1, 1],
        "goal": [4, 5],
        "obstacles": [
            [1, 4],
            [2, 2],
            [2, 4],
            [4, 1],
            [4, 3]
        ]
    }
    return jsonify(example_data)


if __name__ == '__main__':
    print("Starting Robot Navigation Planner Flask Server on http://127.0.0.1:5000 ...")
    app.run(debug=True, host='127.0.0.1', port=5000)
