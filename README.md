# NLP-Based Text Classification and Explainable AI Demo

A real, fully working Machine Learning web application designed for a college practical. The application demonstrates Natural Language Processing (NLP), TF-IDF feature extraction, multi-classifier sentiment classification, real evaluation metrics, confidence scoring, Explainable AI (XAI), and Responsible AI ethics.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.8 or higher installed on your system.

### 2. Install Required Dependencies
Open your terminal/command prompt in the project directory and run:

```bash
pip install -r requirements.txt
```

### 3. Run the Application
Start the Flask web server:

```bash
python app.py
```

### 4. Access the Web Application
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🛠️ Project Structure & File Purpose

- **`app.py`**: The Flask web backend controller. Serves HTML templates and handles REST API endpoints (`/api/classify`, `/api/compare`, `/api/model_info`).
- **`model_manager.py`**: Core Machine Learning and Explainable AI (XAI) engine. Handles TF-IDF vectorization, training 3 scikit-learn models (Logistic Regression, Multinomial Naive Bayes, Linear SVM), calculating real test performance metrics, confidence probabilities, and XAI feature attribution.
- **`nlp_pipeline.py`**: Step-by-step NLP preprocessing module. Handles text lowercasing, punctuation removal, tokenization, stop-word filtering, and Porter stemming.
- **`dataset.py`**: Built-in balanced sentiment dataset containing 195 real-world sentences across Positive, Negative, and Neutral classes.
- **`templates/index.html`**: The single-page dashboard interface featuring sidebar navigation, input forms, interactive cards, progress bars, and accordion components.
- **`static/app.js`**: Client-side JavaScript handling AJAX requests, live Chart.js visualizations, NLP pipeline updates, XAI sentence token highlighting, and classifier comparisons.
- **`static/style.css`**: Professional responsive CSS dashboard design styling.
- **`requirements.txt`**: List of required Python dependencies (`Flask`, `scikit-learn`, `numpy`, `nltk`).

---

## 🔬 Implementation Highlights

### 1. Natural Language Processing (NLP)
The text preprocessing pipeline cleans raw human text sequentially:
1. **Lowercasing**: Normalizes case sensitivity.
2. **Punctuation Removal**: Filters out special characters and symbols via regular expressions.
3. **Tokenization**: Splits text into individual word tokens.
4. **Stop-Word Removal & Stemming**: Filters common grammatical stop-words and applies NLTK's `PorterStemmer` to map inflected words back to root forms.

### 2. TF-IDF Feature Extraction
Uses `scikit-learn`'s `TfidfVectorizer` (with unigrams and bigrams, `sublinear_tf=True`) to convert text into numerical feature vectors weighted by Term Frequency (TF) and Inverse Document Frequency (IDF).

### 3. Machine Learning Classifiers & Real Evaluation
Three algorithms are trained on an 80/20 stratified train/test split:
1. **Logistic Regression** (`LogisticRegression`)
2. **Multinomial Naive Bayes** (`MultinomialNB`)
3. **Linear SVM** (`LinearSVC`)

Real performance metrics (Accuracy, Precision, Recall, F1 Score) are computed against the test set and displayed dynamically in a comparative benchmark table.

### 4. Confidence & Probability Calculation
- **Logistic Regression & Naive Bayes**: Native probability estimates via `predict_proba`.
- **Linear SVM**: Calculates decision function margin distance mapped through a Softmax transformation to ensure valid probability bounds, explicitly indicating calibrated decision scores.

### 5. Explainable AI (XAI)
Feature attribution is computed by mapping trained model coefficient matrix weights \(W\) against document TF-IDF features. Words are categorized into positive and negative contribution weights, dynamically generating natural language explanations and highlighting tokens directly within the sentence.
