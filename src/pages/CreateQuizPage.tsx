import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	createQuiz,
	createSession,
	generateQuestions,
	type GeneratedQuestion,
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
	const navigate = useNavigate();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [questions, setQuestions] = useState<EditableQuestion[]>([
		buildInitialQuestion(),
	]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [aiTopic, setAiTopic] = useState('');
	const [questionCount, setQuestionCount] = useState(5);
	const [aiProvider, setAiProvider] = useState<'groq' | 'gemini'>('groq');

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

	const handleGenerateQuestions = async () => {
		if (!aiTopic.trim()) {
			setError('Введите тему для генерации вопросов');
			return;
		}

		setIsGenerating(true);
		setError(null);

		// Автоматически заполняем название квиза, если оно пустое
		if (!title.trim()) {
			setTitle(aiTopic.trim());
		}

		try {
			const result = await generateQuestions({
				topic: aiTopic.trim(),
				count: questionCount,
				provider: aiProvider,
			});

			// Преобразуем сгенерированные вопросы в формат EditableQuestion
			const generatedQuestions: EditableQuestion[] = result.questions.map(
				(q: GeneratedQuestion) => ({
					id: Date.now() + Math.random(),
					text: q.text,
					timeLimit: q.time_limit,
					options: q.answers.map((answer, idx) => ({
						id: Date.now() + Math.random() + idx,
						text: answer.text,
						isCorrect: answer.is_correct,
					})),
				}),
			);

			// Добавляем сгенерированные вопросы к существующим
			setQuestions((prev) => [...prev, ...generatedQuestions]);
			setAiTopic(''); // Очищаем поле после успешной генерации
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: 'Не удалось сгенерировать вопросы. Проверьте настройки API.';
			setError(message);
		} finally {
			setIsGenerating(false);
		}
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

			await createSession(quiz.id);

			// Редиректим на страницу комнаты
			navigate(`/quizzes/${quiz.id}`, { replace: true });
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

					{/* AI Generation Section */}
					<div style={{
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						padding: '2rem',
						borderRadius: '16px',
						marginBottom: '2rem',
						marginTop: '1rem',
						color: 'white',
						boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
						border: '2px solid rgba(255, 255, 255, 0.2)',
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
							<span style={{ fontSize: '2rem' }}>🤖</span>
							<h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
								Генерация вопросов с помощью ИИ
							</h3>
						</div>
						<label className="field" style={{ marginBottom: '1rem' }}>
							<span className="field__label" style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>
								Выберите нейросеть
							</span>
							<select
								className="field__input"
								value={aiProvider}
								onChange={(e) => setAiProvider(e.target.value as typeof aiProvider)}
								disabled={isGenerating}
								style={{
									background: 'white',
									padding: '0.875rem 1rem',
									fontSize: '1rem',
									border: 'none',
									borderRadius: '8px',
									cursor: isGenerating ? 'not-allowed' : 'pointer',
									width: '100%',
								}}
							>
								<option value="groq">Groq (Llama 3.1) - Бесплатно, быстро</option>
								<option value="gemini">Google Gemini - Бесплатно</option>
							</select>
						</label>
						<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
							<label className="field" style={{ flex: '1 1 300px', margin: 0 }}>
								<span className="field__label" style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>
									Введите тему квиза
								</span>
								<input
									type="text"
									className="field__input"
									placeholder="Например: История России, Математика, Фильмы 90-х"
									value={aiTopic}
									onChange={(event) => {
										setAiTopic(event.target.value);
										// Автозаполнение названия квиза, если оно пустое
										if (!title.trim()) {
											setTitle(event.target.value);
										}
									}}
									disabled={isGenerating}
									style={{
										background: 'white',
										padding: '0.875rem 1rem',
										fontSize: '1rem',
										border: 'none',
										borderRadius: '8px',
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && aiTopic.trim() && !isGenerating) {
											e.preventDefault();
											handleGenerateQuestions();
										}
									}}
								/>
							</label>
							<label className="field" style={{ margin: 0, minWidth: '150px' }}>
								<span className="field__label" style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>
									Количество вопросов
								</span>
								<select
									className="field__input"
									value={questionCount}
									onChange={(e) => setQuestionCount(Number(e.target.value))}
									disabled={isGenerating}
									style={{
										background: 'white',
										padding: '0.875rem 1rem',
										fontSize: '1rem',
										border: 'none',
										borderRadius: '8px',
										cursor: isGenerating ? 'not-allowed' : 'pointer',
									}}
								>
									<option value={3}>3 вопроса</option>
									<option value={5}>5 вопросов</option>
									<option value={10}>10 вопросов</option>
									<option value={15}>15 вопросов</option>
									<option value={20}>20 вопросов</option>
								</select>
							</label>
							<button
								type="button"
								className="primary-button"
								onClick={handleGenerateQuestions}
								disabled={isGenerating || !aiTopic.trim()}
								style={{
									background: isGenerating || !aiTopic.trim() ? '#999' : 'white',
									color: isGenerating || !aiTopic.trim() ? '#ccc' : '#667eea',
									border: 'none',
									padding: '0.875rem 2rem',
									borderRadius: '8px',
									cursor: isGenerating || !aiTopic.trim() ? 'not-allowed' : 'pointer',
									fontWeight: 'bold',
									fontSize: '1rem',
									whiteSpace: 'nowrap',
									boxShadow: isGenerating || !aiTopic.trim() ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)',
									transition: 'all 0.3s ease',
									minWidth: '200px',
								}}
								onMouseEnter={(e) => {
									if (!isGenerating && aiTopic.trim()) {
										e.currentTarget.style.transform = 'translateY(-2px)';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
									}
								}}
								onMouseLeave={(e) => {
									if (!isGenerating && aiTopic.trim()) {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
									}
								}}
							>
								{isGenerating ? '⏳ Генерируем...' : '✨ Сгенерировать вопросы'}
							</button>
						</div>
						<div style={{
							marginTop: '1rem',
							padding: '0.75rem 1rem',
							background: 'rgba(255, 255, 255, 0.15)',
							borderRadius: '8px',
						}}>
							<p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95, lineHeight: '1.5' }}>
								💡 <strong>ИИ автоматически создаст {questionCount} вопросов</strong> с 4 вариантами ответов каждый по указанной теме. 
								Вопросы будут добавлены в список ниже, и вы сможете их отредактировать.
								{questionCount > 10 && ' Большое количество вопросов будет сгенерировано в несколько этапов.'}
							</p>
						</div>
					</div>

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
			</section>
		</main>
	);
}


