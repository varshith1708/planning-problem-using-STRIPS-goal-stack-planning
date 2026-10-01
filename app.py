"""
NLP-Based Text Classification & Explainable AI Web Application.
Flask server providing API endpoints for text classification, NLP pipeline processing,
TF-IDF feature extraction, classifier comparison, and explainable AI insights.
"""
from flask import Flask, render_template, request, jsonify
from model_manager import ModelManager

app = Flask(__name__)
app.secret_key = 'nlp_xai_demo_secret_key_2026'

# Initialize Model Manager on server startup
model_mgr = ModelManager()

@app.route('/')
def index():
    """Renders the main dashboard page."""
    model_info = model_mgr.get_model_info()
    return render_template('index.html', model_info=model_info)

@app.route('/api/classify', methods=['POST'])
def api_classify():
    """Classifies user text and returns complete NLP, TF-IDF, prediction, and XAI details."""
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    classifier_name = data.get('classifier', 'Logistic Regression')

    if not text:
        return jsonify({
            "status": "error",
            "message": "Input text cannot be empty. Please enter a sentence to classify."
        }), 400

    if len(text) > 1000:
        return jsonify({
            "status": "error",
            "message": "Input text exceeds maximum allowed length of 1000 characters."
        }), 400

    res = model_mgr.predict_text(text, model_name=classifier_name)
    
    if "error" in res:
        return jsonify({
            "status": "error",
            "message": res["error"]
        }), 400

    return jsonify({
        "status": "success",
        "data": res
    })

@app.route('/api/compare', methods=['POST'])
def api_compare():
    """Classifies the same text using all 3 classifiers for side-by-side comparison."""
    data = request.get_json() or {}
    text = data.get('text', '').strip()

    if not text:
        return jsonify({
            "status": "error",
            "message": "Input text cannot be empty. Please enter a sentence to compare classifiers."
        }), 400

    comparison_results = model_mgr.compare_all_classifiers(text)
    return jsonify({
        "status": "success",
        "text": text,
        "comparisons": comparison_results
    })

@app.route('/api/model_info', methods=['GET'])
def api_model_info():
    """Returns dataset split details, vocabulary size, and classifier benchmark metrics."""
    info = model_mgr.get_model_info()
    return jsonify({
        "status": "success",
        "data": info
    })

if __name__ == '__main__':
    print("Starting NLP Text Classification & XAI Application on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)
