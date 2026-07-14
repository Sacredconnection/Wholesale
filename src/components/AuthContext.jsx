"use client";

import { createContext, useContext, useState, useEffect } from 'react';

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

  const persistSession = (safeUser) => {
    setIsLoggedIn(true);
    setUser(safeUser);
    localStorage.setItem('sc_wholesale_auth', 'true');
    localStorage.setItem('sc_wholesale_user', JSON.stringify(safeUser));
  };

  /**
   * login() — authenticates against the WordPress/WooCommerce backend via
   * /api/auth/login. Falls back to the local demo mode only when the backend
   * is not configured (503) or unreachable, so local dev keeps working.
   */
  const login = async (email, password) => {
    let res;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return demoLogin(email, password); // network failure — offline/dev fallback
    }

    if (res.status === 503) {
      return demoLogin(email, password); // backend not configured
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid B2B Account credentials.');
    }

    persistSession(data.user);
    return data.user;
  };

  // Legacy localStorage-based login, kept as the dev/demo fallback.
  const demoLogin = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check registered users first
        const registered = JSON.parse(localStorage.getItem('sc_wholesale_registered') || '[]');
        const found = registered.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u._password === password
        );

        if (found) {
          if (found.status === 'PENDING') {
            reject(new Error('Your wholesale account is pending approval by the administration.'));
            return;
          }
          const { _password, ...safeUser } = found;
          persistSession(safeUser);
          resolve(safeUser);
          return;
        }

        // Fallback demo account
        if (email === 'partner@sacredconnection.com' && password === 'ancestral8892') {
          const defaultUser = {
            firstName: "Gravina",
            lastName: "Design Studio",
            displayName: "Gravina",
            email: "partner@sacredconnection.com",
            company: "Gravina Design Studio / Sacred Connection Partner",
            phone: "+55 11 99999-9999",
            country: "Brazil",
            accountId: "SC-WHOLESALE-29983",
            status: "ACTIVE",
            creditLimit: 15000,
            discountRate: 35,
            avatar: null,
            isAdmin: true, // Mark demo partner as admin
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

          persistSession(defaultUser);
          resolve(defaultUser);
        } else {
          reject(new Error('Invalid B2B Account credentials. Try using the Demo Account.'));
        }
      }, 900);
    });
  };

  /**
   * register() — creates the wholesale account as a WooCommerce customer via
   * /api/auth/register (the buyer can immediately log in with the same
   * credentials). Falls back to localStorage when the backend is unavailable.
   */
  const register = async (userData) => {
    let res;
    try {
      res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch {
      return demoRegister(userData); // network failure — offline/dev fallback
    }

    if (res.status === 503) {
      return demoRegister(userData); // backend not configured
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please try again.');
    }

    return data.user;
  };

  // Legacy localStorage-based registration, kept as the dev/demo fallback.
  const demoRegister = (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const registered = JSON.parse(localStorage.getItem('sc_wholesale_registered') || '[]');

          // Check for duplicate email
          if (registered.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
            reject(new Error('An account with this email already exists. Please log in.'));
            return;
          }

          // Store with password (only in the registry list — never exposed to the UI)
          const entry = { ...userData, _password: userData.password };
          const { password, ...safeUser } = entry; // strip plain password from session

          registered.push(entry);
          localStorage.setItem('sc_wholesale_registered', JSON.stringify(registered));

          resolve(safeUser);
        } catch (err) {
          reject(new Error('Registration failed. Please try again.'));
        }
      }, 800);
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

    // Also update the registry if user was registered (not demo)
    try {
      const registered = JSON.parse(localStorage.getItem('sc_wholesale_registered') || '[]');
      const idx = registered.findIndex((u) => u.email === updatedUser.email);
      if (idx !== -1) {
        registered[idx] = { ...registered[idx], ...updatedFields };
        localStorage.setItem('sc_wholesale_registered', JSON.stringify(registered));
      }
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, register, logout, updateUser }}>
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
