"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, ArrowRight, LoaderCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import CatalogPdfExportDialog from "@/components/CatalogPdfExportDialog";
import { useAuth } from "@/components/AuthContext";

export default function DigitalCatalogPage() {
  const { user, isLoggedIn, loading } = useAuth();
  const [open, setOpen] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <div className="site-background-page flex min-h-screen flex-col bg-[#23403B] text-white">
      <Header onOpenLogin={() => setLoginOpen(true)}/>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24 pt-36">
        <FileText className="mb-5 text-[#82d6c5]" size={36}/>
        <p className="text-xs uppercase tracking-widest text-[#82d6c5]">Choose. Review. Share.</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Your PDF Catalog</h1>
        <p className="mt-5 text-base leading-7 text-white/60">Create a catalog with the categories and varieties you need. Review available sizes and your wholesale prices, then save, share or print the PDF.</p>
        <ol className="my-8 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{["Categories", "Products", "Review", "Your PDF"].map((label, index) => <li key={label} className="rounded border border-white/15 p-4"><span className="mb-2 block text-[#82d6c5]">0{index + 1}</span>{label}</li>)}</ol>
        {loading ? <p role="status" className="flex items-center gap-2 text-white/60"><LoaderCircle className="animate-spin" size={20}/>Loading your account?</p> : <button type="button" onClick={() => isLoggedIn ? setOpen(true) : setLoginOpen(true)} className="inline-flex items-center gap-2 rounded bg-[#82d6c5] px-6 py-3 font-bold text-[#102c27]">{isLoggedIn ? "Create PDF Catalog" : "Sign in to create a PDF"}<ArrowRight size={18}/></button>}
        <p className="mt-6 text-sm"><Link href="/catalog" className="text-white/60 underline">Back to the catalog and Excel tools</Link></p>
      </main>
      <Footer/>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)}/>
      {isLoggedIn && user && open && <CatalogPdfExportDialog key={`${user.id}:${user.role}`} user={user} onClose={() => setOpen(false)}/>}
    </div>
  );
}
