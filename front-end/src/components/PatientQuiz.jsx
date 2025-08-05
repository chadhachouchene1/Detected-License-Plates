import React from 'react';
import '../css/PatientQuizUI.css';

const PatientQuizUI = () => {
  return (
    <div className="quiz-container">
      <h1>🩺 Medical Robot Assistant</h1>

      <div className="quiz-card">
        <div className="header">
          <label htmlFor="name">👤 Patient Name:</label>
          <input type="text" id="name" placeholder="e.g. Chadha B." />
        </div>

        <div className="quiz-meta">
          <h2>📋 Quiz: Diabetes Screening</h2>
          <p>🧬 Pathology: <strong>Diabetes</strong></p>
        </div>

        <div className="question">
          <p>1. Do you feel thirsty often?</p>
          <label><input type="radio" name="q1" /> Yes</label>
          <label><input type="radio" name="q1" /> No</label>
        </div>

        <div className="question">
          <p>2. Do you urinate frequently?</p>
          <label><input type="radio" name="q2" /> Yes</label>
          <label><input type="radio" name="q2" /> No</label>
        </div>

        <div className="question">
          <p>3. Have you experienced sudden weight loss?</p>
          <label><input type="radio" name="q3" /> Yes</label>
          <label><input type="radio" name="q3" /> No</label>
        </div>

        <button className="submit-btn">Submit</button>

        {/* After submission (fake static example) */}
        <div className="result-box">
          <h3>✅ Code Generated: <span className="code">4892</span></h3>
          <p>📩 Show this code to your doctor.</p>
        </div>
      </div>
    </div>
  );
};

export default PatientQuizUI;
