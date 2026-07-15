import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import CartDrawer from "@/components/CartDrawer";
import ReloadToHome from "@/components/ReloadToHome";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const themeBootScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem('sacred-wholesale-theme');
      document.documentElement.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
    } catch (error) {
      document.documentElement.dataset.theme = 'dark';
    }
  })();
`;

export const metadata = {
  metadataBase: new URL("https://wholesale.sacredconnection.com"),
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${roboto.variable} ${roboto.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#131313] text-[#e5e2e1]"
        suppressHydrationWarning
      >
        <ReloadToHome />
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
