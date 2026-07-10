"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read state from localStorage on client-side mount
    const storedAuth = localStorage.getItem('sc_wholesale_auth');
    const storedUser = localStorage.getItem('sc_wholesale_user');
    
    if (storedAuth === 'true' && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'partner@sacredconnection.com' && password === 'ancestral8892') {
          const defaultUser = {
            firstName: "Gravina",
            lastName: "Design Studio",
            displayName: "Gravina",
            email: "partner@sacredconnection.com",
            company: "Gravina Design Studio / Sacred Connection Partner",
            phone: "+55 11 99999-9999",
            accountId: "SC-WHOLESALE-29983",
            status: "ACTIVE",
            creditLimit: 15000,
            discountRate: 35,
            shippingAddress: {
              street: "Rua da Floresta, 123",
              neighborhood: "Jardim das Almas",
              city: "São Paulo",
              state: "SP",
              zip: "01234-567",
              country: "Brazil"
            },
            billingAddress: {
              street: "Rua da Floresta, 123",
              neighborhood: "Jardim das Almas",
              city: "São Paulo",
              state: "SP",
              zip: "01234-567",
              country: "Brazil"
            }
          };
          
          setIsLoggedIn(true);
          setUser(defaultUser);
          localStorage.setItem('sc_wholesale_auth', 'true');
          localStorage.setItem('sc_wholesale_user', JSON.stringify(defaultUser));
          resolve(defaultUser);
        } else {
          reject(new Error('Invalid B2B Account credentials. Try using the Demo Account.'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('sc_wholesale_auth');
    localStorage.removeItem('sc_wholesale_user');
  };

  const updateUser = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('sc_wholesale_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
