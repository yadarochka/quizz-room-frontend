import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { Loader } from '../components/Loader';
import { API_URL } from '../services/api';
import {
	getSessionByQuizId,
	type SessionInfoWithCreator,
	type SessionParticipant,
} from '../services/quizzes';

export function QuizRoomPage() {
	const { quizId } = useParams<{ quizId: string }>();
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	const [session, setSession] = useState<SessionInfoWithCreator | null>(null);
	const [participants, setParticipants] = useState<SessionParticipant[]>([]);
	const [isCreator, setIsCreator] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [socketStatus, setSocketStatus] = useState<
		'idle' | 'connecting' | 'joined' | 'error'
	>('idle');
	const [isStarting, setIsStarting] = useState(false);
	const [currentQuestion, setCurrentQuestion] = useState<{
		question_id: number;
		question_text: string;
		answers: Array<{ id: number; text: string }>;
		time_limit: number;
		question_number: number;
		total_questions: number;
	} | null>(null);
	const [quizStarted, setQuizStarted] = useState(false);
	const [answeredQuestionId, setAnsweredQuestionId] = useState<number | null>(null);
	const [timeLeft, setTimeLeft] = useState<number | null>(null);
	const [answeredCount, setAnsweredCount] = useState(0);
	const [totalParticipants, setTotalParticipants] = useState(0);
	const [copiedCode, setCopiedCode] = useState(false);
	const timerIntervalRef = useRef<number | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const sessionIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login', { replace: true });
			return;
		}

		if (!quizId) {
			navigate('/home', { replace: true });
			return;
		}

		const loadSession = async () => {
			try {
				const sessionData = await getSessionByQuizId(Number(quizId));
				setSession(sessionData);
				setParticipants(sessionData.participants || []);
				setTotalParticipants(sessionData.participants.length);
				setIsCreator(sessionData.creator_id === Number(user?.id ?? 0));

				// Подключаемся к комнате
				if (sessionData.room_code) {
					connectToRoom(sessionData.room_code, sessionData.id);
				}
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Не удалось загрузить комнату';
				setError(message);
			} finally {
				setIsLoading(false);
			}
		};

		void loadSession();

		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
			socketRef.current?.disconnect();
		};
	}, [quizId, isAuthenticated, user, navigate]);

	const connectToRoom = (roomCode: string, sessionId: number) => {
		setSocketStatus('connecting');
		const socket = io(API_URL, { withCredentials: true });
		socketRef.current = socket;
		sessionIdRef.current = sessionId;

		socket.on('connect', () => {
			socket.emit('join_room', {
				room_code: roomCode,
				display_name: user?.name || 'Участник',
			});
		});

		socket.on('room_joined', async () => {
			setSocketStatus('joined');
			// Обновляем список участников
			try {
				const sessionData = await getSessionByQuizId(Number(quizId));
				setParticipants(sessionData.participants || []);
			} catch {
				// Игнорируем ошибки
			}
		});

		socket.on('room_join_error', (payload: { error?: string }) => {
			setSocketStatus('error');
			setError(payload?.error || 'Не удалось подключиться к комнате');
		});

		socket.on('connect_error', (err) => {
			setSocketStatus('error');
			setError(err.message || 'Ошибка соединения с сервером');
		});

		socket.on('participant_joined', async () => {
			// Обновляем список участников
			const currentSessionId = sessionIdRef.current;
			if (currentSessionId) {
				try {
					const sessionData = await getSessionByQuizId(Number(quizId));
					setParticipants(sessionData.participants || []);
					setTotalParticipants(sessionData.participants.length);
				} catch {
					// Игнорируем ошибки
				}
			}
		});

		socket.on('participant_left', async () => {
			// Обновляем список участников
			const currentSessionId = sessionIdRef.current;
			if (currentSessionId) {
				try {
					const sessionData = await getSessionByQuizId(Number(quizId));
					setParticipants(sessionData.participants || []);
					setTotalParticipants(sessionData.participants.length);
				} catch {
					// Игнорируем ошибки
				}
			}
		});

		socket.on('participant_answered', (payload: {
			display_name?: string;
			answered?: boolean;
			answered_count?: number;
			total_participants?: number;
		}) => {
			// Обновляем счетчик ответивших из payload
			if (payload.answered_count !== undefined) {
				setAnsweredCount(payload.answered_count);
			}
			if (payload.total_participants !== undefined) {
				setTotalParticipants(payload.total_participants);
			}
		});

		socket.on('quiz_started', () => {
			setQuizStarted(true);
			setIsStarting(false);
			// Обновляем статус сессии
			getSessionByQuizId(Number(quizId))
				.then((sessionData) => {
					setSession(sessionData);
				})
				.catch(() => {
					// Игнорируем ошибки
				});
		});

		socket.on('next_question', (payload: {
			question_id: number;
			question_text: string;
			answers: Array<{ id: number; text: string }>;
			time_limit: number;
			question_number: number;
			total_questions: number;
		}) => {
			// Очищаем предыдущий интервал
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
			
			setCurrentQuestion(payload);
			setQuizStarted(true);
			setAnsweredQuestionId(null); // Сбрасываем флаг ответа для нового вопроса
			setTimeLeft(payload.time_limit); // Устанавливаем таймер
			setAnsweredCount(0); // Сбрасываем счетчик ответов
			
			// Запускаем таймер
			let remaining = payload.time_limit;
			setTimeLeft(remaining);
			
			timerIntervalRef.current = window.setInterval(() => {
				remaining -= 1;
				if (remaining >= 0) {
					setTimeLeft(remaining);
				}
				if (remaining <= 0) {
					if (timerIntervalRef.current) {
						clearInterval(timerIntervalRef.current);
						timerIntervalRef.current = null;
					}
				}
			}, 1000);
		});

		socket.on('question_timeout', () => {
			// Время на вопрос истекло, показываем результаты
			setCurrentQuestion(null);
			setTimeLeft(0);
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
		});

		socket.on('quiz_finished', () => {
			// Квиз завершен, переходим на страницу результатов
			if (sessionIdRef.current) {
				navigate(`/results/${sessionIdRef.current}`, { replace: true });
			}
		});

		socket.on('answer_submitted', () => {
			// Ответ отправлен успешно
			// Можно показать подтверждение
		});

		socket.on('answer_error', (payload: { error?: string }) => {
			setError(payload?.error || 'Ошибка при отправке ответа');
		});

		socket.on('quiz_error', (payload: { error?: string }) => {
			setError(payload?.error || 'Ошибка при запуске квиза');
			setIsStarting(false);
		});

		socket.on('disconnect', () => {
			if (socketStatus !== 'error') {
				setSocketStatus('idle');
			}
		});
	};

	const handleStartQuiz = () => {
		if (!socketRef.current || !sessionIdRef.current) {
			setError('Нет подключения к комнате');
			return;
		}

		setIsStarting(true);
		setError(null);

		socketRef.current.emit('start_quiz', {
			session_id: sessionIdRef.current,
		});
	};

	if (!isAuthenticated || isLoading) {
		return (
			<main className="section section--center">
				<Loader size="large" />
			</main>
		);
	}

	if (error && !session) {
		return (
			<main className="section section--center">
				<p className="error-text">{error}</p>
				<button
					type="button"
					className="primary-button"
					onClick={() => navigate('/home')}
				>
					Вернуться на главную
				</button>
			</main>
		);
	}

	if (!session) {
		return null;
	}

	// Если квиз начался и есть текущий вопрос, показываем его
	if (quizStarted && currentQuestion) {
		const timeLeftDisplay = timeLeft !== null ? Math.max(0, timeLeft) : currentQuestion.time_limit;
		const timePercentage = timeLeft !== null && currentQuestion.time_limit > 0
			? Math.max(0, Math.min(100, (timeLeft / currentQuestion.time_limit) * 100))
			: 100;
		
		const timerColor = timeLeftDisplay <= 10 ? '#ff4444' : timeLeftDisplay <= 30 ? '#ffaa00' : '#667eea';
		
		return (
			<main className="section section--center" style={{ padding: '2rem 1rem' }}>
				<section className="auth-card" style={{
					maxWidth: '100%',
					width: '100%',
					padding: '2rem',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}>
					{/* Заголовок с таймером */}
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '1.5rem',
						flexWrap: 'wrap',
						gap: '1rem',
					}}>
						<div>
							<h1 className="auth-title" style={{
								margin: 0,
								fontSize: '1.8rem',
								background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}>
								Вопрос {currentQuestion.question_number} из {currentQuestion.total_questions}
							</h1>
						</div>
						<div style={{
							background: timerColor,
							color: 'white',
							padding: '0.75rem 1.5rem',
							borderRadius: '12px',
							fontSize: '1.5rem',
							fontWeight: 'bold',
							minWidth: '100px',
							textAlign: 'center',
							boxShadow: `0 4px 12px ${timerColor}40`,
							transition: 'all 0.3s ease',
							animation: timeLeftDisplay <= 10 ? 'pulse 1s infinite' : undefined,
						}}>
							⏱ {timeLeftDisplay}с
						</div>
					</div>
					
					{/* Прогресс-бар таймера */}
					<div style={{
						width: '100%',
						height: '12px',
						background: '#e8e8e8',
						borderRadius: '6px',
						marginBottom: '1.5rem',
						overflow: 'hidden',
						boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
					}}>
						<div style={{
							width: `${timePercentage}%`,
							height: '100%',
							background: `linear-gradient(90deg, ${timerColor} 0%, ${timerColor}dd 100%)`,
							transition: 'width 1s linear, background 0.3s',
							borderRadius: '6px',
						}} />
					</div>
					
					{/* Счетчик ответивших */}
					{totalParticipants > 0 && (
						<div style={{
							background: '#f5f5f5',
							padding: '0.75rem 1rem',
							borderRadius: '8px',
							marginBottom: '1.5rem',
							textAlign: 'center',
						}}>
							<p style={{
								margin: 0,
								fontSize: '1rem',
								color: '#666',
								fontWeight: '500',
							}}>
								👥 Ответили: <strong style={{ color: '#667eea' }}>{answeredCount}</strong> / <strong>{totalParticipants}</strong>
							</p>
						</div>
					)}
					
					{/* Текст вопроса */}
					<div style={{
						background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
						padding: '2rem',
						borderRadius: '12px',
						marginBottom: '2rem',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					}}>
						<p style={{
							margin: 0,
							fontSize: '1.4rem',
							lineHeight: '1.6',
							color: '#333',
							fontWeight: '500',
						}}>
							{currentQuestion.question_text}
						</p>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						{currentQuestion.answers.map((answer, index) => {
							const isAnswered = answeredQuestionId === currentQuestion.question_id;
							return (
								<button
									key={answer.id}
									type="button"
									className="primary-button"
									style={{
										padding: '1.25rem 1.5rem',
										fontSize: '1.1rem',
										borderRadius: '12px',
										border: 'none',
										background: isAnswered
											? '#e0e0e0'
											: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										color: isAnswered ? '#999' : 'white',
										cursor: isAnswered ? 'not-allowed' : 'pointer',
										transition: 'all 0.3s ease',
										boxShadow: isAnswered
											? 'none'
											: '0 4px 12px rgba(102, 126, 234, 0.4)',
										transform: isAnswered ? 'none' : 'translateY(0)',
										opacity: isAnswered ? 0.7 : 1,
									}}
									disabled={isAnswered}
									onMouseEnter={(e) => {
										if (!isAnswered) {
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
										}
									}}
									onMouseLeave={(e) => {
										if (!isAnswered) {
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
										}
									}}
									onClick={() => {
										// Отправляем ответ
										if (socketRef.current && sessionIdRef.current && !isAnswered) {
											socketRef.current.emit('submit_answer', {
												question_id: currentQuestion.question_id,
												answer_id: answer.id,
											});
											setAnsweredQuestionId(currentQuestion.question_id);
										}
									}}
								>
									<span style={{ marginRight: '0.5rem' }}>
										{String.fromCharCode(65 + index)}.
									</span>
									{answer.text}
								</button>
							);
						})}
					</div>
					{answeredQuestionId === currentQuestion.question_id ? (
						<div style={{
							background: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)',
							padding: '1rem',
							borderRadius: '8px',
							marginTop: '1.5rem',
							textAlign: 'center',
						}}>
							<p style={{
								margin: 0,
								color: 'white',
								fontSize: '1.1rem',
								fontWeight: 'bold',
							}}>
								✓ Ответ отправлен! Ожидаем результатов...
							</p>
						</div>
					) : null}
				</section>
			</main>
		);
	}

	// Если квиз начался, но вопроса еще нет - показываем ожидание
	if (quizStarted && !currentQuestion) {
		return (
			<main className="section section--center" style={{ padding: '2rem 1rem' }}>
				<section
					className="auth-card"
					style={{
						maxWidth: '100%',
						width: '100%',
						padding: '2rem',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							minHeight: '200px',
						}}
					>
						<Loader size="medium" text="Ожидаем следующий вопрос..." />
					</div>
				</section>
			</main>
		);
	}

	// Обычный вид комнаты (до начала квиза)
	return (
		<main className="section section--center" style={{ padding: '2rem 1rem', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
			<section className="auth-card" style={{
				maxWidth: '100%',
				width: '100%',
				padding: '3rem 2rem',
				background: 'white',
				borderRadius: '24px',
				boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
			}}>
				{/* Заголовок */}
				<div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
					<div style={{
						fontSize: '4rem',
						marginBottom: '1rem',
						animation: 'pulse 2s infinite',
					}}>
						🎯
					</div>
					<h1 style={{
						margin: '0 0 0.5rem 0',
						fontSize: '2.5rem',
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						fontWeight: 'bold',
					}}>
						Комната квиза
					</h1>
					{session.room_code ? (
						<div style={{ marginTop: '1rem', position: 'relative' }}>
							<div
								onClick={async () => {
									try {
										await navigator.clipboard.writeText(session.room_code);
										setCopiedCode(true);
										setTimeout(() => setCopiedCode(false), 2000);
									} catch (err) {
										// Fallback для старых браузеров
										const textArea = document.createElement('textarea');
										textArea.value = session.room_code;
										textArea.style.position = 'fixed';
										textArea.style.opacity = '0';
										document.body.appendChild(textArea);
										textArea.select();
										try {
											document.execCommand('copy');
											setCopiedCode(true);
											setTimeout(() => setCopiedCode(false), 2000);
										} catch {
											// Игнорируем ошибки
										}
										document.body.removeChild(textArea);
									}
								}}
								style={{
									display: 'inline-block',
									padding: '1rem 2rem',
									background: copiedCode
										? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
										: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									borderRadius: '12px',
									color: 'white',
									fontSize: '1.1rem',
									fontWeight: 'bold',
									boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
									cursor: 'pointer',
									transition: 'all 0.3s ease',
									userSelect: 'none',
								}}
								onMouseEnter={(e) => {
									if (!copiedCode) {
										e.currentTarget.style.transform = 'scale(1.05)';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
									}
								}}
								onMouseLeave={(e) => {
									if (!copiedCode) {
										e.currentTarget.style.transform = 'scale(1)';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
									}
								}}
							>
								<span style={{ opacity: 0.9, marginRight: '0.5rem' }}>
									{copiedCode ? '✓ Скопировано!' : 'Код комнаты:'}
								</span>
								<span style={{ fontSize: '1.5rem', letterSpacing: '0.2em' }}>
									{session.room_code}
								</span>
							</div>
							{!copiedCode && (
								<div style={{
									position: 'absolute',
									top: '100%',
									left: '50%',
									transform: 'translateX(-50%)',
									marginTop: '0.5rem',
									fontSize: '0.85rem',
									color: 'white',
									opacity: 0.8,
									whiteSpace: 'nowrap',
								}}>
									👆 Нажмите, чтобы скопировать
								</div>
							)}
						</div>
					) : null}
				</div>

				{/* Статус подключения */}
				<div style={{
					display: 'flex',
					justifyContent: 'center',
					gap: '1rem',
					marginBottom: '2.5rem',
					flexWrap: 'wrap',
				}}>
					<div style={{
						padding: '0.75rem 1.5rem',
						background: session.status === 'waiting' ? '#f0f9ff' : '#fef3c7',
						borderRadius: '8px',
						border: `2px solid ${session.status === 'waiting' ? '#3b82f6' : '#f59e0b'}`,
					}}>
						<span style={{
							fontSize: '0.9rem',
							color: '#666',
							marginRight: '0.5rem',
						}}>
							Статус:
						</span>
						<strong style={{
							color: session.status === 'waiting' ? '#3b82f6' : '#f59e0b',
							fontSize: '1rem',
						}}>
							{session.status === 'waiting' ? '⏳ Ожидание' : '▶️ В процессе'}
						</strong>
					</div>
					<div style={{
						padding: '0.75rem 1.5rem',
						background: socketStatus === 'joined' ? '#d1fae5' : '#fee2e2',
						borderRadius: '8px',
						border: `2px solid ${socketStatus === 'joined' ? '#10b981' : '#ef4444'}`,
					}}>
						<span style={{
							fontSize: '0.9rem',
							color: '#666',
							marginRight: '0.5rem',
						}}>
							Подключение:
						</span>
						<strong style={{
							color: socketStatus === 'joined' ? '#10b981' : '#ef4444',
							fontSize: '1rem',
						}}>
							{socketStatus === 'joined' ? '✅ Подключено' : '🔄 Подключаемся...'}
						</strong>
					</div>
				</div>

				{/* Участники */}
				<div style={{
					background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
					padding: '2rem',
					borderRadius: '16px',
					marginBottom: '2rem',
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
				}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '1.5rem',
					}}>
						<h2 style={{
							margin: 0,
							fontSize: '1.8rem',
							color: '#333',
							fontWeight: 'bold',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}>
							👥 Участники
						</h2>
						<div style={{
							padding: '0.5rem 1rem',
							background: 'white',
							borderRadius: '20px',
							fontSize: '1.1rem',
							fontWeight: 'bold',
							color: '#667eea',
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
						}}>
							{participants.length}
						</div>
					</div>
					{participants.length > 0 ? (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
							gap: '1rem',
						}}>
							{participants.map((p, idx) => {
								const isCurrentUser = p.user_id === Number(user?.id ?? 0);
								return (
									<div
										key={p.user_id || idx}
										style={{
											padding: '1rem 1.25rem',
											background: isCurrentUser
												? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
												: 'white',
											borderRadius: '12px',
											color: isCurrentUser ? 'white' : '#333',
											fontWeight: isCurrentUser ? 'bold' : '500',
											boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
											transition: 'transform 0.2s ease',
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.transform = 'translateY(-2px)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.transform = 'translateY(0)';
										}}
									>
										<span style={{ fontSize: '1.2rem' }}>
											{isCurrentUser ? '👤' : '👥'}
										</span>
										<span>{p.display_name}</span>
										{isCurrentUser && (
											<span style={{
												fontSize: '0.85rem',
												opacity: 0.9,
												marginLeft: 'auto',
											}}>
												(Вы)
											</span>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<div style={{
							textAlign: 'center',
							padding: '2rem',
							color: '#666',
						}}>
							<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
							<p style={{ margin: 0, fontSize: '1.1rem' }}>
								Пока нет участников. Ожидаем подключения...
							</p>
						</div>
					)}
				</div>

				{/* Действия создателя */}
				{isCreator && socketStatus === 'joined' ? (
					<div style={{ textAlign: 'center' }}>
						{participants.length > 0 ? (
							<button
								type="button"
								className="primary-button"
								onClick={handleStartQuiz}
								disabled={isStarting || session.status !== 'waiting'}
								style={{
									padding: '1.25rem 3rem',
									fontSize: '1.3rem',
									fontWeight: 'bold',
									background: isStarting || session.status !== 'waiting'
										? '#999'
										: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									color: 'white',
									border: 'none',
									borderRadius: '12px',
									cursor: isStarting || session.status !== 'waiting' ? 'not-allowed' : 'pointer',
									boxShadow: isStarting || session.status !== 'waiting'
										? 'none'
										: '0 8px 24px rgba(102, 126, 234, 0.4)',
									transition: 'all 0.3s ease',
									minWidth: '250px',
								}}
								onMouseEnter={(e) => {
									if (!isStarting && session.status === 'waiting') {
										e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
										e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
									}
								}}
								onMouseLeave={(e) => {
									if (!isStarting && session.status === 'waiting') {
										e.currentTarget.style.transform = 'translateY(0) scale(1)';
										e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
									}
								}}
							>
								{isStarting
									? '⏳ Запускаем квиз...'
									: session.status === 'waiting'
										? '🚀 Начать квиз'
										: '✅ Квиз уже запущен'}
							</button>
						) : (
							<div style={{
								padding: '2rem',
								background: '#fef3c7',
								borderRadius: '12px',
								border: '2px solid #f59e0b',
							}}>
								<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
								<p style={{
									margin: 0,
									color: '#92400e',
									fontSize: '1.1rem',
									fontWeight: '500',
								}}>
									Ожидаем участников...
								</p>
							</div>
						)}
					</div>
				) : (
					<div style={{
						textAlign: 'center',
						padding: '2rem',
						background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
						borderRadius: '12px',
						border: '2px solid #667eea',
					}}>
						<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
							{socketStatus === 'joined' ? '⏸️' : '🔄'}
						</div>
						<p style={{
							margin: 0,
							color: '#667eea',
							fontSize: '1.2rem',
							fontWeight: 'bold',
						}}>
							{socketStatus === 'joined'
								? 'Ожидаем начала квиза...'
								: 'Подключаемся к комнате...'}
						</p>
					</div>
				)}

				{error ? (
					<div style={{
						marginTop: '2rem',
						padding: '1rem',
						background: '#fee2e2',
						borderRadius: '8px',
						border: '2px solid #ef4444',
						color: '#991b1b',
						textAlign: 'center',
					}}>
						<p className="error-text" style={{ margin: 0 }}>{error}</p>
					</div>
				) : null}
			</section>
		</main>
	);
}

