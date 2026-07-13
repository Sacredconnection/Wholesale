import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://wholesale.sacredconnection.com"),
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#131313] text-[#e5e2e1]">
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
