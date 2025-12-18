import './Loader.css';
import { useEffect, useState } from 'react';

interface LoaderProps {
	size?: 'small' | 'medium' | 'large';
	text?: string;
}

export function Loader({ size = 'medium', text }: LoaderProps) {
	const sizeClass = `loader--${size}`;
	const [showSlowMessage, setShowSlowMessage] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowSlowMessage(true);
		}, 10000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="loader-container">
			<div className={`loader ${sizeClass}`}>
				<div className="loader-spinner">
					<div className="loader-spinner-ring"></div>
					<div className="loader-spinner-ring"></div>
					<div className="loader-spinner-ring"></div>
				</div>
			</div>
			{text && <p className="loader-text">{text}</p>}
			{showSlowMessage && (
				<p className="loader-text">Первая загрузка может занять долгое время</p>
			)}
		</div>
	);
}
