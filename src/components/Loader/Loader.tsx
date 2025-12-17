import './Loader.css';

interface LoaderProps {
	size?: 'small' | 'medium' | 'large';
	text?: string;
}

export function Loader({ size = 'medium', text }: LoaderProps) {
	const sizeClass = `loader--${size}`;
	
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
		</div>
	);
}

