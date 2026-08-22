/**
 * queryClassifier.js — Smart Intent Classification for VitalTrack Model Cascading
 * 
 * Classifies incoming user queries into 3 tiers:
 * - 'chitchat' : Simple greetings, small talk, polite replies ("salut", "comment ça va", "merci")
 *                -> Routes to Gemini 2.0 Flash Lite, skips RAG context, uses ultra-lightweight prompt.
 * - 'standard' : Routine health, nutrition, botanical, fasting questions
 *                -> Routes to Gemini 2.5 Flash, retrieves 3-4 RAG chunks, full vitalist coaching prompt.
 * - 'complex'  : Image analysis, multi-system pathology, long deep questions (>250 chars), multi-turn history
 *                -> Routes to Gemini 2.5 Flash / 1.5 Pro, deep multi-source RAG, differential analysis.
 */

const GREETING_PATTERNS = [
  /^(salut|bonjour|coucou|hello|hi|hey|hola|buenos\s*d[ií]as|buenas\s*tardes|bon\s*matin|yo|bonsoir)[\s!.,?]*$/i,
  /^(comment\s+(tu\s+vas|ca\s+va|ça\s+va)|ca\s+va\??|ça\s+va\??|how\s+are\s+you|qu[ée]\s+tal|c[oó]mo\s+est[aá]s|c[oó]mo\s+te\s+va)[\s!.,?]*$/i,
  /^(merci|merci\s+beaucoup|thanks|thank\s+you|gracias|muchas\s+gracias|de\s+rien|au\s+revoir|bye|bonne\s+journ[eé]e|bonne\s+nuit|good\s+morning|good\s+night)[\s!.,?]*$/i,
  /^(qui\s+es[- ]tu|t['’]es\s+qui|who\s+are\s+you|qui[eé]n\s+eres|tu\s+fais\s+quoi|que\s+fais[- ]tu|raconte\s+une\s+blague|fais[- ]moi\s+une\s+blague)[\s!.,?]*$/i,
];

const HEALTH_KEYWORDS = [
  'jeûn', 'fast', 'ayun', 'detox', 'détox', 'desintox', 'rein', 'kidney', 'riñón', 'lymphe', 'lymph', 'linfa',
  'foie', 'liver', 'hígado', 'ehret', 'morse', 'sebi', 'plante', 'herb', 'hierba', 'tisane', 'tea', 'infusion',
  'repas', 'meal', 'comida', 'recette', 'recipe', 'receta', 'manger', 'eat', 'comer', 'aliment', 'food',
  'douleur', 'pain', 'dolor', 'transit', 'intestin', 'bowel', 'moco', 'mucus', 'glande', 'thyroid', 'suprarrenal',
  'chanca', 'chaga', 'ortie', 'diente de leon', 'pissenlit', 'morinda', 'fruit', 'legume', 'verdura', 'juice', 'jus', 'zumo'
];

function classifyQueryIntent({ query, history = [], fileParts = [] }) {
  // If images or multimodal attachments are present -> Complex Clinical
  if (Array.isArray(fileParts) && fileParts.length > 0) {
    return 'complex';
  }

  const cleanQuery = (query || '').trim();
  const lowerQuery = cleanQuery.toLowerCase();

  // Check if it's an explicit greeting / short chit-chat
  const isGreetingMatch = GREETING_PATTERNS.some(regex => regex.test(lowerQuery));
  
  // Check if any vitalist/health keyword is present
  const hasHealthKeyword = HEALTH_KEYWORDS.some(kw => lowerQuery.includes(kw));

  if (isGreetingMatch && !hasHealthKeyword) {
    return 'chitchat';
  }

  // If very short and no health keyword and no detailed history
  if (cleanQuery.length <= 40 && !hasHealthKeyword && (!history || history.length === 0)) {
    // Check if it looks like general small talk (e.g. "salut à toi", "coucou l'ami")
    if (/^(salut|bonjour|coucou|hello|hi|hey|hola|bonsoir|merci|yo)/i.test(lowerQuery)) {
      return 'chitchat';
    }
  }

  // Check for complex conditions (long query, complex pathology, deep history)
  if (cleanQuery.length > 300 || (Array.isArray(history) && history.length > 8)) {
    return 'complex';
  }

  return 'standard';
}

module.exports = {
  classifyQueryIntent,
  GREETING_PATTERNS,
  HEALTH_KEYWORDS
};
