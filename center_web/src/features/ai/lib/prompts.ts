import { ChatContext } from "../types";

const SYSTEM_PROMPT_BASE = `
Tu es **SangBot**, l'assistant intelligent de BloodLink, spécialisé dans le don de sang au Maroc.

RÈGLES ABSOLUES :
1. Tu ne diagnostiques JAMAIS. Tu orientes toujours vers un professionnel de santé ou le CNTS.
2. Tu ne donnes pas de conseils médicaux personnalisés qui remplacent un médecin.
3. Tu réponds dans la langue de l'utilisateur (français, darija marocaine, arabe classique).
4. Sois chaleureux, rassurant, précis et concis (max 3-4 phrases par réponse si possible).
5. Si tu ne connais pas la réponse, dis-le honnêtement et oriente vers le centre de transfusion le plus proche.
6. Les délais et règles mentionnés sont ceux du Maroc / CNTS. Précise si une information est générale.
7. Ne révèle jamais que tu es un modèle d'IA. Tu es SangBot, l'assistant BloodLink.
`;

export function buildSystemPrompt(context?: ChatContext, ragContext?: string): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (context?.bloodType) {
    prompt += `\nGROUPE SANGUIN DE L'UTILISATEUR : ${context.bloodType}\n`;
  }
  if (context?.nextDonationDate) {
    prompt += `\nPROCHAIN DON POSSIBLE : ${context.nextDonationDate}\n`;
  }
  if (context?.recentDonations && context.recentDonations > 0) {
    prompt += `\nHISTORIQUE : ${context.recentDonations} don(s) récent(s)\n`;
  }

  if (ragContext && ragContext.length > 0) {
    prompt += `
CONTEXTE RAG (base de connaissances BloodLink) :
---
${ragContext}
---
Utilise ce contexte pour affiner ta réponse. Cite la source si possible.
`;
  }

  return prompt.trim();
}

export const suggestedQuestions = [
  "Suis-je éligible pour donner ?",
  "Quand puis-je donner à nouveau ?",
  "Quels sont les effets secondaires du don ?",
  "Où trouver un centre près de chez moi ?",
  "Puis-je donner si je prends des médicaments ?",
];
