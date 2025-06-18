import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import TrainingPage from "./components/TrainingPage";
import NutritionPage from "./components/NutritionPage";
import ShopPage from "./components/ShopPage";
import AdminPage from "./components/AdminPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import BottomNavigation from "./components/BottomNavigation";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./contexts/AuthContext";
import RoutineForm from './components/RoutineForm';
import DailyRoutine from './components/DailyRoutine';

// Frases motivadoras
const QUOTES = [
    "Tu cuerpo puede aguantar casi cualquier cosa. Es tu mente la que necesitas convencer.",
    "El dolor que sientes hoy será la fuerza que sentirás mañana.",
    "No te rindas cuando estés cansado. Ríndete cuando hayas terminado.",
    "El éxito no es siempre grande. Es el progreso constante lo que importa.",
    "Tu cuerpo es el reflejo de tu estilo de vida.",
    "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
    "No hay atajos para cualquier lugar que valga la pena ir.",
    "El único entrenamiento malo es el que no se hace.",
    "Tu límite es solo tu mente.",
    "El cambio no es fácil, pero siempre es posible."
];

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black">
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } />
            <Route path="/training" element={
              <PrivateRoute>
                <DailyRoutine />
              </PrivateRoute>
            } />
            <Route path="/nutrition" element={
              <PrivateRoute>
                <NutritionPage />
              </PrivateRoute>
            } />
            <Route path="/shop" element={
              <PrivateRoute>
                <ShopPage />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute allowedRoles={[3]}>
                <AdminPage />
              </PrivateRoute>
            } />
            <Route path="/routines/new" element={
              <PrivateRoute>
                <RoutineForm />
              </PrivateRoute>
            } />
          </Routes>
          <BottomNavigation />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 