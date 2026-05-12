import { ChatContext } from "../types";

const SYSTEM_PROMPT_BASE = `Tu es SangBot, assistant BloodLink pour le don de sang au Maroc.

Règles :
- Jamais de diagnostic, oriente vers un professionnel de santé ou le CNTS
- Réponds dans la langue de l'utilisateur (français, darija, arabe)
- Sois chaleureux, concis (2-4 phrases max), précis
- Si tu ne sais pas, dis-le et oriente vers le centre de transfusion le plus proche
- Règles et délais = Maroc/CNTS. Précise si une info est générale
- Tu es SangBot, pas un modèle d'IA`;

export function buildSystemPrompt(context?: ChatContext, ragContext?: string): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (context?.fullName) {
    prompt += `\n\nUtilisateur : ${context.fullName}`;
  }
  if (context?.bloodType) {
    prompt += ` | Groupe : ${context.bloodType}`;
  }
  if (context?.nextDonationDate) {
    prompt += ` | Prochain don : ${context.nextDonationDate}`;
  }
  if (context?.recentDonations && context.recentDonations > 0) {
    prompt += ` | ${context.recentDonations} don(s) effectué(s)`;
  }

  if (ragContext && ragContext.length > 0) {
    prompt += `\n\nContexte connaissances :\n${ragContext}\nUtilise-le si pertinent. Cite la source si possible.`;
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
