# Birdfeeder Analyst Suite

A professional financial and operational intelligence dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Live Financial KPIs**: Real-time tracking of Revenue, Net Income, Net Margin, and COGS.
- **Operational Intelligence**: Inventory predictions and stock-out alerts based on external webhooks.
- **Interactive Visualizations**: High-performance charts using Recharts for trend and day-of-week analysis.
- **Premium Aesthetics**: High-contrast dark theme with smooth transitions and responsive design.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   WEBHOOK_URL=your_webhook_url
   WEBHOOK_KEY=your_header_key
   WEBHOOK_VALUE=your_header_value
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment on Vercel

1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the Environment Variables found in `.env.local` to the Vercel project settings.
4. Deploy!
