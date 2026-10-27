# Stack 100% TypeScript com NestJS e autenticação própria

A versão anterior da A Taverna usava uma API em .NET com Supabase Auth. No recomeço, migramos a stack inteira para TypeScript: uma SPA em React + Vite consome uma API em NestJS, no mesmo monorepo pnpm (`apps/web`, `apps/api` e `packages/shared` com os contratos), com Postgres acessado via Drizzle e tudo (web, api e banco) hospedado no Railway. O motivo é ter uma única linguagem no repositório inteiro, com os contratos da API compartilhados entre web e api. A autenticação é feita na própria API (nome de usuário e senha com hash, JWT em cookie httpOnly), sem depender de um provedor externo.

## Consequences

- Login social, recuperação de senha e confirmação de e-mail não existem de graça: cada um tem de ser construído na API.
