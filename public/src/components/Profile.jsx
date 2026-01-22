import React, { useState, useEffect } from 'react';
import Quiz from './Quiz';
import './Profile.css';

const Profile = ({ onLogout, studentId, studentName }) => {
    const [userData, setUserData] = useState({
        name: studentName || 'Бабаева Алиса',
        group: '7 класс',
        avatar: 'avatar6' // вернули прежний аватар ученика
    });

    // Встроенные аватары
    const avatars = [
        { id: 'avatar1', src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', name: 'Аватар 1' },
        { id: 'avatar2', src: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', name: 'Аватар 2' },
        { id: 'avatar3', src: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png', name: 'Аватар 3' },
        { id: 'avatar4', src: 'https://cdn-icons-png.flaticon.com/512/921/921071.png', name: 'Аватар 4' },
        { id: 'avatar5', src: 'https://cdn-icons-png.flaticon.com/512/4202/4202843.png', name: 'Аватар 5' },
        { id: 'avatar6', src: 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png', name: 'Аватар 6' }
    ];

    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [materials, setMaterials] = useState([]);

    const [activeTab, setActiveTab] = useState('materials');
    const [stats, setStats] = useState({
        testsCompleted: 0,
        totalScore: 0,
        averageScore: 0
    });
    const [testTimer, setTestTimer] = useState(null);
    const [tests, setTests] = useState([]);
    const [showTestModal, setShowTestModal] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);

    // Функция для получения данных учителя
    const getTeacherData = () => {
        try {
            const storedData = localStorage.getItem('teacherData');
            return storedData ? JSON.parse(storedData) : null;
        } catch (error) {
            console.error('Ошибка загрузки данных учителя:', error);
            return null;
        }
    };

    // Функция для загрузки сохраненного прогресса ученика
    const loadStudentProgress = () => {
        try {
            const studentKey = `studentProgress_${studentId || studentName}`;
            const savedProgress = localStorage.getItem(studentKey);
            return savedProgress ? JSON.parse(savedProgress) : null;
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            return null;
        }
    };

    // Функция для сохранения прогресса ученика
    const saveStudentProgress = (progressData) => {
        try {
            const studentKey = `studentProgress_${studentId || studentName}`;
            localStorage.setItem(studentKey, JSON.stringify(progressData));
        } catch (error) {
            console.error('Ошибка сохранения прогресса:', error);
        }
    };

    // Функция для обновления статистики
    const updateStats = (results) => {
        const testsCompleted = results.length;
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const averageScore = testsCompleted > 0 ? Math.round(totalScore / testsCompleted) : 0;

        const newStats = {
            testsCompleted,
            totalScore,
            averageScore
        };

        setStats(newStats);
        return newStats;
    };

    // Функция для проверки существования теста в данных учителя
    const isTestExists = (testId) => {
        const teacherData = getTeacherData();
        if (!teacherData) return false;

        return teacherData.tests.some(test => test.id === testId);
    };

    // Загрузка статистики из localStorage
    const loadStats = () => {
        const progressData = loadStudentProgress();
        if (progressData) {
            if (progressData.stats) {
                setStats(progressData.stats);
            }
        }
    };

    // Функция для загрузки данных ученика
    const loadStudentData = () => {
        const teacherData = getTeacherData();
        const progressData = loadStudentProgress();

        // Загружаем статистику и результаты тестов
        loadStats();

        // Загружаем аватар из сохраненных данных
        if (progressData?.avatar) {
            setUserData(prev => ({ ...prev, avatar: progressData.avatar }));
        }

        if (teacherData) {
            // Находим ученика и его группу в данных учителя
            let foundStudent = null;
            let foundGroup = null;

            teacherData.groups?.forEach(group => {
                if (foundStudent) return;
                const s = group.students?.find(st => st.id === studentId || st.name === studentName);
                if (s) {
                    foundStudent = s;
                    foundGroup = group;
                }
            });

            if (foundStudent && foundGroup) {
                setUserData(prev => ({
                    ...prev,
                    name: foundStudent.name,
                    group: foundGroup.name
                }));
            }

            // Загружаем материалы и тесты для группы ученика
            const groupId = foundGroup?.id;
            if (groupId) {
                // Материалы для группы ученика
                const groupMaterials = teacherData.materials.filter(material =>
                    material.assignedTo.includes(groupId)
                );

                // Загружаем прогресс материалов из сохраненных данных ученика
                const savedMaterials = progressData?.materials || [];

                setMaterials(groupMaterials.map(material => {
                    const savedMaterial = savedMaterials.find(m => m.id === material.id);
                    return {
                        ...material,
                        icon: getMaterialIcon(material.type),
                        progress: savedMaterial?.progress || 0,
                        fileUrl: material.fileUrl || null,
                        fileName: material.fileName || null
                    };
                }));

                // Тесты для группы ученика
                const groupTests = teacherData.tests?.filter(test =>
                    test.assignedTo.includes(groupId)
                ) || [];

                // Загружаем прогресс тестов из сохраненных данных ученика
                const savedTestResults = progressData?.testResults || [];

                setTests(groupTests.map(test => {
                    const savedResult = savedTestResults.find(result => result.testId === test.id);
                    return {
                        ...test,
                        completed: !!savedResult,
                        score: savedResult?.score || 0,
                        date: savedResult?.date || null
                    };
                }));

            }
        }
    };

    // Подписка на изменения данных учителя
    useEffect(() => {
        loadStudentData();

        const handleStorageChange = (event) => {
            if (event.key === 'teacherData') {
                loadStudentData();
            }
        };

        const handleTeacherDataUpdated = () => {
            loadStudentData();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('teacherDataUpdated', handleTeacherDataUpdated);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('teacherDataUpdated', handleTeacherDataUpdated);
    };
    }, [studentId, studentName]);

    useEffect(() => {
        return () => {
            if (testTimer) {
                clearInterval(testTimer);
            }
        };
    }, []);

    const getMaterialIcon = (type) => {
        switch (type) {
            case 'pdf': return '📚';
            case 'video': return '🎬';
            case 'audio': return '🎵';
            case 'text': return '📝';
            default: return '📄';
        }
    };

    const handleAvatarChange = (avatarId) => {
        setUserData(prev => ({ ...prev, avatar: avatarId }));
        setShowAvatarSelector(false);

        // Сохраняем выбор аватара
        const progressData = loadStudentProgress() || {};
        progressData.avatar = avatarId;
        saveStudentProgress(progressData);
    };

    const handleMaterialClick = (material) => {
        // Обновление прогресса материала
        const updatedMaterials = materials.map(m =>
            m.id === material.id
                ? { ...m, progress: Math.min(m.progress + 25, 100) }
                : m
        );
        setMaterials(updatedMaterials);

        // Сохраняем прогресс
        const progressData = loadStudentProgress() || {};
        progressData.materials = updatedMaterials;
        saveStudentProgress(progressData);
    };

    const calculateOverallProgress = () => {
        const totalMaterials = materials.length;
        const completedMaterials = materials.filter(m => m.progress === 100).length;
        return totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Функция для скачивания файла из data URL
    const downloadFile = (dataUrl, fileName) => {
        try {
            if (!dataUrl) {
                alert('Файл недоступен для скачивания');
                return;
            }

            // Проверяем, является ли это data URL
            if (dataUrl.startsWith('data:')) {
                // Извлекаем данные из data URL
                const arr = dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                
                // Создаем Blob из данных
                const blob = new Blob([u8arr], { type: mime });
                const url = window.URL.createObjectURL(blob);
                
                // Создаем временную ссылку для скачивания
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName || 'material';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                
                // Очищаем
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } else {
                // Если это обычный URL (blob: или http://)
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = fileName || 'material';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
            }
        } catch (error) {
            console.error('Ошибка скачивания файла:', error);
            alert('Не удалось скачать файл. Попробуйте еще раз.');
        }
    };



    const handleTestStart = (test) => {
        setCurrentTest(test);
        setShowTestModal(true);
    };

    const handleTestComplete = (result) => {
        // Сохраняем результат теста
        const progressData = loadStudentProgress() || {};
        const testResult = {
            testId: currentTest.id,
            testName: currentTest.title,
            score: result.score,
            date: new Date().toLocaleDateString('ru-RU'),
            mistakes: result.mistakes || []
        };

        // Обновляем результаты тестов
        const existingResults = progressData.testResults || [];
        const updatedResults = existingResults.filter(r => r.testId !== currentTest.id);
        updatedResults.push(testResult);
        progressData.testResults = updatedResults;

        // Обновляем статистику
        const stats = updateStats(updatedResults);
        progressData.stats = stats;

        saveStudentProgress(progressData);

        // Обновляем локальное состояние
        setTests(prevTests =>
            prevTests.map(test =>
                test.id === currentTest.id
                    ? { ...test, completed: true, score: result.score, date: testResult.date }
                    : test
            )
        );

        // Закрываем модальное окно
        setShowTestModal(false);
        setCurrentTest(null);

        // Обновляем статистику в компоненте
        setStats(stats);
    };

    // Рендер модального окна теста
    const renderTestModal = () => {
        if (!currentTest) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content test-modal">
                    <div className="modal-header">
                        <h2>{currentTest.title}</h2>
                        <button
                            onClick={() => {
                                setShowTestModal(false);
                                setCurrentTest(null);
                            }}
                            className="close-btn"
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        <Quiz
                            quiz={currentTest}
                            onClose={() => {
                                setShowTestModal(false);
                                setCurrentTest(null);
                            }}
                            onComplete={handleTestComplete}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="header-content">
                    <h1>Личный кабинет ученика</h1>
                    <button onClick={onLogout} className="logout-btn">
                        Выйти
                    </button>
                </div>
            </header>

            <div className="profile-content">
                <section className="profile-section">
                    <div className="profile-card">
                        <div className="profile-info">
                            <div className="avatar-container">
                                <div
                                    className="avatar"
                                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img
                                        src={avatars.find(a => a.id === userData.avatar)?.src}
                                        alt="Аватар"
                                    />
                                    <div className="avatar-change-indicator">✏️</div>
                                </div>

                                {showAvatarSelector && (
                                    <div className="avatar-selector">
                                        <div className="avatar-selector-header">
                                            <h3>Выберите аватар</h3>
                                            <button
                                                onClick={() => setShowAvatarSelector(false)}
                                                className="close-btn"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="avatar-grid">
                                            {avatars.map(avatar => (
                                                <div
                                                    key={avatar.id}
                                                    className={`avatar-option ${userData.avatar === avatar.id ? 'selected' : ''}`}
                                                    onClick={() => handleAvatarChange(avatar.id)}
                                                >
                                                    <img src={avatar.src} alt={avatar.name} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="user-info">
                                <h2>{userData.name}</h2>
                                <p className="group">{userData.group}</p>
                                <div className="user-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Тестов пройдено:</span>
                                        <span className="stat-value">{stats.testsCompleted}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Общий балл:</span>
                                        <span className="stat-value">{stats.totalScore}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Средний балл:</span>
                                        <span className="stat-value">{stats.averageScore}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Общий прогресс:</span>
                                        <span className="stat-value">{calculateOverallProgress()}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="profile-navigation">
                    <button
                        className={`nav-btn ${activeTab === 'materials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('materials')}
                    >
                        📚 Учебные материалы
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'tests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tests')}
                    >
                        🧪 Тесты
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        📊 Статистика
                    </button>
                </div>

                {activeTab === 'materials' && (
                    <section className="materials-section">
                        <div className="section-header">
                            <h2>📚 Учебные материалы</h2>
                            <p>Изучайте теорию и практику музыки</p>
                        </div>

                        <div className="materials-grid">
                            {materials.map(material => (
                                <div
                                    key={material.id}
                                    className="material-card"
                                    onClick={() => handleMaterialClick(material)}
                                >
                                    <div className="material-icon">{material.icon}</div>
                                    <div className="material-content">
                                        <h3 className="material-title">{material.title}</h3>
                                        <p className="material-description">{material.description}</p>
                                        <div className="material-meta">
                                            <span className="material-date">Добавлен: {material.uploadDate}</span>
                                        </div>
                                        {material.fileUrl && (
                                            <div className="material-file student-material-file" onClick={(e) => {
                                                e.stopPropagation();
                                                downloadFile(material.fileUrl, material.fileName || 'material');
                                            }}>
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        downloadFile(material.fileUrl, material.fileName || 'material');
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    📎 {material.fileName || 'Скачать файл'}
                                                </a>
                                            </div>
                                        )}
                                        {!material.fileUrl && (
                                            <div className="material-file student-material-file" onClick={(e) => e.stopPropagation()}>
                                                <span className="material-no-file">Файл не прикреплен</span>
                                            </div>
                                        )}
                                        {material.progress > 0 && (
                                            <div className="progress-container">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${material.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="progress-text">{material.progress}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {materials.length === 0 && (
                            <div className="empty-content">
                                <div className="empty-icon">📚</div>
                                <h3>Нет доступных материалов</h3>
                                <p>Учитель еще не добавил учебные материалы для вашей группы</p>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'tests' && (
                    <section className="tests-section">
                        <div className="section-header">
                            <h2>🧪 Доступные тесты</h2>
                            <p>Проверьте свои знания</p>
                        </div>

                        <div className="tests-grid">
                            {tests.map(test => (
                                <div
                                    key={test.id}
                                    className={`test-card ${test.completed ? 'completed' : ''}`}
                                >
                                    <div className="test-content">
                                        <h3>{test.title}</h3>
                                        <p>{test.description || 'Тест по музыкальной теории'}</p>
                                        <div className="test-meta">
                                            <span>Вопросов: {test.questions.length}</span>
                                            <span>Время: {test.timeLimit} мин</span>
                                            <span className={`difficulty ${test.difficulty.toLowerCase()}`}>
                                                {test.difficulty}
                                            </span>
                                            {test.completed && (
                                                <>
                                                    <span>Результат: {test.score}/100</span>
                                                    {test.date && <span>Дата: {test.date}</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="test-actions">
                                        {test.completed ? (
                                            <button className="retest-btn" onClick={() => handleTestStart(test)}>
                                                Перепройти
                                            </button>
                                        ) : (
                                            <button className="start-test-btn" onClick={() => handleTestStart(test)}>
                                                Начать тест
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {tests.length === 0 && (
                            <div className="empty-content">
                                <div className="empty-icon">🧪</div>
                                <h3>Нет доступных тестов</h3>
                                <p>Учитель еще не добавил тесты для вашей группы</p>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'stats' && (
                    <section className="stats-section">
                        <div className="section-header">
                            <h2>📊 Статистика и достижения</h2>
                            <p>Ваши результаты и прогресс</p>
                        </div>

                        {(() => {
                            const progressData = loadStudentProgress();
                            const testResults = progressData?.testResults || [];

                            if (testResults.length === 0) {
                                return (
                                    <div className="empty-content">
                                        <div className="empty-icon">📊</div>
                                        <h3>Статистика появится здесь</h3>
                                        <p>После прохождения тестов здесь отобразятся ваши результаты и достижения</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="tests-grid">
                                    {testResults.map((result, index) => (
                                        <div key={index} className="test-card completed">
                                            <div className="test-content">
                                                <h3>{result.testName}</h3>
                                                <div className="test-meta">
                                                    <span className="test-date">📅 {result.date}</span>
                                                    {result.mistakes && result.mistakes.length > 0 && (
                                                        <span className="test-mistakes">
                                                            ❌ Ошибок: {result.mistakes.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="test-result">
                                                <span className="score-display">{result.score}%</span>
                                            </div>
                                            {result.mistakes && result.mistakes.length > 0 && (
                                                <div className="test-mistakes-details">
                                                    <h5>Ошибки:</h5>
                                                    {result.mistakes.slice(0, 2).map((mistake, mistakeIndex) => (
                                                        <div key={mistakeIndex} className="mistake-summary">
                                                            <p><strong>Вопрос:</strong> {mistake.question.substring(0, 50)}...</p>
                                                            <p><strong>Ваш:</strong> <span className="wrong">{mistake.userAnswer}</span></p>
                                                            <p><strong>Правильный:</strong> <span className="correct">{mistake.correctAnswer}</span></p>
                                                        </div>
                                                    ))}
                                                    {result.mistakes.length > 2 && (
                                                        <p className="more-mistakes">... и ещё {result.mistakes.length - 2} ошибок</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </section>
                )}
            </div>

            {showTestModal && renderTestModal()}
        </div>
    );
};

export default Profile;
