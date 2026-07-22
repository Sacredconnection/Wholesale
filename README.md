# Sacred Connection Wholesale — B2B Portal

Welcome to the **Sacred Connection Wholesale B2B Portal**. This is a premium web application built using **Next.js 16**, **React 19**, and **Tailwind CSS v4** to serve B2B clients, distributors, and partners in sourcing sacred Amazonian botanicals, rapé, and related artisanal products.

---

## 🚀 Key Features

*   **Custom B2B Onboarding Flow:** An interactive, multi-step application wizard for retail stores, clinics, and facilitators to request wholesale accounts.
*   **Dynamic Product Catalog:** Live inventory simulation displaying product categories, tribal lineages, custom pricing tiers, weight options (5g sample to 1kg bulk), and live weight-based pricing calculations.
*   **Wholesale Cart & Checkout:** Persistent drawer-based cart with dynamic summaries, subtotal calculations, weight details, and a streamlined client-only checkout.
*   **NGO Integration (Conexão Ancestral):** A bespoke page section supporting the Conexão Ancestral NGO with high-quality visual assets, dynamic 5-photo collage mosaic, custom brand styling, and high-performance SVG watermarks.
*   **Client Dashboard (My Account):** A personalized client area detailing current B2B account limits, approved discount rates, shipping/billing records, and order history.

---

## 🛠️ Technology Stack

*   **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
*   **Runtime Library:** [React 19](https://react.dev/)
*   **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS
*   **Icons Library:** [Lucide React](https://lucide.dev/)
*   **State Management:** React Context API ([AuthContext](src/components/AuthContext.jsx), [CartContext](src/components/CartContext.jsx))

---

## 📂 Project Architecture

```bash
├── public/
│   ├── banner/        # Homepage and carousel banners
│   ├── ngo/           # Conexão Ancestral NGO assets (logo, watermark, collage)
│   ├── products/      # Product images organized by tribe/category
│   └── tribes/        # Tribal portrait visual cards
├── src/
│   ├── app/           # Next.js App Router (Layouts & Pages)
│   │   ├── catalog/   # Wholesale Catalog Page
│   │   ├── my-account/# Client Dashboard Profile Page
│   │   ├── product/   # Dynamic Product Details Page ([id])
│   │   ├── register/  # Onboarding/Registration Page
│   │   └── globals.css# Tailwind v4 configuration & Global styling
│   ├── components/    # Reusable React UI Components
│   │   ├── AuthContext.jsx # LocalStorage Authentication Context
│   │   ├── CartContext.jsx # LocalStorage Cart state provider
│   │   ├── NGOSection.jsx  # Customized NGO block with mosaic and watermark
│   │   └── ...
│   └── data/
│       └── products.js# Centralized product catalog mock data
```

---

## 💻 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   npm or yarn

### Installation

1. Clone or download the repository.
2. Open your terminal in the project root directory.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally (Development)

Start the local development server with Turbopack enabled:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Headless WooCommerce Backends

The catalog is aggregated from Sacred Connection and Maya Herbs. Configuration is entirely server-side through environment variables (see [.env.example](.env.example)):

| Variable | Description |
| --- | --- |
| `WOOCOMMERCE_URL` | Sacred Connection WooCommerce base URL |
| `WOOCOMMERCE_CONSUMER_KEY` | Sacred Connection REST API key with Read/Write permission |
| `WOOCOMMERCE_CONSUMER_SECRET` | Sacred Connection REST API secret |
| `WOOCOMMERCE_URL_MAYA` | Maya Herbs WooCommerce base URL |
| `WOOCOMMERCE_CONSUMER_KEY_MAYA` | Maya Herbs REST API key with Read/Write permission |
| `WOOCOMMERCE_CONSUMER_SECRET_MAYA` | Maya Herbs REST API secret |
| `WC_REVALIDATE_SECONDS` | Optional server-side catalog cache TTL (default `300`) |
| `WC_WEBHOOK_SECRET` | Recommended shared secret for immediate product-cache invalidation from WooCommerce webhooks |
| `SESSION_SECRET` | Required random secret (minimum 32 characters) used to sign authentication cookies |
| `ORDER_PAYMENT_INSTRUCTIONS` | Server-only payment text appended to every created order |

*   **Local dev:** copy `.env.example` to `.env.local` and fill in both sets of keys (WP Admin → WooCommerce → Settings → Advanced → REST API).
*   **Vercel:** add all variables for Production and Preview, then redeploy.

**How it works:** [src/lib/commerce-stores.js](src/lib/commerce-stores.js) defines the two server-only backends. `/api/products` loads both catalogs and tags each product with its source. The cart preserves this source, and `/api/orders` validates the items against their respective stores before creating one WooCommerce order per represented backend. Authentication and the buyer profile remain authoritative in Sacred Connection. Order history merges orders from both stores.

PDF exports always bypass the WooCommerce data cache, so every generated file uses the published products, current variations, prices, and stock returned at generation time. Normal catalog browsing keeps the short `WC_REVALIDATE_SECONDS` cache for performance.

For immediate on-screen updates, create active WooCommerce webhooks for **Product created**, **Product updated**, **Product deleted**, and **Product restored**. Use `https://YOUR_DOMAIN/api/webhooks/woocommerce` as the delivery URL and the exact `WC_WEBHOOK_SECRET` value as the webhook secret. Valid product events immediately expire the tagged catalog cache; invalid signatures are rejected.

> Product route IDs combine store ID and WooCommerce slug, so equal slugs and SKUs can coexist across the two catalogs. The secondary filter only uses real WooCommerce product attributes or subcategories.

### Building for Production

Compile the production bundle:
```bash
npm run build
```
Start the production server:
```bash
npm run start
```

---

## B2B Authentication

Authentication is verified against WordPress/WooCommerce. The application then
stores only a signed, short-lived session in an `HttpOnly` cookie; passwords and
authentication state are never stored in browser `localStorage`.
