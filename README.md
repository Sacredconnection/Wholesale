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

### Headless WooCommerce Backend

The catalog can be served live from a WordPress/WooCommerce backend. Configuration is entirely via environment variables (see [.env.example](.env.example)):

| Variable | Description |
| --- | --- |
| `WOOCOMMERCE_URL` | Base URL of the WooCommerce install (currently `https://wholesale.sacred-snuff.com`) |
| `WOOCOMMERCE_CONSUMER_KEY` | REST API consumer key (`ck_...`) |
| `WOOCOMMERCE_CONSUMER_SECRET` | REST API consumer secret (`cs_...`) |
| `WC_REVALIDATE_SECONDS` | Optional server-side cache TTL for API responses (default `300`) |
| `SESSION_SECRET` | Required random secret (minimum 32 characters) used to sign authentication cookies |
| `ORDER_PAYMENT_INSTRUCTIONS` | Server-only payment text appended to wholesale orders |

*   **Local dev:** copy `.env.example` to `.env.local` and fill in the keys (generated in WP Admin → WooCommerce → Settings → Advanced → REST API).
*   **Vercel:** add the same variables in **Project Settings → Environment Variables**. When the backend URL changes, only `WOOCOMMERCE_URL` needs updating.

**How it works:** credentials stay server-side — [src/lib/woocommerce.js](src/lib/woocommerce.js) talks to the WooCommerce REST API from Route Handlers (`/api/products`, `/api/products/[id]`), and [src/lib/wc-mappers.js](src/lib/wc-mappers.js) converts WC products/variations into the internal catalog shape. On the client, [ProductsContext](src/components/ProductsContext.jsx) renders the static catalog ([src/data/products.js](src/data/products.js)) instantly and swaps in live WooCommerce data when available. If the backend is unconfigured or offline, the site keeps working with static data.

> Product URLs use the WooCommerce **product slug** — keep WP slugs aligned with the ids in `src/data/products.js` (e.g. `apurina-awiry`) for stable links. The "tribe" filter reads a product attribute named **Tribe**; weight options come from product **variations** (weight in grams).

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
