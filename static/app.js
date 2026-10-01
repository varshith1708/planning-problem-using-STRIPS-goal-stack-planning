/**
 * Front-end Logic for NLP-Based Text Classification & Explainable AI Demo.
 * Manages API calls, Chart.js visualizations, NLP pipeline updates, XAI displays,
 * classifier comparisons, and UI accordion/navigation state.
 */

// Global Chart references for updating dynamically
let tfidfChartInstance = null;
let xaiChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAccordion();
    initEventListeners();
});

/**
 * Initializes smooth sidebar navigation and scroll spy.
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

/**
 * Initializes interactive accordion for 'How It Works' section.
 */
function initAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('active');
        });
    });
}

/**
 * Attaches event listeners for input actions and preset examples.
 */
function initEventListeners() {
    const textInput = document.getElementById('text-input');
    const charCounter = document.getElementById('char-counter');
    const classifyBtn = document.getElementById('classify-btn');
    const compareBtn = document.getElementById('compare-btn');
    const clearBtn = document.getElementById('clear-btn');
    const demoBtns = document.querySelectorAll('.demo-btn');

    // Live character counter update
    textInput.addEventListener('input', () => {
        charCounter.textContent = `${textInput.value.length} / 1000 characters`;
    });

    // Preset Demo Example click handler
    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const exampleText = btn.getAttribute('data-text');
            textInput.value = exampleText;
            charCounter.textContent = `${exampleText.length} / 1000 characters`;
            classifyText();
        });
    });

    // Action button listeners
    classifyBtn.addEventListener('click', classifyText);
    compareBtn.addEventListener('click', compareClassifiers);
    clearBtn.addEventListener('click', clearInputs);
}

/**
 * Shows alert message inside error banner container.
 */
function showError(message) {
    const alertBox = document.getElementById('error-alert');
    alertBox.style.display = 'flex';
    alertBox.querySelector('.alert-message').textContent = message;
}

/**
 * Hides error alert banner.
 */
function hideError() {
    const alertBox = document.getElementById('error-alert');
    alertBox.style.display = 'none';
}

/**
 * Clears text input and resets results display.
 */
function clearInputs() {
    document.getElementById('text-input').value = '';
    document.getElementById('char-counter').textContent = '0 / 1000 characters';
    hideError();
    
    // Hide side-by-side comparison box
    document.getElementById('compare-results-card').style.display = 'none';
}

/**
 * Calls API endpoint /api/classify and updates dashboard.
 */
async function classifyText() {
    const text = document.getElementById('text-input').value.trim();
    const classifier = document.getElementById('classifier-select').value;
    
    hideError();

    if (!text) {
        showError("Please enter a sentence in the text area before running classification.");
        return;
    }

    const classifyBtn = document.getElementById('classify-btn');
    classifyBtn.disabled = true;
    classifyBtn.textContent = 'Processing...';

    try {
        const response = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, classifier: classifier })
        });

        const json = await response.json();

        if (response.ok && json.status === 'success') {
            const data = json.data;
            renderPredictionResults(data);
            renderNlpPipeline(data.nlp_pipeline);
            renderTfidfFeatures(data.tfidf_features);
            renderExplainability(data.explainability);
        } else {
            showError(json.message || "An error occurred during classification.");
        }
    } catch (err) {
        console.error("Classification error:", err);
        showError("Failed to communicate with AI model backend server.");
    } finally {
        classifyBtn.disabled = false;
        classifyBtn.innerHTML = '⚡ Classify Text';
    }
}

/**
 * Calls API endpoint /api/compare to compare predictions across all 3 classifiers.
 */
async function compareClassifiers() {
    const text = document.getElementById('text-input').value.trim();
    hideError();

    if (!text) {
        showError("Please enter a sentence to compare classifiers.");
        return;
    }

    const compareBtn = document.getElementById('compare-btn');
    compareBtn.disabled = true;
    compareBtn.textContent = 'Comparing...';

    try {
        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        const json = await response.json();

        if (response.ok && json.status === 'success') {
            renderClassifierComparisonCards(json.text, json.comparisons);
        } else {
            showError(json.message || "Failed to compare classifiers.");
        }
    } catch (err) {
        console.error("Comparison error:", err);
        showError("Server error during classifier comparison.");
    } finally {
        compareBtn.disabled = false;
        compareBtn.innerHTML = '⚖️ Compare Classifiers';
    }
}

/**
 * Renders main prediction badge, confidence, and probability distribution.
 */
function renderPredictionResults(data) {
    const badge = document.getElementById('prediction-badge');
    const confidenceText = document.getElementById('prediction-confidence');
    const modelUsedText = document.getElementById('prediction-model');
    const probTypeNotice = document.getElementById('prob-type-notice');
    
    // Set Prediction Badge
    badge.textContent = data.prediction;
    badge.className = 'badge-label ' + 
        (data.prediction === 'Positive' ? 'badge-positive' : 
         data.prediction === 'Negative' ? 'badge-negative' : 'badge-neutral');

    // Set Confidence Score
    confidenceText.textContent = `${data.confidence}%`;
    modelUsedText.textContent = `Model: ${data.classifier}`;

    // Probabilities type notice
    probTypeNotice.textContent = data.is_native_probability ?
        "Native Probability (predict_proba)" :
        "Calibrated Decision Function Confidence (Non-Native Probability Model)";

    // Update Progress Bars for Class Probabilities
    const probs = data.probabilities;
    updateProbBar('pos', probs.Positive || 0);
    updateProbBar('neu', probs.Neutral || 0);
    updateProbBar('neg', probs.Negative || 0);
}

function updateProbBar(type, value) {
    const percent = Math.round(value * 100);
    document.getElementById(`prob-val-${type}`).textContent = `${percent}%`;
    document.getElementById(`prob-bar-${type}`).style.width = `${percent}%`;
}

/**
 * Renders NLP Pipeline intermediate steps.
 */
function renderNlpPipeline(nlp) {
    document.getElementById('nlp-original').textContent = nlp.original_text || '—';
    document.getElementById('nlp-cleaned').textContent = nlp.cleaned_text || '—';
    
    // Raw Tokens Chip view
    const tokensContainer = document.getElementById('nlp-tokens');
    tokensContainer.innerHTML = '';
    if (nlp.tokens && nlp.tokens.length > 0) {
        nlp.tokens.forEach(tok => {
            const chip = document.createElement('span');
            chip.className = 'token-chip';
            chip.textContent = tok;
            tokensContainer.appendChild(chip);
        });
    } else {
        tokensContainer.textContent = 'None';
    }

    // Processed text
    document.getElementById('nlp-processed').textContent = nlp.processed_text || '—';
}

/**
 * Renders TF-IDF feature table and horizontal bar chart.
 */
function renderTfidfFeatures(features) {
    const tableBody = document.getElementById('tfidf-table-body');
    tableBody.innerHTML = '';

    if (!features || features.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2" class="text-muted">No non-zero TF-IDF features found.</td></tr>';
        if (tfidfChartInstance) tfidfChartInstance.destroy();
        return;
    }

    // Populate Table
    features.slice(0, 8).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code>${item.word}</code></td>
            <td><strong>${item.score.toFixed(4)}</strong></td>
        `;
        tableBody.appendChild(row);
    });

    // Render Chart.js Chart
    const ctx = document.getElementById('tfidf-chart').getContext('2d');
    if (tfidfChartInstance) tfidfChartInstance.destroy();

    const labels = features.slice(0, 8).map(f => f.word);
    const scores = features.slice(0, 8).map(f => f.score);

    tfidfChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'TF-IDF Score',
                data: scores,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true, max: 1.0 }
            }
        }
    });
}

/**
 * Renders Explainable AI (XAI) highlighted sentence, word contributions, and chart.
 */
function renderExplainability(xai) {
    // Sentence Token Highlighting
    const highlightBox = document.getElementById('highlighted-sentence-box');
    highlightBox.innerHTML = '';

    if (xai.highlighted_sentence && xai.highlighted_sentence.length > 0) {
        xai.highlighted_sentence.forEach(item => {
            const span = document.createElement('span');
            span.className = `tok-highlight tok-${item.tag}`;
            span.textContent = item.word;
            span.title = `Impact Weight: ${item.impact}`;
            highlightBox.appendChild(span);
            highlightBox.appendChild(document.createTextNode(' '));
        });
    }

    // Dynamic Human Explanation
    const explanationContainer = document.getElementById('human-explanation-text');
    explanationContainer.innerHTML = xai.human_explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Positive vs Negative Word Contribution Chart
    const ctx = document.getElementById('xai-chart').getContext('2d');
    if (xaiChartInstance) xaiChartInstance.destroy();

    const topWords = (xai.word_contributions || []).slice(0, 8);
    const labels = topWords.map(w => w.word);
    const values = topWords.map(w => w.score);
    const colors = values.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)');
    const borderColors = values.map(v => v >= 0 ? '#10b981' : '#ef4444');

    xaiChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentiment Weight Impact',
                data: values,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/**
 * Renders side-by-side comparison of all 3 classifiers.
 */
function renderClassifierComparisonCards(text, comparisons) {
    const container = document.getElementById('compare-cards-container');
    const resultCard = document.getElementById('compare-results-card');
    container.innerHTML = '';

    document.getElementById('compare-text-quote').textContent = `"${text}"`;

    for (const [modelName, data] of Object.entries(comparisons)) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '0';

        const badgeClass = data.prediction === 'Positive' ? 'badge-positive' :
                           data.prediction === 'Negative' ? 'badge-negative' : 'badge-neutral';

        card.innerHTML = `
            <div class="card-title">${modelName}</div>
            <div style="text-align: center; margin: 12px 0;">
                <span class="badge-label ${badgeClass}" style="font-size: 14px; padding: 4px 14px;">${data.prediction}</span>
                <div style="font-size: 24px; font-weight: 800; margin-top: 8px;">${data.confidence}%</div>
                <div style="font-size: 11px; color: #64748b;">Confidence</div>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;">
            <div style="font-size: 12px; color: #475569;">
                <div><strong>Test Accuracy:</strong> ${(data.metrics.accuracy * 100).toFixed(1)}%</div>
                <div><strong>Precision:</strong> ${(data.metrics.precision * 100).toFixed(1)}%</div>
                <div><strong>F1-Score:</strong> ${(data.metrics.f1_score * 100).toFixed(1)}%</div>
            </div>
        `;
        container.appendChild(card);
    }

    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth' });
}
