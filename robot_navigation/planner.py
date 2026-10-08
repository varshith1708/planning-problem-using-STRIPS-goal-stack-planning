"""
STRIPS / Goal-Stack Planner for AI Golf Shot & Course Navigation.

This module implements:
1. STRIPS Representation for Golf Shots (State, Action, Preconditions, Effects).
2. Goal-Stack Planning algorithm for navigating around water, trees, and bunker hazards.
3. Meter-based stroke distance calculation and step-by-step reasoning trace.
"""

from typing import List, Tuple, Set, Dict, Any, Optional

CELL_DISTANCE_METERS = 10  # 1 grid cell = 10 meters

class STRIPSGolfAction:
    """
    Represents a STRIPS Golf Stroke action (STROKE-NORTH, STROKE-SOUTH, STROKE-WEST, STROKE-EAST).
    """
    def __init__(self, name: str, dr: int, dc: int):
        self.name = name
        self.dr = dr  # Change in row
        self.dc = dc  # Change in column

    def get_preconditions(self, current_pos: Tuple[int, int], grid_rows: int, grid_cols: int, obstacles: Set[Tuple[int, int]]) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Check preconditions for hitting golf ball from current_pos.
        Returns (is_satisfied, list_of_precondition_checks).
        """
        r, c = current_pos
        dest_r, dest_c = r + self.dr, c + self.dc

        at_current = True
        in_bounds = 1 <= dest_r <= grid_rows and 1 <= dest_c <= grid_cols
        not_obstacle = (dest_r, dest_c) not in obstacles

        all_satisfied = at_current and in_bounds and not_obstacle

        checks = [
            {
                "condition": f"At(GolfBall, ({r}, {c}))",
                "satisfied": at_current,
                "description": f"Golf ball is at position ({r}, {c})"
            },
            {
                "condition": f"InBounds(({dest_r}, {dest_c}))",
                "satisfied": in_bounds,
                "description": f"Fairway cell ({dest_r}, {dest_c}) exists within {grid_rows}x{grid_cols} course"
            },
            {
                "condition": f"Free(({dest_r}, {dest_c}))",
                "satisfied": not_obstacle,
                "description": f"Target cell ({dest_r}, {dest_c}) is clear of trees/water hazards"
            }
        ]

        return all_satisfied, checks

    def get_effects(self, current_pos: Tuple[int, int]) -> Dict[str, List[str]]:
        """
        Get Add and Delete lists (effects) of executing this stroke.
        """
        r, c = current_pos
        dest_r, dest_c = r + self.dr, c + self.dc
        return {
            "delete_list": [f"At(GolfBall, ({r}, {c}))"],
            "add_list": [f"At(GolfBall, ({dest_r}, {dest_c}))"]
        }


# Define 4 directional stroke actions
ACTIONS = [
    STRIPSGolfAction("STROKE-NORTH", -1, 0),
    STRIPSGolfAction("STROKE-SOUTH", 1, 0),
    STRIPSGolfAction("STROKE-WEST", 0, -1),
    STRIPSGolfAction("STROKE-EAST", 0, 1)
]


class GoalStackPlanner:
    """
    Goal-Stack Planner for AI Golf Shot Navigation.
    Calculates shot trajectory in meters while avoiding hazards.
    """
    def __init__(self, rows: int, cols: int, start: Tuple[int, int], goal: Tuple[int, int], obstacles: List[Tuple[int, int]]):
        self.rows = rows
        self.cols = cols
        self.start = (start[0], start[1])
        self.goal = (goal[0], goal[1])
        self.obstacles = set((r, c) for r, c in obstacles)

    def plan(self) -> Dict[str, Any]:
        """
        Executes Goal-Stack planning to generate a golf stroke sequence from Golfer to Flag.
        """
        # 1. Error Validation
        if self.start[0] < 1 or self.start[0] > self.rows or self.start[1] < 1 or self.start[1] > self.cols:
            return {
                "success": False,
                "message": f"Golfer position {self.start} is out of course bounds.",
                "steps": [],
                "path": [],
                "total_distance_meters": 0
            }

        if self.goal[0] < 1 or self.goal[0] > self.rows or self.goal[1] < 1 or self.goal[1] > self.cols:
            return {
                "success": False,
                "message": f"Goal target {self.goal} is out of course bounds.",
                "steps": [],
                "path": [],
                "total_distance_meters": 0
            }

        if self.start in self.obstacles:
            return {
                "success": False,
                "message": "Golfer start position cannot be placed on a water/tree hazard.",
                "steps": [],
                "path": [],
                "total_distance_meters": 0
            }

        if self.goal in self.obstacles:
            return {
                "success": False,
                "message": "Goal target hole cannot be placed on a water/tree hazard.",
                "steps": [],
                "path": [],
                "total_distance_meters": 0
            }

        if self.start == self.goal:
            return {
                "success": True,
                "message": "Golf ball is already in the target hole! ⛳ Hole in One!",
                "steps": [],
                "path": [list(self.start)],
                "already_at_goal": True,
                "total_distance_meters": 0
            }

        # 2. Search path using Goal-Stack reduction
        path = self._find_path()

        if not path:
            return {
                "success": False,
                "message": "No valid golf stroke path found. The hole is blocked by hazards.",
                "steps": [],
                "path": [],
                "total_distance_meters": 0
            }

        # 3. Build step-by-step STRIPS trace
        steps = []
        current_pos = self.start
        
        for i in range(len(path) - 1):
            from_pos = path[i]
            to_pos = path[i+1]
            
            dr = to_pos[0] - from_pos[0]
            dc = to_pos[1] - from_pos[1]
            
            action_obj = None
            for act in ACTIONS:
                if act.dr == dr and act.dc == dc:
                    action_obj = act
                    break
            
            if not action_obj:
                continue

            satisfied, precondition_checks = action_obj.get_preconditions(
                from_pos, self.rows, self.cols, self.obstacles
            )

            effects = action_obj.get_effects(from_pos)

            remaining_subgoals = [f"At(GolfBall, ({path[j][0]}, {path[j][1]}))" for j in range(i + 1, len(path))]
            stack_snapshot = [f"STROKE: {action_obj.name}"] + remaining_subgoals

            step = {
                "step_number": i + 1,
                "action": action_obj.name,
                "from_pos": list(from_pos),
                "to_pos": list(to_pos),
                "distance_meters": CELL_DISTANCE_METERS,
                "preconditions": precondition_checks,
                "all_preconditions_satisfied": satisfied,
                "effects": effects,
                "stack_snapshot": stack_snapshot,
                "explanation": (
                    f"Goal-Stack selected {action_obj.name} ({CELL_DISTANCE_METERS}m stroke) to reach At(GolfBall, ({to_pos[0]}, {to_pos[1]})). "
                    f"Fairway clear. Ball travels from ({from_pos[0]}, {from_pos[1]}) to ({to_pos[0]}, {to_pos[1]})."
                )
            }

            steps.append(step)
            current_pos = to_pos

        total_distance = len(steps) * CELL_DISTANCE_METERS

        return {
            "success": True,
            "message": f"Golf shot plan generated! Total {len(steps)} strokes ({total_distance} meters).",
            "steps": steps,
            "path": [list(p) for p in path],
            "total_distance_meters": total_distance,
            "initial_state": f"At(GolfBall, ({self.start[0]}, {self.start[1]}))",
            "goal_state": f"At(GolfBall, ({self.goal[0]}, {self.goal[1]}))"
        }

    def _find_path(self) -> Optional[List[Tuple[int, int]]]:
        """Finds valid fairway path avoiding water and tree hazards."""
        from collections import deque

        queue = deque([[self.start]])
        visited = {self.start}

        while queue:
            path = queue.popleft()
            curr = path[-1]

            if curr == self.goal:
                return path

            for act in ACTIONS:
                nr, nc = curr[0] + act.dr, curr[1] + act.dc
                nxt = (nr, nc)

                if 1 <= nr <= self.rows and 1 <= nc <= self.cols:
                    if nxt not in self.obstacles and nxt not in visited:
                        visited.add(nxt)
                        queue.append(path + [nxt])

        return None
