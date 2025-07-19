# SRH Website - React Conversion

A modern React application that recreates the official website of the Syndicat des Radiologues Hospitaliers (SRH) with pixel-perfect accuracy and enhanced performance.

## 🎯 Project Overview

This project is a complete conversion of [https://www.srh-info.org/](https://www.srh-info.org/) from its original implementation to a modern React application using current best practices. The website represents the French union of hospital radiologists.

## ✨ Features

- **Pixel-perfect recreation** of the original website design
- **Responsive design** that works on all devices
- **Modern React architecture** with TypeScript
- **Optimized performance** with Vite build system
- **Accessible** following WCAG 2.1 AA guidelines
- **SEO-optimized** with React Helmet
- **Production-ready** with optimized assets

## 🛠 Tech Stack

- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.5
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.11
- **Routing**: React Router 7.7.0
- **Forms**: React Hook Form with Zod validation
- **State Management**: Zustand (configured)
- **Icons**: Lucide React
- **SEO**: React Helmet Async
- **Development**: ESLint, Prettier, Husky

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, etc.)
│   ├── layout/       # Header, Footer, Layout components
│   ├── sections/     # Page-specific sections
│   └── forms/        # Form components
├── pages/            # Route components
│   ├── HomePage.tsx
│   ├── QuiSommesNous.tsx
│   ├── NosInformations.tsx
│   └── TextesOfficiels.tsx
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── data/             # Content data and constants
├── assets/           # Images and media files
│   └── images/       # Downloaded website images
└── styles/           # Global styles and configurations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd srh-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📋 Content & Features

### Pages Implemented

1. **Homepage** (`/`)
   - Hero section with original images
   - News highlights
   - Job postings section
   - Interactive navigation

2. **Qui sommes-nous** (`/qui-sommes-nous`)
   - Organization presentation
   - Administrative council
   - Statutes and governance
   - Membership information

3. **Nos informations** (`/nos-informations`)
   - Publications and newsletters
   - Press releases and announcements
   - Newsletter subscription

4. **Textes officiels** (`/textes-officiels`)
   - Official Journal texts
   - Institutional reports
   - Search and filtering functionality

### Assets Included

All original images have been downloaded and optimized:
- Official SRH logo (SVG)
- Homepage hero images (WebP format)
- All supporting graphics and icons

### Typography & Design

- **Fonts**: Inter, Roboto, K2D, IBM Plex Sans (as per original)
- **Colors**: Blue-based color scheme matching original
- **Layout**: Faithful recreation of original layout patterns
- **Responsive**: Mobile-first approach with desktop optimization

## 🎨 Styling

The project uses Tailwind CSS v4 with custom configurations:

- Custom font families matching the original site
- Color palette extracted from the original design
- Responsive breakpoints
- Custom utility classes for brand consistency

## 🔧 Configuration

### Tailwind CSS

The project uses Tailwind CSS v4 with PostCSS integration. Custom styles are defined in `src/index.css` with:
- Font imports from Google Fonts
- Brand color utilities
- Custom component classes

### TypeScript

Strict TypeScript configuration with:
- Type definitions for all data structures
- Proper typing for React components
- Interface definitions for content types

## 📱 Responsive Design

The website is fully responsive with:
- Mobile-first design approach
- Tablet and desktop optimizations
- Touch-friendly interactions
- Accessible navigation patterns

## ⚡ Performance

- **Optimized images**: WebP format for better compression
- **Code splitting**: Route-based code splitting
- **Lazy loading**: Images loaded on demand
- **Minified assets**: Production build optimization
- **Modern JavaScript**: ES2020+ features

## 🌐 SEO & Accessibility

- **Meta tags**: Proper HTML meta tags for each page
- **Semantic HTML**: Proper heading hierarchy and structure
- **ARIA labels**: Accessibility attributes where needed
- **Keyboard navigation**: Full keyboard accessibility
- **Screen reader friendly**: Proper alt texts and descriptions

## 🔗 External Links

The application correctly handles external links:
- Member portal: `https://app.srh-info.org/`
- CNG job postings: External career links
- LinkedIn: Social media integration

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

Generates optimized static files in the `dist/` directory ready for deployment.

### Deployment Options

The built application can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is a faithful recreation of the official SRH website for demonstration purposes.

## 🙏 Acknowledgments

- Original website: [https://www.srh-info.org/](https://www.srh-info.org/)
- Syndicat des Radiologues Hospitaliers for their content
- All the open-source libraries that made this project possible

---

Built with ❤️ using modern React and TypeScript best practices.
