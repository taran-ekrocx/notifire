#!/usr/bin/env python3
"""Generate Notifire.in — Concise Technical Documentation PDF"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether,
)
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Palette ──────────────────────────────────────────────────────────
ACCENT      = colors.HexColor('#7c3aed')
TEXT_PRI    = colors.HexColor('#1a1a2e')
TEXT_MUT    = colors.HexColor('#6b7280')
BG_LIGHT    = colors.HexColor('#f3f4f6')
BG_WHITE    = colors.white
STEP_BG     = colors.HexColor('#7c3aed')
TECH_BG     = colors.HexColor('#10b981')
PIPELINE_BG = colors.HexColor('#f59e0b')

# ── Fonts ────────────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont('Serif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Serif-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Sans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Sans-Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
registerFontFamily('Serif', normal='Serif', bold='Serif-Bold')
registerFontFamily('Sans', normal='Sans', bold='Sans-Bold')

# ── Page Setup ───────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
LM = 1.0 * inch
RM = 1.0 * inch
AW = PAGE_W - LM - RM

# ── Styles ───────────────────────────────────────────────────────────
sTitle = ParagraphStyle('T', fontName='Sans-Bold', fontSize=26, leading=32, textColor=ACCENT, spaceAfter=4)
sSubtitle = ParagraphStyle('ST', fontName='Serif', fontSize=12, leading=18, textColor=TEXT_MUT, spaceAfter=24)
sH1 = ParagraphStyle('H1', fontName='Sans-Bold', fontSize=16, leading=22, textColor=ACCENT, spaceBefore=20, spaceAfter=8)
sH2 = ParagraphStyle('H2', fontName='Sans-Bold', fontSize=12, leading=17, textColor=TEXT_PRI, spaceBefore=14, spaceAfter=6)
sBody = ParagraphStyle('B', fontName='Serif', fontSize=10, leading=16, textColor=TEXT_PRI, alignment=TA_JUSTIFY, spaceAfter=6)
sBullet = ParagraphStyle('BL', fontName='Serif', fontSize=10, leading=16, textColor=TEXT_PRI, spaceAfter=3, leftIndent=20, bulletIndent=8)
sSmall = ParagraphStyle('SM', fontName='Serif', fontSize=9, leading=14, textColor=TEXT_MUT, spaceAfter=3)
sTH = ParagraphStyle('TH', fontName='Sans-Bold', fontSize=9, leading=13, textColor=BG_WHITE, alignment=TA_CENTER)
sTC = ParagraphStyle('TC', fontName='Serif', fontSize=9, leading=13, textColor=TEXT_PRI)
sTCC = ParagraphStyle('TCC', fontName='Serif', fontSize=9, leading=13, textColor=TEXT_PRI, alignment=TA_CENTER)
sStepNum = ParagraphStyle('SN', fontName='Sans-Bold', fontSize=22, leading=28, textColor=BG_WHITE, alignment=TA_CENTER)
sStepTitle = ParagraphStyle('STitle', fontName='Sans-Bold', fontSize=13, leading=18, textColor=TEXT_PRI, spaceAfter=4)
sStepDesc = ParagraphStyle('SDesc', fontName='Serif', fontSize=10, leading=16, textColor=TEXT_PRI, alignment=TA_JUSTIFY, spaceAfter=4)
sCallout = ParagraphStyle('CO', fontName='Serif', fontSize=9, leading=14, textColor=TEXT_MUT, leftIndent=12, rightIndent=12, backColor=BG_LIGHT, borderPadding=(6,6,6,6), spaceAfter=8)
sFooter = ParagraphStyle('FT', fontName='Serif', fontSize=8, leading=12, textColor=TEXT_MUT, alignment=TA_CENTER)

# ── Helpers ──────────────────────────────────────────────────────────
def h1(text): return Paragraph(text, sH1)
def h2(text): return Paragraph(text, sH2)
def body(text): return Paragraph(text, sBody)
def bullet(text): return Paragraph(f'• {text}', sBullet)
def callout(text): return Paragraph(text, sCallout)
def sp(h=6): return Spacer(1, h)

def make_table(headers, rows, col_ratios=None, header_bg=ACCENT):
    hr = [Paragraph(f'<b>{h}</b>', sTH) for h in headers]
    data = [hr]
    for row in rows:
        data.append([Paragraph(str(c), sTC) for c in row])
    cw = [r * AW for r in col_ratios] if col_ratios else [AW / len(headers)] * len(headers)
    t = Table(data, colWidths=cw, hAlign='LEFT')
    cmds = [
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('TEXTCOLOR', (0,0), (-1,0), BG_WHITE),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#d1d5db')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]
    for i in range(1, len(data)):
        bg = BG_WHITE if i % 2 == 1 else BG_LIGHT
        cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
    t.setStyle(TableStyle(cmds))
    return t

def step_block(num, title, description, details=None):
    """Create a visually distinct step block with number badge"""
    elements = []
    # Step header row: number badge + title
    step_data = [[
        Paragraph(f'<b>{num}</b>', sStepNum),
        Paragraph(f'<b>{title}</b>', sStepTitle),
    ]]
    step_table = Table(step_data, colWidths=[40, AW - 50], hAlign='LEFT')
    step_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), ACCENT),
        ('TEXTCOLOR', (0,0), (0,0), BG_WHITE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (0,0), 10),
        ('RIGHTPADDING', (0,0), (0,0), 10),
        ('LEFTPADDING', (1,0), (1,0), 10),
    ]))
    elements.append(step_table)
    elements.append(sp(4))
    elements.append(Paragraph(description, sStepDesc))
    if details:
        for d in details:
            elements.append(bullet(d))
    elements.append(sp(8))
    return elements

# ── Page Decorators ──────────────────────────────────────────────────
def footer_and_header(canvas, doc):
    canvas.saveState()
    # Footer
    canvas.setFont('Serif', 8)
    canvas.setFillColor(TEXT_MUT)
    canvas.drawCentredString(PAGE_W / 2, 0.5 * inch, f'Notifire.in Documentation — Page {doc.page}')
    # Top accent line
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2)
    canvas.line(LM, PAGE_H - 0.6 * inch, PAGE_W - RM, PAGE_H - 0.6 * inch)
    canvas.restoreState()

# ── Build Document ───────────────────────────────────────────────────
out = '/home/z/my-project/Notifire_Documentation.pdf'
doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=0.8*inch, bottomMargin=0.8*inch)

story = []

# ═══════════════════════ COVER ═══════════════════════════════════════
story.append(sp(40))
story.append(Paragraph('Notifire.in', sTitle))
story.append(Paragraph('Real-time Tech Intelligence Platform', sSubtitle))
story.append(sp(8))

# Thin accent line
line_data = [['']]
line_t = Table(line_data, colWidths=[AW], rowHeights=[3])
line_t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), ACCENT), ('LINEBELOW', (0,0), (-1,-1), 0, BG_WHITE)]))
story.append(line_t)
story.append(sp(16))

story.append(Paragraph('<b>Technical Documentation</b>', ParagraphStyle('DT', fontName='Sans-Bold', fontSize=14, leading=20, textColor=TEXT_PRI, spaceAfter=8)))
story.append(Paragraph('Workflow Overview & Technology Stack', ParagraphStyle('DT2', fontName='Serif', fontSize=11, leading=16, textColor=TEXT_MUT, spaceAfter=24)))

story.append(body(
    'Notifire.in is an <b>"Inshorts for Tech"</b> platform that aggregates real-time technology news '
    'from 15+ RSS sources across 7 categories, uses AI to summarize and analyze articles, detects '
    'trending stories, and generates unique illustrations — all within a 24-hour rolling window.'
))

story.append(sp(10))
story.append(callout(
    '<b>Core Principle:</b> The platform never copies or embeds source images directly. '
    'Instead, it generates unique AI-created illustrations inspired by article content, '
    'avoiding copyright issues while providing visually rich presentation.'
))

story.append(sp(16))
# Quick stats
stats_data = [
    [Paragraph('<b>15+</b>', sTCC), Paragraph('<b>7</b>', sTCC), Paragraph('<b>8</b>', sTCC), Paragraph('<b>24h</b>', sTCC)],
    [Paragraph('RSS Sources', sTC), Paragraph('Categories', sTC), Paragraph('Pipeline Steps', sTC), Paragraph('Rolling Window', sTC)],
]
stats_t = Table(stats_data, colWidths=[AW/4]*4, hAlign='CENTER')
stats_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0e6ff')),
    ('BACKGROUND', (0,1), (-1,1), BG_LIGHT),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
    ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e5e7eb')),
]))
story.append(stats_t)

# ═══════════════════════ WORKFLOW ═════════════════════════════════════
story.append(PageBreak())
story.append(h1('1. How It Works — The Complete Workflow'))
story.append(body(
    'The system follows an <b>8-step pipeline</b> split into two phases. '
    '<b>Steps 1–5</b> run automatically every 5 minutes to fetch, process, and store articles. '
    '<b>Steps 6–8</b> are triggered on-demand when a user clicks an article, providing deep AI enrichment only when needed.'
))

story.append(sp(6))
# Phase badges
phase_data = [
    [Paragraph('<b>AUTOMATIC</b> (Every 5 min)', ParagraphStyle('PB1', fontName='Sans-Bold', fontSize=9, textColor=BG_WHITE, alignment=TA_CENTER)),
     Paragraph('<b>ON-DEMAND</b> (User Click)', ParagraphStyle('PB2', fontName='Sans-Bold', fontSize=9, textColor=BG_WHITE, alignment=TA_CENTER))],
    [Paragraph('Steps 1–5: Fetch → Process → Store', sSmall),
     Paragraph('Steps 6–8: Scrape → Summarize → Generate', sSmall)],
]
phase_t = Table(phase_data, colWidths=[AW/2]*2, hAlign='LEFT')
phase_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,0), ACCENT),
    ('BACKGROUND', (1,0), (1,0), TECH_BG),
    ('BACKGROUND', (0,1), (-1,1), BG_LIGHT),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
]))
story.append(phase_t)
story.append(sp(12))

# ── STEP 1 ───────────────────────────────────────────────────────────
story.extend(step_block(1, 'RSS Feed Aggregation',
    'The pipeline starts by fetching articles from 15+ RSS and Atom feed sources organized across 7 categories. '
    'Each source has a pre-configured authority score (0–1) reflecting its credibility.',
    [
        'All feeds are fetched in parallel using Promise.allSettled for speed.',
        'Each feed is parsed to extract title, URL, description, publication date, author, and images.',
        'A 24-hour cutoff filter discards articles older than 24 hours immediately.',
        'There is no per-feed limit — every qualifying article within the window is included.',
        'Failed feeds are logged but do not block the pipeline.',
    ]
))

# ── STEP 2 ───────────────────────────────────────────────────────────
story.extend(step_block(2, 'Category Detection & Tagging',
    'Each article is assigned to one of 7 categories (AI, Cybersecurity, Cloud, Databases, Infrastructure, DevOps, Startup) '
    'using a keyword-based detection algorithm, then tagged with the top 5 most relevant keywords.',
    [
        'Each category has 15–25 weighted keywords (e.g., AI: "llm", "gpt", "openai", "chatgpt", "deepseek").',
        'The system counts keyword matches in the article title + description.',
        'The category with the highest match count wins; fallback is "AI".',
        'Top 5 matching keywords become article tags displayed as hashtags.',
    ]
))

# ── STEP 3 ───────────────────────────────────────────────────────────
story.extend(step_block(3, 'Deduplication',
    'The same story is often covered by multiple sources. A two-layer deduplication strategy '
    'combines exact URL matching with Jaccard similarity on titles.',
    [
        'Exact URL match → immediate duplicate detection.',
        'Title tokenization → Jaccard similarity = |intersection| / |union|.',
        'If similarity > 0.7 (70% overlap), the article is considered a duplicate.',
        'Non-duplicates get a deterministic ID from SHA-256 hash of their URL.',
    ]
))

# ── STEP 4 ───────────────────────────────────────────────────────────
story.extend(step_block(4, 'Trending Score Calculation',
    'Each surviving article receives a trending score (0–100) from four independent components. '
    'Scores above 50 are marked "Rising" and above 65 as "Hot".',
    [
        'Recency (0–30): Newer articles score higher. max(0, 30 − hoursAgo × 0.5).',
        'Source Authority (0–20): Pre-configured authority × 20. MIT Tech Review = 18.4 pts.',
        'Cross-Source Frequency (0–30): min(30, matchingArticles × 10). Multiple sources covering same topic = boost.',
        'Velocity Keywords (0–20): min(20, matches × 10). Keywords like "breaking", "launch", "breach", "zero-day".',
    ]
))

# ── STEP 5 ───────────────────────────────────────────────────────────
story.extend(step_block(5, '24-Hour Filter & Database Persistence',
    'A hard 24-hour rolling window is applied, and all qualifying articles are upserted to the PostgreSQL database.',
    [
        'Articles published more than 24 hours ago are removed (both server and client-side).',
        'Each article is upserted using its unique URL as the key — updates title, description, score, tags.',
        'New records include all metadata; AI fields (summary, content, image) remain empty for on-demand filling.',
        'The frontend auto-refreshes every 5 minutes with incremental updates via a "since" timestamp.',
    ]
))

# ── STEP 6 ───────────────────────────────────────────────────────────
story.extend(step_block(6, 'Article Scraping (On-Demand)',
    'When a user clicks an article, the system checks if full content is already in the database. '
    'If not, it scrapes the article from its original URL using the z-ai page reader.',
    [
        'The z-ai-web-dev-sdk page_reader function retrieves full HTML content from the URL.',
        'Raw HTML is processed: scripts/styles/tags removed, entities decoded → clean plain text.',
        'Extracted text is capped at 8,000 characters for AI token limits.',
        'Word count and reading time (~200 wpm) are calculated and saved.',
    ]
))

# ── STEP 7 ───────────────────────────────────────────────────────────
story.extend(step_block(7, 'AI Summarization & Analysis (On-Demand)',
    'Once full content is available, the AI generates a comprehensive analysis including summary, key points, '
    'sentiment, and actionable drafts for LinkedIn and email.',
    [
        'Full summary: 3–4 sentences covering what happened, why it matters, and impact.',
        '5 key points: Bullet points under 15 words each.',
        'Sentiment: positive / neutral / negative.',
        '4 related topics for discovery and navigation.',
        'LinkedIn post draft with 3–5 hashtags (under 200 words).',
        'Email newsletter draft with subject line and 3–4 sentence body.',
        'All output is cached in the database — repeat visits return instantly.',
    ]
))

# ── STEP 8 ───────────────────────────────────────────────────────────
story.extend(step_block(8, 'AI Image Generation (On-Demand / Auto)',
    'The platform never copies source images. Instead, unique AI illustrations are generated inspired by article content. '
    'For the top 3 trending articles, images are generated automatically; for others, on user request.',
    [
        'Image prompt = article subject + category-specific visual style + editorial illustration style.',
        'Each category has a distinct style (AI: futuristic neural networks/purple-cyan; Cybersecurity: shields/firewalls/red-dark).',
        'Generated at 1344×768 pixels via z-ai-web-dev-sdk image generation.',
        'Saved to /public/generated/ with MD5 hash filenames — never regenerated from disk cache.',
    ]
))

# ═══════════════════════ TECH STACK ═══════════════════════════════════
story.append(PageBreak())
story.append(h1('2. Technology Stack'))

story.append(h2('Frontend'))
story.append(make_table(
    ['Technology', 'Version', 'Purpose'],
    [
        ['Next.js', '16.x', 'App Router, Server Components, API Routes, ISR'],
        ['React', '19.x', 'UI library with concurrent rendering'],
        ['TypeScript', '5.x', 'Strict type safety across entire codebase'],
        ['Tailwind CSS', '4.x', 'Utility-first CSS with theme variables'],
        ['shadcn/ui', 'Latest', 'Radix-based component library (50+ components)'],
        ['Framer Motion', '12.x', 'Animations, transitions, AnimatePresence'],
        ['Lucide React', 'Latest', 'Icon library (30+ icons)'],
        ['next-themes', 'Latest', 'Dark/light mode switching'],
    ],
    [0.22, 0.12, 0.66],
    header_bg=colors.HexColor('#1e40af'),
))
story.append(sp(8))

story.append(h2('Backend'))
story.append(make_table(
    ['Technology', 'Version', 'Purpose'],
    [
        ['Next.js API Routes', '16.x', '7 REST endpoints (GET/POST/PUT/DELETE)'],
        ['Prisma ORM', '6.x', 'Type-safe DB queries with driver adapters'],
        ['PGlite (PostgreSQL WASM)', '0.4.x', 'In-process PostgreSQL with filesystem persistence'],
        ['pglite-prisma-adapter', '0.7.x', 'Bridges PGlite ↔ Prisma Client'],
        ['z-ai-web-dev-sdk', '0.0.17', 'AI: LLM chat, page reader, image generation'],
        ['rss-parser', '3.x', 'RSS/Atom feed fetching and parsing'],
        ['sharp', '0.34.x', 'Server-side image processing'],
    ],
    [0.25, 0.12, 0.63],
    header_bg=colors.HexColor('#047857'),
))
story.append(sp(8))

story.append(h2('AI Capabilities'))
story.append(make_table(
    ['Capability', 'SDK Function', 'Usage'],
    [
        ['LLM Chat Completions', 'chat.completions.create()', 'Summarization, key points, sentiment, drafts'],
        ['Page Reader', 'functions.invoke("page_reader")', 'Full article content extraction from URLs'],
        ['Image Generation', 'images.generations.create()', 'AI-generated article illustrations (1344×768)'],
    ],
    [0.25, 0.35, 0.40],
    header_bg=colors.HexColor('#7c3aed'),
))

# ═══════════════════════ DATA MODEL ══════════════════════════════════
story.append(sp(16))
story.append(h1('3. Database & Data Model'))

story.append(body(
    'Notifire.in uses <b>PGlite</b> — PostgreSQL compiled to WebAssembly — running in-process within the Node.js application. '
    'This eliminates the need for a separate database server while providing full PostgreSQL compatibility.'
))
story.append(sp(4))

story.append(make_table(
    ['Advantage', 'Description'],
    [
        ['No separate server', 'PGlite runs in-process as part of the Next.js app'],
        ['Full PostgreSQL', 'Indexes, constraints, GROUP BY, aggregations all work'],
        ['Filesystem persistence', 'Data stored at .pgdata/ survives restarts'],
        ['Graceful fallback', 'Falls back to in-memory mode if filesystem fails'],
    ],
    [0.25, 0.75],
    header_bg=colors.HexColor('#336791'),
))
story.append(sp(8))

story.append(h2('Article Model — Key Fields'))
story.append(make_table(
    ['Field', 'Type', 'Populated By', 'Description'],
    [
        ['title, url, description, source', 'String', 'Step 1 (RSS)', 'Basic article metadata'],
        ['category, tags', 'String', 'Step 2 (Tagger)', 'Category label + keyword tags'],
        ['content', 'Text', 'Step 6 (Scraping)', 'Full article text (8k char cap)'],
        ['summary, keyPoints, sentiment', 'String/JSON', 'Step 7 (AI)', 'AI-generated analysis'],
        ['aiImageUrl', 'String', 'Step 8 (Image Gen)', 'Path to AI-generated illustration'],
    ],
    [0.25, 0.12, 0.23, 0.40],
    header_bg=colors.HexColor('#336791'),
))

# ═══════════════════════ API ENDPOINTS ═══════════════════════════════
story.append(sp(16))
story.append(h1('4. API Endpoints'))

story.append(make_table(
    ['Method', 'Endpoint', 'Purpose'],
    [
        ['GET', '/api/news', 'Fetch all 24h articles with category filter & incremental updates'],
        ['GET', '/api/trending', 'Trending articles + source/category distribution signals'],
        ['POST', '/api/detail', 'On-demand: scrape → AI summarize → return full detail'],
        ['POST', '/api/scrape', 'Scrape single URL using AI page reader'],
        ['PUT', '/api/scrape', 'Batch scrape up to 10 URLs with rate limiting'],
        ['POST', '/api/summarize', 'AI summarize article (optional scrape-first mode)'],
        ['POST/PUT', '/api/generate-image', 'Generate AI illustration for articles'],
        ['GET/POST/DELETE', '/api/saved', 'Bookmark management for articles'],
    ],
    [0.12, 0.28, 0.60],
    header_bg=colors.HexColor('#b45309'),
))

# ═══════════════════════ CACHING ═════════════════════════════════════
story.append(sp(16))
story.append(h1('5. Caching & Performance'))

story.append(make_table(
    ['Layer', 'TTL', 'Stores', 'Invalidation'],
    [
        ['In-Memory Cache', '5min / 1hr', 'API response data with expiry timestamps', 'Time-based + ?refresh=true'],
        ['ISR (Next.js)', '300s', 'Server-rendered page cache', 'Auto background revalidation'],
        ['Database Cache', 'Permanent', 'AI summaries, scraped content, image paths', 'Upsert on re-scrape'],
        ['Image Disk Cache', 'Permanent', 'AI-generated PNG files in /public/generated/', 'Never (MD5 filenames)'],
        ['Client Incremental', '5min cycle', 'New articles merged via ?since= parameter', 'Full refresh on tab change'],
    ],
    [0.18, 0.12, 0.40, 0.30],
    header_bg=colors.HexColor('#7c3aed'),
))

# ═══════════════════════ RSS SOURCES ═════════════════════════════════
story.append(sp(16))
story.append(h1('6. News Sources by Category'))

story.append(make_table(
    ['Category', 'Sources', 'Authority Range'],
    [
        ['AI 🤖', 'TechCrunch AI, VentureBeat AI, Ars Technica, MIT Tech Review', '0.85–0.92'],
        ['Cybersecurity 🔐', 'The Hacker News, Krebs on Security, Dark Reading, Schneier', '0.85–0.92'],
        ['Cloud ☁️', 'AWS Blog, The New Stack', '0.80–0.90'],
        ['Databases 🗄️', 'PostgreSQL.org, The New Stack, Redis Blog', '0.75–0.85'],
        ['Infrastructure ⚙️', 'Kubernetes Blog, DevOps.com, The New Stack, InfoQ', '0.78–0.90'],
        ['DevOps 🚀', 'DevOps.com, InfoQ, HashiCorp Blog', '0.80–0.88'],
        ['Startup 💡', 'TechCrunch Startups, Hacker News (YC)', '0.85–0.88'],
    ],
    [0.22, 0.55, 0.23],
    header_bg=colors.HexColor('#b45309'),
))

# ═══════════════════════ FRONTEND ════════════════════════════════════
story.append(sp(16))
story.append(h1('7. Frontend Experience'))

story.append(make_table(
    ['Tab', 'Data Source', 'Shows'],
    [
        ['24h Feed', '/api/news', 'All articles from last 24 hours, auto-refresh every 5 min'],
        ['AI Live', '/api/news?withImages=true', 'Same feed with AI enrichment indicators'],
        ['Trending', '/api/trending', 'Articles by trend score + velocity signals'],
        ['Saved', '/api/saved', 'Bookmarked articles, no 24h filter'],
        ['Docs', '—', 'Interactive documentation + PDF download'],
    ],
    [0.15, 0.30, 0.55],
    header_bg=colors.HexColor('#1e40af'),
))
story.append(sp(8))

story.append(body(
    '<b>User Flow:</b> Browse feed → filter by category/search → click article → '
    'on-demand enrichment triggers (scrape + AI summarize + image gen) → view full analysis → '
    'save bookmark or copy LinkedIn/email drafts → auto-refresh brings new articles every 5 minutes.'
))

# ═══════════════════════ PIPELINE SUMMARY ════════════════════════════
story.append(sp(16))
story.append(h1('8. Pipeline Summary'))

story.append(make_table(
    ['Step', 'Name', 'Trigger', 'Output'],
    [
        ['1', 'RSS Feed Aggregation', 'Every 5 min', 'Raw articles from 15+ sources (24h window)'],
        ['2', 'Category Detection', 'Every 5 min', 'Category label + 5 keyword tags per article'],
        ['3', 'Deduplication', 'Every 5 min', 'Unique articles (Jaccard 0.7 threshold)'],
        ['4', 'Trending Scoring', 'Every 5 min', 'Trend score (0–100) per article'],
        ['5', '24h Filter + DB Persist', 'Every 5 min', 'Database records with all metadata'],
        ['6', 'Article Scraping', 'On user click', 'Full article text + reading time'],
        ['7', 'AI Summarization', 'On user click', 'Summary, key points, sentiment, drafts'],
        ['8', 'AI Image Generation', 'On click / auto (top 3)', '1344×768 AI illustration saved to disk'],
    ],
    [0.07, 0.25, 0.23, 0.45],
    header_bg=ACCENT,
))

story.append(sp(20))
line_data2 = [['']]
line_t2 = Table(line_data2, colWidths=[AW], rowHeights=[2])
line_t2.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), ACCENT)]))
story.append(line_t2)
story.append(sp(8))
story.append(Paragraph('End of Documentation — Notifire.in v1.0', ParagraphStyle('End', fontName='Serif', fontSize=9, leading=14, textColor=TEXT_MUT, alignment=TA_CENTER)))

# ── Generate ─────────────────────────────────────────────────────────
doc.build(story, onFirstPage=footer_and_header, onLaterPages=footer_and_header)
print(f'✅ PDF generated: {out}')

import os
size = os.path.getsize(out)
print(f'   Size: {size/1024:.1f} KB')
