import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'customer' | 'customer-admin' | 'creator' | 'implementation';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isInternal: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

/* The exported DemoRoleSelector that used to live here is gone. It was the
   app's only consumer of the shadcn Select, and nothing imported it - the
   role picker that actually renders is the native <select> in Navigation's
   top bar. */

const UserRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const isInternal = userRole === 'creator' || userRole === 'implementation';

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isInternal }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export default UserRoleProvider;
