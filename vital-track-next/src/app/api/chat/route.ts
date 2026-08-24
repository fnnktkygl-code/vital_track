import { NextRequest, NextResponse } from 'next/server';

const GREETINGS_REGEX = /^(salut|bonjour|bonsoir|coucou|hello|hi|hey|ça va|ca va|comment vas[- ]tu|qui es[- ]tu)\b/i;

const CHITCHAT_CASCADE = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
];

const STANDARD_CASCADE = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

const DEEP_SEARCH_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

function getApiKeys(customKey?: string): { key: string; tier: string }[] {
  const tiers: { key: string; tier: string }[] = [];
  if (customKey && customKey.trim().length > 10) {
    tiers.push({ key: customKey.trim(), tier: 'custom_user_key' });
  }
  const freeKey = (process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_FREE_KEY || '').trim();
  if (freeKey) {
    tiers.push({ key: freeKey, tier: 'free_tier_500rpd' });
  }
  const paidKey = (process.env.GEMINI_API_KEY_PAID || process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (paidKey && paidKey !== freeKey) {
    tiers.push({ key: paidKey, tier: 'paid_tier_vital_track' });
  }
  if (tiers.length === 0 && paidKey) {
    tiers.push({ key: paidKey, tier: 'default' });
  }
  return tiers;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-VT-API-Key, x-gemini-key, Accept',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const customKey = req.headers.get('x-gemini-key') || req.headers.get('X-Gemini-Key') || undefined;
    const isStream = req.nextUrl.searchParams.get('stream') === 'true';

    const body = await req.json().catch(() => ({}));
    const { query, messages, history, profile, userContext, fileParts, model } = body;

    // Support both formats: query (standard web-app) and messages (alternative/Next)
    let userPrompt = '';
    let conversationHistory: { role: string; text: string }[] = [];

    if (typeof query === 'string' && query.trim()) {
      userPrompt = query.trim();
      if (Array.isArray(history)) {
        conversationHistory = history.map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          text: typeof m.text === 'string' ? m.text : (typeof m.content === 'string' ? m.content : ''),
        })).filter(m => m.text);
      }
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      userPrompt = (lastMsg?.content || lastMsg?.text || '').trim();
      conversationHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        text: typeof m.content === 'string' ? m.content : (typeof m.text === 'string' ? m.text : ''),
      })).filter(m => m.text);
    }

    if (!userPrompt && (!Array.isArray(fileParts) || fileParts.length === 0)) {
      return NextResponse.json({ error: 'Query or messages required' }, { status: 400 });
    }

    const isGreeting = GREETINGS_REGEX.test(userPrompt);
    const isDeepSearch = userPrompt.length > 250 || /(?:plan|programme|je[uû]ne|bilan|protocole|[ée]monctoire|reins|lymphe|1 mois|30 jours)/i.test(userPrompt);
    const modelCascade = isGreeting ? CHITCHAT_CASCADE : (isDeepSearch ? DEEP_SEARCH_CASCADE : STANDARD_CASCADE);
    const selectedModel = model && model !== 'auto' ? [model, ...modelCascade.filter(m => m !== model)] : modelCascade;

    // Build system instructions
    let profileText = '';
    if (profile && typeof profile === 'object') {
      const parts: string[] = [];
      if (profile.name) parts.push(`Nom: ${profile.name}`);
      if (profile.city || profile.country) parts.push(`Lieu: ${profile.city || ''} ${profile.country || ''}`);
      if (profile.goal) parts.push(`Objectif: ${profile.goal}`);
      if (profile.protocol) parts.push(`Protocole: ${profile.protocol}`);
      if (profile.transitionLevel) parts.push(`Niveau transition: ${profile.transitionLevel}`);
      if (profile.restrictions) parts.push(`Restrictions: ${profile.restrictions}`);
      if (profile.targetOrgans) parts.push(`Émonctoires cibles: ${Array.isArray(profile.targetOrgans) ? profile.targetOrgans.join(', ') : profile.targetOrgans}`);
      if (profile.memories) parts.push(`Directives: ${profile.memories}`);
      profileText = parts.join(' | ');
    } else if (userContext) {
      profileText = String(userContext);
    }

    const systemPrompt = `Tu es le Coach Vital de VitalTrack, expert mondial en hygiénisme, alimentation vivante (Dr. Sebi, Arnold Ehret, Dr. Robert Morse) et régénération cellulaire.
    
    Bio-Contexte Utilisateur Actif :
    ${profileText || 'Aucun contexte spécifique renseigné.'}
    
    Directives de coaching vitaliste :
    - Sois bienveillant, précis, scientifique, direct et motivant.
    - Évalue toujours la charge mucogène et acide des aliments mentionnés (PRAL & NOVA).
    - Encourage le repos digestif, la régénération tissulaire et l'activation des émonctoires (Reins, Côlon, Foie, Poumons, Peau).
    - Propose des alternatives végétales vivantes, électrisantes et adaptées au niveau de transition.
    - RÈGLE DE RENDU JAPANDI : Rédige des réponses aérées avec des puces élégantes et des sous-titres clairs. Évite les tableaux Markdown bruts (| col | col |) pour préserver la lisibilité mobile.`;

    // Multi-turn contents array for Google Generative Language API
    const contents: any[] = [];
    for (const item of conversationHistory.slice(-30)) {
      contents.push({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: item.text }],
      });
    }

    const currentParts: any[] = [{ text: userPrompt }];
    if (Array.isArray(fileParts)) {
      for (const fp of fileParts) {
        if (fp?.inlineData) currentParts.push(fp);
      }
    }
    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const apiKeys = getApiKeys(customKey);
    if (apiKeys.length === 0) {
      return NextResponse.json({
        error: 'Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY_FREE ou GEMINI_API_KEY_PAID sur Vercel, ou fournir une clé dans les paramètres.',
      }, { status: 500 });
    }

    let lastError: any = null;

    for (const { key, tier } of apiKeys) {
      for (const modelName of selectedModel) {
        try {
          const method = isStream ? 'streamGenerateContent?alt=sse' : 'generateContent';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}${isStream ? '&' : '?'}key=${key}`;

          const payload = {
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: isGreeting ? 0.7 : 0.4,
              maxOutputTokens: isGreeting ? 512 : 8192,
            },
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson.error?.message || `HTTP ${response.status}`;
            console.warn(`[FinOps Failover] Tier [${tier}] Model [${modelName}] Status ${response.status}: ${errMsg.slice(0, 120)}`);

            if (response.status === 429 || response.status === 503 || response.status === 500) {
              lastError = new Error(errMsg);
              continue; // try next model / next tier
            }

            if (response.status === 404 || response.status === 400) {
              lastError = new Error(errMsg);
              continue;
            }

            throw new Error(errMsg);
          }

          // Handle streaming response
          if (isStream && response.body) {
            return new Response(response.body, {
              status: 200,
              headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Model-Used': modelName,
                'X-FinOps-Tier': tier,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'X-Model-Used, X-FinOps-Tier',
              },
            });
          }

          // Handle standard JSON response
          const data = await response.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const generatedText = parts
            .filter((p: any) => !p.thought && p.text)
            .map((p: any) => p.text)
            .join('')
            .trim();

          return NextResponse.json({
            content: generatedText,
            text: generatedText,
            modelUsed: modelName,
            tier,
            timestamp: Date.now(),
          }, {
            headers: {
              'X-Model-Used': modelName,
              'X-FinOps-Tier': tier,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Expose-Headers': 'X-Model-Used, X-FinOps-Tier',
            },
          });
        } catch (err: any) {
          console.warn(`[FinOps Error] Tier [${tier}] Model [${modelName}]:`, err?.message);
          lastError = err;
        }
      }
    }

    throw lastError || new Error('Tous les modèles et clés de la cascade ont échoué.');
  } catch (error: any) {
    console.error('[API Chat Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la communication avec le Coach Vital' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
