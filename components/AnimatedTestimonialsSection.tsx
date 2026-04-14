'use client'
import { AnimatedTestimonials } from '@/components/ui/animated-testimonials'

const testimonials = [
  {
    id: 1,
    name: 'Sarah & Mike T.',
    role: 'First-time buyers',
    company: 'Virginia Beach',
    content: "Barry and his team helped us find our dream home in Virginia Beach in under two weeks. Their market knowledge was unmatched — they knew which neighborhoods were up-and-coming before we even asked.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 2,
    name: 'David R.',
    role: 'Seller',
    company: 'Chesapeake',
    content: "Sold our Chesapeake home in 9 days over asking price. Barry's pricing strategy and marketing plan were exactly right. We walked away with more than we expected.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 3,
    name: 'Priya & Raj K.',
    role: 'Investors',
    company: 'Norfolk',
    content: "As first-time investors, we were nervous about buying a rental property in Norfolk. Barry walked us through every step and helped us find a property that cash-flows from day one.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: 4,
    name: 'Marcus & Linda J.',
    role: 'Buyers',
    company: 'Hampton',
    content: "Barry was honest when other agents just told us what we wanted to hear. That honesty saved us from a bad purchase and led us to the perfect home in Hampton.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    id: 5,
    name: 'Nicole S.',
    role: 'Seller & buyer',
    company: 'Virginia Beach',
    content: "From our first call to closing, the Legacy team was responsive, professional, and genuinely cared about our outcome. I've already referred three friends to them.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/54.jpg',
  },
]

export default function AnimatedTestimonialsSection() {
  return <AnimatedTestimonials testimonials={testimonials} autoRotateInterval={6000} />
}
