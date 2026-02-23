// CRUD routes for leads — list all, get one, and update notes/status
const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

// GET /leads — return all leads sorted by priority_score descending
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('customer_id', TEST_CUSTOMER_ID)
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('GET /leads error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }

  return res.json({ leads: data });
});

// GET /leads/:leadId — return single lead with full profile
router.get('/:leadId', async (req, res) => {
  const { leadId } = req.params;

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('customer_id', TEST_CUSTOMER_ID)
    .single();

  if (leadError || !lead) {
    console.error('GET /leads/:leadId error:', leadError?.message);
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  return res.json({ lead, communications: communications || [], followUps: followUps || [] });
});

// PATCH /leads/:leadId — update notes or status
router.patch('/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const { notes, status } = req.body;

  const updates = {};
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update — provide notes or status' });
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .eq('customer_id', TEST_CUSTOMER_ID)
    .select()
    .single();

  if (error) {
    console.error('PATCH /leads/:leadId error:', error.message);
    return res.status(500).json({ error: 'Failed to update lead' });
  }

  return res.json({ lead: data });
});

module.exports = router;
