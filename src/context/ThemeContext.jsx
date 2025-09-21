import React, { createContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

function ThemeProvider({ children }) {
	const getInitialTheme = () => {
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) {
			return savedTheme
		}
		const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
		return prefersDarkMode ? 'dark' : 'light'
	}

	const [theme, setTheme] = useState(getInitialTheme)

	useEffect(() => {
		const root = window.document.documentElement
		root.classList.remove('light', 'dark')
		root.classList.add(theme)
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