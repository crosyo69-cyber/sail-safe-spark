# Template de module — standard obligatoire

Copier ce dossier, puis répartir les fichiers dans les couches officielles :

| Fichier du template | Destination réelle |
| --- | --- |
| `types.ts` | `src/features/<module>/types.ts` |
| `example.service.ts` | `src/services/<domaine>.service.ts` |
| `useExample.ts` | `src/hooks/services/use<Domaine>.ts` |
| `useAdminExample.ts` | `src/hooks/admin/useAdmin<Module>.ts` |
| `components/*` | `src/components/admin/<module>/*` |
| `ExamplePage.tsx` | `src/pages/Admin<Module>.tsx` |
| `index.ts` | `src/features/<module>/index.ts` |

Flux imposé (validé par ESLint) :

```text
Page → Hook admin → Hook React Query → Service → createApiClient → Supabase
```

Voir `docs/development-guide.md` pour la checklist de validation.