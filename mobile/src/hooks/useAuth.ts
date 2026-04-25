// Custom hook d'authentification — à implémenter
export function useAuth() {
  return {
    user: null,
    isLoading: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
  };
}
