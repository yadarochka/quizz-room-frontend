import {
	type FormEvent,
	useEffect,
	useRef,
	useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../services/api';
import {
	createQuiz,
	createSession,
	type CreatedQuiz,
	type CreatedSession,
} from '../services/quizzes';
import type { Question } from '../types/quiz';

type EditableQuestion = Question;

const DEFAULT_TIME_LIMIT = 30;
const MIN_TIME_LIMIT = 5;
const MAX_TIME_LIMIT = 600;

function buildInitialQuestion(): EditableQuestion {
	return {
		id: Date.now(),
		text: '',
		timeLimit: DEFAULT_TIME_LIMIT,
		options: [
			{ id: Date.now() + 1, text: '', isCorrect: false },
			{ id: Date.now() + 2, text: '', isCorrect: false },
		],
	};
}

export function CreateQuizPage() {
	const { user } = useAuth();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [questions, setQuestions] = useState<EditableQuestion[]>([
		buildInitialQuestion(),
	]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdQuiz, setCreatedQuiz] = useState<CreatedQuiz | null>(null);
	const [createdSession, setCreatedSession] =
		useState<CreatedSession | null>(null);
	const [socketStatus, setSocketStatus] = useState<
		'idle' | 'connecting' | 'joined' | 'error'
	>('idle');
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		return () => {
			socketRef.current?.disconnect();
		};
	}, []);

	const handleChangeQuestion = (id: number, value: string) => {
		setQuestions((prev) =>
			prev.map((q) => (q.id === id ? { ...q, text: value } : q)),
		);
	};

	const handleChangeTimeLimit = (id: number, value: number) => {
		setQuestions((prev) =>
			prev.map((q) =>
				q.id === id ? { ...q, timeLimit: Math.max(MIN_TIME_LIMIT, value) } : q,
			),
		);
	};

	const handleAddQuestion = () => {
		setQuestions((prev) => [...prev, buildInitialQuestion()]);
	};

	const handleChangeOptionText = (
		questionId: number,
		optionId: number,
		value: string,
	) => {
		setQuestions((prev) =>
			prev.map((question) =>
				question.id !== questionId
					? question
					: {
							...question,
							options: question.options.map((option) =>
								option.id === optionId
									? { ...option, text: value }
									: option,
							),
					  },
			),
		);
	};

	const handleToggleCorrectOption = (questionId: number, optionId: number) => {
		setQuestions((prev) =>
			prev.map((question) =>
				question.id !== questionId
					? question
					: {
							...question,
							options: question.options.map((option) =>
								option.id === optionId
									? {
											...option,
											isCorrect: !option.isCorrect,
									  }
									: option,
							),
					  },
			),
		);
	};

	const handleAddOption = (questionId: number) => {
		setQuestions((prev) =>
			prev.map((question) =>
				question.id !== questionId
					? question
					: {
							...question,
							options: [
								...question.options,
								{
									id: Date.now(),
									text: '',
									isCorrect: false,
								},
							],
					  },
			),
		);
	};

	const connectToSessionRoom = (roomCode: string) => {
		setSocketStatus('connecting');
		const socket = io(API_URL, { withCredentials: true });
		socketRef.current = socket;

		socket.on('connect', () => {
			socket.emit('join_room', {
				room_code: roomCode,
				display_name: user?.name || 'Ведущий',
			});
		});

		socket.on('room_joined', () => {
			setSocketStatus('joined');
		});

		socket.on('room_join_error', (payload: { error?: string }) => {
			setSocketStatus('error');
			setError(payload?.error || 'Не удалось подключиться к комнате');
		});

		socket.on('connect_error', (err) => {
			setSocketStatus('error');
			setError(err.message || 'Ошибка соединения с сервером');
		});

		socket.on('disconnect', () => {
			if (socketStatus !== 'error') {
				setSocketStatus('idle');
			}
		});
	};

	const handleCreateQuiz = async (event: FormEvent) => {
		event.preventDefault();
		setError(null);

		const filledQuestions = questions.filter(
			(question) => question.text.trim().length > 0,
		);

		const isEveryQuestionValid = filledQuestions.every((question) => {
			const filledOptions = question.options.filter(
				(option) => option.text.trim().length > 0,
			);

			const hasCorrect = filledOptions.some((option) => option.isCorrect);

			return filledOptions.length >= 2 && hasCorrect;
		});

		if (
			!title.trim() ||
			filledQuestions.length === 0 ||
			!isEveryQuestionValid
		) {
			setError(
				'Введите название, хотя бы один вопрос и минимум два варианта ответа с отмеченным правильным.',
			);
			return;
		}

		const payload = {
			title: title.trim(),
			description: description.trim(),
			questions: filledQuestions.map((question) => {
				const filledOptions = question.options.filter(
					(option) => option.text.trim().length > 0,
				);

				const timeLimit = Math.min(
					MAX_TIME_LIMIT,
					Math.max(MIN_TIME_LIMIT, question.timeLimit),
				);

				return {
					text: question.text.trim(),
					time_limit: timeLimit,
					answers: filledOptions.map((option) => ({
						text: option.text.trim(),
						is_correct: option.isCorrect,
					})),
				};
			}),
		};

		setIsSubmitting(true);

		try {
			const quiz = await createQuiz(payload);
			setCreatedQuiz(quiz);

			const session = await createSession(quiz.id);
			setCreatedSession(session);

			connectToSessionRoom(session.room_code);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: 'Не удалось создать квиз. Попробуйте ещё раз.';
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="create-main">
			<section className="create-section">
				<div className="create-header">
					<h1 className="create-title">Создание квиза</h1>
					<p className="create-subtitle">
						Сохраните квиз и сразу получите комнату для участников.
					</p>
				</div>

				<form className="create-form" onSubmit={handleCreateQuiz}>
					<label className="field">
						<span className="field__label">Название квиза</span>
						<input
							type="text"
							className="field__input"
							placeholder="Например: Викторина по фильмам"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</label>

					<label className="field">
						<span className="field__label">Описание (необязательно)</span>
						<textarea
							className="field__textarea"
							placeholder="Короткое описание для участников"
							value={description}
							onChange={(event) =>
								setDescription(event.target.value)
							}
						/>
					</label>

					<div className="questions-block">
						<div className="questions-block__header">
							<span className="field__label">Вопросы квиза</span>
							<button
								type="button"
								className="link-button"
								onClick={handleAddQuestion}
							>
								+ Добавить вопрос
							</button>
						</div>

						<div className="questions-list">
							{questions.map((question, index) => (
								<div key={question.id} className="question-block">
									<label className="field field--question">
										<span className="field__label">
											Вопрос {index + 1}
										</span>
										<textarea
											className="field__textarea"
											placeholder="Введите текст вопроса"
											value={question.text}
											onChange={(event) =>
												handleChangeQuestion(
													question.id,
													event.target.value,
												)
											}
										/>
									</label>

									<label className="field">
										<span className="field__label">
											Время на ответ (сек)
										</span>
										<input
											type="number"
											min={MIN_TIME_LIMIT}
											className="field__input"
											value={question.timeLimit}
											onChange={(event) =>
												handleChangeTimeLimit(
													question.id,
													Number(event.target.value),
												)
											}
										/>
									</label>

									<div className="options-block">
										<div className="options-block__header">
											<span className="field__label">
												Варианты ответа
											</span>
											<button
												type="button"
												className="link-button"
												onClick={() =>
													handleAddOption(question.id)
												}
											>
												+ Добавить вариант
											</button>
										</div>

										<div className="options-list">
											{question.options.map(
												(option, idx) => (
													<div
														key={option.id}
														className="option-row"
													>
														<label className="option-checkbox">
															<input
																type="checkbox"
																checked={
																	option.isCorrect
																}
																onChange={() =>
																	handleToggleCorrectOption(
																		question.id,
																		option.id,
																	)
																}
															/>
															<span>
																Правильный ответ
															</span>
														</label>
														<input
															type="text"
															className="field__input option-input"
															placeholder={`Вариант ${
																idx + 1
															}`}
															value={option.text}
															onChange={(event) =>
																handleChangeOptionText(
																	question.id,
																	option.id,
																	event.target
																		.value,
																)
															}
														/>
													</div>
												),
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{error ? (
						<p className="error-text">{error}</p>
					) : null}

					<div className="create-actions">
						<button
							type="submit"
							className="primary-button"
							disabled={isSubmitting}
						>
							{isSubmitting
								? 'Сохраняем...'
								: 'Создать квиз и комнату'}
						</button>
					</div>
				</form>

				{createdSession ? (
					<div className="room-summary">
						<h2 className="create-title">Комната создана</h2>
						<p className="section__subtitle">
							Поделитесь кодом, чтобы участники подключились:
						</p>
						<div className="room-code">
							Код комнаты: <strong>{createdSession.room_code}</strong>
						</div>
						<p className="section__subtitle">
							Статус соединения: {socketStatus}
						</p>
						{createdQuiz ? (
							<p className="section__subtitle">
								Квиз: {createdQuiz.title}
							</p>
						) : null}
					</div>
				) : null}
			</section>
		</main>
	);
}


