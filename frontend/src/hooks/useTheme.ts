import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme(): [Theme, () => void] {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Apply on first mount (handles SSR/hydration edge cases)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

    return [theme, toggle];
}
