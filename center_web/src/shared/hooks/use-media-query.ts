import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si une media query correspond
 * @param query - La media query à tester (ex: "(min-width: 768px)")
 * @returns true si la media query correspond, false sinon
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Fonction pour mettre à jour l'état
    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };

    // Vérifier immédiatement
    updateMatches();

    // Écouter les changements
    mediaQuery.addEventListener('change', updateMatches);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}

