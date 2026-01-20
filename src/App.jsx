import React, { useState } from 'react';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import Profile from './components/Profile';

function App() {
    const [currentUser, setCurrentUser] = useState(null);

    const handleLogin = (userData) => {
        setCurrentUser(userData);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    return (
        <div className="App">
            {!currentUser ? (
                <Login onLogin={handleLogin} />
            ) : currentUser.type === 'teacher' ? (
                <TeacherDashboard onLogout={handleLogout} />
            ) : (
                <Profile onLogout={handleLogout} studentId={currentUser.studentId} studentName={currentUser.name} />
            )}
        </div>
    );
}

export default App;
