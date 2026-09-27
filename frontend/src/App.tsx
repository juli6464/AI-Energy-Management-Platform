import { Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Meters from './pages/Meters';
import MeterDetail from './pages/MeterDetail';
import Anomalies from './pages/Anomalies';
import { AuthProvider } from './context/AuthContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/meters" element={<Meters />} />
                  <Route path="/meters/:meterId" element={<MeterDetail />} />
                  <Route path="/anomalies" element={<Anomalies />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
