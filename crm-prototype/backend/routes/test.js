// Test routes replacing webhooks for local dev — trigger pipeline functions and seed the database
const express = require('express');
const router = express.Router();
const { extractLead } = require('../functions/extractLead');
const { scoreLead } = require('../functions/scoreLead');
const { draftFollowUp } = require('../functions/draftFollowUp');
const { supabase } = require('../lib/supabase');

const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

// POST /test/extract — run full pipeline on raw content and return created lead + follow-up
router.post('/extract', async (req, res) => {
  const { content, channel = 'email' } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const lead = await extractLead(content, channel, TEST_CUSTOMER_ID);
  if (!lead) return res.status(500).json({ error: 'extractLead failed — check server logs' });

  const followUp = await draftFollowUp(lead.id, TEST_CUSTOMER_ID);

  return res.json({ lead, followUp });
});

// POST /test/draft/:leadId — draft a follow-up for an existing lead
router.post('/draft/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const followUp = await draftFollowUp(leadId, TEST_CUSTOMER_ID);
  if (!followUp) return res.status(500).json({ error: 'draftFollowUp failed — check server logs' });
  return res.json({ followUp });
});

// POST /test/score/:leadId — rescore a lead and return updated score
router.post('/score/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const score = await scoreLead(leadId, TEST_CUSTOMER_ID);
  return res.json({ leadId, priority_score: score });
});

// GET /test/seed — populate database with realistic sample leads and properties
router.get('/seed', async (req, res) => {
  try {
    // Clear existing seed data for this customer first
    await supabase.from('follow_ups').delete().eq('customer_id', TEST_CUSTOMER_ID);
    await supabase.from('communications').delete().eq('customer_id', TEST_CUSTOMER_ID);
    await supabase.from('leads').delete().eq('customer_id', TEST_CUSTOMER_ID);
    await supabase.from('properties').delete().eq('customer_id', TEST_CUSTOMER_ID);

    // Seed leads
    const leads = [
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Brady Singh',
        email: 'brady.singh@gmail.com',
        phone: '617-555-0101',
        budget_min: 900000,
        budget_max: 1200000,
        location: 'Back Bay, Boston',
        property_type: 'Condo',
        timeline: 'Selling in 60 days',
        pre_approved: true,
        priority_score: 85,
        preferred_contact: 'email',
        source_channel: 'email',
        role: 'Seller',
        status: 'active',
        notes: 'Motivated seller, flexible on closing date. Wants to upsize to suburbs after sale.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Kanye West',
        email: 'kanye@yeezy.com',
        phone: '310-555-0199',
        budget_min: 3000000,
        budget_max: 5000000,
        location: 'Bel Air, Los Angeles',
        property_type: 'Mansion',
        timeline: 'ASAP',
        pre_approved: true,
        priority_score: 95,
        preferred_contact: 'phone',
        source_channel: 'call',
        role: 'Buyer',
        status: 'active',
        notes: 'High-priority buyer. Needs gated property with recording studio space.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Aubrey Graham',
        email: 'aubrey@ovo.ca',
        phone: '416-555-0120',
        budget_min: 2000000,
        budget_max: 4000000,
        location: 'Rosedale, Toronto',
        property_type: 'Estate',
        timeline: '90 days',
        pre_approved: true,
        priority_score: 75,
        preferred_contact: 'email',
        source_channel: 'email',
        role: 'Buyer',
        status: 'active',
        notes: 'Looking for large estate with gym and home theatre. Must have high security.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Tate McRae',
        email: 'tate@mgmt.com',
        phone: '403-555-0144',
        budget_min: null,
        budget_max: 800000,
        location: 'West Hollywood, CA',
        property_type: 'Townhouse',
        timeline: 'Selling this spring',
        pre_approved: null,
        priority_score: 55,
        preferred_contact: 'email',
        source_channel: 'email',
        role: 'Seller',
        status: 'active',
        notes: 'Relocating to New York. Needs quick sale by end of spring.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Sabrina Carpenter',
        email: 'sabrina@shortncute.com',
        phone: '215-555-0177',
        budget_min: 1500000,
        budget_max: 2500000,
        location: 'Silver Lake, Los Angeles',
        property_type: 'Single family home',
        timeline: '60 days',
        pre_approved: true,
        priority_score: 70,
        preferred_contact: 'email',
        source_channel: 'email',
        role: 'Buyer',
        status: 'active',
        notes: 'Wants creative neighborhood, private backyard, home office space.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Cristiano Ronaldo',
        email: 'cr7@siuuu.com',
        phone: '351-555-0007',
        budget_min: 5000000,
        budget_max: 10000000,
        location: 'Miami Beach, FL',
        property_type: 'Waterfront estate',
        timeline: '30 days',
        pre_approved: true,
        priority_score: 98,
        preferred_contact: 'phone',
        source_channel: 'call',
        role: 'Buyer',
        status: 'active',
        notes: 'Wants oceanfront with private dock. Needs large garage for car collection.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Lionel Messi',
        email: 'leo@inter.com',
        phone: '54-555-0010',
        budget_min: 2000000,
        budget_max: 3500000,
        location: 'Fort Lauderdale, FL',
        property_type: 'Villa',
        timeline: 'Selling in 45 days',
        pre_approved: null,
        priority_score: 65,
        preferred_contact: 'phone',
        source_channel: 'sms',
        role: 'Seller',
        status: 'active',
        notes: 'Selling current Florida villa. Moving to Europe off-season.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Serena Williams',
        email: 'serena@vc.com',
        phone: '561-555-0023',
        budget_min: 3000000,
        budget_max: 6000000,
        location: 'Palm Beach, FL',
        property_type: 'Luxury home',
        timeline: '90 days',
        pre_approved: true,
        priority_score: 72,
        preferred_contact: 'email',
        source_channel: 'email',
        role: 'Buyer',
        status: 'active',
        notes: 'Needs large yard for kids, home gym, and privacy from street.',
      },
      {
        customer_id: TEST_CUSTOMER_ID,
        name: 'Tom Brady',
        email: 'tb12@goat.com',
        phone: '617-555-0012',
        budget_min: 4000000,
        budget_max: 8000000,
        location: 'Naples, FL',
        property_type: 'Waterfront',
        timeline: 'Flexible',
        pre_approved: true,
        priority_score: 80,
        preferred_contact: 'phone',
        source_channel: 'call',
        role: 'Both',
        status: 'active',
        notes: 'Selling Boston condo, buying in Naples. Prefers cash deals. Very private.',
      },
    ];

    const { data: insertedLeads, error: leadsError } = await supabase
      .from('leads')
      .insert(leads)
      .select();

    if (leadsError) {
      console.error('seed: failed to insert leads:', leadsError.message);
      return res.status(500).json({ error: 'Failed to seed leads: ' + leadsError.message });
    }

    // Seed properties
    const properties = [
      { customer_id: TEST_CUSTOMER_ID, address: '12 Marlborough St, Boston, MA 02116', price: 2100000, type: 'Condo', status: 'active', bedrooms: 3, bathrooms: 2, sqft: 1850, notes: 'Gorgeous Back Bay condo, renovated kitchen.' },
      { customer_id: TEST_CUSTOMER_ID, address: '88 Ocean Dr, Miami Beach, FL 33139', price: 4750000, type: 'Waterfront Estate', status: 'active', bedrooms: 5, bathrooms: 4, sqft: 5200, notes: 'Private dock, infinity pool.' },
      { customer_id: TEST_CUSTOMER_ID, address: '341 Rosedale Ave, Toronto, ON M4T 1G1', price: 3200000, type: 'Estate', status: 'active', bedrooms: 6, bathrooms: 5, sqft: 6800, notes: 'Gated property, landscaped gardens.' },
      { customer_id: TEST_CUSTOMER_ID, address: '5 Silver Lake Blvd, Los Angeles, CA 90039', price: 1950000, type: 'Single Family', status: 'active', bedrooms: 4, bathrooms: 3, sqft: 2400, notes: 'Private backyard, home office, great light.' },
      { customer_id: TEST_CUSTOMER_ID, address: '20 Sunset Plaza Dr, West Hollywood, CA 90069', price: 780000, type: 'Townhouse', status: 'pending', bedrooms: 2, bathrooms: 2, sqft: 1400, notes: 'Canyon views, updated bathrooms.' },
      { customer_id: TEST_CUSTOMER_ID, address: '100 Brickell Bay Dr, Miami, FL 33131', price: 1200000, type: 'Condo', status: 'active', bedrooms: 2, bathrooms: 2, sqft: 1600, notes: 'Floor to ceiling windows, bay views.' },
      { customer_id: TEST_CUSTOMER_ID, address: '77 Palm Beach Way, Palm Beach, FL 33480', price: 5400000, type: 'Luxury Home', status: 'active', bedrooms: 6, bathrooms: 6, sqft: 7500, notes: 'Tennis court, pool, guest house.' },
      { customer_id: TEST_CUSTOMER_ID, address: '9 Naples Cove Ct, Naples, FL 34102', price: 6200000, type: 'Waterfront', status: 'active', bedrooms: 5, bathrooms: 5, sqft: 6100, notes: 'Direct Gulf access, boat lift.' },
      { customer_id: TEST_CUSTOMER_ID, address: '200 Commonwealth Ave #4, Boston, MA 02116', price: 875000, type: 'Condo', status: 'active', bedrooms: 1, bathrooms: 1, sqft: 950, notes: 'Charming Commonwealth Ave condo, doorman building.' },
      { customer_id: TEST_CUSTOMER_ID, address: '14 Beacon Hill Rd, Boston, MA 02108', price: 1650000, type: 'Townhouse', status: 'active', bedrooms: 3, bathrooms: 2, sqft: 2100, notes: 'Historic Beacon Hill, original details.' },
      { customer_id: TEST_CUSTOMER_ID, address: '520 Fort Lauderdale Beach Blvd, FL 33304', price: 2850000, type: 'Villa', status: 'pending', bedrooms: 4, bathrooms: 3, sqft: 3300, notes: 'Steps to beach, tropical landscaping.' },
      { customer_id: TEST_CUSTOMER_ID, address: '400 Bel Air Rd, Los Angeles, CA 90077', price: 7900000, type: 'Mansion', status: 'active', bedrooms: 8, bathrooms: 9, sqft: 11000, notes: 'Gated estate, recording studio, full staff quarters.' },
      { customer_id: TEST_CUSTOMER_ID, address: '33 Newton Center St, Newton, MA 02459', price: 1100000, type: 'Single Family', status: 'active', bedrooms: 4, bathrooms: 3, sqft: 2800, notes: 'Top school district, large yard.' },
      { customer_id: TEST_CUSTOMER_ID, address: '7 Quincy Shore Dr, Quincy, MA 02171', price: 390000, type: 'Condo', status: 'active', bedrooms: 1, bathrooms: 1, sqft: 800, notes: 'Water views, updated throughout.' },
      { customer_id: TEST_CUSTOMER_ID, address: '55 South End St, Boston, MA 02118', price: 850000, type: 'Multi-family', status: 'active', bedrooms: 3, bathrooms: 2, sqft: 2200, notes: '2-unit, top unit vacant, bottom rented.' },
    ];

    const { data: insertedProperties, error: propertiesError } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (propertiesError) {
      console.error('seed: failed to insert properties:', propertiesError.message);
      return res.status(500).json({ error: 'Failed to seed properties: ' + propertiesError.message });
    }

    return res.json({
      message: 'Database seeded successfully',
      leads: insertedLeads.length,
      properties: insertedProperties.length,
    });
  } catch (err) {
    console.error('seed: unexpected error:', err.message);
    return res.status(500).json({ error: 'Seed failed: ' + err.message });
  }
});

module.exports = router;
