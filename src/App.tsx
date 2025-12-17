import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './auth/AuthContext';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ActiveQuizzesPage } from './pages/ActiveQuizzesPage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { HomePage } from './pages/HomePage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QuizResultsPage } from './pages/QuizResultsPage';
import { QuizRoomPage } from './pages/QuizRoomPage';

function App() {
	const [isNavOpen, setIsNavOpen] = useState(false);
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
				<Loader size="large" />
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
				<Route path="/auth/yandex/callback" element={<AuthCallbackPage />} />
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
				<Route
					path="/join"
					element={
						isAuthenticated ? (
							<JoinRoomPage />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route
					path="/quizzes/:quizId"
					element={
						isAuthenticated ? (
							<QuizRoomPage />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route
					path="/active"
					element={
						isAuthenticated ? (
							<ActiveQuizzesPage />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route
					path="/results/:sessionId"
					element={
						isAuthenticated ? (
							<QuizResultsPage />
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
