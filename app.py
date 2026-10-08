import os
import sys

# Add robot_navigation package directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'robot_navigation'))

from app import app

if __name__ == '__main__':
    print("Starting Robot Navigation Planner Flask Server on http://127.0.0.1:5000 ...")
    app.run(debug=True, host='127.0.0.1', port=5000)
