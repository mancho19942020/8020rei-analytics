# 8020REI Analytics Dashboard

A modern, production-ready analytics dashboard built with Next.js 16, TypeScript, and the Axis Design System. Features real-time BigQuery integration, Firebase Authentication, and comprehensive dark mode support.

**Version:** 1.0.0 | **Stack:** Next.js 16.1.6 + TypeScript 5 | **License:** MIT

---

## ✨ Features

- **📊 Real-time Analytics** - Live data from Google Analytics 4 via BigQuery
- **🔐 Secure Authentication** - Firebase Auth with @8020rei.com email restriction
- **🎨 Axis Design System** - 30+ production-ready React components
- **🌙 Dark Mode** - Seamless theme switching with localStorage persistence
- **♿ Accessible** - WCAG AA compliant with keyboard navigation support
- **📱 Responsive** - Mobile-first design that works on all devices
- **⚡ Fast** - Optimized with caching and efficient data fetching
- **🎯 Type-Safe** - Full TypeScript support throughout

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud account with BigQuery access
- Firebase project with Authentication enabled
- `@8020rei.com` email address for login

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/8020rei-analytics.git
cd 8020rei-analytics

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Authenticate with Google Cloud (for local development)
gcloud auth application-default login

# Start the development server
npm run dev
```

Visit **http://localhost:4000** to see the dashboard.

---

## 📁 Project Structure

```
8020rei-analytics/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (metrics, auth)
│   │   ├── login/              # Login page
│   │   └── page.tsx            # Dashboard page
│   │
│   ├── components/
│   │   ├── axis/               # Axis Design System components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   └── ThemeToggle.tsx     # Dark mode toggle
│   │
│   ├── hooks/                  # React hooks (useTheme, useMetrics)
│   ├── lib/                    # Core functionality (Firebase, BigQuery)
│   └── types/                  # TypeScript definitions
│
├── docs/                       # Documentation
├── FIREBASE_SETUP_GUIDE.md     # Firebase setup instructions
├── IMPLEMENTATION_PLAN.md      # Development roadmap
└── .env.local                  # Environment variables (not in git)
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Google Cloud / BigQuery
GOOGLE_CLOUD_PROJECT=your-project-id
BIGQUERY_DATASET=your-dataset-id

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

See [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) for detailed setup instructions.

---

## 🎨 Design System

This project uses the **Axis Design System** - a production-grade, accessible component library built with semantic design tokens.

### Key Principles

- **Semantic Tokens** - Use `main-700`, `success-500`, `error-700` (not color names like `blue-500`)
- **Dark Mode Support** - All components work seamlessly in both light and dark themes
- **WCAG AA Compliant** - 4.5:1 text contrast, keyboard navigation, screen reader support
- **Consistent Patterns** - Unified spacing, typography, and component behavior

### Design Tokens

| Token Category | Usage | Example |
|----------------|-------|---------|
| **main** | Primary brand color (blue) | `bg-main-700`, `text-main-700` |
| **accent-1 to accent-5** | Charts, data visualization | `bg-accent-1-500` |
| **neutral** | Text, backgrounds, borders | `text-neutral-700`, `border-neutral-200` |
| **success/alert/error/info** | Semantic status colors | `text-success-700`, `bg-error-50` |

### Component Library

30+ production-ready React components:

- **Core:** AxisButton, AxisCard, AxisInput, AxisSelect, AxisCallout
- **Forms:** AxisCheckbox, AxisRadio, AxisToggle, AxisSlider
- **Data:** AxisTable, AxisTag, AxisPill, AxisSkeleton
- **Navigation:** AxisBreadcrumb, AxisNavigationTab, AxisStepper

**📖 Complete Documentation:** [Design System Guide](./docs/DESIGN_SYSTEM.md)

For implementation details and full token reference, see:
- `docs/DESIGN_SYSTEM.md` - Complete design system documentation
- `Axis guide/Axis temp folder/` - Axis component library source

---

## 🛠️ Development

### Commands:

```bash
npm run dev          # Start development server (port 4000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ by the 8020REI team**
