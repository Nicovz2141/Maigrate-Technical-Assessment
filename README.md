This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API token Setup -- *important*
You will need to configure a .env.local file in the hg-summarizer folder. Please name it .env.local and enter this:
OPENAI_API_KEY=[insert your Open API Key here without quotes]


## What I built

This is a functional mobile first app which pulls from a news board and allows users to search by keywords, search by tags or create a tag. It also summarizes the articles and gives high level bulleted details

## What Works

Searching for an article by tag, AI assisted tagging, tag creation and AI summarization

## What is incomplete

I do not believe anything in this is incomplete but if I were to improve I would add features to be more veiwable on desktop

## What tradeoffs did you make

I preloaded the AI tagging (which could cost more in AI toke requests) versus loading the tags once an article is clicked. This was done so that the tags would be preloaded for the user to utilzie without clicking through every article

## How did you use AI?

I used Gemini and fed it the insturctions and prompted Gemini to say I am using NextJs as the framework. So Gemini developed the code and I copied it into my NextJS app. Along the way i saw that the app was native to desktop in the way Gemini coded it so I prompted Gemini to make it mobile first. Along the way I also prompted AI to add a way for me to add my own custom tags and tested the code. I found a bug where the AI tag would count "AI" in articles not pertaining to AI so I also prompted Gemini to fix this and re-tested.

## What would you do with more time?

With more time I would implement a sign in feature to allow tags to save and connect a supabase backend to store all the profile information (perhaps saved articles, tags created, name, etc).
