/**
 * Website Scraper for Signup V2
 * Extracts business content from websites for AI training
 */

import * as cheerio from 'cheerio'
import { WebsiteContent } from '@/types/signup-v2'

interface ScraperOptions {
  timeout?: number
  maxPages?: number
}

const DEFAULT_OPTIONS: ScraperOptions = {
  timeout: 10000, // 10 seconds
  maxPages: 5, // Only scrape up to 5 pages
}

/**
 * Scrape a website and extract structured content
 */
export async function scrapeWebsite(
  url: string,
  options: ScraperOptions = {}
): Promise<WebsiteContent> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    // Validate URL
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol. Must be http or https.')
    }

    // Fetch the main page
    const html = await fetchPage(parsedUrl.href, opts.timeout!)

    // Parse with Cheerio
    const $ = cheerio.load(html)

    // Extract structured content
    const content: WebsiteContent = {
      title: extractTitle($),
      description: extractDescription($),
      faqs: extractFAQs($),
      services: extractServices($),
      about: extractAbout($),
      contact_info: extractContactInfo($),
      scraped_at: new Date().toISOString(),
    }

    return content
  } catch (error) {
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to fetch website. Please check the URL and try again.')
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Website took too long to respond. Please try again.')
      }

      if (error.message.includes('404')) {
        throw new Error('Website not found (404). Please check the URL.')
      }

      // Re-throw known errors
      throw error
    }

    // Unknown error
    throw new Error('Failed to scrape website. Please try again later.')
  }
}

/**
 * Fetch a single page with timeout
 */
async function fetchPage(url: string, timeout: number): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AgentOS/1.0 (Business Information Scraper)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404')
      }
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('timeout')
    }

    throw error
  }
}

/**
 * Extract page title
 */
function extractTitle($: cheerio.CheerioAPI): string {
  // Try multiple sources in priority order
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').first().text() ||
    $('h1').first().text() ||
    'Business Website'

  return title.trim()
}

/**
 * Extract page description
 */
function extractDescription($: cheerio.CheerioAPI): string {
  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('p').first().text() ||
    ''

  return description.trim()
}

/**
 * Extract FAQs from the page
 */
function extractFAQs($: cheerio.CheerioAPI): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = []

  // Look for FAQ schema markup
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).html() || '{}')
      if (data['@type'] === 'FAQPage' && data.mainEntity) {
        data.mainEntity.forEach((item: any) => {
          if (item['@type'] === 'Question') {
            faqs.push({
              question: item.name || '',
              answer: item.acceptedAnswer?.text || '',
            })
          }
        })
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  })

  // If no schema markup, look for common FAQ patterns
  if (faqs.length === 0) {
    // Look for FAQ sections
    const faqSection = $('section, div').filter((_, el) => {
      const text = $(el).text().toLowerCase()
      const id = $(el).attr('id')?.toLowerCase() || ''
      const className = $(el).attr('class')?.toLowerCase() || ''
      return (
        text.includes('faq') ||
        text.includes('frequently asked') ||
        id.includes('faq') ||
        className.includes('faq')
      )
    })

    // Extract Q&A pairs from the section
    faqSection.find('dt, .question, [class*="question"]').each((i, el) => {
      const question = $(el).text().trim()
      const answer = $(el).next('dd, .answer, [class*="answer"]').text().trim()

      if (question && answer) {
        faqs.push({ question, answer })
      }
    })
  }

  return faqs.slice(0, 10) // Limit to 10 FAQs
}

/**
 * Extract services offered
 */
function extractServices($: cheerio.CheerioAPI): string[] {
  const services: string[] = []

  // Look for service sections
  $('section, div').filter((_, el) => {
    const text = $(el).text().toLowerCase()
    const id = $(el).attr('id')?.toLowerCase() || ''
    const className = $(el).attr('class')?.toLowerCase() || ''
    return (
      text.includes('service') ||
      text.includes('what we do') ||
      text.includes('our offerings') ||
      id.includes('service') ||
      className.includes('service')
    )
  }).each((_, section) => {
    // Extract list items
    $(section).find('li, h3, h4, .service-title, [class*="service"]').each((_, el) => {
      const service = $(el).text().trim()
      if (service && service.length > 3 && service.length < 100) {
        services.push(service)
      }
    })
  })

  // Remove duplicates and limit
  return Array.from(new Set(services)).slice(0, 20)
}

/**
 * Extract about/description text
 */
function extractAbout($: cheerio.CheerioAPI): string {
  // Look for about sections
  const aboutSection = $('section, div').filter((_, el) => {
    const text = $(el).text().toLowerCase()
    const id = $(el).attr('id')?.toLowerCase() || ''
    const className = $(el).attr('class')?.toLowerCase() || ''
    return (
      text.includes('about') ||
      text.includes('who we are') ||
      text.includes('our story') ||
      id.includes('about') ||
      className.includes('about')
    )
  }).first()

  if (aboutSection.length > 0) {
    // Get all paragraph text from the about section
    const paragraphs: string[] = []
    aboutSection.find('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 20) {
        paragraphs.push(text)
      }
    })
    return paragraphs.join('\n\n').substring(0, 1000) // Limit to 1000 chars
  }

  // Fallback: get first few meaningful paragraphs
  const paragraphs: string[] = []
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 50 && paragraphs.length < 3) {
      paragraphs.push(text)
    }
  })

  return paragraphs.join('\n\n').substring(0, 1000)
}

/**
 * Extract contact information
 */
function extractContactInfo($: cheerio.CheerioAPI): object {
  const contact: Record<string, string> = {}

  // Extract phone numbers
  const phoneRegex = /(\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g
  const bodyText = $('body').text()
  const phones = bodyText.match(phoneRegex)
  if (phones && phones.length > 0) {
    contact.phone = phones[0].trim()
  }

  // Extract email addresses
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
  const emails = bodyText.match(emailRegex)
  if (emails && emails.length > 0) {
    // Filter out common non-contact emails
    const validEmails = emails.filter(
      (email) =>
        !email.includes('example.com') &&
        !email.includes('test.com') &&
        !email.includes('sentry.io') &&
        !email.includes('google') &&
        !email.includes('facebook')
    )
    if (validEmails.length > 0) {
      contact.email = validEmails[0].trim()
    }
  }

  // Extract address (look for schema markup)
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).html() || '{}')
      if (data.address) {
        if (typeof data.address === 'string') {
          contact.address = data.address
        } else if (data.address.streetAddress) {
          contact.address = [
            data.address.streetAddress,
            data.address.addressLocality,
            data.address.addressRegion,
            data.address.postalCode,
          ]
            .filter(Boolean)
            .join(', ')
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  })

  // Extract social media links
  const socialLinks: Record<string, string> = {}
  $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"]').each(
    (_, el) => {
      const href = $(el).attr('href')
      if (href) {
        if (href.includes('facebook.com')) socialLinks.facebook = href
        if (href.includes('twitter.com')) socialLinks.twitter = href
        if (href.includes('linkedin.com')) socialLinks.linkedin = href
        if (href.includes('instagram.com')) socialLinks.instagram = href
      }
    }
  )

  if (Object.keys(socialLinks).length > 0) {
    contact.social = JSON.stringify(socialLinks)
  }

  return contact
}
