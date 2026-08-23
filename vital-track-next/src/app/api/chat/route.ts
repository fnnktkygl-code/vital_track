import { NextRequest, NextResponse } from 'next/server';
import { executeGeminiWithFailover } from '@/lib/ai/geminiClient';

const GREETINGS_REGEX = /^(salut|bonjour|bonsoir|coucou|hello|hi|hey|ça va|ca va|comment vas[- ]tu|qui es[- ]tu)\b/i;

export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json();
    const customKey = req.headers.get('x-gemini-key') || undefined;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const isGreeting = GREETINGS_REGEX.test(lastMessage.content.trim());
    const feature = isGreeting ? 'greeting' : 'chat';

    const systemPrompt = `Tu es le Coach Vital IA de VitalTrack, expert en hygiénisme, alimentation vivante, équilibre acido-basique (PRAL), régénération cellulaire et jeûne thérapeutique (selon Dr. Robert Morse, Dr. Sebi, Arnold Ehret).
    
    Bio-Contexte Utilisateur Actif :
    ${userContext || 'Aucun contexte spécifique renseigné.'}
    
    Directives de réponse :
    - Sois bienveillant, précis, scientifique et direct.
    - Évalue toujours la charge mucogène et acide des aliments mentionnés.
    - Encourage le repos digestif et l'activation des émonctoires (Reins, Côlon, Foie, Poumons, Peau).
    - Si l'utilisateur demande une analyse de plat, donne la classification PRAL estimée et le niveau NOVA.`;

    const { result, modelUsed } = await executeGeminiWithFailover(
      feature,
      customKey,
      async (ai, modelName) => {
        const model = ai.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });

        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });
        const response = await chat.sendMessage(lastMessage.content);
        return response.response.text();
      }
    );

    return NextResponse.json({
      content: result,
      modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[API Chat Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération IA' },
      { status: 500 }
    );
  }
}
