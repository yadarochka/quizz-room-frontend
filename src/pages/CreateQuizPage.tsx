import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../types/quiz';

export function CreateQuizPage() {
	const navigate = useNavigate();
	const [title, setTitle] = useState('');
	const [questions, setQuestions] = useState<Question[]>([
		{
			id: 1,
			text: '',
			options: [
				{ id: 1, text: '', isCorrect: false },
				{ id: 2, text: '', isCorrect: false },
			],
		},
	]);

	const handleChangeQuestion = (id: number, value: string) => {
		setQuestions((prev) =>
			prev.map((q) => (q.id === id ? { ...q, text: value } : q)),
		);
	};

	const handleAddQuestion = () => {
		setQuestions((prev) => [
			...prev,
			{
				id: Date.now(),
				text: '',
				options: [
					{ id: Date.now() + 1, text: '', isCorrect: false },
					{ id: Date.now() + 2, text: '', isCorrect: false },
				],
			},
		]);
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

	const handleCreateQuiz = (event: FormEvent) => {
		event.preventDefault();

		const filledQuestions = questions.filter(
			(question) => question.text.trim().length > 0,
		);

		const isEveryQuestionValid = filledQuestions.every((question) => {
			const filledOptions = question.options.filter(
				(option) => option.text.trim().length > 0,
			);

			const hasCorrect = filledOptions.some(
				(option) => option.isCorrect,
			);

			return filledOptions.length >= 2 && hasCorrect;
		});

		if (
			!title.trim() ||
			filledQuestions.length === 0 ||
			!isEveryQuestionValid
		) {
			// eslint-disable-next-line no-alert
			alert(
				'Введите название, хотя бы один вопрос и минимум два варианта ответа с отмеченным правильным.',
			);
			return;
		}

		// Здесь вы можете отправить данные на сервер или сохранить их локально
		// eslint-disable-next-line no-console
		console.log('Создан квиз:', {
			title,
			questions: filledQuestions.map((question) => ({
				...question,
				options: question.options.filter(
					(option) => option.text.trim().length > 0,
				),
			})),
		});

		// eslint-disable-next-line no-alert
		alert('Квиз успешно создан!');
		navigate(-1);
	};

	return (
		<main className="create-main">
			<section className="create-section">
				<div className="create-header">
					<h1 className="create-title">Создание квиза</h1>
					<p className="create-subtitle">
						Укажите название квиза и добавьте вопросы для участников.
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
							onChange={(event) =>
								setTitle(event.target.value)
							}
						/>
					</label>

					<div className="questions-block">
						<div className="questions-block__header">
							<span className="field__label">
								Вопросы квиза
							</span>
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

					<div className="create-actions">
						<button
							type="button"
							className="secondary-button"
							onClick={() => navigate(-1)}
						>
							Назад
						</button>
						<button type="submit" className="primary-button">
							Создать
						</button>
					</div>
				</form>
			</section>
		</main>
	);
}


