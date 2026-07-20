import { Compass, HandHeart, Leaf, Network, Sparkles } from 'lucide-react';
import EditorialPage, {
  EditorialContact,
  EditorialNotice,
  EditorialSection,
} from '@/components/EditorialPage';

export const metadata = {
  title: 'About | Sacred Connection Wholesale',
  description: 'Discover the purpose, values, and partnership approach behind Sacred Connection Wholesale.',
  alternates: {
    canonical: '/about',
  },
};

const navigation = [
  { id: 'our-purpose', label: 'Our purpose' },
  { id: 'what-guides-us', label: 'What guides us' },
  { id: 'our-approach', label: 'Our approach' },
  { id: 'wholesale-partnerships', label: 'Wholesale partnerships' },
];

const values = [
  {
    icon: HandHeart,
    title: 'Respectful relationships',
    text: 'We value long-term relationships built through clear communication, mutual respect, and responsible commercial practices.',
  },
  {
    icon: Leaf,
    title: 'Thoughtful sourcing',
    text: 'We aim to understand origin, handling, and quality so our wholesale partners can make informed purchasing decisions.',
  },
  {
    icon: Network,
    title: 'Shared growth',
    text: 'We believe meaningful growth is collaborative, supporting suppliers, retailers, practitioners, and the communities they serve.',
  },
];

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="Our story"
      title="Trade rooted in connection."
      description="Sacred Connection Wholesale exists to connect thoughtful businesses with carefully selected products, while honoring the people, knowledge, and places behind them."
      icon={Compass}
      navigation={navigation}
      bannerImage="/banners/editorial/about-banner.webp"
      bannerPosition="center right"
    >
      <EditorialSection id="our-purpose" number="01" title="Our purpose">
        <p>
          We created Sacred Connection Wholesale for retailers and practitioners who care about more than a product on a shelf. Our purpose is to support responsible access to meaningful goods through professional, transparent, and human-centered wholesale relationships.
        </p>
        <p>
          We work to bring greater context to every collection: where products come from, how they should be handled, and what makes them valuable to the people who use them. This approach helps our partners buy with intention and speak about their assortment with clarity.
        </p>
        <EditorialNotice title="A living commitment">
          <p>
            Our standards and practices continue to evolve as we learn from suppliers, partners, and the communities connected to our work.
          </p>
        </EditorialNotice>
      </EditorialSection>

      <EditorialSection id="what-guides-us" number="02" title="What guides us">
        <p>
          Our decisions are shaped by respect, traceability, honest communication, and a commitment to doing business with care. These principles guide how we evaluate opportunities and maintain relationships.
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {values.map(({ icon: ValueIcon, title, text }) => (
            <div key={title} className="editorial-value-card rounded-sm border border-white/10 bg-[#131313] p-5">
              <ValueIcon className="mb-5 h-5 w-5 text-[#82d6c5]" aria-hidden="true" />
              <h3 className="mb-3 font-headline text-lg font-semibold leading-snug text-white">{title}</h3>
              <p className="text-sm leading-7 text-white/55">{text}</p>
            </div>
          ))}
        </div>
      </EditorialSection>

      <EditorialSection id="our-approach" number="03" title="Our approach">
        <p>
          We favor thoughtful selection over volume for its own sake. Before presenting a product to our wholesale network, we consider its quality, consistency, presentation, and fit with the needs of professional buyers.
        </p>
        <ul>
          <li>Clear product information and practical guidance for wholesale buyers.</li>
          <li>Careful handling and fulfillment appropriate to each product category.</li>
          <li>Open communication when availability, lead times, or specifications change.</li>
          <li>A willingness to listen, improve, and build relationships over time.</li>
        </ul>
        <p>
          Where cultural knowledge or traditional use is involved, we encourage respectful representation and discourage claims that reduce living traditions to trends or marketing language.
        </p>
      </EditorialSection>

      <EditorialSection id="wholesale-partnerships" number="04" title="Wholesale partnerships">
        <p>
          Our wholesale program is designed for established retailers, studios, practitioners, and aligned organizations. Approved partners receive access to trade information, product availability, and ordering support suited to their business.
        </p>
        <p>
          Every partnership begins with understanding. Tell us about your store, your customers, and what you hope to offer; we will help you explore whether our collections are the right fit.
        </p>
        <EditorialContact>
          <p>
            Interested in working together? Visit our <a href="/register">wholesale registration page</a> or email <a href="mailto:info@sacredconnection.co">info@sacredconnection.co</a>.
          </p>
        </EditorialContact>
      </EditorialSection>
    </EditorialPage>
  );
}
