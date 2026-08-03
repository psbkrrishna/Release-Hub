import React, { createContext, useContext, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export const DemoRoleSelector = () => {
  const { userRole, setUserRole } = useUserRole();
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Demo Role:</label>
      <Select value={userRole} onValueChange={(v) => setUserRole(v as UserRole)}>
        <SelectTrigger className="w-[180px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="customer-admin">Customer Admin</SelectItem>
          <SelectItem value="creator">Creator (Internal)</SelectItem>
          <SelectItem value="implementation">Implementation Team</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

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
