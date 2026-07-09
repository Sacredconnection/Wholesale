"use client";

import React, { useState } from 'react';
import { Key, Eye, EyeOff, Loader2, Award, ClipboardList, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  if (!isOpen) return null;

  const handleDemoFill = () => {
    setEmail('partner@sacredconnection.com');
    setPassword('ancestral8892');
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    // Simulate validation
    setTimeout(() => {
      setSubmitting(false);
      if (email === 'partner@sacredconnection.com' && password === 'ancestral8892') {
        setLoggedIn(true);
      } else {
        setError('Invalid B2B Account credentials. Try using the Demo Account.');
      }
    }, 1500);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0c0c0c]/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div 
        className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-md w-full shadow-2xl relative overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#268072]/15 blur-xl pointer-events-none rounded-full"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white/70 hover:text-white flex items-center justify-center font-bold border border-white/10 hover:border-white/30 transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {!loggedIn ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="p-8 flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#82d6c5] uppercase flex items-center gap-1.5 mb-1">
                <Key className="w-3.5 h-3.5" />
                Secure Portal Access
              </span>
              <h3 className="font-headline-md text-2xl font-bold text-white">
                Client Login
              </h3>
            </div>

            {error && (
              <div className="bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-3 rounded-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Partner Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 pr-10 rounded-sm outline-none transition-colors w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Assist */}
            <div className="bg-[#268072]/5 border border-[#268072]/20 rounded p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#82d6c5] uppercase tracking-wider flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Testing Sandbox credentials
                </span>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-[10px] font-mono bg-[#268072] hover:bg-[#1f665b] text-white px-2 py-1 rounded transition-colors uppercase border-0 cursor-pointer font-bold"
                >
                  Fill Demo
                </button>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Click <strong>Fill Demo</strong> to instantly populate credentials and test the functional B2B Client Dashboard.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#268072] hover:bg-[#1f665b] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-lg shadow-[#268072]/15 hover:shadow-[#268072]/30 disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Portal'
              )}
            </button>
          </form>
        ) : (
          /* Client Dashboard View */
          <div className="p-8 flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <span className="text-[9px] font-mono text-[#82d6c5] uppercase tracking-widest bg-[#268072]/15 border border-[#268072]/30 px-2 py-0.5 rounded">
                  PARTNER STATUS: ACTIVE
                </span>
                <h3 className="font-headline-md text-xl font-bold text-white mt-2">
                  Sacred Connection Wholesale
                </h3>
                <span className="text-xs text-white/40">Account ID: SC-WHOLESALE-29983</span>
              </div>
            </div>

            {/* Content Dashboard Summary */}
            <div className="flex flex-col gap-4">
              
              {/* Stat Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#131313] border border-white/5 p-3 rounded flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-white/40 uppercase">Credit Limit</span>
                  <span className="text-sm font-bold text-white">$15,000 USD</span>
                </div>
                <div className="bg-[#131313] border border-white/5 p-3 rounded flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-white/40 uppercase">Partner Discount</span>
                  <span className="text-sm font-bold text-[#82d6c5]">35% Off Base</span>
                </div>
              </div>

              {/* Order Status */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider font-label-sm">
                  Active Shipment tracking
                </span>
                <div className="bg-[#131313] border border-white/5 rounded p-3 flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-[#82d6c5] shrink-0 mt-0.5" />
                  <div className="flex-grow flex flex-col gap-0.5">
                    <div className="text-xs font-bold text-white flex justify-between">
                      <span>Order #8890-HK</span>
                      <span className="text-[#82d6c5]">In Transit</span>
                    </div>
                    <p className="text-[11px] text-white/50">
                      Huni Kuin Tsunu Blend x 40 Units. Carrier: DHL Express (Tracking: SC991823).
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Downloads */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider font-label-sm">
                  Resource Vault
                </span>
                <div className="flex flex-col gap-2">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("Downloading Purity Lab reports..."); }}
                    className="text-xs text-white/80 hover:text-white bg-[#131313] hover:bg-white/5 border border-white/5 p-3 rounded flex justify-between items-center transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#82d6c5]" />
                      Download Chemical Purity Certificate
                    </span>
                    <span className="font-mono text-[9px] text-[#82d6c5]">PDF</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Logout */}
            <div className="flex gap-3 border-t border-white/5 pt-4">
              <button
                onClick={onClose}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-sm transition-all border border-white/10 flex-grow text-center cursor-pointer"
              >
                Close Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#93000a]/15 hover:bg-[#93000a]/30 text-[#ffb4ab] text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-sm transition-all border border-[#93000a]/30 flex-grow text-center cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
