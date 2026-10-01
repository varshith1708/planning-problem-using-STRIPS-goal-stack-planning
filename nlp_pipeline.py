"""
NLP Preprocessing Pipeline for Text Classification & Explainable AI.
Implements step-by-step text cleaning, tokenization, stop-word removal, and stemming.
"""
import re
import string
from nltk.stem import PorterStemmer

# Comprehensive English Stop Words list for robust offline execution
DEFAULT_STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
    'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
    'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
    'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
    'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
    'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is',
    'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
    'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
    'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
    'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
    'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
    'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through',
    'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
    'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
    'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom',
    'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
    'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
}

stemmer = PorterStemmer()

def process_nlp_pipeline(text: str) -> dict:
    """
    Executes full NLP preprocessing pipeline step-by-step and returns intermediate states.
    Steps:
    1. Original Text
    2. Cleaned Text (Lowercased + Punctuation removed)
    3. Tokens (Word Tokenization)
    4. Stop-words Removal & Stemming -> Processed Text
    """
    original_text = text.strip() if text else ""
    if not original_text:
        return {
            "original_text": "",
            "cleaned_text": "",
            "tokens": [],
            "filtered_tokens": [],
            "stemmed_tokens": [],
            "processed_text": ""
        }

    # Step 1 & 2: Lowercasing and Punctuation Removal
    lowercased = original_text.lower()
    cleaned_text = re.sub(r'[^\w\s]', ' ', lowercased)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

    # Step 3: Tokenization
    raw_tokens = cleaned_text.split() if cleaned_text else []

    # Step 4: Stop-word handling & Normalization (Stemming)
    filtered_tokens = [t for t in raw_tokens if t not in DEFAULT_STOP_WORDS and len(t) > 1]
    
    # Stemming
    stemmed_tokens = [stemmer.stem(t) for t in filtered_tokens]

    # Processed Text
    processed_text = " ".join(stemmed_tokens)

    return {
        "original_text": original_text,
        "cleaned_text": cleaned_text,
        "tokens": raw_tokens,
        "filtered_tokens": filtered_tokens,
        "stemmed_tokens": stemmed_tokens,
        "processed_text": processed_text
    }

def custom_tokenizer(text: str):
    """Vectorizer custom tokenizer wrapper."""
    nlp_res = process_nlp_pipeline(text)
    return nlp_res["stemmed_tokens"]
