import { createContext } from 'react'
import type { ThemeModeContextValue } from './ThemeModeProvider.interfaces'

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)
