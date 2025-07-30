This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **E-commerce Store**: Complete jewelry store with product management
- **AI-Generated Descriptions**: Automatic product descriptions using Google Gemini Vision
- **Admin Dashboard**: Full admin interface for managing products and orders
- **Authentication**: Secure admin authentication with NextAuth.js
- **Image Processing**: Automatic image resizing and optimization
- **Database**: SQLite database with Prisma ORM

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Google Gemini API key (for AI-generated product descriptions)

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google Gemini AI (for AI-generated product descriptions)
GOOGLE_GEMINI_API_KEY="your-google-gemini-api-key-here"
```

3. Set up the database:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Create an admin user:

```bash
node scripts/create-admin.js
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Google Gemini API Setup

To enable AI-generated product descriptions:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file as `GOOGLE_GEMINI_API_KEY`
4. The system will automatically use Gemini Vision to generate product descriptions from uploaded images

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
