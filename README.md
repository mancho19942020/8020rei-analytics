# 8020REI Analytics Dashboard

A modern, production-ready analytics dashboard built with Next.js 16, TypeScript, and the Axis Design System. Features real-time BigQuery integration, Firebase Authentication, and comprehensive dark mode support.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

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

This project uses the **Axis Design System** - a comprehensive, accessible component library.

### Key Principles:

- **Semantic Tokens** - Use `main`, `success`, `error` instead of color names
- **Dark Mode First** - Every component supports both light and dark themes
- **Accessible** - WCAG AA compliant with 4.5:1 text contrast
- **Consistent** - Unified spacing, typography, and interaction patterns

### Component Library:

**Core:** AxisButton, AxisCard, AxisInput, AxisSelect, AxisCallout
**Forms:** AxisCheckbox, AxisRadio, AxisToggle, AxisSlider
**Data:** AxisTable, AxisTag, AxisPill, AxisSkeleton
**Navigation:** AxisBreadcrumb, AxisNavigationTab, AxisStepper

See [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) for complete documentation.

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
