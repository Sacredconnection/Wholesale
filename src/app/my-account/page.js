"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ApplicationModal from "@/components/ApplicationModal";
import { 
  User, 
  ShoppingBag, 
  Download, 
  MapPin, 
  Settings, 
  LogOut, 
  ClipboardList, 
  Award, 
  Check, 
  ChevronRight, 
  Truck, 
  AlertCircle, 
  FileText, 
  Save,
  Lock,
  Camera
} from "lucide-react";

export default function MyAccountPage() {
  const { isLoggedIn, user, loading, logout, updateUser } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef(null);
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Avatar upload handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return; // 4MB guard
    const reader = new FileReader();
    reader.onload = (ev) => updateUser({ avatar: ev.target.result });
    reader.readAsDataURL(file);
  };
  
  
  // Modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Address edit toggles and form states
  const [editShipping, setEditShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });

  const [editBilling, setEditBilling] = useState(false);
  const [billingForm, setBillingForm] = useState({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });

  // Account details form state
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    company: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [accountSuccess, setAccountSuccess] = useState("");
  const [accountError, setAccountError] = useState("");

  // Sync state with user data once loaded
  useEffect(() => {
    if (user) {
      setShippingForm({ ...user.shippingAddress });
      setBillingForm({ ...user.billingAddress });
      setAccountForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        displayName: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [user]);

  // Handle Loading State
  if (loading) {
    return (
      <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenApply={() => setIsApplyOpen(true)} />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#268072] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle Not Logged In State
  if (!isLoggedIn) {
    return (
      <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenApply={() => setIsApplyOpen(true)} />
        
        <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-24 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#268072]/10 blur-xl pointer-events-none rounded-full"></div>
            
            <div className="w-16 h-16 rounded-full bg-[#93000a]/10 border border-[#93000a]/30 flex items-center justify-center text-3xl mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-[#ffb4ab]" />
            </div>

            <h2 className="font-headline-md text-3xl font-bold text-white mb-3">
              Portal Access Restricted
            </h2>
            <p className="font-body-md text-sm text-white/60 leading-relaxed mb-8">
              You must be a registered and approved B2B partner to view wholesale account details. Log in using your credentials or apply for a wholesale partnership.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="bg-[#268072] hover:bg-[#1f665b] text-white text-xs font-bold uppercase tracking-wider py-4 rounded transition-all cursor-pointer border-0 w-full shadow-lg shadow-[#268072]/15"
              >
                Access Portal Login
              </button>
              <button
                onClick={() => setIsApplyOpen(true)}
                className="bg-transparent hover:bg-white/5 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider py-4 rounded transition-all cursor-pointer border border-white/10 w-full"
              >
                Apply for Wholesale Account
              </button>
            </div>
          </div>
        </main>

        <Footer />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <ApplicationModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      </div>
    );
  }

  // Handle Logout Action
  const handleLogoutAction = () => {
    logout();
    router.push("/");
  };

  // Handle Account Update
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    setAccountSuccess("");
    setAccountError("");

    if (accountForm.newPassword) {
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        setAccountError("New passwords do not match.");
        return;
      }
      if (!accountForm.currentPassword) {
        setAccountError("Current password is required to change password.");
        return;
      }
    }

    updateUser({
      firstName: accountForm.firstName,
      lastName: accountForm.lastName,
      displayName: accountForm.displayName,
      email: accountForm.email,
      phone: accountForm.phone,
      company: accountForm.company
    });

    setAccountSuccess("Account details updated successfully!");
    
    // Clear passwords
    setAccountForm(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }));
  };

  // Handle Address Updates
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    updateUser({ shippingAddress: { ...shippingForm } });
    setEditShipping(false);
  };

  const handleBillingSubmit = (e) => {
    e.preventDefault();
    updateUser({ billingAddress: { ...billingForm } });
    setEditBilling(false);
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
      <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenApply={() => setIsApplyOpen(true)} />

      {/* Hero Header Section */}
      <section className="bg-[#1c1c1c] border-b border-white/15 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#268072]/10 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative flex items-center gap-6">
          {/* Avatar */}
          <div
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white/20 hover:border-[#268072] cursor-pointer overflow-hidden group shrink-0 bg-[#131313] flex items-center justify-center transition-all"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white/40">
                {(user.firstName || user.displayName || "?")[0]?.toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[9px] font-mono text-white uppercase">Change</span>
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#82d6c5] uppercase">
              B2B Partner Portal
            </span>
            <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-white mt-1">
              My Account
            </h1>
            <p className="text-sm text-white/50 mt-1.5 font-mono">
              Welcome back, <span className="text-[#82d6c5] font-bold">{user.displayName}</span> · ID: {user.accountId}
            </p>
          </div>
        </div>
      </section>

      {/* Main Account Portal Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Tabs Sidebar */}
          <aside className="bg-[#1a1a1a] border border-white/10 rounded-md p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 scrollbar-none">
            {[
              { id: "dashboard", label: "Dashboard", icon: User },
              { id: "orders", label: "Orders", icon: ShoppingBag },
              { id: "downloads", label: "Downloads", icon: Download },
              { id: "addresses", label: "Addresses", icon: MapPin },
              { id: "details", label: "Account Details", icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border-l-2 cursor-pointer text-left whitespace-nowrap lg:w-full select-none ${
                    active 
                      ? "bg-[#268072]/15 text-[#82d6c5] border-[#268072]" 
                      : "text-white/60 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#82d6c5]" : "text-white/50"}`} />
                  {tab.label}
                </button>
              );
            })}
            
            <button
              onClick={handleLogoutAction}
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border-l-2 border-transparent text-[#ffb4ab] hover:text-[#ffb4ab] hover:bg-[#93000a]/10 cursor-pointer text-left whitespace-nowrap lg:w-full lg:mt-4"
            >
              <LogOut className="w-4 h-4 text-[#ffb4ab]" />
              Logout
            </button>
          </aside>

          {/* Tab Panel Content Area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* 1. DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 md:p-8 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#268072]/5 blur-2xl pointer-events-none rounded-full"></div>
                  
                  <h2 className="font-headline-md text-2xl font-bold text-white mb-4">
                    Hello, {user.firstName || user.displayName}!
                  </h2>
                  
                  <p className="font-body-md text-sm text-white/70 leading-relaxed mb-6">
                    From your account dashboard, you can easily access your{" "}
                    <button onClick={() => setActiveTab("orders")} className="text-[#82d6c5] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0">
                      recent orders
                    </button>
                    , manage your{" "}
                    <button onClick={() => setActiveTab("addresses")} className="text-[#82d6c5] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0">
                      shipping and billing addresses
                    </button>
                    , and update your{" "}
                    <button onClick={() => setActiveTab("details")} className="text-[#82d6c5] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0">
                      password and account details
                    </button>
                    .
                  </p>

                  <div className="h-px bg-white/10 my-6"></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#131313] border border-white/5 p-4 rounded flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Credit Limit</span>
                      <span className="text-xl font-bold text-white">${user.creditLimit.toLocaleString()} USD</span>
                      <span className="text-[10px] text-[#82d6c5] font-mono mt-0.5">Flexible net-30 terms</span>
                    </div>

                    <div className="bg-[#131313] border border-white/5 p-4 rounded flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Partner Discount</span>
                      <span className="text-xl font-bold text-[#82d6c5]">{user.discountRate}% Off Base</span>
                      <span className="text-[10px] text-white/40 font-mono mt-0.5">Applied at wholesale checkout</span>
                    </div>

                    <div className="bg-[#131313] border border-white/5 p-4 rounded flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Company Status</span>
                      <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-5 h-5 shrink-0" />
                        {user.status}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono mt-0.5">Verified wholesale buyer</span>
                    </div>
                  </div>
                </div>

                {/* Active Tracking Mini-Card */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 shadow-xl flex flex-col gap-4">
                  <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#82d6c5]" />
                    Active Shipment Tracking
                  </h3>
                  <div className="bg-[#131313] border border-white/5 rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">Order #8890-HK</span>
                        <span className="text-[10px] font-mono bg-[#268072]/20 text-[#82d6c5] border border-[#268072]/30 px-2 py-0.5 rounded">
                          In Transit
                        </span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                        Huni Kuin Tsunu Blend x 40 Units. Carrier: DHL Express (Tracking: SC991823). Est. Arrival: July 15.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab("orders")}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all shrink-0 cursor-pointer"
                    >
                      View Order Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Active Order Tracker Detail */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 shadow-xl">
                  <h3 className="font-headline-md text-lg font-bold text-white mb-6 flex items-center gap-2.5">
                    <ClipboardList className="w-5 h-5 text-[#82d6c5]" />
                    Active Order Tracking
                  </h3>
                  
                  <div className="border border-white/5 bg-[#131313] rounded p-6 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] font-mono text-white/50">Tracking Reference</span>
                        <p className="text-sm font-bold text-white mt-0.5">Order #8890-HK · DHL SC991823</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-white/50">Est. Shipment Arrival</span>
                        <p className="text-sm font-bold text-[#82d6c5] mt-0.5">July 15, 2026</p>
                      </div>
                    </div>

                    {/* Simple visual steps */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex flex-col gap-2">
                        <div className="h-1.5 bg-[#268072] rounded-full"></div>
                        <span className="text-[9px] font-mono text-white/80 font-bold uppercase">1. Draft Approved</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="h-1.5 bg-[#268072] rounded-full"></div>
                        <span className="text-[9px] font-mono text-[#82d6c5] font-bold uppercase">2. In Transit (DHL)</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="h-1.5 bg-white/10 rounded-full"></div>
                        <span className="text-[9px] font-mono text-white/40 uppercase">3. Delivery</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders List Table */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 shadow-xl">
                  <h3 className="font-headline-md text-lg font-bold text-white mb-4">
                    Order History
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 font-mono uppercase tracking-wider">
                          <th className="py-3 px-4 font-normal">Order</th>
                          <th className="py-3 px-4 font-normal">Date</th>
                          <th className="py-3 px-4 font-normal">Total</th>
                          <th className="py-3 px-4 font-normal">Status</th>
                          <th className="py-3 px-4 text-right font-normal">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-body-md text-white/80">
                        <tr>
                          <td className="py-4 px-4 font-bold text-white">#8890-HK</td>
                          <td className="py-4 px-4">July 10, 2026</td>
                          <td className="py-4 px-4">$1,240.00</td>
                          <td className="py-4 px-4"><span className="text-yellow-400">In Transit</span></td>
                          <td className="py-4 px-4 text-right">
                            <button className="text-[#82d6c5] hover:underline font-bold bg-transparent border-0 cursor-pointer">
                              View Invoice
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4 font-bold text-white">#8421-HK</td>
                          <td className="py-4 px-4">May 15, 2026</td>
                          <td className="py-4 px-4">$3,500.00</td>
                          <td className="py-4 px-4"><span className="text-emerald-400">Completed</span></td>
                          <td className="py-4 px-4 text-right">
                            <button className="text-[#82d6c5] hover:underline font-bold bg-transparent border-0 cursor-pointer">
                              View Invoice
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4 font-bold text-white">#8109-YW</td>
                          <td className="py-4 px-4">March 02, 2026</td>
                          <td className="py-4 px-4">$850.00</td>
                          <td className="py-4 px-4"><span className="text-emerald-400">Completed</span></td>
                          <td className="py-4 px-4 text-right">
                            <button className="text-[#82d6c5] hover:underline font-bold bg-transparent border-0 cursor-pointer">
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. DOWNLOADS TAB */}
            {activeTab === "downloads" && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 md:p-8 shadow-xl animate-fade-in">
                <h3 className="font-headline-md text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#82d6c5]" />
                  Downloadable Partner Vault
                </h3>
                <p className="text-xs text-white/50 leading-relaxed mb-6">
                  Access official botanical certificates, wholesale catalogs, pricing lists, and lineage agreements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Chemical Purity Lab Reports", desc: "Tsunu & Cumaru gas chromatography tests.", size: "PDF - 2.4 MB" },
                    { title: "Wholesale Catalog & Pricing 2026", desc: "Base and bulk pricing structures.", size: "PDF - 5.1 MB" },
                    { title: "Amazon Rainforest Fair Trade Agreement", desc: "Indigenous alliance certification.", size: "PDF - 1.8 MB" },
                    { title: "Rapeh Administration Guidelines", desc: "Dosages, warnings and best practices.", size: "PDF - 920 KB" }
                  ].map((doc, idx) => (
                    <div key={idx} className="bg-[#131313] border border-white/5 rounded-md p-5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <div className="mb-4">
                        <FileText className="w-8 h-8 text-[#82d6c5] mb-2" />
                        <h4 className="text-sm font-bold text-white mb-1">{doc.title}</h4>
                        <p className="text-xs text-white/50 leading-relaxed">{doc.desc}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-[10px] font-mono text-white/40">{doc.size}</span>
                        <button 
                          onClick={() => alert(`Downloading: ${doc.title}`)}
                          className="text-[10px] font-mono text-[#82d6c5] hover:text-white font-bold bg-transparent border-0 cursor-pointer flex items-center gap-1"
                        >
                          Download <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <p className="text-xs text-white/50">
                  The following addresses will be used on the checkout order drafts by default.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Shipping Address */}
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                      <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white">
                        Shipping Address
                      </h3>
                      <button 
                        onClick={() => setEditShipping(!editShipping)}
                        className="text-[10px] font-mono text-[#82d6c5] hover:text-white font-bold bg-transparent border-0 cursor-pointer"
                      >
                        {editShipping ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    {!editShipping ? (
                      <address className="not-italic text-xs text-white/70 leading-relaxed flex flex-col gap-1">
                        <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                        <p>{user.shippingAddress.street}</p>
                        <p>{user.shippingAddress.neighborhood}</p>
                        <p>{user.shippingAddress.city}, {user.shippingAddress.state} {user.shippingAddress.zip}</p>
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{user.shippingAddress.country}</p>
                      </address>
                    ) : (
                      <form onSubmit={handleShippingSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono uppercase text-white/50">Street Address</label>
                          <input 
                            type="text" 
                            value={shippingForm.street} 
                            onChange={(e) => setShippingForm(prev => ({ ...prev, street: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none" 
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono uppercase text-white/50">Neighborhood</label>
                          <input 
                            type="text" 
                            value={shippingForm.neighborhood} 
                            onChange={(e) => setShippingForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">City</label>
                            <input 
                              type="text" 
                              value={shippingForm.city} 
                              onChange={(e) => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">State / Region</label>
                            <input 
                              type="text" 
                              value={shippingForm.state} 
                              onChange={(e) => setShippingForm(prev => ({ ...prev, state: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">Postal Code</label>
                            <input 
                              type="text" 
                              value={shippingForm.zip} 
                              onChange={(e) => setShippingForm(prev => ({ ...prev, zip: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">Country</label>
                            <input 
                              type="text" 
                              value={shippingForm.country} 
                              onChange={(e) => setShippingForm(prev => ({ ...prev, country: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="bg-[#268072] hover:bg-[#1f665b] text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded mt-2 cursor-pointer border-0 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Shipping
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Billing Address */}
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                      <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white">
                        Billing Address
                      </h3>
                      <button 
                        onClick={() => setEditBilling(!editBilling)}
                        className="text-[10px] font-mono text-[#82d6c5] hover:text-white font-bold bg-transparent border-0 cursor-pointer"
                      >
                        {editBilling ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    {!editBilling ? (
                      <address className="not-italic text-xs text-white/70 leading-relaxed flex flex-col gap-1">
                        <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                        <p>{user.billingAddress.street}</p>
                        <p>{user.billingAddress.neighborhood}</p>
                        <p>{user.billingAddress.city}, {user.billingAddress.state} {user.billingAddress.zip}</p>
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{user.billingAddress.country}</p>
                      </address>
                    ) : (
                      <form onSubmit={handleBillingSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono uppercase text-white/50">Street Address</label>
                          <input 
                            type="text" 
                            value={billingForm.street} 
                            onChange={(e) => setBillingForm(prev => ({ ...prev, street: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono uppercase text-white/50">Neighborhood</label>
                          <input 
                            type="text" 
                            value={billingForm.neighborhood} 
                            onChange={(e) => setBillingForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">City</label>
                            <input 
                              type="text" 
                              value={billingForm.city} 
                              onChange={(e) => setBillingForm(prev => ({ ...prev, city: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">State / Region</label>
                            <input 
                              type="text" 
                              value={billingForm.state} 
                              onChange={(e) => setBillingForm(prev => ({ ...prev, state: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">Postal Code</label>
                            <input 
                              type="text" 
                              value={billingForm.zip} 
                              onChange={(e) => setBillingForm(prev => ({ ...prev, zip: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono uppercase text-white/50">Country</label>
                            <input 
                              type="text" 
                              value={billingForm.country} 
                              onChange={(e) => setBillingForm(prev => ({ ...prev, country: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#268072] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="bg-[#268072] hover:bg-[#1f665b] text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded mt-2 cursor-pointer border-0 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Billing
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. ACCOUNT DETAILS TAB */}
            {activeTab === "details" && (
              <div className="flex flex-col gap-6 animate-fade-in">

                {/* Profile Photo Card */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 md:p-8 shadow-xl">
                  <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2 mb-6">
                    <Camera className="w-4 h-4 text-[#82d6c5]" />
                    Profile Photo
                  </h3>
                  <div className="flex items-center gap-6">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-full border-2 border-dashed border-white/20 hover:border-[#268072] cursor-pointer overflow-hidden group transition-all bg-[#131313] flex items-center justify-center shrink-0"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white/30">
                          {(user.firstName || user.displayName || "?")[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="bg-[#268072]/15 hover:bg-[#268072]/30 text-[#82d6c5] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded border border-[#268072]/30 cursor-pointer transition-all"
                      >
                        Upload New Photo
                      </button>
                      {user.avatar && (
                        <button
                          type="button"
                          onClick={() => updateUser({ avatar: null })}
                          className="text-[#ffb4ab] text-xs font-medium hover:underline bg-transparent border-0 cursor-pointer text-left"
                        >
                          Remove photo
                        </button>
                      )}
                      <span className="text-[10px] text-white/30 font-mono">JPG, PNG or WEBP · Max 4MB</span>
                    </div>
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6 md:p-8 shadow-xl">
                <h3 className="font-headline-md text-lg font-bold text-white mb-6">
                  Account Details
                </h3>

                {accountSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-4 rounded mb-6 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{accountSuccess}</span>
                  </div>
                )}

                {accountError && (
                  <div className="bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-4 rounded mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{accountError}</span>
                  </div>
                )}

                <form onSubmit={handleAccountSubmit} className="flex flex-col gap-6">
                  
                  {/* General Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">First Name</label>
                      <input 
                        type="text" 
                        value={accountForm.firstName} 
                        onChange={(e) => setAccountForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">Last Name</label>
                      <input 
                        type="text" 
                        value={accountForm.lastName} 
                        onChange={(e) => setAccountForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">Display Name</label>
                      <input 
                        type="text" 
                        value={accountForm.displayName} 
                        onChange={(e) => setAccountForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                        required
                      />
                      <span className="text-[10px] text-white/40 italic">This will be how your name is shown on headers and greetings.</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">Partner Email Address</label>
                      <input 
                        type="email" 
                        value={accountForm.email} 
                        onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">Phone Number</label>
                      <input 
                        type="text" 
                        value={accountForm.phone} 
                        onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">Company Name</label>
                      <input 
                        type="text" 
                        value={accountForm.company} 
                        disabled
                        className="bg-[#131313]/60 border border-white/5 rounded px-4 py-3 text-sm text-white/50 cursor-not-allowed outline-none"
                      />
                      <span className="text-[10px] text-white/40 italic">Contact support to change company registration.</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/10 my-2"></div>

                  {/* Password Reset */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#82d6c5]" />
                      Password Change
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase text-white/50">Current Password (leave blank to leave unchanged)</label>
                        <input 
                          type="password" 
                          value={accountForm.currentPassword}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="••••••••"
                          className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono uppercase text-white/50">New Password</label>
                          <input 
                            type="password" 
                            value={accountForm.newPassword}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono uppercase text-white/50">Confirm New Password</label>
                          <input 
                            type="password" 
                            value={accountForm.confirmPassword}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#268072] outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="bg-[#268072] hover:bg-[#1f665b] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all border-0 shadow-lg shadow-[#268072]/15 hover:shadow-[#268072]/30 cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="w-4 h-4" />
                    Save Account Changes
                  </button>

                  </form>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer />

      {/* Modals for restricted access actions */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ApplicationModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
    </div>
  );
}
