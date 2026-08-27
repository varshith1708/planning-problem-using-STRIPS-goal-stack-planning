import random
import math
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Winning combinations on a 3x3 grid (indexed 0..8)
WINNING_COMBOS = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),  # Rows
    (0, 3, 6), (1, 4, 7), (2, 5, 8),  # Columns
    (0, 4, 8), (2, 4, 6)              # Diagonals
]

def check_game_status(board):
    """
    Evaluates the board state.
    Returns (winner, winning_combo) where winner is 'X', 'O', 'draw', or None.
    """
    for combo in WINNING_COMBOS:
        a, b, c = combo
        if board[a] and board[a] == board[b] == board[c]:
            return board[a], list(combo)
    
    if None not in board and "" not in board:
        return "draw", None
        
    return None, None

def minimax(board, depth, is_maximizing, ai_symbol, player_symbol, alpha, beta):
    winner, _ = check_game_status(board)
    if winner == ai_symbol:
        return 10 - depth
    elif winner == player_symbol:
        return -10 + depth
    elif winner == "draw":
        return 0

    if is_maximizing:
        max_eval = -math.inf
        for i in range(9):
            if board[i] is None or board[i] == "":
                board[i] = ai_symbol
                eval_score = minimax(board, depth + 1, False, ai_symbol, player_symbol, alpha, beta)
                board[i] = None
                max_eval = max(max_eval, eval_score)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
        return max_eval
    else:
        min_eval = math.inf
        for i in range(9):
            if board[i] is None or board[i] == "":
                board[i] = player_symbol
                eval_score = minimax(board, depth + 1, True, ai_symbol, player_symbol, alpha, beta)
                board[i] = None
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
        return min_eval

def get_best_move(board, ai_symbol, player_symbol):
    """Finds the optimal move for the AI using Minimax with Alpha-Beta Pruning."""
    best_score = -math.inf
    best_moves = []

    # Fast start heuristic for empty board (pick center or random corner)
    empty_indices = [i for i in range(9) if board[i] is None or board[i] == ""]
    if len(empty_indices) == 9:
        return random.choice([0, 2, 4, 6, 8])

    for i in empty_indices:
        board[i] = ai_symbol
        score = minimax(board, 0, False, ai_symbol, player_symbol, -math.inf, math.inf)
        board[i] = None
        if score > best_score:
            best_score = score
            best_moves = [i]
        elif score == best_score:
            best_moves.append(i)

    return random.choice(best_moves) if best_moves else None

def get_tactical_move(board, symbol):
    """Returns move index if taking it leads to immediate victory for `symbol`."""
    empty_indices = [i for i in range(9) if board[i] is None or board[i] == ""]
    for i in empty_indices:
        board[i] = symbol
        winner, _ = check_game_status(board)
        board[i] = None
        if winner == symbol:
            return i
    return None

def compute_ai_move(board, difficulty, ai_symbol, player_symbol):
    empty_indices = [i for i in range(9) if board[i] is None or board[i] == ""]
    if not empty_indices:
        return None

    if difficulty == "hard":
        # Hard mode: Unbeatable Minimax
        return get_best_move(board, ai_symbol, player_symbol)
    
    elif difficulty == "medium":
        # 1. Check if AI can win immediately
        win_move = get_tactical_move(board, ai_symbol)
        if win_move is not None:
            return win_move

        # 2. Check if player is about to win and block them
        block_move = get_tactical_move(board, player_symbol)
        if block_move is not None:
            return block_move

        # 3. 60% chance best minimax move, 40% random
        if random.random() < 0.60:
            return get_best_move(board, ai_symbol, player_symbol)
        else:
            return random.choice(empty_indices)

    else: # "easy"
        # 1. 20% chance to block player's immediate win
        block_move = get_tactical_move(board, player_symbol)
        if block_move is not None and random.random() < 0.20:
            return block_move
        # Otherwise random move
        return random.choice(empty_indices)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/ai-move", methods=["POST"])
def ai_move():
    data = request.get_json() or {}
    board = data.get("board", [None] * 9)
    difficulty = data.get("difficulty", "hard").lower()
    ai_symbol = data.get("ai_symbol", "O")
    player_symbol = data.get("player_symbol", "X")

    # Sanitize board inputs
    board = [cell if cell in ["X", "O"] else None for cell in board]

    # Check if game is already over
    winner, combo = check_game_status(board)
    if winner:
        return jsonify({
            "move": None,
            "board": board,
            "winner": winner,
            "winning_combo": combo
        })

    move_index = compute_ai_move(board, difficulty, ai_symbol, player_symbol)

    if move_index is not None:
        board[move_index] = ai_symbol
        winner, combo = check_game_status(board)

    return jsonify({
        "move": move_index,
        "board": board,
        "winner": winner,
        "winning_combo": combo
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
