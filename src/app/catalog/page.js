"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationModal from "@/components/ApplicationModal";
import LoginModal from "@/components/LoginModal";
import { 
  Search, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Filter,
  PackageOpen
} from "lucide-react";

// Premium B2B Product Catalog Data based on the attached catalog image
const PRODUCTS_DATA = [
  {
    id: "huni-kuin-ninawa-500g",
    name: "Huni Kuin Rapé - Ninawa Pai da Mata 500g",
    sku: "RAP-HK01-500G",
    category: "Rapé (Snuff)",
    tribe: "Huni Kuin",
    priceRange: "$250.00",
    image: "🍃",
    options: [
      { name: "500g Bulk Pack", price: 250.00, sku: "RAP-HK01-500G", weightGrams: 500 }
    ]
  },
  {
    id: "shawadawa-kapayura",
    name: "Shawãdawa Kapayura Hape",
    sku: "RAP-SD01",
    category: "Rapé (Snuff)",
    tribe: "Shawãdawa",
    priceRange: "$7.00 - $14.00",
    image: "🌿",
    options: [
      { name: "50g", price: 7.00, sku: "RAP-SD01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-SD01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-SD01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "nukini-cumaru",
    name: "Nukini Cumaru Hape",
    sku: "RAP-NK01",
    category: "Rapé (Snuff)",
    tribe: "Nukini",
    priceRange: "$7.00 - $14.00",
    image: "🌱",
    options: [
      { name: "50g", price: 7.00, sku: "RAP-NK01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-NK01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-NK01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "caboclo-sananga-hape",
    name: "Caboclo Sananga Hape",
    sku: "RAP-CB01",
    category: "Rapé (Snuff)",
    tribe: "Caboclo",
    priceRange: "$7.00 - $14.00",
    image: "🍂",
    options: [
      { name: "50g", price: 7.00, sku: "RAP-CB01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-CB01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-CB01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "nukini-alfavaca",
    name: "Nukini Alfavaca Hape",
    sku: "RAP-NK02",
    category: "Rapé (Snuff)",
    tribe: "Nukini",
    priceRange: "$7.00 - $14.00",
    image: "🌿",
    options: [
      { name: "50g", price: 7.00, sku: "RAP-NK02-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-NK02-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-NK02-250G", weightGrams: 250 }
    ]
  },
  {
    id: "yawanawa-feminine",
    name: "Yawanawá Tribe Feminine Forces Hape",
    sku: "RAP-YW01",
    category: "Rapé (Snuff)",
    tribe: "Yawanawá",
    priceRange: "$3.55 - $14.00",
    image: "🌸",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-YW01-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-YW01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-YW01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-YW01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "munay-vine",
    name: "Munay Cura Vine of the Soul Hape",
    sku: "RAP-MC01",
    category: "Rapé (Snuff)",
    tribe: "Caboclo",
    priceRange: "$3.55 - $14.00",
    image: "🌀",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-MC01-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-MC01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-MC01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-MC01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "munay-cacao",
    name: "Munay Cura Cacao Heart Opener Hape",
    sku: "RAP-MC02",
    category: "Rapé (Snuff)",
    tribe: "Caboclo",
    priceRange: "$3.55 - $14.00",
    image: "🤎",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-MC02-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-MC02-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-MC02-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-MC02-250G", weightGrams: 250 }
    ]
  },
  {
    id: "yawanawa-guacamayo",
    name: "Yawanawá Guacamayo Hape",
    sku: "RAP-YW02",
    category: "Rapé (Snuff)",
    tribe: "Yawanawá",
    priceRange: "$7.00 - $14.00",
    image: "🦜",
    options: [
      { name: "50g", price: 7.00, sku: "RAP-YW02-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-YW02-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-YW02-250G", weightGrams: 250 }
    ]
  },
  {
    id: "yawanawa-children",
    name: "Yawanawá Children of the Rainforest Hape",
    sku: "RAP-YW03",
    category: "Rapé (Snuff)",
    tribe: "Yawanawá",
    priceRange: "$3.55 - $14.00",
    image: "✨",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-YW03-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-YW03-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-YW03-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-YW03-250G", weightGrams: 250 }
    ]
  },
  {
    id: "kuntanawa-origins",
    name: "Kuntanawa Tribe Origins Hape",
    sku: "RAP-KT01",
    category: "Rapé (Snuff)",
    tribe: "Kuntanawa",
    priceRange: "$3.55 - $14.00",
    image: "☀️",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-KT01-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-KT01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-KT01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-KT01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "caboclo-robinsana",
    name: "Caboclo Robinsana Hape",
    sku: "RAP-CB02",
    category: "Rapé (Snuff)",
    tribe: "Caboclo",
    priceRange: "$3.55 - $14.00",
    image: "🌸",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-CB02-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-CB02-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-CB02-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-CB02-250G", weightGrams: 250 }
    ]
  },
  {
    id: "limited-ancestor",
    name: "Limited Edition Ancestor Hape",
    sku: "RAP-LE01",
    category: "Rapé (Snuff)",
    tribe: "Huni Kuin",
    priceRange: "$7.00 - $14.00",
    image: "👑",
    options: [
      { name: "50g", price: 7.00, sku: "RAP-LE01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-LE01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-LE01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "yawanawa-thoughts",
    name: "Yawanawá Tribe Beautiful Thoughts Hape",
    sku: "RAP-YW04",
    category: "Rapé (Snuff)",
    tribe: "Yawanawá",
    priceRange: "$3.55 - $14.00",
    image: "💡",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-YW04-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-YW04-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-YW04-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-YW04-250G", weightGrams: 250 }
    ]
  },
  {
    id: "shanenawa-caneleiro",
    name: "Shanenawa Tribe Caneleiro Harmony Hape",
    sku: "RAP-SN01",
    category: "Rapé (Snuff)",
    tribe: "Shanenawa",
    priceRange: "$3.55 - $14.00",
    image: "✨",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-SN01-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-SN01-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-SN01-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-SN01-250G", weightGrams: 250 }
    ]
  },
  {
    id: "kuntanawa-nectar",
    name: "Kuntanawa Tribe Hive Nectar Propolis Hape",
    sku: "RAP-KT02",
    category: "Rapé (Snuff)",
    tribe: "Kuntanawa",
    priceRange: "$3.55 - $14.00",
    image: "🐝",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-KT02-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-KT02-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-KT02-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-KT02-250G", weightGrams: 250 }
    ]
  },
  {
    id: "shawadawa-purification",
    name: "Shawãdawa Tribe Spiritual Purification Hape",
    sku: "RAP-SD02",
    category: "Rapé (Snuff)",
    tribe: "Shawãdawa",
    priceRange: "$3.55 - $14.00",
    image: "⚡",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-SD02-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-SD02-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-SD02-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-SD02-250G", weightGrams: 250 }
    ]
  },
  {
    id: "nukini-divine-mother",
    name: "Nukini Tribe Divine Mother Rose Hape",
    sku: "RAP-NK03",
    category: "Rapé (Snuff)",
    tribe: "Nukini",
    priceRange: "$3.55 - $14.00",
    image: "🌹",
    options: [
      { name: "15g Sample", price: 3.55, sku: "RAP-NK03-15G", weightGrams: 15 },
      { name: "50g", price: 7.00, sku: "RAP-NK03-50G", weightGrams: 50 },
      { name: "100g", price: 11.00, sku: "RAP-NK03-100G", weightGrams: 100 },
      { name: "250g", price: 14.00, sku: "RAP-NK03-250G", weightGrams: 250 }
    ]
  },
  {
    id: "sananga-drops-strong",
    name: "Strong Sananga Eye Drops 10ml",
    sku: "SAN-STRG-10ML",
    category: "Sananga",
    tribe: "Katukina",
    priceRange: "$29.00",
    image: "💧",
    options: [
      { name: "10ml Bottle", price: 29.00, sku: "SAN-STRG-10ML", weightGrams: 25 }
    ]
  },
  {
    id: "kambo-stick-authentic",
    name: "Authentic Kambo Stick",
    sku: "MED-KB-STICK",
    category: "Traditional Remedies",
    tribe: "Katukina",
    priceRange: "$75.00",
    image: "🐸",
    options: [
      { name: "Single Stick", price: 75.00, sku: "MED-KB-STICK", weightGrams: 10 }
    ]
  }
];

export default function CatalogPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tribe, setTribe] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Options Dialog State
  const [selectedProductOptions, setSelectedProductOptions] = useState(null);
  const [optionsQuantities, setOptionsQuantities] = useState({});

  // Success Notification
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // Extract Categories and Tribes dynamically for dropdowns
  const categories = useMemo(() => {
    return ["All", ...new Set(PRODUCTS_DATA.map((p) => p.category))];
  }, []);

  const tribes = useMemo(() => {
    return ["All", ...new Set(PRODUCTS_DATA.map((p) => p.tribe))];
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return PRODUCTS_DATA.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(search.toLowerCase()) || 
        product.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      const matchesTribe = tribe === "All" || product.tribe === tribe;
      return matchesSearch && matchesCategory && matchesTribe;
    });
  }, [search, category, tribe]);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Cart Handlers
  const handleAddToCart = (product, optionIndex = 0, quantity = 1) => {
    if (quantity <= 0) return;
    const option = product.options[optionIndex];
    
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.sku === option.sku
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          optionName: option.name,
          sku: option.sku,
          price: option.price,
          weightGrams: option.weightGrams || 0,
          quantity
        }
      ];
    });

    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (sku, change) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.sku === sku) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveFromCart = (sku) => {
    setCart((prevCart) => prevCart.filter((item) => item.sku !== sku));
  };

  // Cart Metrics
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartTotalWeightGrams = useMemo(() => {
    return cart.reduce((total, item) => total + (item.weightGrams * item.quantity), 0);
  }, [cart]);

  // Options Modal Handlers
  const openOptionsModal = (product) => {
    setSelectedProductOptions(product);
    // Initialize quantities to 0 or 1 for the first option
    const initialQty = {};
    product.options.forEach((opt) => {
      initialQty[opt.sku] = 0;
    });
    // Set first option to 1 by default
    initialQty[product.options[0].sku] = 1;
    setOptionsQuantities(initialQty);
  };

  const closeOptionsModal = () => {
    setSelectedProductOptions(null);
    setOptionsQuantities({});
  };

  const handleOptionQtyChange = (sku, change) => {
    setOptionsQuantities((prev) => {
      const currentQty = prev[sku] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [sku]: newQty };
    });
  };

  const handleAddMultipleOptionsToCart = () => {
    if (!selectedProductOptions) return;
    
    selectedProductOptions.options.forEach((opt, index) => {
      const qty = optionsQuantities[opt.sku] || 0;
      if (qty > 0) {
        handleAddToCart(selectedProductOptions, index, qty);
      }
    });

    closeOptionsModal();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setTribe("All");
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onOpenApply={() => setIsApplyOpen(true)} 
      />

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-10">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-6 mt-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#268072]/15 border border-[#268072]/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#82d6c5] uppercase font-label-sm mb-3">
              B2B Portal
            </div>
            <h1 className="font-headline-lg text-4xl md:text-5xl font-black tracking-tighter text-white">
              Wholesale Product Catalog
            </h1>
            <p className="font-body-md text-base text-white/60 max-w-2xl mt-2 leading-relaxed">
              Verify pricing options and add products to your bulk order draft. Submitting the request drafts an order sheet for our verification team.
            </p>
          </div>
          
          {/* Quick Cart Summary Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 py-3.5 px-6 rounded-sm text-sm font-bold tracking-wide text-white uppercase relative shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#82d6c5]" />
            Order Sheet
            {cartTotalItems > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e02401] text-[10px] font-bold text-white absolute -top-2 -right-2 animate-pulse">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-sm p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-label-sm">
            <Filter className="w-4 h-4 text-[#82d6c5]" />
            Filter Products
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
            
            {/* Search Input */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="search" className="text-xs text-white/55 font-semibold tracking-wide uppercase font-label-sm">
                Search
              </label>
              <div className="relative w-full">
                <input 
                  type="text" 
                  id="search"
                  placeholder="Name or SKU..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 pl-12 pr-4 text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#268072] transition-colors font-body-md"
                />
                <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="category" className="text-xs text-white/55 font-semibold tracking-wide uppercase font-label-sm">
                Category
              </label>
              <div className="relative">
                <select 
                  id="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 px-4 text-sm text-white focus:outline-none focus:border-[#268072] transition-colors font-body-md cursor-pointer appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                  ▼
                </div>
              </div>
            </div>

            {/* Tribe/Etnia Dropdown */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="tribe" className="text-xs text-white/55 font-semibold tracking-wide uppercase font-label-sm">
                Indigenous Tribe
              </label>
              <div className="relative">
                <select 
                  id="tribe"
                  value={tribe}
                  onChange={(e) => {
                    setTribe(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 px-4 text-sm text-white focus:outline-none focus:border-[#268072] transition-colors font-body-md cursor-pointer appearance-none"
                >
                  {tribes.map((tb) => (
                    <option key={tb} value={tb}>{tb === "All" ? "All Tribes" : tb}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                  ▼
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="w-full">
              <button 
                onClick={handleClearFilters}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 py-4 px-6 rounded-sm text-sm font-bold tracking-wider uppercase text-white cursor-pointer"
              >
                Clear Filters
              </button>
            </div>

          </div>
        </div>

        {/* Product Table Grid */}
        <div className="border border-white/10 rounded-sm overflow-hidden bg-[#1a1a1a]">
          
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-[#131313] border-b border-white/10 text-xs font-bold text-white/50 uppercase tracking-widest font-label-sm">
            <div className="col-span-2">Image</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2 text-center">SKU Prefix</div>
            <div className="col-span-2 text-right">Price Range</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Product Items */}
          {paginatedProducts.length > 0 ? (
            <div className="divide-y divide-white/5">
              {paginatedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-8 py-6 hover:bg-white/[0.01] transition-colors"
                >
                  {/* Image Column */}
                  <div className="col-span-1 md:col-span-2 flex items-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl select-none">
                      {product.image}
                    </div>
                  </div>

                  {/* Name Column */}
                  <div className="col-span-1 md:col-span-4 flex flex-col gap-1">
                    <h3 className="font-headline-md text-lg font-bold text-white">
                      {product.name}
                    </h3>
                    <div className="flex gap-2">
                      <span className="inline-block text-[10px] font-semibold bg-[#268072]/15 text-[#82d6c5] border border-[#268072]/30 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                        {product.category}
                      </span>
                      <span className="inline-block text-[10px] font-semibold bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                        {product.tribe}
                      </span>
                    </div>
                  </div>

                  {/* SKU Column */}
                  <div className="col-span-1 md:col-span-2 text-left md:text-center">
                    <span className="text-[11px] font-mono text-white/45 bg-[#131313] border border-white/5 px-2 py-1.5 rounded-sm tracking-wide">
                      {product.sku}
                    </span>
                  </div>

                  {/* Price Column */}
                  <div className="col-span-1 md:col-span-2 text-left md:text-right">
                    <span className="text-base font-bold text-[#82d6c5] font-headline-md">
                      {product.priceRange}
                    </span>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-1 md:col-span-2 flex justify-end">
                    {product.options.length === 1 ? (
                      <button
                        onClick={() => handleAddToCart(product, 0, 1)}
                        className="w-full md:w-auto bg-[#268072] hover:bg-[#1f665b] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-0"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => openOptionsModal(product)}
                        className="w-full md:w-auto bg-white/10 hover:bg-[#268072] hover:text-white text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-sm border border-white/10 hover:border-[#268072]/40 transition-all duration-300 cursor-pointer"
                      >
                        Select Options
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
              <PackageOpen className="w-16 h-16 text-white/20" />
              <h3 className="font-headline-md text-xl font-bold text-white/60">
                No products found matching filters
              </h3>
              <button
                onClick={handleClearFilters}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-sm text-xs font-bold transition-all border cursor-pointer ${
                    currentPage === page
                      ? "bg-[#268072] text-white border-[#268072]"
                      : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* Footer Section */}
      <Footer />

      {/* Modal: Size Options Selector Drawer */}
      {selectedProductOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#1a1a1a] border border-white/15 rounded-md max-w-lg w-full overflow-hidden shadow-2xl relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-[#82d6c5] uppercase tracking-widest font-label-sm">
                  {selectedProductOptions.category}
                </span>
                <h3 className="font-headline-md text-xl font-bold text-white mt-1">
                  Configure Options
                </h3>
              </div>
              <button 
                onClick={closeOptionsModal}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Option List */}
            <div className="p-8 flex flex-col gap-6">
              <div>
                <h4 className="text-base font-bold text-white/80 uppercase font-headline-md">
                  {selectedProductOptions.name}
                </h4>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Base SKU: {selectedProductOptions.sku}
                </p>
              </div>

              <div className="flex flex-col gap-4 divide-y divide-white/5">
                {selectedProductOptions.options.map((opt) => (
                  <div key={opt.sku} className="flex justify-between items-center pt-4 first:pt-0">
                    <div>
                      <div className="text-sm font-bold text-white">{opt.name}</div>
                      <div className="text-[10px] font-mono text-white/45 mt-0.5">{opt.sku}</div>
                    </div>

                    <div className="flex items-center gap-5">
                      <span className="text-base font-bold text-[#82d6c5]">
                        ${opt.price.toFixed(2)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center bg-[#131313] border border-white/10 rounded-sm">
                        <button
                          onClick={() => handleOptionQtyChange(opt.sku, -1)}
                          className="p-2.5 text-white/65 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-white font-mono">
                          {optionsQuantities[opt.sku] || 0}
                        </span>
                        <button
                          onClick={() => handleOptionQtyChange(opt.sku, 1)}
                          className="p-2.5 text-white/65 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-[#131313] border-t border-white/10 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase font-label-sm">
                  Subtotal Selection
                </span>
                <span className="text-xl font-bold text-[#82d6c5] font-headline-md">
                  $
                  {selectedProductOptions.options.reduce((sum, opt) => {
                    const qty = optionsQuantities[opt.sku] || 0;
                    return sum + opt.price * qty;
                  }, 0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleAddMultipleOptionsToCart}
                disabled={!selectedProductOptions.options.some((opt) => (optionsQuantities[opt.sku] || 0) > 0)}
                className="bg-[#268072] hover:bg-[#1f665b] disabled:opacity-40 disabled:hover:bg-[#268072] text-white text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer disabled:cursor-not-allowed border-0"
              >
                Add Selection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Side Drawer: Order Summary Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          ></div>

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#1a1a1a] border-l border-white/10 shadow-2xl flex flex-col justify-between animate-fade-in-left">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-[#131313]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#82d6c5]" />
                <h3 className="font-headline-md text-xl font-bold text-white">
                  Bulk Order Sheet
                </h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Cart Items */}
            <div className="flex-grow overflow-y-auto px-8 py-6 flex flex-col gap-6 scrollbar-none">
              {cart.length > 0 ? (
                <div className="flex flex-col gap-5 divide-y divide-white/5">
                  {cart.map((item, index) => (
                    <div key={item.sku} className={`flex justify-between items-start gap-4 ${index > 0 ? "pt-5" : ""}`}>
                      <div className="flex-grow">
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-white/5 text-[#82d6c5] border border-white/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                            {item.optionName}
                          </span>
                          <span className="text-[10px] font-mono text-white/35">
                            {item.sku}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between h-full gap-3 min-w-[100px] shrink-0">
                        <span className="text-sm font-bold text-white font-mono">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center bg-[#131313] border border-white/10 rounded-sm">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.sku, -1)}
                            className="p-1.5 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-white font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.sku, 1)}
                            className="p-1.5 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button 
                          onClick={() => handleRemoveFromCart(item.sku)}
                          className="text-[10px] text-white/35 hover:text-[#e02401] uppercase tracking-wider font-semibold transition-colors cursor-pointer bg-transparent border-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-4 text-white/30">
                  <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                  <p className="text-sm font-semibold">Your B2B order sheet is currently empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs font-bold text-[#82d6c5] uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Browse Catalog
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="px-8 py-6 bg-[#131313] border-t border-white/10 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-white/50 uppercase tracking-wider font-label-sm">
                  <span>Total Items</span>
                  <span className="font-bold text-white font-mono">{cartTotalItems}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/50 uppercase tracking-wider font-label-sm">
                  <span>Estimated Net Weight</span>
                  <span className="font-bold text-white font-mono">
                    {cartTotalWeightGrams >= 1000 
                      ? `${(cartTotalWeightGrams / 1000).toFixed(2)} kg`
                      : `${cartTotalWeightGrams} g`
                    }
                  </span>
                </div>
                <div className="h-px bg-white/5 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white uppercase tracking-widest font-label-sm">
                    Est. Subtotal
                  </span>
                  <span className="text-2xl font-black text-[#82d6c5] font-headline-lg">
                    ${cartSubtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCart([]);
                  setIsCartOpen(false);
                  setShowOrderSuccess(true);
                }}
                disabled={cart.length === 0}
                className="w-full bg-[#268072] hover:bg-[#1f665b] disabled:opacity-40 disabled:hover:bg-[#268072] text-white text-xs font-bold uppercase tracking-widest py-5 rounded-sm transition-all duration-300 shadow-lg shadow-[#268072]/20 hover:shadow-[#268072]/40 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed border-0"
              >
                Submit Wholesale Order
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showOrderSuccess && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#1a1a1a] border border-white/10 rounded-md max-w-md w-full p-8 text-center shadow-2xl relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-[#268072]/20 border border-[#268072]/45 flex items-center justify-center text-3xl mx-auto mb-6">
              <Check className="w-8 h-8 text-[#82d6c5]" />
            </div>
            
            <h3 className="font-headline-md text-2xl font-bold text-white mb-2">
              Order Draft Submitted
            </h3>
            
            <p className="font-body-md text-sm text-white/70 leading-relaxed mb-6">
              Your wholesale order request has been received. Our vetting team will check product availability, calculate shipping weight costs, and contact you within 24 hours to confirm.
            </p>

            <button 
              onClick={() => setShowOrderSuccess(false)}
              className="bg-[#268072] text-white font-label-sm text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-sm hover:bg-[#1f665b] transition-all duration-300 cursor-pointer border-0 w-full"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      <ApplicationModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
      />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
