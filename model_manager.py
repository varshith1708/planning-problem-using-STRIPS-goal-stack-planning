"""
Machine Learning Classifier Manager & XAI Explanation Engine.
Implements TF-IDF vectorization, training of 3 classifiers (Logistic Regression, Naive Bayes, Linear SVM),
evaluation on test dataset, confidence score computation, feature attribution (XAI), and text explanations.
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from dataset import SENTIMENT_DATASET
from nlp_pipeline import process_nlp_pipeline, custom_tokenizer

class ModelManager:
    def __init__(self):
        self.vectorizer = None
        self.models = {}
        self.metrics = {}
        self.classes_ = ["Negative", "Neutral", "Positive"]
        self.train_size = 0
        self.test_size = 0
        self.total_samples = 0
        self.is_trained = False
        
        self.train_and_evaluate()

    def train_and_evaluate(self):
        """Preprocesses dataset, fits TF-IDF, trains classifiers and calculates real test metrics."""
        texts = [item[0] for item in SENTIMENT_DATASET]
        labels = [item[1] for item in SENTIMENT_DATASET]
        
        self.total_samples = len(texts)

        # 80/20 Train-Test Split with stratification
        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            texts, labels, test_size=0.20, random_state=42, stratify=labels
        )

        self.train_size = len(X_train_raw)
        self.test_size = len(X_test_raw)

        # Process raw text into preprocessed string representations
        X_train_processed = [process_nlp_pipeline(t)["processed_text"] for t in X_train_raw]
        X_test_processed = [process_nlp_pipeline(t)["processed_text"] for t in X_test_raw]

        # TF-IDF Feature Extraction Vectorizer
        self.vectorizer = TfidfVectorizer(
            tokenizer=custom_tokenizer,
            token_pattern=None,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True
        )

        X_train_tfidf = self.vectorizer.fit_transform(X_train_raw)
        X_test_tfidf = self.vectorizer.transform(X_test_raw)

        # Classifiers definitions
        clf_dict = {
            "Logistic Regression": LogisticRegression(C=1.5, max_iter=1000, random_state=42),
            "Multinomial Naive Bayes": MultinomialNB(alpha=0.8),
            "Linear SVM": LinearSVC(C=1.0, dual='auto', random_state=42)
        }

        for name, clf in clf_dict.items():
            # Fit model on training dataset
            clf.fit(X_train_tfidf, y_train)
            self.models[name] = clf

            # Predict on test dataset
            y_pred = clf.predict(X_test_tfidf)
            y_train_pred = clf.predict(X_train_tfidf)

            # Calculate real performance metrics
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, average='macro', zero_division=0))
            rec = float(recall_score(y_test, y_pred, average='macro', zero_division=0))
            f1 = float(f1_score(y_test, y_pred, average='macro', zero_division=0))
            train_acc = float(accuracy_score(y_train, y_train_pred))

            self.metrics[name] = {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "train_accuracy": round(train_acc, 4)
            }

        self.is_trained = True

    def extract_tfidf_features(self, text: str):
        """Extracts non-zero TF-IDF features for the input text."""
        nlp_res = process_nlp_pipeline(text)
        tfidf_vec = self.vectorizer.transform([text])
        feature_names = self.vectorizer.get_feature_names_out()
        
        non_zero_indices = tfidf_vec.nonzero()[1]
        scores = tfidf_vec.data

        feature_scores = []
        for idx, score in zip(non_zero_indices, scores):
            word = feature_names[idx]
            feature_scores.append({
                "word": word,
                "score": round(float(score), 4)
            })

        # Sort by TF-IDF score descending
        feature_scores.sort(key=lambda x: x["score"], reverse=True)
        return feature_scores, nlp_res

    def predict_text(self, text: str, model_name: str = "Logistic Regression"):
        """Classifies input text using specified model, computes confidence & XAI explanations."""
        if not text or not text.strip():
            return {"error": "Text input cannot be empty."}

        if model_name not in self.models:
            model_name = "Logistic Regression"

        model = self.models[model_name]
        nlp_res = process_nlp_pipeline(text)

        # Check if text contains valid tokens after preprocessing
        if not nlp_res["tokens"]:
            return {"error": "Text contains only punctuation or empty tokens."}

        tfidf_vec = self.vectorizer.transform([text])
        feature_names = self.vectorizer.get_feature_names_out()

        # Predict class label
        pred_label = str(model.predict(tfidf_vec)[0])

        # Confidence & Probability distribution calculation
        prob_dist = {}
        is_native_prob = True
        prob_type = "Native Probability (predict_proba)"

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(tfidf_vec)[0]
            for cls, p in zip(model.classes_, probs):
                prob_dist[str(cls)] = round(float(p), 4)
            confidence = round(float(np.max(probs) * 100), 2)
        elif hasattr(model, "decision_function"):
            is_native_prob = False
            prob_type = "Decision Function (Softmax Confidence)"
            df_scores = model.decision_function(tfidf_vec)[0]
            
            # Apply softmax to decision function scores to map to valid [0, 1] probability range
            exp_scores = np.exp(df_scores - np.max(df_scores))
            probs = exp_scores / np.sum(exp_scores)
            
            for cls, p in zip(model.classes_, probs):
                prob_dist[str(cls)] = round(float(p), 4)
            confidence = round(float(np.max(probs) * 100), 2)
        else:
            confidence = 100.0
            prob_dist = {str(cls): (1.0 if cls == pred_label else 0.0) for cls in self.classes_}

        # --- Explainable AI (XAI) Feature Importance ---
        non_zero_indices = tfidf_vec.nonzero()[1]
        tfidf_scores = tfidf_vec.data

        # Determine target class index
        class_list = list(model.classes_)
        pred_class_idx = class_list.index(pred_label)

        word_contributions = []
        pos_contributions = []
        neg_contributions = []
        
        word_weight_map = {}

        for idx, score in zip(non_zero_indices, tfidf_scores):
            word = feature_names[idx]

            if model_name in ["Logistic Regression", "Linear SVM"]:
                # Coefficient matrix weight for predicted class
                coefs = model.coef_
                if len(coefs) == 1:
                    # Binary case
                    weight = float(coefs[0][idx])
                else:
                    weight = float(coefs[pred_class_idx][idx])
                
                # Positive vs Negative overall impact mapping
                # In 3-class sentiment: Positive class coef index vs Negative class coef index
                pos_idx = class_list.index("Positive") if "Positive" in class_list else pred_class_idx
                neg_idx = class_list.index("Negative") if "Negative" in class_list else pred_class_idx
                
                pos_weight = float(coefs[pos_idx][idx])
                neg_weight = float(coefs[neg_idx][idx])
                net_impact = (pos_weight - neg_weight) * float(score)

            elif model_name == "Multinomial Naive Bayes":
                # Feature log probabilities difference
                pos_idx = class_list.index("Positive") if "Positive" in class_list else pred_class_idx
                neg_idx = class_list.index("Negative") if "Negative" in class_list else pred_class_idx
                
                pos_log_prob = float(model.feature_log_prob_[pos_idx][idx])
                neg_log_prob = float(model.feature_log_prob_[neg_idx][idx])
                
                net_impact = (pos_log_prob - neg_log_prob) * float(score)
                weight = float(model.feature_log_prob_[pred_class_idx][idx])

            word_weight_map[word] = net_impact
            item = {
                "word": word,
                "score": round(net_impact, 4),
                "tfidf": round(float(score), 4)
            }
            word_contributions.append(item)

            if net_impact > 0.01:
                pos_contributions.append(item)
            elif net_impact < -0.01:
                neg_contributions.append(item)

        # Sort word contributions
        word_contributions.sort(key=lambda x: abs(x["score"]), reverse=True)
        pos_contributions.sort(key=lambda x: x["score"], reverse=True)
        neg_contributions.sort(key=lambda x: x["score"])

        # Sentence token highlighting
        tokens_highlighted = []
        for tok in nlp_res["tokens"]:
            # Stem word to match vectorizer vocabulary
            stemmed_tok = process_nlp_pipeline(tok)["processed_text"]
            
            # Look up net impact score
            score = word_weight_map.get(stemmed_tok, word_weight_map.get(tok.lower(), 0.0))
            
            if score > 0.05:
                tag = "positive"
            elif score < -0.05:
                tag = "negative"
            else:
                tag = "neutral"
                
            tokens_highlighted.append({
                "word": tok,
                "tag": tag,
                "impact": round(score, 4)
            })

        # Dynamic human readable explanation string
        explanation_text = self._generate_human_explanation(
            pred_label, confidence, pos_contributions, neg_contributions, nlp_res["tokens"]
        )

        # Return full prediction response object
        return {
            "prediction": pred_label,
            "confidence": confidence,
            "classifier": model_name,
            "probabilities": prob_dist,
            "is_native_probability": is_native_prob,
            "probability_type": prob_type,
            "nlp_pipeline": nlp_res,
            "tfidf_features": self.extract_tfidf_features(text)[0],
            "explainability": {
                "word_contributions": word_contributions,
                "positive_words": pos_contributions,
                "negative_words": neg_contributions,
                "highlighted_sentence": tokens_highlighted,
                "human_explanation": explanation_text
            },
            "model_metrics": self.metrics[model_name]
        }

    def compare_all_classifiers(self, text: str):
        """Classifies text across all available models for comparison."""
        results = {}
        for name in self.models:
            res = self.predict_text(text, model_name=name)
            results[name] = {
                "prediction": res.get("prediction"),
                "confidence": res.get("confidence"),
                "probabilities": res.get("probabilities"),
                "is_native_probability": res.get("is_native_probability"),
                "metrics": self.metrics[name]
            }
        return results

    def _generate_human_explanation(self, prediction, confidence, pos_words, neg_words, tokens):
        """Generates dynamic natural language explanation based on model feature attributions."""
        top_pos = [f"'{w['word']}' (+{w['score']:.2f})" for w in pos_words[:3]]
        top_neg = [f"'{w['word']}' ({w['score']:.2f})" for w in neg_words[:3]]

        if prediction == "Positive":
            if top_pos:
                words_str = ", ".join(top_pos)
                return (f"The model predicted **Positive** with **{confidence}% confidence** "
                        f"because terms such as {words_str} have strong positive contributions "
                        f"towards a favorable sentiment.")
            else:
                return (f"The model predicted **Positive** with **{confidence}% confidence** "
                        f"based on overall text structure and positive word patterns.")

        elif prediction == "Negative":
            if top_neg:
                words_str = ", ".join(top_neg)
                return (f"The model predicted **Negative** with **{confidence}% confidence** "
                        f"because terms such as {words_str} have strong negative contributions "
                        f"indicating dissatisfaction or adverse context.")
            else:
                return (f"The model predicted **Negative** with **{confidence}% confidence** "
                        f"based on negative term associations in the training corpus.")

        else: # Neutral
            if top_pos and top_neg:
                return (f"The model predicted **Neutral** with **{confidence}% confidence** "
                        f"because both positive terms ({', '.join(top_pos)}) and negative terms "
                        f"({', '.join(top_neg)}) balanced each other out.")
            else:
                return (f"The model predicted **Neutral** with **{confidence}% confidence** "
                        f"because the input text consists primarily of objective/informational statements "
                        f"without strong positive or negative sentiment indicators.")

    def get_model_info(self):
        """Returns metadata about dataset split, vectorizer, and classifier benchmark table."""
        vocab_size = len(self.vectorizer.get_feature_names_out()) if self.vectorizer else 0
        return {
            "total_dataset_samples": self.total_samples,
            "training_samples": self.train_size,
            "testing_samples": self.test_size,
            "num_classes": len(self.classes_),
            "classes": self.classes_,
            "num_tfidf_features": vocab_size,
            "classifier_metrics": self.metrics
        }
