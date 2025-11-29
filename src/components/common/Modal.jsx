import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ children, onClose, title, maxWidth = 'max-w-4xl' }) => {
	// Close on Escape key
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [onClose]);

	// Close on click outside
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
			onClick={handleBackdropClick}
		>
			<div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col relative animate-fadeIn`}>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
				>
					<FaTimes size={20} />
				</button>
				{title && (
					<div className="px-6 py-4 border-b dark:border-gray-700">
						<h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
					</div>
				)}
				<div className="overflow-y-auto custom-scrollbar">
					{children}
				</div>
			</div>
		</div>
	);
};

export default Modal;
