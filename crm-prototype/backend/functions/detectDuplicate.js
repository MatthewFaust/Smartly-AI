// Checks if a lead with matching email or phone already exists before creating a new record
const { supabase } = require('../lib/supabase');

async function detectDuplicate(name, email, phone, customerId) {
  try {
    // Check for exact email match first
    if (email) {
      const { data: emailMatch, error: emailError } = await supabase
        .from('leads')
        .select('id, name, email, phone, duplicate_flag')
        .eq('customer_id', customerId)
        .eq('email', email)
        .limit(1);

      if (emailError) {
        console.error('detectDuplicate: email query error:', emailError.message);
      } else if (emailMatch && emailMatch.length > 0) {
        return emailMatch[0].id;
      }
    }

    // Fall back to exact phone match
    if (phone) {
      const { data: phoneMatch, error: phoneError } = await supabase
        .from('leads')
        .select('id, name, email, phone, duplicate_flag')
        .eq('customer_id', customerId)
        .eq('phone', phone)
        .limit(1);

      if (phoneError) {
        console.error('detectDuplicate: phone query error:', phoneError.message);
      } else if (phoneMatch && phoneMatch.length > 0) {
        return phoneMatch[0].id;
      }
    }

    return null;
  } catch (err) {
    console.error('detectDuplicate: unexpected error:', err.message);
    return null;
  }
}

module.exports = { detectDuplicate };
