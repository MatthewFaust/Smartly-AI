# Project Overview

An AI-powered CRM for real estate agents that automatically captures and manages leads across email, SMS, and phone calls, handles follow-ups intelligently, manages property listings, and generates social media and marketing content automatically — with minimal manual input from the agent.

Agents interact with the system through a web dashboard that includes a lead/client view, a property listings view, a calendar view, an AI chat interface for querying their leads, and an approvals queue. All AI logic runs server-side and surfaces results in the dashboard for the agent to review and approve.

---

# Tech Stack

- **Backend:** Node.js with Express
- **Frontend:** Next.js (agent dashboard)
- **Database:** Supabase (PostgreSQL) with row-level security
- **Auth:** Supabase Auth
- **AI:** Claude API (claude-sonnet-4-6 for complex tasks, claude-haiku-4-5-20251001 for simple/fast ones)
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
- AI chat interface allows agents to ask natural language questions about their leads and pipeline

## Provisioning
- New customer signup triggers automated container provisioning script
- Script creates Docker container, injects environment variables, runs migrations, registers webhooks
- Update strategy: rolling updates via deployment script that iterates over all active containers
- Never manually manage individual containers in production

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
- canva_token (text, encrypted)
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
- source_channel (text) — email, sms, call, referral
- referred_by (text) — name or lead_id of referrer if applicable
- status (text) — new, active, nurture, closed
- duplicate_flag (boolean) — flagged by AI as possible duplicate
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

## properties
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- address (text)
- price (integer)
- type (text) — residential, condo, commercial, land
- status (text) — active, under_contract, sold, off_market
- bedrooms (integer)
- bathrooms (integer)
- sqft (integer)
- listing_url (text)
- image_url (text)
- notes (text)
- linked_lead_ids (uuid[]) — leads interested in this property
- created_at (timestamp)

## social_posts
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- property_id (uuid, foreign key, nullable)
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
- property_id (uuid, foreign key, nullable)
- address (text)
- type (text) — buy, sell
- status (text)
- timeline_steps (jsonb)
- contacts (jsonb)
- created_at (timestamp)

## calendar_events
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- lead_id (uuid, foreign key, nullable)
- property_id (uuid, foreign key, nullable)
- title (text)
- type (text) — follow_up, open_house, showing, closing, other
- scheduled_for (timestamp)
- notes (text)
- created_at (timestamp)

## agent_chat_history
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- role (text) — user, assistant
- content (text)
- created_at (timestamp)

---

# Core Functions (Skills)

Each skill is a TypeScript async function in the backend. One function does one thing. All functions sanitize input before calling Claude API.

## extractLead(content: string, channel: string, customerId: string)
- Triggered by Gmail push notification, Twilio SMS webhook, or Deepgram transcript
- Sanitizes raw input before any processing
- Calls Claude API to extract: name, contact info, budget, location, property type, timeline, pre-approval status, urgency
- Calls detectDuplicate() before creating a new lead record
- Creates or updates lead record in Supabase
- Calls scoreLead() after extraction

## detectDuplicate(name: string, email: string, phone: string, customerId: string)
- Called before creating any new lead
- Fuzzy-matches against existing leads by name, email, and phone
- If likely duplicate found, sets duplicate_flag = true and flags for agent review rather than creating second record
- Returns existing lead ID if match found

## updateProfile(leadId: string, newContent: string, customerId: string)
- Triggered when existing lead sends new communication
- Detects changes in budget, timeline, requirements
- Updates lead record in Supabase
- Logs change to communications table

## scoreLead(leadId: string, customerId: string)
- Called after every extractLead() or updateProfile()
- Scoring factors: timeline urgency, budget clarity, pre-approval status, responsiveness, channel engagement
- Updates priority_score in leads table
- If score crosses hot threshold, triggers hotLeadAlert()
- Returns updated score

## hotLeadAlert(leadId: string, customerId: string)
- Triggered when priority_score crosses configured hot threshold
- Sends immediate SMS or email notification to agent
- Does not wait for morning briefing

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
- Surfaces summary in dashboard notification and optionally via email/SMS to agent
- Briefing email includes one-tap approval links for pending follow-ups

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
- Links to property record if available
- Accessible to agent in dashboard

## answerAgentQuery(message: string, customerId: string)
- Powers the AI chat interface in the dashboard
- Agent can ask natural language questions: "who are my hottest leads?", "any leads looking in Brookline under 800k?", "draft a follow-up for Brady Singh"
- Calls Claude API with full access to that customer's lead, property, and communication data as context
- Saves exchange to agent_chat_history
- Returns answer or triggers relevant action (e.g. drafting a follow-up)

## getSourceAnalytics(customerId: string)
- Queries leads grouped by source_channel
- Returns conversion rates and lead counts per channel
- Surfaced on dashboard as a simple stats bar

---

# Webhook Endpoints

## POST /webhooks/gmail/:customerId
- Receives Gmail push notifications
- Validates request is from Google (Cloud Pub/Sub token)
- Calls extractLead() or updateProfile() depending on sender
- Note: Gmail push subscriptions expire every 7 days — renewal is handled automatically via cron job

## POST /webhooks/sms/:customerId
- Receives Twilio SMS webhooks
- Validates Twilio signature on every request
- Calls extractLead() or updateProfile() depending on sender

## POST /webhooks/call/:customerId
- Receives Twilio call recording webhooks
- Sends audio to Deepgram for transcription
- Calls extractLead() or updateProfile() with transcript
- Logs each step explicitly — transcription failure must not silently drop the lead

## POST /api/chat/:customerId
- Receives agent message from dashboard chat interface
- Calls answerAgentQuery()
- Returns AI response

---

# Dashboard Pages

## /dashboard
- Lead pipeline view — all leads sorted by priority score
- Color coded by status: hot, warm, cold
- Source analytics bar — leads by channel this month
- Quick actions: view lead, approve follow-up, dismiss
- Hot lead alerts displayed prominently

## /leads
- Sidebar list of all clients/leads
- Click through to full lead profile
- Full lead profile includes: avatar, contact info, AI-generated summary, Client Overview panel, Notes panel
- Complete communication history in chronological order
- Priority score breakdown
- Follow-up history and preferred contact method
- Duplicate flag warning if detected

## /properties
- Searchable, filterable list of properties
- Property detail view: address, price, type, status, bedrooms, bathrooms, sqft, listing URL, image
- Notes panel per property
- Linked leads shown on property detail

## /calendar
- Monthly calendar view (May/2025 style as per Figma)
- Shows: scheduled follow-ups, open houses, showings, closings
- Click event to see detail or linked lead/property
- Add event manually or auto-populated from follow_ups and transactions

## /chat
- AI chat interface for agent to query their pipeline
- Conversation history shown
- Input: "what's on your leads?" style natural language
- Agent avatar shown

## /approvals
- Queue of pending follow-up drafts
- Queue of pending social media posts
- Agent reviews, edits if needed, approves or rejects
- One-tap approve designed for speed

## /transactions
- Active deals with transaction timeline
- Progress tracker per deal
- Key contacts stored per transaction
- Linked to property and lead records

## /settings
- Connected accounts: Gmail, Twilio, Buffer, MailChimp, Canva
- Notification preferences (dashboard, email, SMS)
- Hot lead alert threshold setting
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
- agent_chat_history scoped strictly to customer_id — agents cannot query other customers' data

---

# Development Rules

- Always work on dev branch, never commit directly to main
- Write a brief comment at the top of every function explaining what it does
- Handle all errors explicitly — no silent failures, always log meaningful errors
- The call transcription → lead extraction pipeline must have explicit logging at every step
- Test every function against at least 10 real-world style inputs before marking complete
- Keep functions small and single purpose
- Never hardcode customer IDs, API keys, or tokens anywhere
- All Claude API calls must have a system prompt that includes the sanitization instruction
- Gmail push subscription renewal cron must run every 6 days (subscriptions expire at 7)
- Automated container provisioning script must be written and tested before onboarding first customer
- Environment variables required: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, DEEPGRAM_API_KEY, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, BUFFER_TOKEN, CANVA_API_KEY

---

# Build Priority Order

1. Hetzner server setup and Docker
2. Automated container provisioning script
3. Supabase schema and row-level security
4. Express backend with webhook endpoints
5. Gmail OAuth and push notification setup — **start Google app verification process immediately**
6. extractLead() and detectDuplicate() functions
7. scoreLead(), hotLeadAlert(), and updateProfile() functions
8. draftFollowUp() and trackContactPreference() functions
9. Twilio SMS webhook and integration
10. Twilio call recording and Deepgram transcription pipeline (with full step logging)
11. Input sanitization layer
12. node-cron daily briefing with one-tap approval links
13. Next.js dashboard — lead pipeline view with source analytics
14. Dashboard — lead/client detail view (Figma: sidebar list + profile + notes)
15. Dashboard — properties view
16. Dashboard — calendar view
17. Dashboard — AI chat interface + answerAgentQuery()
18. Dashboard — approvals queue
19. Buffer API integration
20. Canva API integration — **prototype early to validate template API capabilities**
21. generateSocialContent() function
22. Dashboard — social media approvals
23. Transaction timeline
24. MailChimp integration
