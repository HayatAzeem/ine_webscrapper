# Product Price Tracker

A full-stack web application built for the INE Software Engineer Intern Assignment. It tracks prices and stock from the mock storefront and handles challenging asynchronous layouts.

## Features
- **Frontend:** React + TailwindCSS (Vite), featuring Recharts for price history visualization.
- **Backend:** Express API with Playwright for resilient headless scraping.
- **Database:** Supabase PostgreSQL (with local JSON fallback if keys are omitted).
- **Scheduling:** Secured `/api/scrape` endpoint designed to be triggered by cron-job.org.

## Setup Instructions

### 1. Database (Supabase)
1. Create a new Supabase project.
2. Run the SQL script located in `backend/schema.sql` in the Supabase SQL Editor to create the tables.
3. Get your Supabase URL and Service Role Key (or Anon Key).

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
# Install Playwright browsers
npx playwright install
\`\`\`
Create a `.env` file in the `backend` folder:
\`\`\`env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
\`\`\`
*(Note: If you do not provide Supabase keys, the backend will automatically fall back to a local JSON file `local-db.json` so you can test the app without DB configuration!)*

Start the backend:
\`\`\`bash
npm start
\`\`\`

### 3. Frontend Setup
In a new terminal:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Running the Scraper in Headed Mode
To fulfill the requirement of recording a headed run, a dedicated script is provided:
\`\`\`bash
cd backend
npm run scrape:headed
\`\`\`
This will launch Playwright visibly and slowly so you can record how it handles the difficult storefront mechanics.

## Scraping Schedule
Since free-tier backends sleep, the scraper does not run an internal `setInterval`. 
Instead, configure a cron job on [cron-job.org](https://cron-job.org) to make a `POST` request to `https://your-backend-url.onrender.com/api/scrape` every 2 hours.

## Design Note: Overcoming the Mock Store
The mock store (`demo.inelabteamdev.com`) uses anti-bot mechanisms:
1. **Cookie Banner:** Blocks clicks and hovers until dismissed.
2. **CAPTCHA-like Hover:** The "Reveal Price" button remains disabled until you perform a minimum number of mouse movements (`minMoves`) across the `.price-block` and dwell for a specific duration.
3. **Delayed Load:** The price is inserted dynamically after interaction.

**What the AI got wrong on the first attempt:**
Initially, I instructed Playwright to simply `await page.hover('.price-block')`. However, Playwright's `hover()` method just teleports the cursor to the center of the element. The mock store's frontend JavaScript explicitly tracks the length of the `mousemove` event array (`this.moves.length < this.req.minMoves`). Because a standard Playwright hover only triggered a single synthetic movement, the "Reveal Price" button never enabled! 

**How it was corrected:**
I extracted the storefront's bundled JavaScript and reverse-engineered the obfuscated hover logic. I updated the scraper to explicitly extract the bounding box of the price element and fire a `for` loop of incremental `page.mouse.move()` events across the box, followed by a `page.waitForTimeout()` to satisfy the dwell timer. Finally, this enabled the button, allowing Playwright to click it and wait for the DOM to populate the actual price.
