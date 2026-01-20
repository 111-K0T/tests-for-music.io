import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [userType, setUserType] = useState('student');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Получение данных для входа из localStorage
    const getLoginData = () => {
        // Данные учителя (постоянные)
        const teacherData = {
            'Лилия Нуховна': {
                password: 'teacher'
            }
        };

        // Данные учеников из localStorage
        const studentData = {};
        try {
            const teacherStorage = localStorage.getItem('teacherData');
            const studentPasswords = localStorage.getItem('studentPasswords');

            if (teacherStorage) {
                // Загружаем данные из teacherData если они существуют
                const teacherDataParsed = JSON.parse(teacherStorage);
                const passwords = studentPasswords ? JSON.parse(studentPasswords) : {};

                teacherDataParsed.groups?.forEach(group => {
                    group.students?.forEach(student => {
                        studentData[student.name] = {
                            password: passwords[student.name] || 'student1',
                            group: group.name,
                            studentId: student.id
                        };
                    });
                });
            } else {
                // Если teacherData не существует, используем данные по умолчанию для учеников
                const defaultStudentData = {
                    'Бабаева Алиса': {
                        password: 'student1',
                        group: '7 класс',
                        studentId: 1
                    }
                };

                // Сохраняем данные по умолчанию в localStorage для совместимости
                const defaultTeacherData = {
                    groups: [
                        {
                            id: 1,
                            name: '7 класс',
                            students: [
                                {
                                    id: 1,
                                    name: 'Бабаева Алиса',
                                    avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
                                    testsCompleted: 0,
                                    averageScore: 0,
                                    lastActivity: null,
                                    testResults: []
                                }
                            ]
                        }
                    ],
                    tests: [],
                    materials: []
                };

                localStorage.setItem('teacherData', JSON.stringify(defaultTeacherData));
                localStorage.setItem('studentPasswords', JSON.stringify({ 'Бабаева Алиса': 'student1' }));

                Object.assign(studentData, defaultStudentData);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // В случае ошибки используем минимальные данные по умолчанию
            studentData['Бабаева Алиса'] = {
                password: 'student1',
                group: '7 класс',
                studentId: 1
            };
        }

        return {
            student: studentData,
            teacher: teacherData
        };
    };

    const authors = [
        {
            name: 'Бабаева Алиса',
            role: 'Главный програмист',
            description: 'Тот самый человек, который знает, как всё устроено «под капотом». Пишу код, исправляю баги и слежу, чтобы сайт работал быстрее, чем вы успеете моргнуть',
            photo: '/authors/aisylu.jpg'
        },
        {
            name: 'Лилия Нуховна',
            role: 'Учитель музыки',
            description: 'Открываю детям мир гармонии и звуков. Учу не просто слышать музыку, но и понимать её язык, превращая каждый урок в маленькое творческое путешествие',
            photo: '/authors/lilia.jpg'
        },
        {
            name: 'Усманов Алан',
            role: 'Помощник программиста',
            description: 'Креативное сердце проекта. Отвечаю за то, чтобы сайт был не просто набором функций, а живым и стильным пространством, в которое хочется возвращаться',
            photo: '/authors/ildar.jpg'
        }
    ];

    // Функция для обработки ошибок загрузки изображения
    const handleImageError = (e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.classList.add('no-photo');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const loginData = getLoginData();
        const userData = loginData[userType];

        // Проверяем существует ли пользователь
        if (!userData[name]) {
            setError('Пользователь не найден');
            return;
        }

        const user = userData[name];

        // Проверяем пароль
        if (user.password === password) {
            console.log('Успешный вход:', { type: userType, name: name });
            onLogin({
                type: userType,
                name: name,
                ...(userType === 'student' && {
                    group: user.group,
                    studentId: user.studentId
                })
            });
            setError('');
        } else {
            setError('Неверный пароль');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Вход в систему</h1>

                <div className="user-type-toggle">
                    <button
                        className={`toggle-btn ${userType === 'student' ? 'active' : ''}`}
                        onClick={() => setUserType('student')}
                    >
                        👨‍🎓 Ученик
                    </button>
                    <button
                        className={`toggle-btn ${userType === 'teacher' ? 'active' : ''}`}
                        onClick={() => setUserType('teacher')}
                    >
                        👩‍🏫 Учитель
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="name">
                            {userType === 'student' ? 'Имя ученика' : 'Имя учителя'}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={userType === 'student' ? 'Введите ваше имя' : 'Введите имя учителя'}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-btn">
                        Войти
                    </button>
                </form>
            </div>

            <div className="authors-block">
                <h3>Команда курса</h3>
                <p className="authors-intro">
                    Над проектом работает команда преподавателей и разработчиков, чтобы обучение музыке было доступным и удобным.
                </p>
                <div className="authors-grid">
                    {authors.map((author, idx) => (
                        <div key={author.name} className={`author-card ${idx === 1 ? 'featured' : ''}`}>
                            <div className="author-photo">
                                <img 
                                    src={author.photo} 
                                    alt={author.name}
                                    onError={handleImageError}
                                />
                                <div className="photo-placeholder">Фото пока нет</div>
                            </div>
                            <div className="author-info">
                                <p className="author-name">{author.name}</p>
                                <p className="author-role">{author.role}</p>
                                <p className="author-description">{author.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Login;
