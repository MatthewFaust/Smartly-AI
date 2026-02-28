// CRUD routes for properties — list, get, create, and update notes
const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

// GET /properties — all properties sorted by created_at desc
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('customer_id', TEST_CUSTOMER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /properties error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }

  return res.json({ properties: data });
});

// GET /properties/:id — single property
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', req.params.id)
    .eq('customer_id', TEST_CUSTOMER_ID)
    .single();

  if (error || !data) {
    console.error('GET /properties/:id error:', error?.message);
    return res.status(404).json({ error: 'Property not found' });
  }

  return res.json({ property: data });
});

// POST /properties — create a new property
router.post('/', async (req, res) => {
  const { address, price, type, status, bedrooms, bathrooms, sqft, listing_url, image_url, notes } = req.body;

  if (!address) return res.status(400).json({ error: 'address is required' });

  const { data, error } = await supabase
    .from('properties')
    .insert({
      customer_id: TEST_CUSTOMER_ID,
      address, price, type, status: status || 'active',
      bedrooms, bathrooms, sqft, listing_url, image_url, notes
    })
    .select()
    .single();

  if (error) {
    console.error('POST /properties error:', error.message);
    return res.status(500).json({ error: 'Failed to create property' });
  }

  return res.status(201).json({ property: data });
});

// PATCH /properties/:id — update notes or status
router.patch('/:id', async (req, res) => {
  const allowed = ['notes', 'status', 'price', 'listing_url', 'image_url'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', req.params.id)
    .eq('customer_id', TEST_CUSTOMER_ID)
    .select()
    .single();

  if (error) {
    console.error('PATCH /properties/:id error:', error.message);
    return res.status(500).json({ error: 'Failed to update property' });
  }

  return res.json({ property: data });
});

module.exports = router;
