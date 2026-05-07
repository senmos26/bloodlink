# Configuration des variables d'environnement pour l'admin web

Créez un fichier `.env.local` dans le dossier `admin_web/` avec le contenu suivant :

```bash
# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xgdinqpxjywlfhjylktu.supabase.co

# Clé service role de Supabase (à utiliser uniquement côté serveur)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGlucXB4anl3bGZoanlsa3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2MDc1MSwiZXhwIjoyMDkyNjM2NzUxfQ.bA7ZNVhYHJRX3i25RrzmTqWByxtMFev_4CC1ux7MRE8

# Clé anonyme de Supabase (peut être publique)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGlucXB4anl3bGZoanlsa3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjA3NTEsImV4cCI6MjA5MjYzNjc1MX0.jP0o6MxlXxsrAh43c2L7UTY8xMZRKQybA8SVpdwfqVA
```

## Où trouver ces clés :

1. Allez dans votre dashboard Supabase
2. Project Settings > API
3. Copiez les valeurs depuis :
   - Project URL (pour NEXT_PUBLIC_SUPABASE_URL)
   - service_role (pour SUPABASE_SERVICE_ROLE_KEY) 
   - anon/public (pour NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Important :

- Ne jamais partager la clé `service_role` (elle a tous les droits)
- Le fichier `.env.local` ne doit jamais être commité dans Git
- Redémarrez le serveur de développement après avoir ajouté les variables
