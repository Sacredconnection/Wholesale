import { ChevronDown } from "lucide-react";

const FAQ_GROUPS = [
  {
    id: "shipping-fulfillment",
    title: "Shipping & Fulfillment",
    items: [
      {
        question: "What are the standard fulfillment and shipping lead times for bulk orders?",
        answer:
          "In-stock wholesale orders are typically processed and dispatched within 2 to 4 business days. For large-volume freight or custom-prepared botanical batches, fulfillment may take 5 to 10 business days. Transit times vary by region, and full tracking is provided upon dispatch.",
      },
      {
        question: "How do you handle international shipping, customs clearance, and import regulations?",
        answer:
          "We ship globally using reliable DHL, FedEx, and freight partners. We provide complete commercial invoices, botanical declarations, and certificates of origin to support smooth customs clearance. Import duties, VAT, and local compliance remain the responsibility of the receiving importer.",
      },
      {
        question: "Do you offer split shipping or direct distribution to third-party logistics (3PL) warehouses?",
        answer:
          "Yes. We can coordinate multi-location shipments or ship directly to your 3PL fulfillment provider or Amazon FBA warehouse, provided all barcode and labeling requirements are communicated before order packing.",
      },
    ],
  },
  {
    id: "inventory-quality",
    title: "Inventory & Quality Assurance",
    items: [
      {
        question: "What is the recommended shelf life and optimal storage for natural or botanical bulk products?",
        answer:
          "Most of our organic and sacred botanical goods maintain optimal potency and freshness for 12 to 24 months when stored correctly. We recommend keeping bulk inventory in a cool, dry, and dark environment, sealed in airtight containers away from direct sunlight and humidity.",
      },
      {
        question: "Do you provide Certificates of Analysis (CoA) or ethical sourcing documentation?",
        answer:
          "Absolutely. Transparency is core to our partnership. We provide CoAs, botanical authenticity certificates, and fair-trade indigenous sourcing documentation upon request to support your retail compliance and marketing transparency.",
      },
      {
        question: "Are white-labeling or custom packaging options available for wholesale partners?",
        answer:
          "Yes. We offer white-labeling, bulk unbranded packaging, and custom co-branding options for high-volume partners. Minimum order quantities (MOQ) and lead times apply to custom packaging services. Contact your account manager for our customization catalog.",
      },
    ],
  },
  {
    id: "financials-scaling",
    title: "Financials & Account Scaling",
    items: [
      {
        question: "How do volume-based tiered discounts work as my order size increases?",
        answer:
          "Our pricing structure rewards scale. Discounts automatically apply at checkout based on order volume brackets, for example: Tier 1, $1k to $3k; Tier 2, $3k to $10k; and Tier 3, $10k+. For recurring quarterly or annual supply contracts, we offer locked-in custom pricing.",
      },
      {
        question: "What is your resolution process for damaged or non-conforming shipments?",
        answer:
          "Every shipment is fully insured. If any items arrive damaged or fail to meet quality standards, the issue must be reported within 7 business days of delivery with photographic proof. We will promptly issue a credit memo, replacement shipment, or account refund.",
      },
      {
        question: "How do I submit my Reseller Permit, Tax Exemption, or VAT number?",
        answer:
          "During account registration or inside your B2B dashboard, you can upload your valid Reseller ID, EIN, or EU VAT certificate. Once verified by our financial team, usually within 24 hours, your account will be automatically exempted from applicable sales taxes.",
      },
    ],
  },
];

export default function B2BFAQ() {
  return (
    <section
      aria-labelledby="b2b-faq-title"
      className="b2b-faq-card relative isolate w-full overflow-hidden rounded-xl border border-white/15 bg-[#1a1a1a] px-5 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all duration-500 sm:px-7 sm:py-7 lg:px-8"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-48 w-48 rounded-full bg-[#268072]/10 blur-3xl" />

      <div className="relative grid gap-6 md:grid-cols-2 md:gap-7 xl:grid-cols-[0.78fr_repeat(3,minmax(0,1fr))] xl:gap-7">
        <div className="md:col-span-2 xl:col-span-1">
          <p className="mb-2 font-label-sm text-[10px] font-bold uppercase tracking-[0.2em] text-[#82d6c5]">
            Wholesale Support
          </p>
          <h2
            id="b2b-faq-title"
            className="font-headline-lg text-2xl font-black tracking-tighter text-white sm:text-3xl"
          >
            B2B Operational Clarity
          </h2>
          <p className="mt-3 max-w-xl font-body-md text-sm leading-6 text-white/60">
            Clear terms for planning your first order, managing inventory, and scaling your wholesale partnership.
          </p>
        </div>

        {FAQ_GROUPS.map(({ id, title, items }) => (
          <section key={id} aria-labelledby={`faq-group-${id}`}>
            <h3
              id={`faq-group-${id}`}
              className="mb-2 font-label-sm text-[10px] font-bold uppercase tracking-[0.16em] text-[#82d6c5]"
            >
              {title}
            </h3>
            <div className="flex flex-col border-t border-white/10">
              {items.map(({ question, answer }) => (
                <details
                  key={question}
                  name="b2b-operational-faq"
                  className="b2b-faq-item group relative border-b border-white/10"
                >
                  <span className="absolute inset-y-2.5 left-0 w-px origin-top scale-y-0 bg-[#82d6c5] shadow-[0_0_10px_rgba(130,214,197,0.45)] transition-transform duration-300 ease-out group-open:scale-y-100" aria-hidden="true" />
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2.5 py-3 pl-2.5 text-left [&::-webkit-details-marker]:hidden">
                    <h4 className="b2b-faq-question font-headline-md text-sm font-bold leading-snug text-white transition-colors duration-300 group-hover:text-[#82d6c5] group-open:text-[#82d6c5]">
                      {question}
                    </h4>
                    <span className="b2b-faq-toggle flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#131313]/55 text-[#82d6c5] transition-all duration-300 group-open:rotate-180 group-open:border-[#82d6c5]/35 group-open:bg-[#268072]/15">
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="pb-4 pl-2.5 pr-8">
                    <p className="font-body-md text-[13px] leading-5 text-white/60">
                      {answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
