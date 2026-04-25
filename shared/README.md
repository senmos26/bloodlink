# Shared

Code TypeScript partagé entre l'app mobile et l'admin web.

## Structure

- `lib/` : Fonctions utilitaires (formatage, validation, etc.)
- `types/` : Types et interfaces partagés (User, Donation, Center, etc.)

## Usage

Dans `mobile/` ou `admin_web/` :

```ts
import { User } from "@bloodlink/shared/types";
import { formatDate } from "@bloodlink/shared/lib";
```
