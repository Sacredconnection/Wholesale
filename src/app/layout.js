import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "variable",
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
  title: "Sacred Connection Wholesale | B2B Portal",
  description:
    "Direct fair-trade sourcing of sacred Amazonian botanicals and traditional forest remedies for wholesale partners.",
  applicationName: "Sacred Connection Wholesale",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
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
        className="min-h-full flex flex-col bg-[#23403B] text-[#e5e2e1]"
        suppressHydrationWarning
      >
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
