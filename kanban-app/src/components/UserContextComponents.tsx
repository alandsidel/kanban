import { ReactNode, useState } from 'react';
import { UserContext, UserType } from '../lib/UserContext';

type UserContextProviderProps = {
  children?: ReactNode
}

export function UserContextProvider({children} : UserContextProviderProps) {
  const [user, setUser] = useState<UserType | null>(null);
  return (
    <UserContext.Provider value={{user, setUser}}>
      {children}
    </UserContext.Provider>
  );
}
