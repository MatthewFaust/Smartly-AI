// Chat routes — handles agent AI queries and returns chat history
const express = require('express');
const router = express.Router();
const { answerAgentQuery } = require('../functions/answerAgentQuery');
const { supabase } = require('../lib/supabase');

const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

// POST /chat — send a message and get an AI response
router.post('/', async (req, res) => {
  const { message, chatHistory = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const response = await answerAgentQuery(message, TEST_CUSTOMER_ID, chatHistory);

  return res.json({ response });
});

// GET /chat/history — return recent chat history for the test customer
router.get('/history', async (req, res) => {
  const { data, error } = await supabase
    .from('agent_chat_history')
    .select('*')
    .eq('customer_id', TEST_CUSTOMER_ID)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('GET /chat/history error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch chat history' });
  }

  return res.json({ history: data });
});

module.exports = router;
