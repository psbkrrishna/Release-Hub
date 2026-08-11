import React, { createContext, useContext, useState } from "react";

/** @typedef {'customer'|'customer-admin'|'creator'|'implementation'} UserRole */

export const ROLE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "customer-admin", label: "Customer Admin" },
  { value: "creator", label: "Creator (Internal)" },
  { value: "implementation", label: "Implementation Team" },
];

const UserRoleContext = createContext(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error("useUserRole must be used within a UserRoleProvider");
  return context;
};

export const UserRoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState("customer");
  const isInternal = userRole === "creator" || userRole === "implementation";

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isInternal }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export default UserRoleProvider;
