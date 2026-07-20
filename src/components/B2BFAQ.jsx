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
      className="b2b-faq-card relative isolate w-full overflow-hidden rounded-xl border border-white/15 bg-[#1a1a1a] px-5 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.14)] transition-all duration-500 sm:px-7 sm:py-10 lg:px-10 lg:py-12"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[#268072]/12 blur-3xl" />

      <div className="relative">
        <div className="max-w-3xl">
          <p className="mb-3 font-label-sm text-[10px] font-bold uppercase tracking-[0.2em] text-[#82d6c5] sm:text-xs">
            Wholesale Support
          </p>
          <h2
            id="b2b-faq-title"
            className="font-headline-lg text-3xl font-black tracking-tighter text-white sm:text-4xl"
          >
            B2B Operational Clarity
          </h2>
          <p className="mt-4 font-body-md text-sm leading-relaxed text-white/60 sm:text-base">
            Clear terms for planning your first order, managing inventory, and scaling your wholesale partnership.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3 lg:gap-6">
          {FAQ_GROUPS.map(({ id, title, items }) => (
            <section key={id} aria-labelledby={`faq-group-${id}`}>
              <h3
                id={`faq-group-${id}`}
                className="mb-3 font-label-sm text-[10px] font-bold uppercase tracking-[0.18em] text-[#82d6c5] sm:text-xs"
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
                    <span className="absolute inset-y-3 left-0 w-px origin-top scale-y-0 bg-[#82d6c5] shadow-[0_0_10px_rgba(130,214,197,0.45)] transition-transform duration-300 ease-out group-open:scale-y-100" aria-hidden="true" />
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 pl-3 text-left [&::-webkit-details-marker]:hidden sm:py-5">
                      <h4 className="b2b-faq-question font-headline-md text-sm font-bold leading-snug text-white transition-colors duration-300 group-hover:text-[#82d6c5] group-open:text-[#82d6c5] sm:text-base">
                        {question}
                      </h4>
                      <span className="b2b-faq-toggle flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#131313]/55 text-[#82d6c5] transition-all duration-300 group-open:rotate-180 group-open:border-[#82d6c5]/35 group-open:bg-[#268072]/15">
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </summary>
                    <div className="pb-5 pl-3 pr-10">
                      <p className="font-body-md text-sm leading-relaxed text-white/60">
                        {answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
