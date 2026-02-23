# Project Overview

An AI-powered CRM for real estate agents that automatically captures and manages leads across email, SMS, and phone calls, handles follow-ups intelligently, and generates social media and marketing content automatically — with minimal manual input from the agent.

Agents interact with the system through a web dashboard. There is no messaging interface. All AI logic runs server-side and surfaces results in the dashboard for the agent to review and approve.

---

# Tech Stack

- **Backend:** Node.js with Express
- **Frontend:** Next.js (agent dashboard)
- **Database:** Supabase (PostgreSQL) with row-level security
- **Auth:** Supabase Auth
- **AI:** Claude API (claude-sonnet-4-6 for complex tasks, claude-haiku-4-5-20251001 for simple ones)
- **SMS/Calls:** Twilio
- **Call Transcription:** Deepgram
- **Email:** Gmail API via OAuth (read-only initially)
- **Social Scheduling:** Buffer API
- **Design Generation:** Canva API
- **Scheduling:** node-cron
- **Hosting:** Hetzner VPS
- **Containers:** Docker + Docker Compose

---

# Architecture

## How It Works
- One Node.js backend instance per customer, running in its own Docker container on Hetzner
- Each instance is isolated — no access to other customer containers
- All AI logic runs as TypeScript functions called directly from the backend
- Gmail push notifications and Twilio webhooks trigger processing automatically
- Dashboard is the primary agent interface — agents log in, review leads, approve follow-ups and social posts

## Data Flow
Inbound communication arrives (email, SMS, call) → webhook fires → input sanitized → Claude API extracts lead data → Supabase updated → dashboard reflects changes → agent reviews and approves actions

---

# Database Schema

## customers
- id (uuid, primary key)
- name (text)
- email (text)
- phone (text)
- twilio_number (text)
- gmail_token (text, encrypted)
- buffer_token (text, encrypted)
- mailchimp_token (text, encrypted)
- created_at (timestamp)

## leads
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- name (text)
- email (text)
- phone (text)
- budget_min (integer)
- budget_max (integer)
- location (text)
- property_type (text)
- timeline (text)
- pre_approved (boolean)
- priority_score (integer)
- preferred_contact (text)
- source_channel (text) — email, sms, call
- status (text) — new, active, nurture, closed
- created_at (timestamp)
- last_contacted_at (timestamp)

## communications
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- customer_id (uuid, foreign key)
- channel (text) — email, sms, call
- direction (text) — inbound, outbound
- raw_content (text)
- summary (text)
- created_at (timestamp)

## follow_ups
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- customer_id (uuid, foreign key)
- draft_content (text)
- channel (text) — email, sms
- status (text) — pending, approved, sent, rejected
- scheduled_for (timestamp)
- sent_at (timestamp)
- created_at (timestamp)

## social_posts
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- trigger_event (text) — new_listing, deal_closed, open_house, price_reduction
- caption (text)
- image_url (text)
- status (text) — pending, approved, scheduled, posted
- scheduled_for (timestamp)
- created_at (timestamp)

## transactions
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- lead_id (uuid, foreign key)
- address (text)
- type (text) — buy, sell
- status (text)
- timeline_steps (jsonb)
- contacts (jsonb)
- created_at (timestamp)

---

# Core Functions (Skills)

Each skill is a TypeScript async function in the backend. One function does one thing. All functions sanitize input before calling Claude API.

## extractLead(content: string, channel: string, customerId: string)
- Triggered by Gmail push notification, Twilio SMS webhook, or Deepgram transcript
- Sanitizes raw input before any processing
- Calls Claude API to extract: name, contact info, budget, location, property type, timeline, pre-approval status, urgency
- Creates or updates lead record in Supabase
- Calls scoreLead() after extraction

## updateProfile(leadId: string, newContent: string, customerId: string)
- Triggered when existing lead sends new communication
- Detects changes in budget, timeline, requirements
- Updates lead record in Supabase
- Logs change to communications table

## scoreLead(leadId: string, customerId: string)
- Called after every extractLead() or updateProfile()
- Scoring factors: timeline urgency, budget clarity, pre-approval status, responsiveness, channel engagement
- Updates priority_score in leads table
- Returns updated score

## trackContactPreference(leadId: string, channel: string, outcome: string, customerId: string)
- Logs outcome of every contact attempt — successful or unsuccessful — per channel
- Builds history of what communication methods work per lead
- Used by draftFollowUp() to suggest best channel

## draftFollowUp(leadId: string, customerId: string)
- Drafts follow-up message based on lead profile, last interaction, and contact history
- Calls Claude API to generate personalized message
- Suggests best channel based on trackContactPreference() history
- Creates follow_up record with status: pending
- Agent reviews and approves in dashboard

## sendDailyBriefing(customerId: string)
- Scheduled via node-cron to run every morning at configured time
- Queries Supabase for: new leads, hot leads, follow-ups due, leads not contacted recently
- Pulls MailChimp engagement data if connected
- Surfaces summary in dashboard notification and optionally via email to agent

## generateSocialContent(triggerId: string, customerId: string)
- Triggered by key events: deal closed, new listing, open house scheduled, price reduction
- Calls Claude API to generate caption, property description, hashtags
- Calls Canva API to generate visual from agent's saved templates
- Creates social_post record with status: pending
- Agent reviews and approves in dashboard
- On approval calls Buffer API to schedule posting

## processTransactionTimeline(transactionId: string, customerId: string)
- Creates and updates shared progress document for each active deal
- Tracks completed and upcoming steps
- Stores key contacts: attorney, title, insurance
- Accessible to agent in dashboard

---

# Webhook Endpoints

## POST /webhooks/gmail/:customerId
- Receives Gmail push notifications
- Validates request is from Google
- Calls extractLead() or updateProfile() depending on sender

## POST /webhooks/sms/:customerId
- Receives Twilio SMS webhooks
- Validates Twilio signature
- Calls extractLead() or updateProfile() depending on sender

## POST /webhooks/call/:customerId
- Receives Twilio call recording webhooks
- Sends audio to Deepgram for transcription
- Calls extractLead() or updateProfile() with transcript

---

# Dashboard Pages

## /dashboard
- Lead pipeline view — all leads sorted by priority score
- Color coded by status: hot, warm, cold
- Quick actions: view lead, approve follow-up, dismiss

## /leads/:leadId
- Full lead profile
- Complete communication history in chronological order
- Priority score breakdown
- Follow-up history and preferred contact method
- Notes field for agent

## /approvals
- Queue of pending follow-up drafts
- Queue of pending social media posts
- Agent reviews, edits if needed, approves or rejects

## /transactions
- Active deals with transaction timeline
- Progress tracker per deal
- Key contacts stored per transaction

## /settings
- Connected accounts: Gmail, Twilio, Buffer, MailChimp, Canva
- Notification preferences
- Canva template selection
- node-cron schedule for daily briefing

---

# Security Rules

- ALL inbound content must pass through input sanitization before any function processes it
- Strip prompt injection patterns from all email, SMS, and call transcript content
- Each customer's Docker container is network isolated — cannot reach other containers
- Supabase row-level security enabled — each customer can only access their own data
- All API keys and tokens stored as Docker environment variables only, never hardcoded
- Gmail OAuth scoped to minimum necessary permissions — read-only initially
- API spending cap set per customer instance — alert at 50% and 80% of cap
- Twilio webhook signature validation on every inbound request
- Never log raw email or SMS content — log summaries only

---

# Development Rules

- Always work on dev branch, never commit directly to main
- Write a brief comment at the top of every function explaining what it does
- Handle all errors explicitly — no silent failures, always log meaningful errors
- Test every function against at least 10 real-world style inputs before marking complete
- Keep functions small and single purpose
- Never hardcode customer IDs, API keys, or tokens anywhere
- All Claude API calls must have a system prompt that includes the sanitization instruction
- Environment variables required: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, DEEPGRAM_API_KEY, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET

---

# Build Priority Order

1. Hetzner server setup and Docker
2. Supabase schema and row-level security
3. Express backend with webhook endpoints
4. Gmail OAuth and push notification setup
5. extractLead() function
6. scoreLead() and updateProfile() functions
7. draftFollowUp() function
8. Twilio SMS webhook and integration
9. Twilio call recording and Deepgram transcription
10. Input sanitization layer
11. node-cron daily briefing
12. Next.js dashboard — lead pipeline view
13. Dashboard — lead detail view
14. Dashboard — approvals queue
15. Buffer API integration
16. Canva API integration
17. generateSocialContent() function
18. Dashboard — social media approvals
19. Transaction timeline
20. MailChimp integration

---

# Current Status

Project is in initial setup phase. Nothing deployed yet. Starting with Hetzner server setup and Docker configuration.