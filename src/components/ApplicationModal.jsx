"use client";

import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export default function ApplicationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    taxId: '',
    email: '',
    phone: '',
    volume: 'medium',
    resaleIntent: 'retail',
    agreeEthical: false
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.fullName.trim()) tempErrors.fullName = 'Full Name is required';
    if (!formData.businessName.trim()) tempErrors.businessName = 'Business Name is required';
    if (!formData.taxId.trim()) tempErrors.taxId = 'Business License/Tax ID is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) tempErrors.phone = 'Phone number is required';
    if (!formData.agreeEthical) tempErrors.agreeEthical = 'You must agree to respect ancestral origins';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    
    // Simulate premium B2B network verification submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({
      fullName: '',
      businessName: '',
      taxId: '',
      email: '',
      phone: '',
      volume: 'medium',
      resaleIntent: 'retail',
      agreeEthical: false
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0c0c0c]/85 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-xl w-full shadow-2xl relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white/70 hover:text-white flex items-center justify-center font-bold border border-white/10 hover:border-white/30 transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
            
            {/* Header */}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#82d6c5] uppercase flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" />
                Step 1 of 3: Vetting Application
              </span>
              <h3 className="font-headline-md text-2xl font-bold text-white">
                Apply for Wholesale Account
              </h3>
              <p className="text-sm text-white/50 font-body-md mt-1">
                Fill in the commercial details below. Applications are reviewed within 48 hours for ethical alignment.
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Authorized Contact Name
                </label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
                {errors.fullName && <span className="text-xs text-[#ffb4ab]">{errors.fullName}</span>}
              </div>

              {/* Business Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Registered Business Name
                </label>
                <input 
                  type="text" 
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Ancestral Botanicals Ltd."
                  className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
                {errors.businessName && <span className="text-xs text-[#ffb4ab]">{errors.businessName}</span>}
              </div>

              {/* Tax ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Business License / Tax ID
                </label>
                <input 
                  type="text" 
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="e.g. EIN-12-3456789"
                  className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
                {errors.taxId && <span className="text-xs text-[#ffb4ab]">{errors.taxId}</span>}
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Work Email
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                  />
                  {errors.email && <span className="text-xs text-[#ffb4ab]">{errors.email}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                  />
                  {errors.phone && <span className="text-xs text-[#ffb4ab]">{errors.phone}</span>}
                </div>
              </div>

              {/* volume & intent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Est. Monthly Ordering Volume
                  </label>
                  <select 
                    name="volume"
                    value={formData.volume}
                    onChange={handleChange}
                    className="bg-[#131313] border border-[#3e4946] focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors appearance-none"
                  >
                    <option value="low">Under $1,000 / month</option>
                    <option value="medium">$1,000 - $5,000 / month</option>
                    <option value="high">$5,000 - $20,000 / month</option>
                    <option value="bulk">Over $20,000 / month</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Resale Channel
                  </label>
                  <select 
                    name="resaleIntent"
                    value={formData.resaleIntent}
                    onChange={handleChange}
                    className="bg-[#131313] border border-[#3e4946] focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors appearance-none"
                  >
                    <option value="retail">Physical Botanical/Wellness Shop</option>
                    <option value="online">Online E-Commerce store</option>
                    <option value="holistic">Holistic Practice / Therapist</option>
                    <option value="distribution">Regional Distribution</option>
                  </select>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 mt-2">
                <input 
                  type="checkbox" 
                  name="agreeEthical"
                  id="agreeEthical"
                  checked={formData.agreeEthical}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded text-[#268072] focus:ring-[#268072] bg-[#131313] border-white/10"
                />
                <label htmlFor="agreeEthical" className="text-xs text-white/70 leading-relaxed font-body-md cursor-pointer select-none">
                  I agree to respect the sacred origins of the botanical blends and support the direct profit-sharing program back to the tribal gatherers.
                </label>
              </div>
              {errors.agreeEthical && <span className="text-xs text-[#ffb4ab]">{errors.agreeEthical}</span>}

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/5 justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-sm transition-all border border-white/10 hover:border-white/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-sm transition-all flex items-center gap-2 cursor-pointer border-0 shadow-lg shadow-[#EC2300]/15 hover:shadow-[#EC2300]/30 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Application
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Success Screen */
          <div className="p-10 flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#268072]/10 border border-[#268072]/20 flex items-center justify-center text-[#82d6c5]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-2">
                Application Received Successfully!
              </h3>
              <p className="text-sm text-white/50 font-body-md max-w-sm mx-auto leading-relaxed">
                Your vetting ticket has been created. A dedicated B2B compliance officer will review your business credentials within the next 48 hours.
              </p>
            </div>

            <div className="bg-[#131313] border border-white/5 rounded-sm p-4 w-full flex flex-col gap-2 font-mono text-left max-w-sm">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">TICKET ID:</span>
                <span className="text-[#82d6c5] font-bold">SCW-7781-B2B</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">STATUS:</span>
                <span className="text-white font-bold uppercase">PENDING REVIEW</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">NOTIFICATIONS TO:</span>
                <span className="text-white">{formData.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase">
              <ShieldCheck className="w-4 h-4 text-[#82d6c5]" />
              Secure vetting vault encrypted
            </div>

            <button
              onClick={handleClose}
              className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-sm transition-all border-0 cursor-pointer w-full max-w-sm shadow-md"
            >
              Return to Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
