"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import {
  User,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Globe,
  Briefcase,
  FileText,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Check,
  ChevronLeft,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const BUSINESS_TYPES = [
  "Physical Botanical / Wellness Shop",
  "Online Wellness Store",
  "Yoga & Meditation Studio",
  "Holistic Health Clinic",
  "Retreat Center",
  "Distributor / Wholesaler",
  "Ceremonial Facilitator",
  "Other",
];

const VOLUME_OPTIONS = [
  "Under $500 / month",
  "$500 – $1,000 / month",
  "$1,000 – $5,000 / month",
  "$5,000 – $15,000 / month",
  "Over $15,000 / month",
];

const COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Netherlands",
  "Spain", "Italy", "Portugal", "Brazil", "Canada", "Australia",
  "New Zealand", "Switzerland", "Austria", "Belgium", "Czech Republic",
  "Poland", "Mexico", "Argentina", "Colombia", "Peru", "Chile",
  "South Africa", "Israel", "Japan", "South Korea", "Singapore", "Other",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    // Step 1 — Identity
    avatar: null,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    // Step 2 — Business
    company: "",
    businessType: "",
    taxId: "",
    monthlyVolume: "",
    website: "",
    // Step 3 — Security
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreeEthics: false,
  });

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setError("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("Photo must be under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setForm((prev) => ({ ...prev, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "First and last name are required.";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "A valid email is required.";
      if (!form.country) return "Please select your country.";
    }
    if (step === 2) {
      if (!form.company.trim()) return "Company name is required.";
      if (!form.businessType) return "Please select a business type.";
      if (!form.monthlyVolume) return "Please select an estimated monthly volume.";
    }
    if (step === 3) {
      if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      if (!form.agreeTerms) return "You must accept the Terms of Service.";
      if (!form.agreeEthics) return "You must agree to our ethical sourcing commitment.";
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }

    setSubmitting(true);
    setError("");

    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        displayName: form.firstName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        company: form.company,
        businessType: form.businessType,
        taxId: form.taxId,
        monthlyVolume: form.monthlyVolume,
        website: form.website,
        avatar: form.avatar,
        accountId: `SC-${Date.now().toString(36).toUpperCase()}`,
        status: "PENDING",
        creditLimit: 0,
        discountRate: 0,
        shippingAddress: { street: "", neighborhood: "", city: "", state: "", zip: "", country: form.country },
        billingAddress:  { street: "", neighborhood: "", city: "", state: "", zip: "", country: form.country },
      });
      router.push("/my-account");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: "Your Identity" },
    { n: 2, label: "Business Info" },
    { n: 3, label: "Create Password" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1] flex flex-col antialiased">
      {/* Top Bar */}
      <div className="w-full border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#131313]">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.svg" alt="Sacred Connection Wholesale" className="h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
        </Link>
        <div className="flex items-center gap-4 text-sm text-white/50">
          <span>Already a partner?</span>
          <Link href="/" className="text-[#82d6c5] hover:text-white font-semibold transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Log In
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#82d6c5] uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Wholesale Partner Registration
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Create Your B2B Account
            </h1>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              Join our network of conscious wholesale buyers. Applications reviewed within 48 hours.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {steps.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    step > s.n
                      ? "bg-[#268072] border-[#268072] text-white"
                      : step === s.n
                      ? "bg-transparent border-[#268072] text-[#82d6c5]"
                      : "bg-transparent border-white/20 text-white/30"
                  }`}>
                    {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${step === s.n ? "text-[#82d6c5]" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-16 mb-5 mx-1 transition-colors ${step > s.n ? "bg-[#268072]" : "bg-white/10"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Card */}
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#268072]/5 blur-3xl pointer-events-none rounded-full" />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-3 rounded mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* ── STEP 1: IDENTITY ── */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#82d6c5]" /> Your Identity
                  </h2>

                  {/* Profile Photo */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-24 h-24 rounded-full border-2 border-dashed border-white/20 hover:border-[#268072] cursor-pointer overflow-hidden group transition-all flex items-center justify-center bg-[#131313]"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-white/30 group-hover:text-[#82d6c5] transition-colors">
                          <Camera className="w-6 h-6" />
                          <span className="text-[9px] font-mono uppercase">Photo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    <span className="text-[10px] text-white/30 font-mono">Optional · max 4MB</span>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name" icon={<User className="w-3.5 h-3.5" />}>
                      <input type="text" value={form.firstName} onChange={set("firstName")} placeholder="Sarah" className="input-field" autoFocus />
                    </Field>
                    <Field label="Last Name" icon={null}>
                      <input type="text" value={form.lastName} onChange={set("lastName")} placeholder="Mitchell" className="input-field" />
                    </Field>
                  </div>

                  <Field label="Work Email" icon={<Mail className="w-3.5 h-3.5" />}>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="sarah@botanicals.com" className="input-field" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                      <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="input-field" />
                    </Field>
                    <Field label="Country" icon={<Globe className="w-3.5 h-3.5" />}>
                      <select value={form.country} onChange={set("country")} className="input-field">
                        <option value="">Select country…</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 2: BUSINESS ── */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#82d6c5]" /> Business Information
                  </h2>

                  <Field label="Registered Business Name" icon={<Building2 className="w-3.5 h-3.5" />}>
                    <input type="text" value={form.company} onChange={set("company")} placeholder="Sacred Botanicals LLC" className="input-field" autoFocus />
                  </Field>

                  <Field label="Business Type" icon={<Briefcase className="w-3.5 h-3.5" />}>
                    <select value={form.businessType} onChange={set("businessType")} className="input-field">
                      <option value="">Select type…</option>
                      {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Business License / Tax ID" icon={<FileText className="w-3.5 h-3.5" />}>
                      <input type="text" value={form.taxId} onChange={set("taxId")} placeholder="EIN-12-3456789" className="input-field" />
                    </Field>
                    <Field label="Est. Monthly Volume" icon={null}>
                      <select value={form.monthlyVolume} onChange={set("monthlyVolume")} className="input-field">
                        <option value="">Select range…</option>
                        {VOLUME_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Company Website (optional)" icon={<Globe className="w-3.5 h-3.5" />}>
                    <input type="url" value={form.website} onChange={set("website")} placeholder="https://your-store.com" className="input-field" />
                  </Field>

                  {/* Info notice */}
                  <div className="bg-[#268072]/8 border border-[#268072]/20 rounded-lg p-4 text-xs text-white/60 leading-relaxed">
                    <strong className="text-[#82d6c5]">Review process:</strong> All wholesale accounts are reviewed within 48 hours for ethical alignment. You will receive an email once approved with your discount rate and credit terms.
                  </div>
                </div>
              )}

              {/* ── STEP 3: PASSWORD ── */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#82d6c5]" /> Secure Your Account
                  </h2>

                  {/* Summary pill */}
                  <div className="flex items-center gap-3 bg-[#131313] border border-white/5 rounded-lg px-4 py-3">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#268072]/40" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#268072]/20 flex items-center justify-center text-[#82d6c5] text-sm font-bold">
                        {form.firstName[0]}{form.lastName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{form.firstName} {form.lastName}</p>
                      <p className="text-[11px] text-white/40">{form.email} · {form.company}</p>
                    </div>
                  </div>

                  <Field label="Password" icon={<Lock className="w-3.5 h-3.5" />}>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                        placeholder="Min. 8 characters"
                        className="input-field pr-10"
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-transparent border-0 cursor-pointer p-0">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {form.password.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {[1,2,3,4].map((n) => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                            form.password.length >= n * 3
                              ? n <= 1 ? "bg-[#93000a]" : n <= 2 ? "bg-yellow-500" : n <= 3 ? "bg-blue-500" : "bg-[#268072]"
                              : "bg-white/10"
                          }`} />
                        ))}
                      </div>
                    )}
                  </Field>

                  <Field label="Confirm Password" icon={null}>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        placeholder="Repeat password"
                        className="input-field pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-transparent border-0 cursor-pointer p-0">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  {/* Agreements */}
                  <div className="flex flex-col gap-3 mt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${form.agreeTerms ? "bg-[#268072] border-[#268072]" : "border-white/20 group-hover:border-[#268072]/60"}`}>
                        {form.agreeTerms && <Check className="w-3 h-3 text-white" />}
                        <input type="checkbox" checked={form.agreeTerms} onChange={set("agreeTerms")} className="sr-only" />
                      </div>
                      <span className="text-xs text-white/60 leading-relaxed">
                        I agree to the <span className="text-[#82d6c5] underline cursor-pointer">Terms of Service</span> and <span className="text-[#82d6c5] underline cursor-pointer">Privacy Policy</span>.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${form.agreeEthics ? "bg-[#268072] border-[#268072]" : "border-white/20 group-hover:border-[#268072]/60"}`}>
                        {form.agreeEthics && <Check className="w-3 h-3 text-white" />}
                        <input type="checkbox" checked={form.agreeEthics} onChange={set("agreeEthics")} className="sr-only" />
                      </div>
                      <span className="text-xs text-white/60 leading-relaxed">
                        I agree to respect the sacred origins of these botanical medicines and support the direct profit-sharing program with the tribal gatherers.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/8">
                {step > 1 ? (
                  <button type="button" onClick={() => { setError(""); setStep((s) => s - 1); }}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium bg-transparent border-0 cursor-pointer transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#268072] hover:bg-[#1f665b] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded transition-all cursor-pointer border-0 shadow-lg shadow-[#268072]/20"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
                  ) : step < 3 ? (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Create Account</>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-white/30 mt-6">
            Already have an account?{" "}
            <Link href="/" className="text-[#82d6c5] hover:text-white transition-colors font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Inline styles for shared input class */}
      <style jsx global>{`
        .input-field {
          width: 100%;
          background: #131313;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          color: #e5e2e1;
          font-size: 0.875rem;
          padding: 0.75rem 1rem;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          -webkit-appearance: none;
        }
        .input-field:focus {
          border-color: #268072;
        }
        .input-field option {
          background: #1a1a1a;
          color: #e5e2e1;
        }
        .input-field::placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 uppercase tracking-wider">
        {icon && <span className="text-[#82d6c5]">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
