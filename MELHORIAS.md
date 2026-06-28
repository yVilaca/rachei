# Rachei — Review de Telas e Plano de Melhorias

> Revisão completa do frontend antes de iniciar o backend.
> Data: 28/06/2026 · Escopo: todas as telas e componentes em `rachei/src/`

O objetivo deste documento é (1) registrar o estado atual de cada tela, (2) listar as **decisões que travam o backend** e precisam ser resolvidas antes, e (3) dar uma fila priorizada de limpeza e polimento.

---

## 🔑 Resumo executivo

O app está visualmente coeso e o fluxo principal (criar dívida → cobrar → pagar → confirmar) funciona ponta a ponta sobre dados mockados. Os pontos mais importantes antes do backend são, em ordem:

1. **Modelo monetário em float** — risco real de erro de arredondamento. Migrar para centavos (inteiros).
2. **Sem camada de API** — componentes chamam o Zustand direto. Sem uma abstração, trocar mock → real toca todas as telas.
3. **Sem estados de loading / erro / vazio** — tudo é síncrono hoje. Toda tela async vai precisar deles.
4. **Auth é mock** — falta token/sessão, interceptors, expiração.
5. **Inconsistências de estilo e código acumuladas** — dois paradigmas de CSS coexistindo, 6 componentes órfãos, paletas de avatar duplicadas e divergentes.

---

## 🚧 P0 — Decisões que travam o backend (resolver ANTES)

### 1. Dinheiro como float → migrar para centavos (inteiros)
**Severidade: alta.** O modelo guarda valores como `number` em reais: [types/index.ts](rachei/src/types/index.ts) (`totalAmount`, `amount`) e [mock-data.ts](rachei/src/lib/mock-data.ts) (`240.0`, `80.0`). O [DebtForm](rachei/src/features/debts/components/DebtForm.tsx) já trabalha internamente em centavos (`amountCents`) e converte para float só na submissão (`/ 100`) — ou seja, **introduzimos float justamente na fronteira com o store**.

Somar/dividir floats acumula erro (`0.1 + 0.2 !== 0.3`). Numa divisão de R$ 100 entre 3, o resto vira dízima.

**Recomendação:** padronizar **centavos como inteiros** no modelo inteiro (`totalAmountCents`, `amountCents`), formatar para exibição só na borda (`formatCurrency` recebe centavos). Decidir agora, porque muda o contrato da API.

### 2. Introduzir camada de serviço/API (abstração de dados)
**Severidade: alta.** Hoje as telas importam `useAppStore()` e chamam `addDebt`, `updateInstallmentStatus`, `getDebtsByGroup` diretamente. Quando o backend entrar, cada tela muda.

**Recomendação:** criar `src/services/` (ou `src/api/`) com funções assíncronas (`debtsService.create()`, `.list()`, etc.). O Zustand passa a ser cache do resultado, não fonte da verdade. Assim o swap mock → HTTP fica isolado. Considerar React Query / TanStack Query para cache, loading e revalidação.

### 3. Geração de IDs no cliente
**Severidade: média.** IDs são criados com `debt-${Date.now()}` e `inst-${Date.now()}-${i}` em [app.store.ts](rachei/src/stores/app.store.ts). Colidem se duas ações ocorrem no mesmo ms, e o servidor vai gerar os IDs reais.

**Recomendação:** definir estratégia de **IDs otimistas** (uuid temporário no cliente → reconciliar com ID do servidor na resposta), ou só renderizar após confirmação do servidor.

### 4. Autenticação real
**Severidade: alta.** [auth.store.ts](rachei/src/stores/auth.store.ts) aceita qualquer credencial e seta o usuário mock. Falta: token/sessão, refresh, expiração, header de Authorization, e tratamento de 401 global. O `persist` guarda o usuário, mas não há token.

**Recomendação:** definir o fluxo (JWT? cookie de sessão?) antes, pois afeta o interceptor HTTP e o `PrivateRoute`.

### 5. Normalização do modelo de dados
**Severidade: média.** O modelo embute objetos `User` inteiros dentro de `Installment.debtor` e `GroupMember.user` ([types/index.ts](rachei/src/types/index.ts)). A API real provavelmente retornará referências (`debtorUserId`) e uma lista separada de usuários.

**Recomendação:** decidir entre (a) o backend hidratar e devolver aninhado, ou (b) normalizar no cliente (store de usuários + lookup). Afeta o shape de toda resposta.

### 6. Estados de loading / erro / vazio
**Severidade: alta.** Nenhuma tela tem skeleton, spinner ou tratamento de falha — tudo resolve síncrono do mock. Telas de lista (Dashboard, Grupos, Atividade, DebtDetail) e ações (enviar comprovante, cobrar) vão todas precisar disso quando virarem chamadas de rede.

**Recomendação:** criar componentes base (`<Skeleton/>`, `<ErrorState/>`, `<EmptyState/>`) agora e já usá-los nas listas. Há vazios bons já feitos em Atividade e Dashboard que servem de molde.

### 7. Persistência e serialização do `app.store`
**Severidade: média.** [auth.store.ts](rachei/src/stores/auth.store.ts) usa `persist`, mas [app.store.ts](rachei/src/stores/app.store.ts) **não** — dívidas criadas e status de leitura somem ao recarregar. Além disso, `readEventIds` é um `Set`, que **não serializa** com o JSON padrão do `persist`.

**Recomendação:** com backend, o status de leitura deveria ser server-side de qualquer forma. Decidir se `readEventIds` vira uma tabela `notification_reads` ou fica local (e então precisa de storage customizado para `Set`).

### 8. Geração de link de cobrança acoplada ao browser
**Severidade: baixa.** `generateChargeLink` usa `Math.random()` (não seguro) e `window.location.origin` dentro do store ([app.store.ts](rachei/src/stores/app.store.ts)). Token de cobrança real deve vir do servidor (assinado, com expiração validada no servidor).

---

## 🧹 P1 — Limpeza e consistência (barato, idealmente antes do backend)

### 9. Remover 6 componentes órfãos
Substituídos pelos redesenhos inline, mas nunca deletados. Confundem quem for mexer:
- [features/debts/components/InstallmentRow.tsx](rachei/src/features/debts/components/InstallmentRow.tsx) — substituído pelos cards inline do DebtDetailPage
- [features/debts/components/SplitSelector.tsx](rachei/src/features/debts/components/SplitSelector.tsx) — substituído pelo toggle segmentado do DebtForm
- [features/groups/components/MemberList.tsx](rachei/src/features/groups/components/MemberList.tsx) — não usado
- [features/dashboard/components/BalanceCard.tsx](rachei/src/features/dashboard/components/BalanceCard.tsx) — inline no DashboardPage
- [features/dashboard/components/FriendRow.tsx](rachei/src/features/dashboard/components/FriendRow.tsx) — inline no DashboardPage
- [features/dashboard/components/GroupCard.tsx](rachei/src/features/dashboard/components/GroupCard.tsx) — inline no DashboardPage

> `StatusBadge` ainda é usado pelo `PaymentLinkPage` — manter por enquanto (ver item 14).

### 10. Centralizar paleta de avatar e o hash `avatarFor`
A mesma pessoa pode ter cores diferentes dependendo da tela:
- [DashboardPage](rachei/src/features/dashboard/DashboardPage.tsx) e [DebtDetailPage](rachei/src/features/debts/DebtDetailPage.tsx): `AVATAR_PALETTE` (6 cores) + função `avatarFor` **duplicada idêntica**
- [GroupHeader](rachei/src/features/groups/components/GroupHeader.tsx): `AVATAR_COLORS` (5 cores **diferentes**, indexadas por posição — não por ID)
- [DebtList](rachei/src/features/groups/components/DebtList.tsx): `DEBT_ICON_COLORS` (paleta própria)

**Recomendação:** um único `src/lib/avatar.ts` com a paleta e `avatarFor(id)` estável por ID, usado em todo lugar.

### 11. Unificar o paradigma de estilo
Hoje convivem dois sistemas:
- **Tailwind/classes:** AuthPage, LoginForm, RegisterForm, GroupPage, PaymentLinkPage, QuickRegisterForm, NotFoundPage
- **Inline `style={{}}`:** DashboardPage, ActivityPage, DebtDetailPage, ProfilePage, GroupsPage, BottomNav, GroupHeader, DebtList, DebtForm

Os hex coral `#FF5436`, muted `#9A9AA4`, ink `#15151A`, verde `#0E8F5C` etc. estão hardcoded dezenas de vezes, embora o `tailwind.config` já tenha `brand`/`muted`. **Decidir um paradigma** e extrair tokens (cores, raios, sombras, espaçamentos) para um único lugar. Isso paga muito dividendo na manutenção.

### 12. Padronizar o padding-top dos cabeçalhos
Inconsistência real: telas que reservam espaço para a status bar (52px) vs. as que não reservam:
- **52px:** Dashboard, Atividade, DebtDetail
- **22px:** [ProfilePage](rachei/src/features/profile/ProfilePage.tsx), [GroupsPage](rachei/src/features/groups/GroupsPage.tsx)
- **14px:** [GroupHeader](rachei/src/features/groups/components/GroupHeader.tsx)

Em dispositivo real, Perfil/Grupos/Grupo vão colar o conteúdo no topo/notch. Padronizar (idealmente via `env(safe-area-inset-top)`).

### 13. `NOW` hardcoded na tela de Atividade
[ActivityPage.tsx](rachei/src/features/activity/ActivityPage.tsx) tem `const NOW = new Date('2026-06-28T12:00:00Z')` para calcular datas relativas. Funciona só porque casa com as datas do mock — vai dar datas erradas ("há -3 dias") com dados reais. Trocar por `new Date()` real (ou data do servidor) quando os timestamps forem reais.

### 14. Redesenhar a `PaymentLinkPage` (tela pública de pagamento)
**Importante:** é a tela que um **não-usuário** abre ao receber a cobrança — provavelmente a de maior impacto em conversão — e é a **menos polida**. Continua no estilo Tailwind antigo ([PaymentLinkPage.tsx](rachei/src/features/payment/PaymentLinkPage.tsx)), destoando do resto do app, enquanto o protótipo tem uma versão caprichada (header "Rachei · link seguro", valor grande, card de detalhes, anexo, nota de confirmação dupla). A `DebtorView` nova do DebtDetail já tem quase tudo isso — dá pra extrair componentes e compartilhar.

### 15. Botões e CTAs sem ação
- "+ Criar novo grupo" em [GroupsPage](rachei/src/features/groups/GroupsPage.tsx) e [DashboardPage](rachei/src/features/dashboard/DashboardPage.tsx): `onClick={() => {}}`
- "Assinar Pro · R$ 9,90/mês" em [ProfilePage](rachei/src/features/profile/ProfilePage.tsx): `div` sem handler
- Toggles de notificação em Perfil: só estado local, não persistem nem ligam em nada

Decidir se viram fluxo real (criação de grupo é uma tela inteira que falta) ou se ganham um estado "em breve".

---

## ♿ P2 — Acessibilidade e polimento

### 16. Contraste do texto secundário abaixo do mínimo WCAG
O cinza `#9A9AA4` sobre branco rende ~**2.8:1**, abaixo do AA (4.5:1 para texto normal; 3:1 para grande). É o cor de sub-texto usada em quase todas as telas; `#A5A5AE` é ainda mais claro. Escurecer um tom (ex.: `#6B6B76`, que já é usado em alguns lugares) resolve.

### 17. Toggles e elementos clicáveis sem semântica
- Os toggles de notificação ([ProfilePage](rachei/src/features/profile/ProfilePage.tsx)) são `div` com `onClick` — sem `role="switch"`, `aria-checked`, nem suporte a teclado.
- "Sair da conta" e o CTA do Pro são `div` clicáveis — viram `<button>`.
- Vários elementos inline-styled não têm `:focus-visible` — usuário de teclado não vê foco. Os componentes Tailwind (`button`) têm ring; os inline não.

### 18. `alert()` + clipboard sem fallback
Cobrar gera o link e usa `alert()` + `navigator.clipboard.writeText` em [DashboardPage](rachei/src/features/dashboard/DashboardPage.tsx) e [DebtDetailPage](rachei/src/features/debts/DebtDetailPage.tsx). `alert()` é placeholder; clipboard falha em contexto não-seguro/sem permissão e não há tratamento. Trocar por toast + fallback (ex.: abrir wpp com texto, ou modal de cópia).

### 19. Upload de comprovante é placeholder
`URL.createObjectURL(proofFile)` cria um blob URL perdido no reload e nunca revogado (vaza memória). Em [DebtDetailPage](rachei/src/features/debts/DebtDetailPage.tsx) e [PaymentLinkPage](rachei/src/features/payment/PaymentLinkPage.tsx). Vira upload real (multipart/S3) com o backend.

### 20. Detalhes menores
- `formatDate` ([utils.ts](rachei/src/lib/utils.ts)) mostra só dia+mês — ambíguo entre anos.
- Tamanhos de fonte em `px` fixo não respeitam preferência do usuário; `rem` é mais acessível.
- Toast do DebtForm em `top: 24` pode colidir com o notch — considerar `safe-area-inset`.
- Self-share: a parcela do próprio pagador entra como `paid` ([app.store.ts](rachei/src/stores/app.store.ts)), o que infla o "X de Y quitados" (conta o pagador). Decidir se o pagador deve contar no progresso.

---

## 📋 Estado por tela

| Tela | Arquivo | Estado | Pendências principais |
|------|---------|--------|----------------------|
| Login / Cadastro | `features/auth/*` | OK (mock) | Tailwind antigo; sem loading/erro de servidor; valida só presença |
| Dashboard | `features/dashboard/DashboardPage.tsx` | Bom | `alert()` na cobrança; "criar grupo" morto; avatarFor duplicado |
| Grupos (lista) | `features/groups/GroupsPage.tsx` | Bom | padding-top 22px; "criar grupo" morto |
| Grupo (detalhe) | `features/groups/GroupPage.tsx` + Header/DebtList | Bom | paleta de avatar própria; padding-top 14px |
| Nova dívida | `features/debts/NewDebtPage.tsx` + DebtForm | Muito bom | introduz float na borda; label sem `htmlFor` |
| Detalhe da dívida | `features/debts/DebtDetailPage.tsx` | Muito bom | `alert()`; upload placeholder; progresso conta pagador |
| Pagamento (link público) | `features/payment/PaymentLinkPage.tsx` | **Defasado** | redesenhar p/ casar com o app (item 14) |
| Atividade | `features/activity/ActivityPage.tsx` | Muito bom | `NOW` hardcoded; leitura não persiste |
| Perfil | `features/profile/ProfilePage.tsx` | Bom | toggles sem a11y/persistência; CTA Pro morto; padding-top 22px |

---

## 🗺️ Ordem sugerida

**Antes de escrever qualquer endpoint:**
1. Fechar o **contrato de dados**: centavos (item 1) + normalização (item 5) + estratégia de ID (item 3) + auth (item 4).
2. Criar a **camada de serviço** (item 2) ainda apontando para o mock, já com `async`.
3. Adicionar **loading/erro/vazio** base (item 6) nas listas.

**Limpeza barata em paralelo (não bloqueia backend):**
4. Remover órfãos (item 9), centralizar avatar (item 10) e tokens de cor (item 11), padronizar headers (item 12), corrigir `NOW` (item 13).

**Depois / contínuo:**
5. Redesenhar PaymentLinkPage (item 14), acessibilidade (16–17), e fluxos que faltam (criar grupo, assinar Pro — item 15).

---

*Gerado a partir de review manual de todos os 44 arquivos em `rachei/src/`.*
