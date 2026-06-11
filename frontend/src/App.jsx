import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import ChatWidget from './components/ChatWidget';
import ChangePasswordForceScreen from './components/ChangePasswordForceScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Visits from './pages/Visits';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import MapPage from './pages/Map';
import Settings from './pages/Settings';

// Layout for Protected Pages (renders BottomNav at the bottom)
const ProtectedLayout = () => {
  const { user } = useAuth();
  if (user?.mustChangePassword) {
    return <ChangePasswordForceScreen />;
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
