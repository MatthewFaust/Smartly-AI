// Test routes that replace webhooks for local development — trigger pipeline functions directly
const express = require('express');
const router = express.Router();
const { extractLead } = require('../functions/extractLead');
const { scoreLead } = require('../functions/scoreLead');
const { draftFollowUp } = require('../functions/draftFollowUp');

const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

// POST /test/extract — run extractLead on raw content and return created lead
router.post('/extract', async (req, res) => {
  const { content, channel = 'email' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const lead = await extractLead(content, channel, TEST_CUSTOMER_ID);

  if (!lead) {
    return res.status(500).json({ error: 'extractLead failed — check server logs' });
  }

  return res.json({ lead });
});

// POST /test/score/:leadId — run scoreLead and return updated score
router.post('/score/:leadId', async (req, res) => {
  const { leadId } = req.params;

  const score = await scoreLead(leadId, TEST_CUSTOMER_ID);

  return res.json({ leadId, priority_score: score });
});

// POST /test/draft/:leadId — run draftFollowUp and return pending draft
router.post('/draft/:leadId', async (req, res) => {
  const { leadId } = req.params;

  const followUp = await draftFollowUp(leadId, TEST_CUSTOMER_ID);

  if (!followUp) {
    return res.status(500).json({ error: 'draftFollowUp failed — check server logs' });
  }

  return res.json({ followUp });
});

// POST /test/full-pipeline — extract, score, and draft in sequence, return all three results
router.post('/full-pipeline', async (req, res) => {
  const { content, channel = 'email' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const lead = await extractLead(content, channel, TEST_CUSTOMER_ID);

  if (!lead) {
    return res.status(500).json({ error: 'extractLead failed — check server logs' });
  }

  const score = await scoreLead(lead.id, TEST_CUSTOMER_ID);

  const followUp = await draftFollowUp(lead.id, TEST_CUSTOMER_ID);

  return res.json({ lead: { ...lead, priority_score: score }, followUp });
});

module.exports = router;
