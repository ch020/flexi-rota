<<<<<<< HEAD
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import EmployeeAvailability from './pages/ManagerRecapPage';
import ChatPage from './pages/ChatPage';
import NotificationPage from './pages/NotificationPage';


function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/manager-recap" element={<EmployeeAvailability />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route
          path="/"
          element={
            <div>
              <div>
                <a href="https://vite.dev" target="_blank">
                  <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
              </div>
              <h1>Vite + React</h1>
              <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                  count is {count}
                </button>
                <p>
                  Edit <code>src/App.jsx</code> and save to test HMR
                </p>
              </div>
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
              <div>
                <Link to="/manager-recap">
                  <button>Go to Manager Recap</button>
                </Link>
                <Link to="/chat">
                  <button>Go to Chat Page</button>
                </Link>
                <Link to="/notifications">
                  <button>Go to Notification Page</button>
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}


export default App;
=======
import ShiftPlanner from './pages/ShiftPlanner';
import './index.css'; // Adjust to the path of your stylesheet

function App() {
  return <ShiftPlanner />;
}

export default App;
>>>>>>> 575a125 (pre-installing tailwindv4)
