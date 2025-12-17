import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './auth/AuthContext';
import { Header } from './components/Header';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
	const [isNavOpen, setIsNavOpen] = useState(false);
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="page">
				<p>Загрузка...</p>
			</div>
		);
	}

	return (
		<div className="page">
			<Header isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />

			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/auth/callback" element={<AuthCallbackPage />} />
				<Route
					path="/home"
					element={
						isAuthenticated ? (
							<HomePage />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route
					path="/quizzes/create"
					element={
						isAuthenticated ? (
							<CreateQuizPage />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</div>
	);
}

export default App;
