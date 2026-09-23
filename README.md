# PDF Tools

PDF Tools is an open-source, high-performance, client-side web platform for managing, modifying, and converting PDF documents directly within the user's browser. Built with privacy-first engineering, all file operations execute strictly in local browser memory without uploading any documents to remote servers.

Developed and maintained by Primadev Digital Technology.

---

## Overview

Traditional online PDF services often require users to upload sensitive personal, legal, or commercial files to third-party cloud infrastructure. PDF Tools eliminates this security risk by running document compilation, compression algorithms, and image rasterization locally on the client device using modern WebAssembly, HTML5 Canvas, and specialized JavaScript processing engines.

Official Production Deployment: https://pdftools.primadev.id

---

## Core Capabilities

### 1. PDF Document Merger
- Combines multiple PDF files into a single consolidated document.
- Interactive drag-and-drop visual interface for arranging document sequences.
- Per-document page range extraction and selective page inclusion.
- Individual and bulk 90-degree page rotation adjustments.

### 2. Lossless PDF Compressor
- Reduces overall document file size by compacting internal stream dictionaries, removing duplicate resources, and stripping redundant metadata.
- Preserves native vector typography and high-resolution raster images without pixelation or blurring.
- Real-time client-side size calculation and bandwidth comparison metrics.

### 3. PDF to High-Resolution Image Converter
- Renders individual PDF pages into high-fidelity image formats: PNG, JPG, and WebP.
- Dual resolution modes: Standard (150 DPI) for compact sharing and High Definition (300 DPI) for print and archival clarity.
- Download individual pages as standalone graphic files or batch-download all pages packaged in a single ZIP archive.

---

## Privacy and Security Architecture

- Zero Cloud Uploads: Document bytes are read exclusively via the browser's FileReader API and held in sandboxed memory.
- In-Memory Processing: Once browser tabs are closed or tasks completed, document buffers are discarded from browser RAM.
- No Tracking Telemetry: File names, internal page content, and document metadata are never transmitted to external analytics providers.
- No Account Requirements: All tools and capabilities remain fully functional without user registration or authentication hurdles.

---

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Runtime & Language | Node.js, React 19, TypeScript 5 |
| PDF Processing Engines | PDF-Lib, Mozilla PDF.js (Client-Side Worker) |
| Archival Compression | JSZip |
| Typography & Theming | Next/Font (Self-hosted Google Fonts: Plus Jakarta Sans & JetBrains Mono) |
| Styling Architecture | Vanilla CSS Modules, CSS Custom Properties Tokens |
| Structured Data | Schema.org (WebSite, WebApplication, Organization) |

---

## Performance and SEO Engineering

- Self-Hosted Fonts: Integrated through `next/font/google` to eliminate render-blocking external font stylesheet requests and prevent chained network latency.
- Google Site Names: Fully annotated with `schema.org/WebSite` structured data and OpenGraph tags to ensure canonical representation as "PDF Tools" or "PDF Tools by Primadev" on search engine results pages.
- Agentic Context Protocols: Complete `llms.txt` and `llms-full.txt` discovery files compliant with the llmstxt.org specification for LLM crawler understanding.
- Robots Protocol Compliance: RFC 9309 compliant `robots.txt` configuration for search indexing.

---

## Project Directory Structure

```
pdf-tools/
├── public/
│   ├── icon.png                 # Primary application icon
│   ├── llm.txt                  # LLM context specification
│   ├── llms.txt                 # Agentic browser documentation
│   ├── robots.txt               # RFC 9309 crawler directives
│   └── site.webmanifest         # PWA and browser manifest
├── src/
│   ├── app/
│   │   ├── compress/            # PDF compression route
│   │   ├── legal/               # Privacy, Terms, and Compliance documentation
│   │   ├── merge/               # PDF merger workspace route
│   │   ├── pdf-to-image/        # PDF to image conversion route
│   │   ├── tools/               # Dedicated tools catalog route
│   │   ├── globals.css          # Core CSS variables, resets, and utility classes
│   │   ├── layout.tsx           # Root layout, anti-flicker script, metadata
│   │   ├── page.tsx             # Root landing page hub
│   │   ├── sitemap.ts           # Dynamic XML sitemap generator
│   │   ├── template.tsx         # Route transition wrapper
│   │   └── template.module.css  # Transition keyframe styling
│   ├── components/
│   │   ├── landing/             # Hero, showcase, and landing view components
│   │   ├── merger/              # Drag-and-drop file cards, modal, workspace
│   │   ├── tools/               # Compressor, image converter, and catalog components
│   │   ├── Footer.tsx           # Global responsive footer
│   │   └── Navbar.tsx           # Dynamic header with responsive navigation
│   ├── context/
│   │   └── LanguageContext.tsx  # Bilingual state manager (ID / EN)
│   └── lib/
│       ├── pdfMerger.ts         # Client-side PDF-lib merge engine
│       └── translations.ts      # Structured Indonesian and English strings
├── next.config.ts               # Next.js build optimizations
├── package.json                 # Project dependencies and script declarations
├── vercel.json                  # Vercel deployment and security header configurations
├── LICENSE                      # MIT License (Primadev Digital Technology)
└── README.md                    # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure the following tools are installed on your environment:
- Node.js (version 18.17.0 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/primadev/pdf-tools.git
   cd pdf-tools
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Running in Development

Start the local development server with Turbopack:
```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

### Building for Production

Compile optimized production assets:
```bash
npm run build
```

Run the production server:
```bash
npm run start
```

---

## Licensing and Attribution

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.

Copyright (c) 2026 Primadev Digital Technology. All rights reserved.
