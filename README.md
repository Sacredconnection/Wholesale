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

## 🔐 B2B Demo Login Credentials

For testing and client review, a simulated default B2B account is preloaded:

*   **Email:** `partner@sacredconnection.com`
*   **Password:** `ancestral8892`

*Note: In production environments, this mock provider is designed to be replaced with a secure database or headless identity management service (e.g., Auth0, Firebase Auth, or Clerk).*
