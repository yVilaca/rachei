# Rachei Frontend — Instruções para Claude

## Convenções de ambiente e ferramentas

Antes de instalar dependências ou introduzir qualquer ferramenta, **detecte e siga o que o repositório já usa** — não traga alternativas em paralelo.

- **Gerenciador de pacotes / lockfile**: o lockfile presente é a fonte da verdade. Use exatamente o gerenciador dele e **nunca** crie um segundo lockfile no mesmo projeto. Um projeto = um gerenciador = um lockfile.
- **Ferramentas base** (runtime, bundler, test runner, linter, formatador): respeite a escolha já existente antes de propor outra. Trocar ferramenta base é decisão explícita, não efeito colateral de uma tarefa.
- **Dependências reais vão declaradas** no `package.json`; nunca depender de algo que só existe no ambiente local. Uma instalação limpa (do zero) tem que funcionar.
- **Config que varia por máquina/ambiente** fica em arquivo ignorado pelo git (ex.: `.env*`); segredos nunca vão para o repositório.
- **Na dúvida, olhe antes de agir**: inspecione o lockfile e os arquivos de config; se encontrar duplicidade/inconsistência, consolide em um só — não conviva com dois.
- **Sincronismo com o backend**: qualquer mudança de contrato (campos, formato) deve ser refletida dos dois lados; rode as travas locais (hooks) antes do push.

## Stack (o que já está estabelecido — respeite)

- **Gerenciador**: pnpm (lockfile `pnpm-lock.yaml`; versão fixada em `package.json > packageManager`). Scripts de build permitidos ficam em `pnpm-workspace.yaml` (`allowBuilds`).
- **Base**: Vite + React + TypeScript.
- **Testes**: Vitest + Testing Library + MSW (`pnpm test:run`). Config em `vitest.config.ts`.
- **Qualidade**: ESLint + Prettier. Build/typecheck: `pnpm build` (`tsc -b && vite build`).
