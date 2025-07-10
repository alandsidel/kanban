import { createContext, useContext } from 'react';

export type UserType = {
  username: string,
  isAdmin: boolean,
  isElectron: boolean,
}

type UserContextType = {
  user: UserType | null,
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUserContext() {
  const context = useContext(UserContext);

  if (context === null) {
    throw new Error('useUserContext outside of UserContextProvider');
  }

  return context;
}
