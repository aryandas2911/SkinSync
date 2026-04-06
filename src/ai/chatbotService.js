import { loadChatbotModel } from './modelLoader';

const SYSTEM_PROMPT = `You are a clinical dermatologist and cosmetic chemist AI.

You MUST provide highly specific, context-aware skincare advice based on the user's profile.

REASONING PROCESS (MANDATORY — DO NOT SKIP):
1. Identify the key ingredients, actives, or concepts in the user's question
2. Cross-reference them against:
   - Skin type
   - Concerns
   - Sensitivities
   - Current actives
   - Reactivity level
3. Evaluate:
   - Compatibility
   - Irritation risk
   - Ingredient interactions (layering conflicts)
4. Adjust answer based on REAL-WORLD usage (frequency, layering, overuse risk)

STRICT RULES:
- NEVER give generic advice if profile data is available
- NEVER ignore sensitivities or current actives
- ALWAYS explain WHY something is safe or unsafe
- ALWAYS mention interaction risks if relevant
- If uncertain → explicitly say what depends on concentration or formulation

OUTPUT STYLE:
- Start with a direct answer (1–2 lines)
- Then give a short reasoning section
- Then give a practical recommendation

TONE:
- Clinical but simple
- No fluff, no marketing language
- No vague phrases like 'it depends' without explanation`;

/**
 * Builds a structured, high-signal prompt that forces the LLM
 * to reason against the profile rather than give generic answers.
 */
const buildPrompt = (message, profile, history) => {
  // --- 1. Profile Block ---
  // Being explicit and exhaustive here is critical.
  // The LLM needs hard facts to anchor its reasoning.
  const profileBlock = profile
    ? [
      `SYSTEM CONTEXT — USER SKIN PROFILE:`,
      `  Skin Type   : ${profile.skinType || 'Unknown'}`,
      `  Concerns    : ${profile.concerns?.join(', ') || 'None stated'}`,
      `  Sensitivities: ${profile.sensitivities?.join(', ') || 'None stated'}`,
      `  Active Ingredients Currently In Use: ${profile.actives?.join(', ') || 'None stated'}`,
      `  Reactivity  : ${profile.reactivity || 'Normal'}`,
    ].join('\n')
    : `SYSTEM CONTEXT — USER SKIN PROFILE: Not provided. Give general, clearly caveated advice.`;

  // --- 2. Conversation History (last 6 turns max) ---
  // Keeps context tight. Too much history = diluted attention.
  const recentHistory = (history || []).slice(-6);
  const historyBlock = recentHistory.length > 0
    ? `\nCONVERSATION HISTORY (most recent turns):\n` +
    recentHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n')
    : '';

  // --- 3. Anti-Generic Forcing Instruction ---
  // This is the key addition: we explicitly forbid the LLM from
  // ignoring the profile data and giving one-size-fits-all answers.
  const forcingInstruction = `
CRITICAL INSTRUCTION BEFORE ANSWERING:
- You have the user's full skin profile above. USE IT.
- Your answer MUST reference at least one specific detail from the profile
  (skin type, a named sensitivity, a current active, or reactivity level).
- If the question involves an ingredient, you MUST check if it conflicts
  with any current active or listed sensitivity — explicitly state your finding.
- If the profile lacks relevant data for part of the answer, say so clearly
  instead of giving a generic fallback.
- Do NOT give advice that would apply equally to someone with the opposite profile.
`;

  // --- 4. Final Assembled Prompt ---
  return [
    SYSTEM_PROMPT,
    '',
    profileBlock,
    historyBlock,
    forcingInstruction,
    '',
    `USER QUESTION: "${message}"`,
    '',
    `ASSISTANT RESPONSE:`,
  ].join('\n');
};

/**
 * Checks whether the model's response is unacceptably generic
 * given the profile it should have used.
 */
const isResponseGeneric = (text, profile) => {
  if (!text || text.trim().length < 100) return true;

  const lower = text.toLowerCase();

  // If profile has concrete data, the response must reference some of it
  if (profile?.skinType && profile.skinType !== 'Unknown') {
    const mentionsSkinType = lower.includes(profile.skinType.toLowerCase());
    const mentionsConcern = profile.concerns?.some(c => lower.includes(c.toLowerCase()));
    const mentionsActive = profile.actives?.some(a => lower.includes(a.toLowerCase()));
    const mentionsSensitivity = profile.sensitivities?.some(s => lower.includes(s.toLowerCase()));

    if (!mentionsSkinType && !mentionsConcern && !mentionsActive && !mentionsSensitivity) {
      return true; // Response ignored the entire profile
    }
  }

  // Catch responses that say "it depends" with zero explanation
  if (/it depends/i.test(text) && text.length < 200) return true;

  // Catch suspiciously short "safe for all skin types" type answers
  if (/safe for (all|most|any) skin/i.test(text) && text.length < 250) return true;

  return false;
};

/**
 * Builds a targeted follow-up prompt that instructs the model
 * to redo its answer — more specifically.
 */
const buildRegenerationPrompt = (originalQuestion, profile, previousResponse) => {
  const profileSummary = profile
    ? `Skin: ${profile.skinType}, Concerns: ${profile.concerns?.join(', ')}, ` +
    `Sensitivities: ${profile.sensitivities?.join(', ')}, ` +
    `Actives: ${profile.actives?.join(', ')}, Reactivity: ${profile.reactivity}`
    : 'No profile available';

  return [
    `Your previous response was too generic and did not adequately reference the user's skin profile.`,
    ``,
    `Profile: ${profileSummary}`,
    `Original Question: "${originalQuestion}"`,
    `Your Previous Response: "${previousResponse}"`,
    ``,
    `Rewrite your answer. Requirements:`,
    `- Name the specific skin type and explain WHY it is relevant to this question.`,
    `- If any current active or sensitivity creates a conflict or synergy with the question topic, name it explicitly.`,
    `- If you mention a risk, explain the biochemical or formulation reason.`,
    `- No generic phrases. Every claim must be tied to the profile.`,
    ``,
    `IMPROVED RESPONSE:`,
  ].join('\n');
};

export const generateChatResponse = async (message, profile, history) => {
  let model;

  // --- Load the RunAnywhere LLM (uses cached instance after first call) ---
  try {
    model = await loadChatbotModel();
  } catch (err) {
    console.error('[ChatbotService] Model load failed:', err);
    return `⚠️ **AI Engine Unavailable**\n\nCould not load the local LLM. Please check that RunAnywhere is correctly initialized.\n\nError: ${err.message}`;
  }

  try {
    // --- First inference attempt ---
    const fullPrompt = buildPrompt(message, profile, history);

    let response = await model.generate({
      prompt: fullPrompt,
      temperature: 0.35,  // Low enough for clinical accuracy, not so low it becomes robotic
      max_tokens: 512,
    });

    let responseText = response?.text?.trim() || '';

    // Strip leaked internal thought tags if any
    responseText = responseText
      .replace(/<(thought|think|reasoning)>[\s\S]*?<\/(thought|think|reasoning)>/gi, '')
      .trim();

    // --- Regeneration guardrail ---
    // If the first response is generic, give the model ONE structured retry
    // with a prompt that makes the failure mode explicit.
    if (isResponseGeneric(responseText, profile)) {
      console.warn('[ChatbotService] Response flagged as generic — triggering targeted regeneration.');

      const regenPrompt = buildRegenerationPrompt(message, profile, responseText);
      const regenResponse = await model.generate({
        prompt: regenPrompt,
        temperature: 0.2,   // Even tighter: we want a specific, corrective answer
        max_tokens: 512,
      });

      const regenText = regenResponse?.text?.trim() || '';

      // Use the regen response if it's meaningfully better
      if (regenText.length > responseText.length + 50) {
        responseText = regenText
          .replace(/<(thought|think|reasoning)>[\s\S]*?<\/(thought|think|reasoning)>/gi, '')
          .trim();
      }
    }

    // --- Final fallback if both attempts fail ---
    if (!responseText || responseText.length < 50) {
      return `I need a bit more detail about your routine or concern to give a precise answer tailored to your profile.`;
    }

    return responseText;

  } catch (error) {
    console.error('[ChatbotService] Inference error:', error);
    return `⚠️ **Inference Error**\n\nThe local model could not process this request.\n\nError: ${error.message}`;
  }
};