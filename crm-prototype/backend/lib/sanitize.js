// Removes prompt injection patterns and caps input length before passing to Claude
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/you are now/gi, '')
    .replace(/forget everything/gi, '')
    .trim()
    .slice(0, 8000);
}

module.exports = { sanitizeInput };
