import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sacred Connection Wholesale | B2B Portal",
  description:
    "Direct fair-trade sourcing of traditional Amazonian botanicals and responsibly produced goods for wholesale partners.",
  applicationName: "Sacred Connection Wholesale",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${roboto.variable} ${roboto.className} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-[#23403B] text-[#e5e2e1]"
      >
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <BackToTop />
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
