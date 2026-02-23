// Routes for fetching and approving/rejecting follow-up drafts
const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

// GET /followups?status=pending — return follow-ups filtered by status
router.get('/', async (req, res) => {
  const { status } = req.query;

  let query = supabase
    .from('follow_ups')
    .select(`
      *,
      leads (
        id,
        name,
        email,
        phone,
        priority_score,
        status
      )
    `)
    .eq('customer_id', TEST_CUSTOMER_ID)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('GET /followups error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }

  return res.json({ followUps: data });
});

// PATCH /followups/:followUpId — update status to approved or rejected
router.patch('/:followUpId', async (req, res) => {
  const { followUpId } = req.params;
  const { status } = req.body;

  const validStatuses = ['approved', 'rejected', 'sent'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const updates = { status };
  if (status === 'sent') {
    updates.sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('follow_ups')
    .update(updates)
    .eq('id', followUpId)
    .eq('customer_id', TEST_CUSTOMER_ID)
    .select()
    .single();

  if (error) {
    console.error('PATCH /followups/:followUpId error:', error.message);
    return res.status(500).json({ error: 'Failed to update follow-up' });
  }

  return res.json({ followUp: data });
});

module.exports = router;
