
import React, { createContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

function ThemeProvider({ children }) {
	const [theme, setTheme] = useState('dark')

	useEffect(() => {
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) {
			setTheme(savedTheme)
		}
	}, [])

	useEffect(() => {
		const root = window.document.documentElement
		if (theme === 'dark') {
			root.classList.add('dark')
		} else {
			root.classList.remove('dark')
		}
		localStorage.setItem('theme', theme)
	}, [theme])

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light')
	}

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export { ThemeContext, ThemeProvider }
 