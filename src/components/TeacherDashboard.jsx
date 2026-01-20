import React, { useState, useEffect } from 'react';
import './TeacherDashboard.css';
const TeacherDashboard = ({ onLogout }) => {
    const [userData, setUserData] = useState({
        name: 'Габдуллина Лилия Нуховна',
        subject: 'Музыка',
        avatar: 'teacher-avatar1',
    });

    const [activeTab, setActiveTab] = useState('groups');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showCreateTestModal, setShowCreateTestModal] = useState(false);
    const [showEditTestModal, setShowEditTestModal] = useState(false);
    const [showTestResultsModal, setShowTestResultsModal] = useState(false);
    const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false);
    const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
    const [editMaterial, setEditMaterial] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
    const [selectedGroupForStudent, setSelectedGroupForStudent] = useState(null);
    const [newGroup, setNewGroup] = useState({ name: '' });
    const defaultStudentAvatar = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
    const [newStudent, setNewStudent] = useState({ name: '', password: '', groupId: null, avatar: defaultStudentAvatar });
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState(null);
    const [editGroupName, setEditGroupName] = useState('');


    // Встроенные аватары для учителя
    const avatars = [
        { id: 'teacher-avatar1', src: 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png', name: 'Аватар 1' },
        { id: 'teacher-avatar2', src: 'https://cdn-icons-png.flaticon.com/512/4140/4140046.png', name: 'Аватар 2' },
        { id: 'teacher-avatar3', src: 'https://cdn-icons-png.flaticon.com/512/4140/4140045.png', name: 'Аватар 3' },
        { id: 'teacher-avatar4', src: 'https://cdn-icons-png.flaticon.com/512/4140/4140044.png', name: 'Аватар 4' },
    ];

    // Хелпер для конвертации файла в dataURL (чтобы ученики могли скачать после перезагрузки)
    const readFileAsDataUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Получение данных из localStorage
    const getStoredData = () => {
        const storedData = localStorage.getItem('teacherData');
        return storedData ? JSON.parse(storedData) : null;
    };

    // Сохранение данных в localStorage
    const saveDataToStorage = (data) => {
        localStorage.setItem('teacherData', JSON.stringify(data));
    };

    // Функция синхронизации данных ученика из его localStorage
    const syncStudentDataFromLocalStorage = (teacherData) => {
        if (!teacherData || !teacherData.groups) return teacherData;

        const updatedData = { ...teacherData };
        
        // Проходим по всем группам и ученикам
        updatedData.groups = updatedData.groups.map(group => ({
            ...group,
            students: group.students.map(student => {
                // Пытаемся загрузить данные ученика из его localStorage
                try {
                    const studentKey = `studentProgress_${student.id || student.name}`;
                    const studentProgress = localStorage.getItem(studentKey);
                    
                    if (studentProgress) {
                        const progressData = JSON.parse(studentProgress);
                        
                        // Если у ученика есть результаты тестов, синхронизируем их
                        if (progressData.testResults && progressData.testResults.length > 0) {
                            // Проверяем существование тестов и помечаем удаленные
                            const validatedResults = progressData.testResults.map(result => ({
                                ...result,
                                exists: teacherData.tests ? teacherData.tests.some(test => test.id === result.testId) : false
                            }));
                            
                            // Статистика рассчитывается на основе всех результатов, включая удаленные тесты
                            const testsCompleted = validatedResults.length;
                            const totalScore = validatedResults.reduce((sum, result) => sum + result.score, 0);
                            const averageScore = testsCompleted > 0 ? Math.round(totalScore / testsCompleted) : 0;
                            
                            return {
                                ...student,
                                testsCompleted,
                                averageScore,
                                lastActivity: progressData.lastActivity ? 
                                    (progressData.lastActivity.split('T')[0] || progressData.lastActivity) : 
                                    null,
                                testResults: validatedResults
                            };
                        } else {
                            // Если результатов нет, сбрасываем статистику
                            return {
                                ...student,
                                testsCompleted: 0,
                                averageScore: 0,
                                lastActivity: null,
                                testResults: []
                            };
                        }
                    } else {
                        // Если данных ученика нет в localStorage, сбрасываем статистику
                        return {
                            ...student,
                            testsCompleted: 0,
                            averageScore: 0,
                            lastActivity: null,
                            testResults: []
                        };
                    }
                } catch (error) {
                    console.error(`Ошибка синхронизации данных для ученика ${student.name}:`, error);
                    // В случае ошибки сбрасываем статистику
                    return {
                        ...student,
                        testsCompleted: 0,
                        averageScore: 0,
                        lastActivity: null,
                        testResults: []
                    };
                }
            })
        }));
        
        return updatedData;
    };

    // Инициализация данных
    const initializeData = () => {
        const storedData = getStoredData();

        if (storedData) {
            // Синхронизируем данные учеников из их localStorage при инициализации
            return syncStudentDataFromLocalStorage(storedData);
        }

        // Начальные данные по умолчанию
        const defaultData = {
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
                        },
                    ]
                }
            ],
            tests: [
                {
                    id: 1,
                    title: 'Тест по музыкальной теории',
                    questions: [
                        {
                            id: 1,
                            question: 'Сколько всего основных нот существует в музыке?',
                            options: ['5', '7', '12', '24'],
                            correctAnswer: '7'
                        },
                        {
                            id: 2,
                            question: 'Как называется знак повышения ноты на полтона?',
                            options: ['Бемоль', 'Диез', 'Бекор', 'Дубль-диез'],
                            correctAnswer: 'Диез'
                        }
                    ],
                    difficulty: 'Средняя',
                    timeLimit: 15,
                    assignedTo: [1]
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'Основы музыкальной теории',
                    type: 'pdf',
                    uploadDate: '2023-09-15',
                    description: 'Основные понятия и термины музыкальной теории',
                    assignedTo: [1],
                    fileUrl: null
                }
            ]
        };

        saveDataToStorage(defaultData);
        
        // Инициализация паролей для учеников
        const passwords = {};
        defaultData.groups.forEach(group => {
            group.students.forEach(student => {
                if (!passwords[student.name]) {
                    passwords[student.name] = 'student1';
                }
            });
        });
        localStorage.setItem('studentPasswords', JSON.stringify(passwords));
        
        return defaultData;
    };

    const [data, setData] = useState(initializeData());
    const { groups, tests, materials } = data;

    // Форма создания теста
    const [newTest, setNewTest] = useState({
        title: '',
        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '', image: null }],
        difficulty: 'Средняя',
        timeLimit: 15,
        assignedTo: [1]
    });

    // Форма редактирования теста
    const [editTest, setEditTest] = useState(null);
    const [questionImages, setQuestionImages] = useState({});

    // Форма создания материала
    const [newMaterial, setNewMaterial] = useState({
        title: '',
        type: 'pdf',
        description: '',
        assignedTo: [1],
        file: null
    });

    const [showAvatarSelector, setShowAvatarSelector] = useState(false);

    // Функция синхронизации данных из localStorage
    const syncDataFromStorage = () => {
        const storedData = getStoredData();
        if (storedData) {
            // Синхронизируем данные учеников из их localStorage
            const syncedData = syncStudentDataFromLocalStorage(storedData);
            setData(syncedData);
            // Сохраняем синхронизированные данные обратно
            if (JSON.stringify(syncedData) !== JSON.stringify(storedData)) {
                saveDataToStorage(syncedData);
            }
        }
    };

    // Обновление данных и сохранение в localStorage
    const updateData = (newData) => {
        setData(newData);
        saveDataToStorage(newData);
    };

    // Синхронизация данных при изменении localStorage
    useEffect(() => {
        // Слушаем изменения localStorage (событие storage срабатывает только в других вкладках)
        const handleStorageChange = (event) => {
            if (event.key === 'teacherData') {
                syncDataFromStorage();
            }
        };

        // Слушаем кастомное событие для синхронизации в той же вкладке
        const handleCustomStorageChange = () => {
            syncDataFromStorage();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('teacherDataUpdated', handleCustomStorageChange);

        // Периодическая синхронизация (каждые 2 секунды)
        const syncInterval = setInterval(() => {
            syncDataFromStorage();
        }, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('teacherDataUpdated', handleCustomStorageChange);
            clearInterval(syncInterval);
        };
    }, []);

    // Обновление selectedStudent при изменении данных, если модальное окно открыто
    useEffect(() => {
        if (selectedStudent && showStudentModal && data.groups) {
            const currentStudent = data.groups
                .flatMap(group => group.students)
                .find(s => s.id === selectedStudent.id || s.name === selectedStudent.name);
            
            if (currentStudent && JSON.stringify(currentStudent) !== JSON.stringify(selectedStudent)) {
                setSelectedStudent(currentStudent);
            }
        }
    }, [data, showStudentModal, selectedStudent]);

    const handleAvatarChange = (avatarId) => {
        setUserData(prev => ({ ...prev, avatar: avatarId }));
        setShowAvatarSelector(false);
    };

    const handleStudentClick = (student) => {
        // Получаем актуальные данные ученика из текущего состояния
        const currentStudent = groups
            .flatMap(group => group.students)
            .find(s => s.id === student.id || s.name === student.name);

        if (currentStudent) {
            setSelectedStudent(currentStudent);
            setShowStudentModal(true);
        }
    };

    const handleTestEdit = (test) => {
        setSelectedTest(test);
        setEditTest(test);
        setShowEditTestModal(true);
    };

    const handleTestResults = (test) => {
        setSelectedTest(test);
        setShowTestResultsModal(true);
    };

    const calculateGroupStats = (group) => {
        const studentsWithTests = group.students.filter(s => s.testsCompleted > 0);
        const totalStudents = group.students.length;
        const activeStudents = studentsWithTests.length;
        const averageScore = studentsWithTests.length > 0
            ? Math.round(studentsWithTests.reduce((sum, student) => sum + student.averageScore, 0) / studentsWithTests.length)
            : 0;

        return { totalStudents, activeStudents, averageScore };
    };

    // Добавление вопроса в тест
    const addQuestion = () => {
        setNewTest(prev => ({
            ...prev,
            questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: '' }]
        }));
    };

    // Удаление вопроса
    const removeQuestion = (index) => {
        setNewTest(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    // Обновление вопроса
    const updateQuestion = (index, field, value) => {
        setNewTest(prev => {
            const updatedQuestions = [...prev.questions];
            updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
            return { ...prev, questions: updatedQuestions };
        });
    };

    // Обновление опции вопроса
    const updateOption = (questionIndex, optionIndex, value) => {
        setNewTest(prev => {
            const updatedQuestions = [...prev.questions];
            const updatedOptions = [...updatedQuestions[questionIndex].options];
            updatedOptions[optionIndex] = value;
            updatedQuestions[questionIndex].options = updatedOptions;
            return { ...prev, questions: updatedQuestions };
        });
    };

    // Создание теста
    const createTest = async () => {
        // Обработка изображений вопросов
        const processedQuestions = await Promise.all(newTest.questions.map(async (question) => {
            let imageUrl = null;
            if (question.image && question.image instanceof File) {
                try {
                    imageUrl = await readFileAsDataUrl(question.image);
                } catch (error) {
                    console.error('Ошибка обработки изображения:', error);
                }
            }
            return { ...question, image: imageUrl };
        }));

        const test = {
            id: Date.now(),
            title: newTest.title,
            questions: processedQuestions,
            difficulty: newTest.difficulty,
            timeLimit: newTest.timeLimit,
            assignedTo: newTest.assignedTo
        };

        const updatedData = {
            ...data,
            tests: [...tests, test]
        };

        updateData(updatedData);

        setNewTest({
            title: '',
            questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '', image: null }],
            difficulty: 'Средняя',
            timeLimit: 15,
            assignedTo: [1]
        });
        setShowCreateTestModal(false);
    };

    // Обновление опции вопроса при редактировании
    const updateEditOption = (questionIndex, optionIndex, value) => {
        setEditTest(prev => {
            const updatedQuestions = [...prev.questions];
            const updatedOptions = [...updatedQuestions[questionIndex].options];
            updatedOptions[optionIndex] = value;
            updatedQuestions[questionIndex].options = updatedOptions;
            return { ...prev, questions: updatedQuestions };
        });
    };

    // Обновление вопроса при редактировании
    const updateEditQuestion = (index, field, value) => {
        setEditTest(prev => {
            const updatedQuestions = [...prev.questions];
            updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
            return { ...prev, questions: updatedQuestions };
        });
    };

    // Добавление вопроса при редактировании
    const addEditQuestion = () => {
        setEditTest(prev => ({
            ...prev,
            questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: '', image: null }]
        }));
    };

    // Удаление вопроса при редактировании
    const removeEditQuestion = (index) => {
        setEditTest(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    // Обновление теста
    const updateTest = async () => {
        // Обработка новых изображений
        const processedQuestions = await Promise.all(editTest.questions.map(async (question, index) => {
            let imageUrl = question.image;
            if (questionImages[index] && questionImages[index] !== question.image) {
                try {
                    imageUrl = await readFileAsDataUrl(questionImages[index]);
                } catch (error) {
                    console.error('Ошибка обработки изображения:', error);
                }
            }
            return { ...question, image: imageUrl };
        }));

        const updatedTest = { ...editTest, questions: processedQuestions };

        const updatedData = {
            ...data,
            tests: tests.map(test => test.id === editTest.id ? updatedTest : test)
        };

        updateData(updatedData);
        setShowEditTestModal(false);
        setEditTest(null);
        setQuestionImages({});
    };

    // Редактирование материала
    const handleMaterialEdit = (material) => {
        setEditMaterial(material);
        setShowEditMaterialModal(true);
    };

    // Обновление материала
    const updateMaterial = async () => {
        if (!editMaterial.title.trim()) {
            alert('Пожалуйста, введите название материала');
            return;
        }

        let nextFileUrl = editMaterial.fileUrl || null;
        let nextFileName = editMaterial.fileName || null;

        if (uploadedFile) {
            try {
                nextFileUrl = await readFileAsDataUrl(uploadedFile);
                nextFileName = uploadedFile.name;
            } catch (error) {
                console.error('Ошибка чтения файла материала:', error);
            }
        }

        const updatedData = {
            ...data,
            materials: materials.map(material => 
                material.id === editMaterial.id 
                    ? { 
                        ...editMaterial, 
                        fileUrl: nextFileUrl,
                        fileName: nextFileName
                    }
                    : material
            )
        };

        updateData(updatedData);
        setShowEditMaterialModal(false);
        setEditMaterial(null);
        setUploadedFile(null);
    };

    // Создание учебного материала
    const createMaterial = async () => {
        if (!newMaterial.title.trim()) {
            alert('Пожалуйста, введите название материала');
            return;
        }

        let fileUrl = null;
        let fileName = null;

        if (newMaterial.file) {
            try {
                fileUrl = await readFileAsDataUrl(newMaterial.file);
                fileName = newMaterial.file.name;
            } catch (error) {
                console.error('Ошибка чтения файла материала:', error);
            }
        }

        const material = {
            id: Date.now(),
            title: newMaterial.title,
            type: newMaterial.type,
            description: newMaterial.description,
            uploadDate: new Date().toISOString().split('T')[0],
            assignedTo: newMaterial.assignedTo,
            fileUrl,
            fileName
        };

        const updatedData = {
            ...data,
            materials: [...materials, material]
        };

        updateData(updatedData);

        setNewMaterial({
            title: '',
            type: 'pdf',
            description: '',
            assignedTo: [1],
            file: null
        });
        setUploadedFile(null);
        setShowCreateMaterialModal(false);
    };

    // Обработка загрузки файла
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setNewMaterial(prev => ({ ...prev, file }));
            setUploadedFile(file);
        }
    };

    // Удаление теста
    const deleteTest = (testId) => {
        const updatedData = {
            ...data,
            tests: tests.filter(test => test.id !== testId)
        };
        
        // Обновляем результаты учеников, помечая удаленные тесты
        updatedData.groups = updatedData.groups.map(group => ({
            ...group,
            students: group.students.map(student => {
                if (student.testResults && student.testResults.length > 0) {
                    const updatedResults = student.testResults.map(result => ({
                        ...result,
                        exists: result.testId === testId ? false : (updatedData.tests.some(test => test.id === result.testId))
                    }));
                    
                    // Пересчитываем статистику на основе всех результатов, включая удаленные тесты
                    const testsCompleted = updatedResults.length;
                    const totalScore = updatedResults.reduce((sum, result) => sum + result.score, 0);
                    const averageScore = testsCompleted > 0 ? Math.round(totalScore / testsCompleted) : 0;
                    
                    return {
                        ...student,
                        testResults: updatedResults,
                        testsCompleted,
                        averageScore
                    };
                }
                return student;
            })
        }));
        
        updateData(updatedData);
    };

    // Удаление материала
    const deleteMaterial = (materialId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
            const updatedData = {
                ...data,
                materials: materials.filter(material => material.id !== materialId)
            };
            updateData(updatedData);
        }
    };

    // Аватары для учеников
    const studentAvatars = [
        'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
        'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
        'https://cdn-icons-png.flaticon.com/512/921/921071.png',
        'https://cdn-icons-png.flaticon.com/512/4202/4202843.png',
        'https://cdn-icons-png.flaticon.com/512/6997/6997662.png'
    ];

    // Сохранение паролей учеников
    const saveStudentPasswords = (passwords) => {
        localStorage.setItem('studentPasswords', JSON.stringify(passwords));
    };

    // Получение паролей учеников
    const getStudentPasswords = () => {
        try {
            const passwords = localStorage.getItem('studentPasswords');
            return passwords ? JSON.parse(passwords) : {};
        } catch (error) {
            return {};
        }
    };

    // Создание группы
    const createGroup = () => {
        if (!newGroup.name.trim()) {
            alert('Пожалуйста, введите название группы');
            return;
        }

        const newGroupData = {
            id: Date.now(),
            name: newGroup.name,
            students: []
        };

        const updatedData = {
            ...data,
            groups: [...groups, newGroupData]
        };

        updateData(updatedData);
        setNewGroup({ name: '' });
        setShowCreateGroupModal(false);
    };

    // Создание ученика
    const createStudent = () => {
        if (!newStudent.name.trim()) {
            alert('Пожалуйста, введите имя ученика');
            return;
        }
        if (!newStudent.password.trim()) {
            alert('Пожалуйста, введите пароль для ученика');
            return;
        }
        if (!newStudent.groupId) {
            alert('Пожалуйста, выберите группу');
            return;
        }

        const newStudentData = {
            id: Date.now(),
            name: newStudent.name,
            avatar: newStudent.avatar,
            testsCompleted: 0,
            averageScore: 0,
            lastActivity: null,
            testResults: []
        };

        const updatedData = {
            ...data,
            groups: groups.map(group =>
                group.id === newStudent.groupId
                    ? { ...group, students: [...group.students, newStudentData] }
                    : group
            )
        };

        updateData(updatedData);

        // Инициализируем прогресс ученика в его кабинете
        try {
            const baseProgress = {
                avatar: newStudent.avatar,
                materials: [],
                testResults: [],
                stats: {
                    testsCompleted: 0,
                    totalScore: 0,
                    averageScore: 0
                },
                lastActivity: null
            };
            localStorage.setItem(`studentProgress_${newStudentData.id}`, JSON.stringify(baseProgress));
            localStorage.setItem(`studentProgress_${newStudentData.name}`, JSON.stringify(baseProgress));
        } catch (error) {
            console.error('Ошибка инициализации кабинета ученика:', error);
        }

        // Сохраняем пароль
        const passwords = getStudentPasswords();
        passwords[newStudent.name] = newStudent.password;
        saveStudentPasswords(passwords);

        setNewStudent({ name: '', password: '', groupId: null, avatar: defaultStudentAvatar });
        setShowCreateStudentModal(false);
        setSelectedGroupForStudent(null);
    };

    // Удаление ученика
    const deleteStudent = (groupId, studentId) => {
        const group = groups.find(g => g.id === groupId);
        const student = group?.students.find(s => s.id === studentId);

        if (!student) return;

        if (!window.confirm(`Вы уверены, что хотите удалить ученика "${student.name}"? Его результаты тестов и прогресс будут удалены только из этой программы.`)) {
            return;
        }

        const updatedData = {
            ...data,
            groups: groups.map(groupItem =>
                groupItem.id === groupId
                    ? { ...groupItem, students: groupItem.students.filter(s => s.id !== studentId) }
                    : groupItem
            )
        };

        updateData(updatedData);

        // Удаляем пароль ученика
        const passwords = getStudentPasswords();
        if (passwords[student.name]) {
            delete passwords[student.name];
            saveStudentPasswords(passwords);
        }

        // Удаляем сохранённый прогресс ученика
        try {
            localStorage.removeItem(`studentProgress_${studentId}`);
            localStorage.removeItem(`studentProgress_${student.name}`);
        } catch (error) {
            console.error('Ошибка удаления прогресса ученика:', error);
        }

        // Если открыто модальное окно с этим учеником – закрываем
        if (selectedStudent && (selectedStudent.id === studentId || selectedStudent.name === student.name)) {
            setShowStudentModal(false);
            setSelectedStudent(null);
        }
    };

    // Сохранение нового названия группы
    const saveGroupName = () => {
        if (!groupToEdit || !editGroupName.trim()) {
            alert('Пожалуйста, введите название группы');
            return;
        }

        const updatedData = {
            ...data,
            groups: groups.map(group =>
                group.id === groupToEdit.id
                    ? { ...group, name: editGroupName.trim() }
                    : group
            )
        };

        updateData(updatedData);
        setShowEditGroupModal(false);
        setGroupToEdit(null);
        setEditGroupName('');
    };

    // Удаление группы
    const deleteGroup = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const studentCount = group.students.length;
        const confirmationMessage = studentCount > 0
            ? `Вы уверены, что хотите удалить группу "${group.name}"? В группе ${studentCount} ученик(ов). Все данные учеников будут удалены.`
            : `Вы уверены, что хотите удалить группу "${group.name}"?`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        // Удаляем пароли всех учеников группы
        const passwords = getStudentPasswords();
        group.students.forEach(student => {
            if (passwords[student.name]) {
                delete passwords[student.name];
            }
        });
        saveStudentPasswords(passwords);

        // Удаляем прогресс всех учеников группы
        group.students.forEach(student => {
            try {
                localStorage.removeItem(`studentProgress_${student.id}`);
                localStorage.removeItem(`studentProgress_${student.name}`);
            } catch (error) {
                console.error(`Ошибка удаления прогресса ученика ${student.name}:`, error);
            }
        });

        // Удаляем группу из данных
        const updatedData = {
            ...data,
            groups: groups.filter(group => group.id !== groupId)
        };

        updateData(updatedData);

        // Если открыта эта группа - закрываем
        if (selectedGroup?.id === groupId) {
            setSelectedGroup(null);
        }
    };

    // Рендер модального окна ученика
    const renderStudentModal = () => {
        if (!selectedStudent) return null;

        // Определяем слайды для модального окна
        const slides = [
            {
                id: 'summary',
                title: 'Общая статистика',
                content: (
                    <div className="student-summary">
                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="student-avatar" />
                        <div className="student-info">
                            <h3>Общая статистика</h3>
                            <div className="student-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Тестов пройдено:</span>
                                    <span className="stat-value">{selectedStudent.testsCompleted}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Средний балл:</span>
                                    <span className="stat-value">{selectedStudent.averageScore}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Последняя активность:</span>
                                    <span className="stat-value">{selectedStudent.lastActivity || 'Нет активности'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: 'results',
                title: 'Результаты тестов',
                content: selectedStudent.testResults && selectedStudent.testResults.length > 0 ? (
                    <div className="student-test-results">
                        <h3>Результаты тестов</h3>
                        {selectedStudent.testResults.map((result, index) => {
                            // Проверяем существование теста
                            const testExists = result.exists !== undefined
                                ? result.exists
                                : (data.tests ? data.tests.some(test => test.id === result.testId) : false);

                            // Находим тест для отображения ошибок
                            const test = data.tests?.find(t => t.id === result.testId);

                            return (
                                <div key={index} className="test-result-detail">
                                    <h4 className={!testExists ? 'deleted-test' : ''}>
                                        {result.testName}
                                        {!testExists && ' (тест удален)'}
                                    </h4>
                                    <div className="test-result-info">
                                        <span className="score">Оценка: {result.score}/100</span>
                                        <span className="date">Дата: {result.date}</span>
                                    </div>
                                    {testExists && test && result.mistakes && result.mistakes.length > 0 && (
                                        <div className="test-mistakes">
                                            <h5>Ошибки:</h5>
                                            <ul className="mistakes-list">
                                                {result.mistakes.map((mistake, mistakeIndex) => (
                                                    <li key={mistakeIndex}>
                                                        <strong>Вопрос:</strong> {mistake.question}<br />
                                                        <span className="mistake-answer">
                                                            <strong>Ответ ученика:</strong> <span className="wrong-answer">{mistake.userAnswer}</span><br />
                                                            <strong>Правильный ответ:</strong> <span className="correct-answer">{mistake.correctAnswer}</span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-results">
                        <p>Ученик еще не проходил тесты.</p>
                    </div>
                )
            }
        ];

        const nextSlide = () => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        };

        const prevSlide = () => {
            setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        };

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Результаты ученика: {selectedStudent.name}</h2>
                        <button onClick={() => setShowStudentModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        {/* Навигация слайдера */}
                        <div className="slider-navigation">
                            <button
                                className="slider-btn prev-btn"
                                onClick={prevSlide}
                                disabled={slides.length <= 1}
                            >
                                ← Предыдущий
                            </button>
                            <div className="slider-indicators">
                                {slides.map((slide, index) => (
                                    <button
                                        key={slide.id}
                                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(index)}
                                    >
                                        {slide.title}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="slider-btn next-btn"
                                onClick={nextSlide}
                                disabled={slides.length <= 1}
                            >
                                Следующий →
                            </button>
                        </div>

                        {/* Контент слайда */}
                        <div className="slide-content">
                            {slides[currentSlide].content}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна создания теста
    const renderCreateTestModal = () => {
        // Определяем слайды для модального окна создания теста
        const slides = [
            {
                id: 'basic-info',
                title: 'Основная информация',
                content: (
                    <div>
                        <div className="form-group">
                            <label>Название теста:</label>
                            <input
                                type="text"
                                value={newTest.title}
                                onChange={(e) => setNewTest(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Введите название теста"
                            />
                        </div>

                        <div className="form-group">
                            <label>Сложность:</label>
                            <select
                                value={newTest.difficulty}
                                onChange={(e) => setNewTest(prev => ({ ...prev, difficulty: e.target.value }))}
                            >
                                <option value="Легкая">Легкая</option>
                                <option value="Средняя">Средняя</option>
                                <option value="Сложная">Сложная</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Время на прохождение (минут):</label>
                            <input
                                type="number"
                                value={newTest.timeLimit}
                                onChange={(e) => setNewTest(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                                min="5"
                                max="60"
                            />
                        </div>

                        <div className="form-group">
                            <label>Для группы:</label>
                            <select
                                value={newTest.assignedTo[0]}
                                onChange={(e) => setNewTest(prev => ({ ...prev, assignedTo: [parseInt(e.target.value)] }))}
                            >
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )
            },
            {
                id: 'questions',
                title: 'Вопросы',
                content: (
                    <div>
                        <h3>Вопросы:</h3>
                        {newTest.questions.map((question, index) => (
                            <div key={index} className="question-card">
                                <div className="question-header">
                                    <h4>Вопрос {index + 1}</h4>
                                    <button onClick={() => removeQuestion(index)} className="delete-btn">Удалить</button>
                                </div>

                                <div className="form-group">
                                    <label>Текст вопроса:</label>
                                    <input
                                        type="text"
                                        value={question.question}
                                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                        placeholder="Введите текст вопроса"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Варианты ответов:</label>
                                    {question.options.map((option, optionIndex) => (
                                        <input
                                            key={optionIndex}
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                            placeholder={`Вариант ${optionIndex + 1}`}
                                        />
                                    ))}
                                </div>

                                <div className="form-group">
                                    <label>Правильный ответ:</label>
                                    <select
                                        value={question.correctAnswer}
                                        onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                    >
                                        <option value="">Выберите правильный ответ</option>
                                        {question.options.map((option, optionIndex) => (
                                            <option key={optionIndex} value={option}>
                                                {option || `Вариант ${optionIndex + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}

                        <button onClick={addQuestion} className="add-question-btn">
                            + Добавить вопрос
                        </button>
                    </div>
                )
            }
        ];

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Создание нового теста</h2>
                        <button onClick={() => setShowCreateTestModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        {/* Контент слайда */}
                        <div className="slide-content">
                            {slides.map((slide, index) => (
                                <div key={slide.id} className="slide-section">
                                    <h3>{slide.title}</h3>
                                    {slide.content}
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button onClick={createTest} className="create-test-btn">
                                Создать тест
                            </button>
                            <button onClick={() => setShowCreateTestModal(false)} className="cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна редактирования теста
    const renderEditTestModal = () => {
        if (!editTest) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Редактирование теста: {editTest.title}</h2>
                        <button onClick={() => setShowEditTestModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Название теста:</label>
                            <input
                                type="text"
                                value={editTest.title}
                                onChange={(e) => setEditTest(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Введите название теста"
                            />
                        </div>

                        <div className="form-group">
                            <label>Сложность:</label>
                            <select
                                value={editTest.difficulty}
                                onChange={(e) => setEditTest(prev => ({ ...prev, difficulty: e.target.value }))}
                            >
                                <option value="Легкая">Легкая</option>
                                <option value="Средняя">Средняя</option>
                                <option value="Сложная">Сложная</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Время на прохождение (минут):</label>
                            <input
                                type="number"
                                value={editTest.timeLimit}
                                onChange={(e) => setEditTest(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                                min="5"
                                max="60"
                            />
                        </div>

                        <div className="form-group">
                            <label>Для группы:</label>
                            <select
                                value={editTest.assignedTo[0]}
                                onChange={(e) => setEditTest(prev => ({ ...prev, assignedTo: [parseInt(e.target.value)] }))}
                            >
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>

                        <h3>Вопросы:</h3>
                        {editTest.questions.map((question, index) => (
                            <div key={index} className="question-card">
                                <div className="question-header">
                                    <h4>Вопрос {index + 1}</h4>
                                    <button onClick={() => removeEditQuestion(index)} className="delete-btn">Удалить</button>
                                </div>

                                <div className="form-group">
                                    <label>Текст вопроса:</label>
                                    <input
                                        type="text"
                                        value={question.question}
                                        onChange={(e) => updateEditQuestion(index, 'question', e.target.value)}
                                        placeholder="Введите текст вопроса"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Изображение к вопросу (опционально):</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setQuestionImages(prev => ({ ...prev, [index]: file }));
                                            }
                                        }}
                                        className="file-upload-input"
                                    />
                                    {(questionImages[index] || question.image) && (
                                        <div className="image-preview">
                                            <img
                                                src={questionImages[index] ? URL.createObjectURL(questionImages[index]) : question.image}
                                                alt="Предпросмотр"
                                                style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', marginTop: '10px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQuestionImages(prev => ({ ...prev, [index]: null }));
                                                    updateEditQuestion(index, 'image', null);
                                                }}
                                                className="remove-image-btn"
                                                style={{ marginTop: '5px', background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Удалить изображение
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Варианты ответов:</label>
                                    {question.options.map((option, optionIndex) => (
                                        <input
                                            key={optionIndex}
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateEditOption(index, optionIndex, e.target.value)}
                                            placeholder={`Вариант ${optionIndex + 1}`}
                                        />
                                    ))}
                                </div>

                                <div className="form-group">
                                    <label>Правильный ответ:</label>
                                    <select
                                        value={question.correctAnswer}
                                        onChange={(e) => updateEditQuestion(index, 'correctAnswer', e.target.value)}
                                    >
                                        <option value="">Выберите правильный ответ</option>
                                        {question.options.map((option, optionIndex) => (
                                            <option key={optionIndex} value={option}>
                                                {option || `Вариант ${optionIndex + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}

                        <button onClick={addEditQuestion} className="add-question-btn">
                            + Добавить вопрос
                        </button>

                        <div className="modal-actions">
                            <button onClick={updateTest} className="save-btn">
                                Сохранить изменения
                            </button>
                            <button onClick={() => setShowEditTestModal(false)} className="cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна результатов теста
    const renderTestResultsModal = () => {
        if (!selectedTest) return null;

        // Получаем всех учеников, которым назначен этот тест
        const assignedGroupIds = selectedTest.assignedTo || [];
        const assignedStudents = groups
            .filter(group => assignedGroupIds.includes(group.id))
            .flatMap(group => group.students)
            .map(student => {
                // Находим результат этого теста у ученика
                const testResult = student.testResults?.find(result => result.testId === selectedTest.id);
                return {
                    ...student,
                    testResult: testResult || null,
                    hasCompleted: !!testResult
                };
            });

        const completedCount = assignedStudents.filter(s => s.hasCompleted).length;
        const averageScore = assignedStudents.filter(s => s.hasCompleted).length > 0
            ? Math.round(assignedStudents.filter(s => s.hasCompleted).reduce((sum, s) => sum + (s.testResult?.score || 0), 0) / completedCount)
            : 0;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Результаты теста: {selectedTest.title}</h2>
                        <button onClick={() => setShowTestResultsModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        {/* Контент слайда */}
                        <div className="slide-content">
                            <div className="test-results-summary">
                                <h3>Статистика прохождения</h3>
                                <div className="test-stats-overview">
                                    <div className="stat-item">
                                        <span className="stat-label">Всего учеников:</span>
                                        <span className="stat-value">{assignedStudents.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Прошли тест:</span>
                                        <span className="stat-value">{completedCount}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Средний балл:</span>
                                        <span className="stat-value">{averageScore}</span>
                                    </div>
                                </div>

                                <h3>Результаты учеников</h3>
                                {assignedStudents.length > 0 ? (
                                    <div className="test-results-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Ученик</th>
                                                    <th>Статус</th>
                                                    <th>Оценка</th>
                                                    <th>Дата прохождения</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignedStudents.map(student => (
                                                    <tr key={student.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <img src={student.avatar} alt={student.name} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                                                <span>{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={student.hasCompleted ? 'status active' : 'status inactive'}>
                                                                {student.hasCompleted ? 'Пройден' : 'Не пройден'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {student.hasCompleted ? (
                                                                <span className="score">{student.testResult.score}/100</span>
                                                            ) : (
                                                                <span>-</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {student.hasCompleted ? student.testResult.date : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>Нет учеников, которым назначен этот тест.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна редактирования материала
    const renderEditMaterialModal = () => {
        if (!editMaterial) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Редактирование материала: {editMaterial.title}</h2>
                        <button onClick={() => setShowEditMaterialModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Название материала:</label>
                            <input
                                type="text"
                                value={editMaterial.title}
                                onChange={(e) => setEditMaterial(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Введите название материала"
                            />
                        </div>

                        <div className="form-group">
                            <label>Тип материала:</label>
                            <select
                                value={editMaterial.type}
                                onChange={(e) => setEditMaterial(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="pdf">PDF документ</option>
                                <option value="video">Видео</option>
                                <option value="audio">Аудио</option>
                                <option value="text">Текстовый материал</option>
                                <option value="file">Файл</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Для группы:</label>
                            <select
                                value={editMaterial.assignedTo[0]}
                                onChange={(e) => setEditMaterial(prev => ({ ...prev, assignedTo: [parseInt(e.target.value)] }))}
                            >
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Загрузить новый файл (опционально):</label>
                            <input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setEditMaterial(prev => ({ ...prev, fileUrl: URL.createObjectURL(file) }));
                                        setUploadedFile(file);
                                    }
                                }}
                                className="file-upload-input"
                            />
                            {uploadedFile && (
                                <div className="file-preview">
                                    <span>Выбран файл: {uploadedFile.name}</span>
                                </div>
                            )}
                            {editMaterial.fileUrl && !uploadedFile && (
                                <div className="file-preview">
                                    <span>Текущий файл сохранен</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Описание:</label>
                            <textarea
                                value={editMaterial.description}
                                onChange={(e) => setEditMaterial(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Введите описание материала"
                                rows="3"
                            />
                        </div>

                        <div className="modal-actions">
                            <button onClick={updateMaterial} className="save-btn">
                                Сохранить изменения
                            </button>
                            <button onClick={() => {
                                setShowEditMaterialModal(false);
                                setEditMaterial(null);
                                setUploadedFile(null);
                            }} className="cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна создания группы
    const renderCreateGroupModal = () => {
        return (
            <div className="modal-overlay create-modal-overlay">
                <div className="modal-content create-modal-content">
                    <div className="modal-header">
                        <h2>Создание группы</h2>
                        <button onClick={() => setShowCreateGroupModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        {/* Контент слайда */}
                        <div className="slide-content">
                            <div className="form-group">
                                <label>Название группы:</label>
                                <input
                                    type="text"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ name: e.target.value })}
                                    placeholder="Введите название группы"
                                />
                            </div>

                            <div className="confirmation-message">
                                <h3>Создание новой группы</h3>
                                <p>Вы собираетесь создать группу с названием:</p>
                                <div className="group-creation-preview">
                                    <span className="group-name-preview">"{newGroup.name || 'Название группы'}"</span>
                                </div>
                                <p className="info-text">После создания группы вы сможете добавить в неё учеников.</p>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={createGroup} className="create-btn">
                                Создать группу
                            </button>
                            <button onClick={() => setShowCreateGroupModal(false)} className="cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна редактирования группы
    const renderEditGroupModal = () => {
        if (!groupToEdit) return null;

        return (
            <div className="modal-overlay create-modal-overlay">
                <div className="modal-content create-modal-content">
                    <div className="modal-header">
                        <h2>Переименование группы</h2>
                        <button
                            onClick={() => { setShowEditGroupModal(false); setGroupToEdit(null); setEditGroupName(''); }}
                            className="close-btn"
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Текущее название группы:</label>
                            <input
                                type="text"
                                value={groupToEdit.name}
                                disabled
                                className="disabled-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Новое название группы:</label>
                            <input
                                type="text"
                                value={editGroupName}
                                onChange={(e) => setEditGroupName(e.target.value)}
                                placeholder="Введите новое название группы"
                            />
                        </div>

                        <div className="confirmation-message">
                            <h3>Подтверждение изменения</h3>
                            <p>Вы собираетесь изменить название группы:</p>
                            <div className="name-change-preview">
                                <span className="old-name">"{groupToEdit.name}"</span>
                                <span className="arrow">→</span>
                                <span className="new-name">"{editGroupName || 'Новое название'}"</span>
                            </div>
                            <p className="warning-text">Это действие нельзя отменить.</p>
                        </div>

                        <div className="modal-actions">
                            <button onClick={saveGroupName} className="create-btn">
                                Сохранить
                            </button>
                            <button
                                onClick={() => { setShowEditGroupModal(false); setGroupToEdit(null); setEditGroupName(''); }}
                                className="cancel-btn"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна создания ученика
    const renderCreateStudentModal = () => {
        return (
            <div className="modal-overlay create-modal-overlay">
                <div className="modal-content create-modal-content">
                    <div className="modal-header">
                        <h2>Добавление ученика</h2>
                        <button onClick={() => setShowCreateStudentModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        {/* Контент слайда */}
                        <div className="slide-content">
                            <div className="form-group">
                                <label>Имя ученика:</label>
                                <input
                                    type="text"
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Введите имя ученика"
                                />
                            </div>
                            <div className="form-group">
                                <label>Пароль:</label>
                                <input
                                    type="password"
                                    value={newStudent.password}
                                    onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Введите пароль для ученика"
                                />
                            </div>
                            <div className="form-group">
                                <label>Группа:</label>
                                <select
                                    value={newStudent.groupId || ''}
                                    onChange={(e) => setNewStudent(prev => ({ ...prev, groupId: parseInt(e.target.value) }))}
                                >
                                    <option value="">Выберите группу</option>
                                    {groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Аватар ученика:</label>
                                <div className="student-avatar-grid">
                                    {studentAvatars.map((avatarUrl) => (
                                        <button
                                            type="button"
                                            key={avatarUrl}
                                            className={`student-avatar-option ${newStudent.avatar === avatarUrl ? 'selected' : ''}`}
                                            onClick={() => setNewStudent(prev => ({ ...prev, avatar: avatarUrl }))}
                                        >
                                            <img src={avatarUrl} alt="Аватар ученика" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={createStudent} className="create-btn">
                                Добавить ученика
                            </button>
                            <button onClick={() => setShowCreateStudentModal(false)} className="cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Рендер модального окна создания материала
    const renderCreateMaterialModal = () => {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Добавление учебного материала</h2>
                        <button onClick={() => setShowCreateMaterialModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                        {/* Контент слайда */}
                        <div className="slide-content">
                            <div className="form-group">
                                <label>Название материала:</label>
                                <input
                                    type="text"
                                    value={newMaterial.title}
                                    onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Введите название материала"
                                />
                            </div>

                            <div className="form-group">
                                <label>Тип материала:</label>
                                <select
                                    value={newMaterial.type}
                                    onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="pdf">PDF документ</option>
                                    <option value="video">Видео</option>
                                    <option value="audio">Аудио</option>
                                    <option value="text">Текстовый материал</option>
                                    <option value="file">Файл</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Для группы:</label>
                                <select
                                    value={newMaterial.assignedTo[0]}
                                    onChange={(e) => setNewMaterial(prev => ({ ...prev, assignedTo: [parseInt(e.target.value)] }))}
                                >
                                    {groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Загрузить файл:</label>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="file-upload-input"
                                    accept=".pdf,.doc,.docx,.txt,.mp4,.mp3,.wav,.jpg,.jpeg,.png"
                                />
                                {uploadedFile && (
                                    <div className="file-preview">
                                        <span>Выбран файл: {uploadedFile.name}</span>
                                        <span className="file-size">({(uploadedFile.size / 1024 / 1024).toFixed(2)} МБ)</span>
                                    </div>
                                )}
                                {!uploadedFile && (
                                    <div className="file-hint">
                                        <small>Поддерживаются файлы: PDF, DOC, DOCX, TXT, MP4, MP3, WAV, JPG, PNG</small>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Описание:</label>
                                <textarea
                                    value={newMaterial.description}
                                    onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Введите описание материала"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={createMaterial} className="create-btn">
                                Добавить материал
                            </button>
                            <button onClick={() => setShowCreateMaterialModal(false)} className="cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="teacher-dashboard-container">
            {/* Хедер */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Кабинет учителя</h1>
                    <button onClick={onLogout} className="logout-btn">
                        Выйти
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Блок профиля учителя */}
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

                                {/* Селектор аватаров */}
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
                                <p className="subject">{userData.subject}</p>
                                <div className="teacher-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Групп:</span>
                                        <span className="stat-value">{groups.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Учеников:</span>
                                        <span className="stat-value">{groups.reduce((total, group) => total + group.students.length, 0)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Активных учеников:</span>
                                        <span className="stat-value">{groups.reduce((total, group) => total + group.students.filter(s => s.testsCompleted > 0).length, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Навигация */}
                <div className="dashboard-navigation">
                    <button
                        className={`nav-btn ${activeTab === 'groups' ? 'active' : ''}`}
                        onClick={() => setActiveTab('groups')}
                    >
                        👥 Мои группы
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'statistics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('statistics')}
                    >
                        📊 Статистика
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'tests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tests')}
                    >
                        📝 Тесты
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'materials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('materials')}
                    >
                        📚 Материалы
                    </button>
                </div>

                {/* Контент в зависимости от выбранной вкладки */}
                {activeTab === 'groups' && (
                    <section className="groups-section">
                        <div className="section-header">
                            <h2>👥 Мои учебные группы</h2>
                            <p>Управление группыми и просмотр прогресса учеников</p>
                        </div>

                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="create-test-btn"
                                onClick={() => setShowCreateGroupModal(true)}
                                style={{ background: '#28a745' }}
                            >
                                + Создать группу
                            </button>
                            <button
                                className="create-test-btn"
                                onClick={() => {
                                    if (groups.length === 0) {
                                        alert('Сначала создайте группу');
                                        return;
                                    }
                                    setShowCreateStudentModal(true);
                                }}
                                style={{ background: '#17a2b8' }}
                            >
                                + Добавить ученика
                            </button>
                        </div>

                        <div className="groups-grid">
                            {groups.map(group => {
                                const stats = calculateGroupStats(group);
                                return (
                                    <div
                                        key={group.id}
                                        className="group-card"
                                        onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                                    >
                                        <div className="group-header">
                                            <h3>{group.name}</h3>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    className="edit-group-name-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setGroupToEdit(group);
                                                        setEditGroupName(group.name);
                                                        setShowEditGroupModal(true);
                                                    }}
                                                    title="Редактировать название группы"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="delete-group-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteGroup(group.id);
                                                    }}
                                                    title="Удалить группу"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <span className={`group-status ${stats.activeStudents === stats.totalStudents ? 'complete' : 'partial'}`}>
                                                {stats.activeStudents}/{stats.totalStudents} активны
                                            </span>
                                        </div>

                                        <div className="group-stats">
                                            <div className="group-stat">
                                                <span className="stat-label">Средний балл:</span>
                                                <span className="stat-value">{stats.averageScore}</span>
                                            </div>
                                            <div className="group-stat">
                                                <span className="stat-label">Тестов пройдено:</span>
                                                <span className="stat-value">{group.students.reduce((total, student) => total + student.testsCompleted, 0)}</span>
                                            </div>
                                        </div>

                                        {selectedGroup?.id === group.id && (
                                            <div className="students-list">
                                                <h4>Ученики:</h4>
                                                {group.students.map(student => (
                                                    <div
                                                        key={student.id}
                                                        className="student-item"
                                                    >
                                                        <div
                                                            className="student-main"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStudentClick(student);
                                                            }}
                                                        >
                                                            <img src={student.avatar} alt={student.name} className="student-avatar" />
                                                            <div className="student-info">
                                                                <span className="student-name">{student.name}</span>
                                                                <span className="student-score">Средний балл: {student.averageScore}</span>
                                                            </div>
                                                            <div className="student-actions">
                                                                <span className={`status ${student.testsCompleted > 0 ? 'active' : 'inactive'}`}>
                                                                    {student.testsCompleted > 0 ? `${student.testsCompleted} тестов` : 'Не активен'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="delete-student-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteStudent(group.id, student.id);
                                                            }}
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {activeTab === 'statistics' && (
                    <section className="statistics-section">
                        <div className="section-header">
                            <h2>📊 Общая статистика</h2>
                            <p>Статистика по всем группам и ученикам</p>
                        </div>

                        <div className="statistics-content">
                            <div className="overall-stats-cards">
                                <div className="stat-card">
                                    <h3>Всего групп</h3>
                                    <div className="stat-number">{groups.length}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>Всего учеников</h3>
                                    <div className="stat-number">
                                        {groups.reduce((total, group) => total + group.students.length, 0)}
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <h3>Активных учеников</h3>
                                    <div className="stat-number">
                                        {groups.reduce((total, group) => 
                                            total + group.students.filter(s => s.testsCompleted > 0).length, 0
                                        )}
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <h3>Всего тестов</h3>
                                    <div className="stat-number">{tests.length}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>Всего материалов</h3>
                                    <div className="stat-number">{materials.length}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>Общий средний балл</h3>
                                    <div className="stat-number">
                                        {(() => {
                                            const allStudents = groups.flatMap(group => group.students);
                                            const studentsWithTests = allStudents.filter(s => s.testsCompleted > 0);
                                            return studentsWithTests.length > 0
                                                ? Math.round(studentsWithTests.reduce((sum, s) => sum + s.averageScore, 0) / studentsWithTests.length)
                                                : 0;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="groups-statistics">
                                <h3>Статистика по группам</h3>
                                <div className="groups-stats-list">
                                    {groups.map(group => {
                                        const stats = calculateGroupStats(group);
                                        return (
                                            <div key={group.id} className="group-stat-card">
                                                <h4>{group.name}</h4>
                                                <div className="group-stat-details">
                                                    <div className="stat-detail">
                                                        <span>Учеников:</span>
                                                        <span>{stats.totalStudents}</span>
                                                    </div>
                                                    <div className="stat-detail">
                                                        <span>Активных:</span>
                                                        <span>{stats.activeStudents}</span>
                                                    </div>
                                                    <div className="stat-detail">
                                                        <span>Средний балл:</span>
                                                        <span>{stats.averageScore}</span>
                                                    </div>
                                                    <div className="stat-detail">
                                                        <span>Тестов пройдено:</span>
                                                        <span>{group.students.reduce((total, student) => total + student.testsCompleted, 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="top-students">
                                <h3>Топ учеников</h3>
                                <div className="top-students-list">
                                    {groups
                                        .flatMap(group => group.students)
                                        .filter(student => student.testsCompleted > 0)
                                        .sort((a, b) => b.averageScore - a.averageScore)
                                        .slice(0, 5)
                                        .map((student, index) => (
                                            <div key={student.id} className="top-student-item">
                                                <div className="student-rank">#{index + 1}</div>
                                                <img src={student.avatar} alt={student.name} className="student-avatar-small" />
                                                <div className="student-details">
                                                    <span className="student-name">{student.name}</span>
                                                    <span className="student-stats">
                                                        Средний балл: {student.averageScore} | Тестов: {student.testsCompleted}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    {groups.flatMap(group => group.students).filter(student => student.testsCompleted > 0).length === 0 && (
                                        <p>Нет учеников, прошедших тесты.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'tests' && (
                    <section className="tests-management-section">
                        <div className="section-header">
                            <h2>📝 Управление тестами</h2>
                            <p>Создание и редактирование учебных материалов</p>
                        </div>

                        <div className="tests-management-content">
                            <div className="create-test-card">
                                <h3>Создать новый тест</h3>
                                <p>Разработайте новый тест для ваших учеников</p>
                                <button
                                    className="create-test-btn"
                                    onClick={() => setShowCreateTestModal(true)}
                                >
                                    + Создать тест
                                </button>
                            </div>

                            <div className="existing-tests">
                                <h3>Существующие тесты</h3>
                                <div className="tests-list">
                                    {tests.map(test => (
                                        <div key={test.id} className="test-management-card">
                                            <h4>{test.title}</h4>
                                            <div className="test-management-info">
                                                <span>Вопросов: {test.questions.length}</span>
                                                <span>Сложность: {test.difficulty}</span>
                                                <span>Время: {test.timeLimit} мин</span>
                                                <span>Для: {groups.find(g => g.id === test.assignedTo[0])?.name}</span>
                                            </div>
                                            <div className="test-management-actions">
                                                <button 
                                                    className="edit-btn"
                                                    onClick={() => handleTestEdit(test)}
                                                >
                                                    Редактировать
                                                </button>
                                                <button 
                                                    className="results-btn"
                                                    onClick={() => handleTestResults(test)}
                                                >
                                                    Результаты
                                                </button>
                                                <button 
                                                    className="delete-btn" 
                                                    onClick={() => deleteTest(test.id)}
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'materials' && (
                    <section className="materials-section">
                        <div className="section-header">
                            <h2>📚 Учебные материалы</h2>
                            <p>Управление учебными материалами для учеников</p>
                        </div>

                        <div className="materials-management-content">
                            <div className="create-material-card">
                                <h3>Добавить учебный материал</h3>
                                <p>Загрузите новый материал для ваших учеников</p>
                                <button
                                    className="create-material-btn"
                                    onClick={() => setShowCreateMaterialModal(true)}
                                >
                                    + Добавить материал
                                </button>
                            </div>

                            <div className="existing-materials">
                                <h3>Существующие материалы</h3>
                                <div className="materials-list">
                                    {materials.map(material => (
                                        <div key={material.id} className="material-card">
                                            <div className="material-icon">
                                                {material.type === 'pdf' && '📄'}
                                                {material.type === 'video' && '🎥'}
                                                {material.type === 'audio' && '🎵'}
                                                {material.type === 'text' && '📝'}
                                                {material.type === 'file' && '📎'}
                                            </div>
                                            <div className="material-info">
                                                <h4>{material.title}</h4>
                                                <p>{material.description}</p>
                                                <span className="material-date">Загружено: {material.uploadDate}</span>
                                                <span className="material-group">Для: {groups.find(g => g.id === material.assignedTo[0])?.name}</span>
                                                {material.fileUrl && (
                                                    <div className="material-file">
                                                        <a
                                                            href={material.fileUrl}
                                                            download={material.fileName || 'material'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            📎 {material.fileName || 'Скачать файл'}
                                                        </a>
                                                    </div>
                                                )}
                                                {!material.fileUrl && (
                                                    <div className="material-no-file">
                                                        <span>Файл не прикреплен</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="material-actions">
                                                <button 
                                                    className="edit-btn"
                                                    onClick={() => handleMaterialEdit(material)}
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => deleteMaterial(material.id)}
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Модальные окна */}
            {showStudentModal && renderStudentModal()}
            {showCreateTestModal && renderCreateTestModal()}
            {showEditTestModal && renderEditTestModal()}
            {showTestResultsModal && renderTestResultsModal()}
            {showCreateMaterialModal && renderCreateMaterialModal()}
            {showEditMaterialModal && renderEditMaterialModal()}
            {showCreateGroupModal && renderCreateGroupModal()}
            {showCreateStudentModal && renderCreateStudentModal()}
            {showEditGroupModal && renderEditGroupModal()}
        </div>
    );
};

export default TeacherDashboard;
