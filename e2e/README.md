# Testes E2E (Playwright · full-stack)

Estes testes sobem a **stack completa** — Django real (banco `rachei_e2e`
descartável) + Vite — e dirigem um Chromium como um usuário de verdade. Sem
mocks de API: login confere senha real, cookies de sessão, dados no Postgres.

## Pré-requisitos (uma vez)

1. Backend com dependências instaladas e Postgres no ar (mesmas credenciais do
   `rachei-backend/.env`).
2. Criar o banco descartável **`rachei_e2e`** (a suíte nunca toca o banco de dev):
   ```sql
   CREATE DATABASE rachei_e2e;
   ```
3. Instalar o browser do Playwright:
   ```bash
   npx playwright install chromium
   ```

O `globalSetup` aplica as migrações automaticamente a cada execução; cada teste
chama `POST /api/__e2e__/reset/` para semear um cenário limpo (ver
`e2e/support/e2e.ts` e `apps/e2e/seed.py`).

## Rodar

```bash
pnpm test:e2e            # headless (Django + Vite sobem sozinhos)
pnpm test:e2e -- --headed
npx playwright test --ui
```

Roda em série (`workers: 1`) porque os testes compartilham um único banco e o
resetam entre si.

## Fluxos cobertos (P0)

| Spec | Fluxo |
|------|-------|
| `auth.spec.ts` | Login real → dashboard com dados do usuário |
| `debts.spec.ts` | Criar dívida no grupo → aparece na lista |
| `payment.spec.ts` | Confirmação dupla: devedor declara → credor confirma |
| `settle.spec.ts` | Acertar contas: propor compensação → outra parte confirma |

## Arquitetura

- `config/settings_e2e.py` (backend): banco `rachei_e2e`, envios fake, throttles
  desligados, `E2E_MODE=True` (habilita o endpoint de reset), reuso de conexão.
- `apps/e2e/` (backend): `seed.py` (cenário determinístico), endpoint de reset e
  o comando `manage.py seed_e2e`.
- `playwright.config.ts`: sobe os dois servidores (Django em :8000 com
  `--settings=config.settings_e2e`, Vite em :5173) e roda o Chromium.

## Nota de ambiente (Windows + Python 3.14)

O `psycopg2` sob Python 3.14 no Windows pt-BR pode quebrar ao decodificar
mensagens do libpq em cp1252. Mitigado com `OPTIONS={'client_encoding':'UTF8'}`
(settings) e `CONN_MAX_AGE` no E2E (reuso de conexão). Em Linux/CI/produção não
ocorre.
