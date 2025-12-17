import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../services/api';

export function JoinRoomPage() {
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	const [roomCode, setRoomCode] = useState('');
	const [displayName, setDisplayName] = useState(user?.name || '');
	const [isJoining, setIsJoining] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [socketStatus, setSocketStatus] = useState<
		'idle' | 'connecting' | 'joined' | 'error'
	>('idle');
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		return () => {
			socketRef.current?.disconnect();
		};
	}, []);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login', { replace: true });
		}
	}, [isAuthenticated, navigate]);

	const handleJoinRoom = async (event: FormEvent) => {
		event.preventDefault();
		setError(null);

		const code = roomCode.trim().toUpperCase();
		const name = displayName.trim();

		if (!code || code.length < 4) {
			setError('Введите код комнаты (минимум 4 символа)');
			return;
		}

		if (!name || name.length < 2) {
			setError('Введите ваше имя (минимум 2 символа)');
			return;
		}

		setIsJoining(true);
		setSocketStatus('connecting');

		const socket = io(API_URL, { withCredentials: true });
		socketRef.current = socket;

		socket.on('connect', () => {
			socket.emit('join_room', {
				room_code: code,
				display_name: name,
			});
		});

		socket.on('room_joined', (payload: {
			session_id?: number;
			quiz_id?: number;
			participants?: Array<{
				display_name: string;
				user_id: number;
			}>;
		}) => {
			setSocketStatus('joined');
			setIsJoining(false);
			// TODO: Переход на страницу ожидания/игры
			// Можно сохранить session_id в state или localStorage
		});

		socket.on('room_join_error', (payload: { error?: string }) => {
			setSocketStatus('error');
			setError(payload?.error || 'Не удалось подключиться к комнате');
			setIsJoining(false);
			socket.disconnect();
		});

		socket.on('connect_error', (err) => {
			setSocketStatus('error');
			setError(err.message || 'Ошибка соединения с сервером');
			setIsJoining(false);
		});

		socket.on('disconnect', () => {
			if (socketStatus !== 'error') {
				setSocketStatus('idle');
			}
		});
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<main className="section section--center">
			<section className="auth-card">
				<h1 className="auth-title">Присоединиться к квизу</h1>
				<p className="auth-subtitle">
					Введите код комнаты, чтобы присоединиться к квизу.
				</p>

				<form onSubmit={handleJoinRoom} className="auth-form">
					<label className="field">
						<span className="field__label">Код комнаты</span>
						<input
							type="text"
							className="field__input"
							placeholder="Например: ABC123"
							value={roomCode}
							onChange={(event) =>
								setRoomCode(event.target.value.toUpperCase())
							}
							maxLength={10}
							disabled={isJoining}
						/>
					</label>

					<label className="field">
						<span className="field__label">Ваше имя</span>
						<input
							type="text"
							className="field__input"
							placeholder="Как вас называть?"
							value={displayName}
							onChange={(event) => setDisplayName(event.target.value)}
							maxLength={50}
							disabled={isJoining}
						/>
					</label>

					{error ? <p className="error-text">{error}</p> : null}

					{socketStatus === 'joined' ? (
						<div className="success-message">
							<p>Вы успешно присоединились к комнате!</p>
							<p>Статус: {socketStatus}</p>
							<p>Ожидайте начала квиза...</p>
						</div>
					) : null}

					<button
						type="submit"
						className="primary-button auth-button"
						disabled={isJoining || socketStatus === 'joined'}
					>
						{isJoining
							? 'Подключаемся...'
							: socketStatus === 'joined'
								? 'Подключено'
								: 'Присоединиться'}
					</button>
				</form>
			</section>
		</main>
	);
}

