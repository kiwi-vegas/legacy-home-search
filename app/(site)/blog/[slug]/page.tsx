import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { getBlogPost, getBlogPosts } from '@/sanity/queries'
import PortableText from '@/components/PortableText'
import BlogCommunityListings, { type CommunityKey } from '@/components/BlogCommunityListings'

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

export async function generateStaticParams() {
  const posts = await getBlogPosts(100)
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
  }
}

function detectCommunities(title: string, slug: string): CommunityKey[] {
  const text = `${title} ${slug}`.toLowerCase()
  // Strip "Hampton Roads" (spaced or hyphenated) so "hampton" alone isn't a false-positive
  const textNoHR = text.replace(/hampton[\s-]+roads?/gi, '')
  const found: CommunityKey[] = []
  if (text.includes('virginia beach') || text.includes('virginia-beach')) found.push('virginia-beach')
  if (text.includes('chesapeake')) found.push('chesapeake')
  if (text.includes('norfolk')) found.push('norfolk')
  if (textNoHR.includes('hampton')) found.push('hampton')
  if (text.includes('newport news') || text.includes('newport-news')) found.push('newport-news')
  if (text.includes('suffolk')) found.push('suffolk')
  return found
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const imgUrl = post.coverImage
    ? builder.image(post.coverImage).width(1920).url()
    : null

  const pubDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const category = CATEGORY_LABELS[post.category] ?? post.category
  const communities = detectCommunities(post.title, post.slug)

  return (
    <article className="blog-post">

      {/* ── HERO IMAGE ──────────────────────────────────────────────── */}
      {imgUrl && (
        <div className="blog-post-hero">
          <Image
            src={imgUrl}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'top' }}
          />
          <div className="blog-post-hero-overlay" />
        </div>
      )}

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="container">
        <div className="blog-post-header">
          {category && <span className="blog-card-category">{category}</span>}
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="blog-post-meta">
            <span>Barry Jenkins</span>
            {pubDate && <><span className="blog-post-sep">·</span><span>{pubDate}</span></>}
            {post.aiGenerated && <span className="blog-ai-badge">AI-Assisted</span>}
          </div>
          {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        {post.body && (
          <div className="blog-post-body">
            <PortableText value={post.body} />
          </div>
        )}

      </div>

      {/* ── COMMUNITY LISTINGS ──────────────────────────────────────── */}
      <BlogCommunityListings communities={communities} />

      <div className="container">
        {/* ── BACK LINK ───────────────────────────────────────────────── */}
        <div className="blog-post-footer">
          <a href="/blog" className="btn-outline">← Back to Blog</a>
        </div>
      </div>

    </article>
  )
}
