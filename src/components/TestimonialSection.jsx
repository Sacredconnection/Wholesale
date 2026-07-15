"use client";

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Quote, Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'Partnering with Sacred Connection has been seamless. The quality of the ancestral blends is unmatched and our customers recognize the authenticity immediately.',
    name: 'Sarah J.',
    role: 'Owner',
    store: 'Holistic Earth Boutique',
    location: 'Amsterdam',
  },
  {
    quote: 'The wholesale process is straightforward, delivery is consistent, and the knowledge behind every lineage gives our team confidence when serving clients.',
    name: 'Daniel M.',
    role: 'Purchasing Manager',
    store: 'Forest & Soul Apothecary',
    location: 'Lisbon',
  },
  {
    quote: 'Our customers value traceability. Sacred Connection gives us a clear origin story and dependable quality across every order.',
    name: 'Elena V.',
    role: 'Founder',
    store: 'Ritual Roots Market',
    location: 'Rotterdam',
  },
];

export default function TestimonialSection() {
  const carouselRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToTestimonial = (index) => {
    const nextIndex = (index + testimonials.length) % testimonials.length;
    const carousel = carouselRef.current;
    const card = carousel?.children[nextIndex];

    if (!carousel || !card) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const inlinePadding = Number.parseFloat(window.getComputedStyle(carousel).paddingLeft) || 0;
    carousel.scrollTo({
      left: card.offsetLeft - carousel.offsetLeft - inlinePadding,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    setActiveIndex(nextIndex);
  };

  const syncActiveCard = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(carousel.children).forEach((card, index) => {
      const cardCenter = card.offsetLeft - carousel.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(cardCenter - carouselCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
  };

  return (
    <section
      aria-labelledby="testimonial-heading"
      className="relative isolate w-full overflow-hidden rounded-xl border border-white/15 bg-[#131313] px-4 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.14)] sm:px-6 sm:py-7 lg:px-8 lg:py-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#268072]/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-5 text-center sm:mb-6">
          <p className="mb-1.5 font-label-sm text-xs font-bold uppercase tracking-[0.2em] text-[#82d6c5]">
            Retail Partner Experiences
          </p>
          <h2 id="testimonial-heading" className="font-headline-lg text-xl font-black tracking-tight text-white sm:text-2xl">
            Retailers Trust Our Lineage
          </h2>
        </div>

        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={syncActiveCard}
            className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-5 touch-pan-x lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0"
          >
            {testimonials.map((testimonial) => (
              <figure
                key={`${testimonial.name}-${testimonial.store}`}
                className="relative flex min-w-[calc(100%-2.5rem)] snap-center flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-lg lg:min-w-0 lg:p-6"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#82d6c5] to-[#268072]" />

                <div className="mb-3 flex items-center justify-between gap-3">
                  <Quote className="h-6 w-6 text-[#82d6c5]" aria-hidden="true" />
                  <div className="flex items-center gap-0.5 text-[#E09A1E]" aria-label="5 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                </div>

                <blockquote className="font-body-md text-sm italic leading-relaxed text-white/80">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="mt-auto border-t border-white/10 pt-4">
                  <p className="font-headline-md text-sm font-bold text-white">
                    {testimonial.name} · {testimonial.role}
                  </p>
                  <p className="mt-0.5 font-body-md text-xs text-white/60">{testimonial.store}</p>
                  <p className="mt-2 flex items-center gap-1.5 font-label-sm text-[11px] font-bold uppercase tracking-widest text-[#82d6c5]">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {testimonial.location}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToTestimonial(activeIndex - 1)}
            className="absolute left-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#131313]/90 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-[#82d6c5] hover:text-[#82d6c5] lg:hidden"
            aria-label="Show previous testimonial"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToTestimonial(activeIndex + 1)}
            className="absolute right-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#131313]/90 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-[#82d6c5] hover:text-[#82d6c5] lg:hidden"
            aria-label="Show next testimonial"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-2 lg:hidden" aria-label="Testimonial position">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => goToTestimonial(index)}
              className={`h-1.5 rounded-full transition-all ${activeIndex === index ? 'w-6 bg-[#82d6c5]' : 'w-1.5 bg-white/20'}`}
              aria-label={`Show testimonial ${index + 1}`}
              aria-current={activeIndex === index ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
