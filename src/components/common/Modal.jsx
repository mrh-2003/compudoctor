function Modal({ children, onClose }) {
	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
			onClick={onClose}
		>
			<div
				className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
				onClick={(e) => e.stopPropagation()} 
			>
				<div className="relative p-4">
					<button
						onClick={onClose}
						className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl leading-none"
						aria-label="Cerrar modal"
					>
						&times;
					</button>
					{children}
				</div>
			</div>
		</div>
	)
}

export default Modal