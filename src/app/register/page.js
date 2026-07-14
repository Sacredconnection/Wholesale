"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft 
} from "lucide-react";

const COUNTRIES = [
  "Brazil", "United States", "United Kingdom", "Germany", "France", "Netherlands",
  "Spain", "Italy", "Portugal", "Canada", "Australia", "New Zealand", "Other"
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    state: "",
    phone: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.username.trim()) return "Username / Contact Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "A valid email address is required.";
    if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
    if (!form.address.trim()) return "Address Line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.zip.trim()) return "Postcode / ZIP is required.";
    if (!form.country) return "Please select your Country/Region.";
    if (!form.phone.trim()) return "Phone number is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await register({
        firstName: form.username.split(" ")[0] || form.username,
        lastName: form.username.split(" ").slice(1).join(" ") || "",
        displayName: form.username,
        email: form.email,
        phone: form.phone,
        country: form.country,
        company: `${form.username} Wholesale`,
        businessType: "Wholesale Partner",
        taxId: "PENDING-B2B",
        monthlyVolume: "Under $1,000",
        website: "",
        avatar: null,
        password: form.password,
        accountId: `SC-${Date.now().toString(36).toUpperCase()}`,
        status: "PENDING",
        creditLimit: 0,
        discountRate: 0,
        shippingAddress: {
          street: form.address,
          neighborhood: "",
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country
        },
        billingAddress: {
          street: form.address,
          neighborhood: "",
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country
        }
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1] flex flex-col antialiased">
      {/* Top Header */}
      <div className="theme-dark-zone w-full border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-[#131313] z-10">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Sacred Connection Wholesale Logo" className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity" />
        </Link>
        <Link href="/" className="text-xs font-mono text-[#82d6c5] hover:text-white transition-colors flex items-center gap-1 font-bold">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex items-center justify-center py-8 sm:py-10 lg:py-12 px-4 sm:px-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#268072]/5 blur-3xl pointer-events-none rounded-full" />

        <div className="w-full max-w-md z-10">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-white/10 rounded-sm p-5 sm:p-8 shadow-2xl flex flex-col gap-5 sm:gap-6">
              
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#82d6c5] uppercase block mb-1">
                  B2B Partner Portal
                </span>
                <h1 className="text-2xl font-bold text-white font-headline-md">
                  Wholesale Registration
                </h1>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Submit your details below to create your wholesale B2B account.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-3 rounded-sm animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                
                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Username
                  </label>
                  <input 
                    type="text" 
                    value={form.username} 
                    onChange={set("username")}
                    placeholder="e.g. johndoe"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={set("email")}
                    placeholder="name@company.com"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Password
                  </label>
                  <input 
                    type="password" 
                    value={form.password} 
                    onChange={set("password")}
                    placeholder="Minimum 8 characters"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Address Line 1 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Address Line 1
                  </label>
                  <input 
                    type="text" 
                    value={form.address} 
                    onChange={set("address")}
                    placeholder="1234 Main St"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    City
                  </label>
                  <input 
                    type="text" 
                    value={form.city} 
                    onChange={set("city")}
                    placeholder="New York"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Postcode / ZIP */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Postcode / ZIP
                  </label>
                  <input 
                    type="text" 
                    value={form.zip} 
                    onChange={set("zip")}
                    placeholder="10001"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Country/Region */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Country/Region
                  </label>
                  <select 
                    value={form.country} 
                    onChange={set("country")}
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full appearance-none"
                    required
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* State / Region (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    State / Region (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={form.state} 
                    onChange={set("state")}
                    placeholder="Select a state / region..."
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={form.phone} 
                    onChange={set("phone")}
                    placeholder="(123) 456-7890"
                    className="bg-[#131313] border border-white/10 focus:border-[#268072] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

              </div>

              <div className="text-center text-[11px] text-white/40 mt-1 font-body-md">
                Registration confirmation will be emailed to you.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-lg shadow-[#EC2300]/15 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </form>
          ) : (
            /* Success Screen */
            <div className="bg-[#1a1a1a] border border-white/10 rounded-sm p-6 sm:p-10 flex flex-col items-center text-center gap-5 sm:gap-6 shadow-2xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#268072]/10 border border-[#268072]/20 flex items-center justify-center text-[#82d6c5]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="font-headline-md text-2xl font-bold text-white mb-2">
                  Registration Submitted!
                </h3>
                <p className="text-sm text-white/60 font-body-md max-w-sm mx-auto leading-relaxed">
                  Your wholesale account has been created and is <strong className="text-white">pending
                  approval by the administration</strong>.
                </p>
                <p className="text-xs text-white/40 font-body-md max-w-sm mx-auto leading-relaxed mt-2">
                  Our team will review your business profile and assign your wholesale
                  access level. You will be able to sign in once your account is approved.
                </p>
              </div>

              <div className="bg-[#131313] border border-white/5 rounded-sm p-4 w-full flex flex-col gap-2 font-mono text-left max-w-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">USERNAME:</span>
                  <span className="text-[#82d6c5] font-bold">{form.username}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">EMAIL:</span>
                  <span className="text-white font-bold">{form.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">STATUS:</span>
                  <span className="text-yellow-400 font-bold uppercase">PENDING APPROVAL</span>
                </div>
              </div>

              <Link
                href="/"
                className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all border-0 cursor-pointer w-full max-w-sm shadow-md text-center no-underline"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
