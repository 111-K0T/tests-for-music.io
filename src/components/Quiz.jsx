import React, { useState, useEffect } from 'react';
import './Quiz.css';

const Quiz = ({ quiz, onClose, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // в секундах
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [results, setResults] = useState(null);
    const [focusMode, setFocusMode] = useState(false);

    const currentQuestion = quiz.questions[currentQuestionIndex];

    // Таймер
    useEffect(() => {
        if (timeLeft > 0 && !quizCompleted) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !quizCompleted) {
            handleSubmitQuiz();
        }
    }, [timeLeft, quizCompleted]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (answer) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitQuiz = () => {
        // Calculate score and mistakes
        const score = quiz.questions.reduce((total, question, index) => {
            const userAnswer = selectedAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            return total + (isCorrect ? 1 : 0);
        }, 0);

        const percentage = Math.round((score / quiz.questions.length) * 100);

        const mistakes = quiz.questions
            .map((question, index) => {
                const userAnswer = selectedAnswers[index];
                if (userAnswer !== question.correctAnswer) {
                    return {
                        questionIndex: index,
                        question: question.question,
                        userAnswer: userAnswer || 'Не отвечено',
                        correctAnswer: question.correctAnswer
                    };
                }
                return null;
            })
            .filter(mistake => mistake !== null);

        // Call the parent component's completion handler
        if (onComplete) {
            onComplete({ score: percentage, mistakes });
        } else {
            // Fallback for display if no completion handler
            const resultsData = {
                score: percentage,
                totalQuestions: quiz.questions.length,
                correctAnswers: score,
                mistakes: mistakes,
                date: new Date().toLocaleDateString('ru-RU'),
                timeSpent: quiz.timeLimit * 60 - timeLeft
            };

            setResults(resultsData);
            setQuizCompleted(true);
        }
    };

    if (quizCompleted && results) {
        return (
            <div className="quiz-results">
                <div className="results-header">
                    <h2>Результаты теста</h2>
                    <div className="score-display">
                        <div className="score-details">
                            <p>Правильных ответов: {results.correctAnswers} из {results.totalQuestions}</p>
                            <p>Время выполнения: {Math.floor(results.timeSpent / 60)}:{(results.timeSpent % 60).toString().padStart(2, '0')}</p>
                        </div>
                    </div>
                </div>

                {results.mistakes.length > 0 && (
                    <div className="mistakes-section">
                        <h3>Ошибки:</h3>
                        {results.mistakes.map((mistake, index) => (
                            <div key={index} className="mistake-item">
                                <h4>Вопрос: {mistake.question}</h4>
                                <p><strong>Ваш ответ:</strong> <span className="wrong-answer">{mistake.userAnswer}</span></p>
                                <p><strong>Правильный ответ:</strong> <span className="correct-answer">{mistake.correctAnswer}</span></p>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="finish-btn"
                    onClick={onClose}
                >
                    Завершить
                </button>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <div className="quiz-header">
                <h2>{quiz.title}</h2>
                <div className="quiz-info">
                    <span className="question-counter">
                        Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}
                    </span>
                    <span className="timer">
                        ⏱️ {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div className="question-card">
                {currentQuestion.image && (
                    <div className="question-image">
                        <img
                            src={currentQuestion.image}
                            alt="Вопрос"
                            className="question-img"
                        />
                    </div>
                )}

                <div className="question-text">
                    <h3>{currentQuestion.question}</h3>
                </div>

                <div className="answers-grid">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            className={`answer-option ${
                                selectedAnswers[currentQuestionIndex] === option ? 'selected' : ''
                            }`}
                            onClick={() => handleAnswerSelect(option)}
                        >
                            <span className="option-letter">
                                {['А', 'Б', 'В', 'Г'][index]}
                            </span>
                            <span className="option-text">{option}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="quiz-navigation">
                <button
                    className="nav-btn prev-btn"
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                >
                    ← Предыдущий
                </button>

                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                    ></div>
                </div>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                        className="nav-btn submit-btn"
                        onClick={handleSubmitQuiz}
                    >
                        Завершить тест
                    </button>
                ) : (
                    <button
                        className="nav-btn next-btn"
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                    >
                        Следующий →
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;
