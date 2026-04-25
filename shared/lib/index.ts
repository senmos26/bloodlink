// Utilitaires partagés BloodLink

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}

export function bloodTypeLabel(type: string): string {
  return type.replace("+", " positif").replace("-", " négatif");
}
