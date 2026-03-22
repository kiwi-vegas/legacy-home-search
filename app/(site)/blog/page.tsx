import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { getBlogPosts } from '@/sanity/queries'

export const metadata: Metadata = {
  title: 'Real Estate Blog | Legacy Home Search',
  description:
    'Expert insights on real estate — market updates, buying tips, community spotlights, and investment analysis from the Legacy Home Search team.',
}

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  investment: 'Investment',
  news: 'News',
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
const builder = imageUrlBuilder(sanityClient)

function urlFor(source: any) {
  return builder.image(source)
}

export default async function BlogPage() {
  const posts = await getBlogPosts(24)

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="blog-hero">
        <div className="container">
          <span className="section-label">Insights &amp; News</span>
          <h1 className="blog-hero-title">Real Estate Blog</h1>
          <p className="blog-hero-sub">
            Market updates, buying &amp; selling guides, and community insights — from the Legacy Home Search team.
          </p>
        </div>
      </section>

      {/* ── POSTS GRID ────────────────────────────────────────────────── */}
      <section className="blog-listing">
        <div className="container">
          {posts.length === 0 ? (
            <div className="blog-empty">
              <p>No posts yet — check back soon. Our blog publishes fresh insights regularly.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map((post) => {
                const imgUrl = post.coverImage
                  ? urlFor(post.coverImage).width(600).height(340).fit('crop').url()
                  : null
                const pubDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''
                const category = CATEGORY_LABELS[post.category] ?? post.category

                return (
                  <Link key={post._id} href={`/blog/${post.slug}`} className="blog-card">
                    <div className="blog-card-img">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="blog-card-placeholder" />
                      )}
                    </div>
                    <div className="blog-card-body">
                      {category && (
                        <span className="blog-card-category">{category}</span>
                      )}
                      <h2 className="blog-card-title">{post.title}</h2>
                      {post.excerpt && (
                        <p className="blog-card-excerpt">{post.excerpt}</p>
                      )}
                      <div className="blog-card-meta">
                        <span>{pubDate}</span>
                        {post.aiGenerated && <span className="blog-ai-badge">AI</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
