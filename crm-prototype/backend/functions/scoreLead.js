// Scores a lead 0-100 based on urgency signals and profile completeness, then updates the DB
const { supabase } = require('../lib/supabase');

async function scoreLead(leadId, customerId) {
  try {
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('customer_id', customerId)
      .single();

    if (fetchError || !lead) {
      console.error('scoreLead: could not fetch lead:', fetchError?.message);
      return 0;
    }

    let score = 0;

    // Timeline urgency
    const timeline = (lead.timeline || '').toLowerCase();
    if (
      timeline.includes('week') ||
      timeline.includes('asap') ||
      timeline.includes('immediately') ||
      timeline.includes('2 week') ||
      timeline.includes('two week')
    ) {
      score += 30;
    } else if (
      timeline.includes('month') ||
      timeline.includes('60 day') ||
      timeline.includes('90 day') ||
      timeline.includes('summer') ||
      timeline.includes('soon')
    ) {
      score += 20;
    }

    // Budget provided
    if (lead.budget_min && lead.budget_max) {
      score += 20;
    } else if (lead.budget_min || lead.budget_max) {
      score += 10;
    }

    // Pre-approval
    if (lead.pre_approved === true) {
      score += 25;
    }

    // Contact info
    if (lead.phone) score += 10;
    if (lead.email) score += 10;

    // Property type specified
    if (lead.property_type) score += 5;

    // Cap at 100
    score = Math.min(score, 100);

    const { error: updateError } = await supabase
      .from('leads')
      .update({ priority_score: score })
      .eq('id', leadId)
      .eq('customer_id', customerId);

    if (updateError) {
      console.error('scoreLead: failed to update score:', updateError.message);
    }

    return score;
  } catch (err) {
    console.error('scoreLead: unexpected error:', err.message);
    return 0;
  }
}

module.exports = { scoreLead };
