import { Link, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";
import Loader from "./components/Loader.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import OpportunitiesPage from "./pages/OpportunitiesPage.jsx";
import MyProfilePage from "./pages/MyProfilePage.jsx";
import ProfileDetailPage from "./pages/ProfileDetailPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { GameProvider } from "./gamification/GameContext.jsx";

function LandingRedirect() {
  const { token, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-gray-600">The page you’re looking for doesn’t exist.</p>
      <Link className="mt-6 inline-block font-semibold underline decoration-spark decoration-2 underline-offset-4" to="/">
        Back to Sparkmatch
      </Link>
    </main>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Loader fullScreen />;

  return (
    <GameProvider>
      <div className="min-h-screen bg-white text-black">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingRedirect />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/people/:id" element={<ProtectedRoute><ProfileDetailPage /></ProtectedRoute>} />
          <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </GameProvider>
  );
}
