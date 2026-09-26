import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize with active session for smooth demo, but allow full login/logout
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stocksense_user');
    return saved ? JSON.parse(saved) : { name: "Alex Morgan", email: "manager@stocksense.io", role: "Inventory Manager" };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('stocksense_auth') === 'false' ? false : true;
  });

  const login = (email, password) => {
    const fakeUser = {
      name: email.split('@')[0].replace('.', ' '),
      email: email,
      role: "Inventory Manager"
    };
    setUser(fakeUser);
    setIsAuthenticated(true);
    localStorage.setItem('stocksense_user', JSON.stringify(fakeUser));
    localStorage.setItem('stocksense_auth', 'true');
    return true;
  };

  const signup = (name, email, password) => {
    const fakeUser = {
      name: name || "Warehouse Supervisor",
      email: email,
      role: "Inventory Manager"
    };
    setUser(fakeUser);
    setIsAuthenticated(true);
    localStorage.setItem('stocksense_user', JSON.stringify(fakeUser));
    localStorage.setItem('stocksense_auth', 'true');
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.setItem('stocksense_auth', 'false');
    localStorage.removeItem('stocksense_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
