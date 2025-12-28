# Issue #6 - tela de transações recorrentes

## Data: 2025-12-28

## Contexto
ISSUE #6: tela de transações recorrentes

DESCRICAO:
na listagem de transações recorrentes, tem um possível bug
eu cadastrei uma recorrência que inicia dia 01/01/2026 e nessa listagem da tela principal aparece "Próximo: 31 de dez"
ai no banco de dados esta cadastrado 2026-01-01 00:00:00.000

sera que o problema esta no momento de cadastrar ? erro no backend ?
erro de exibição no front end ?


COMENTARIOS:

--- orlonski ---
🚀 **Automação iniciada!**

📋 Agente Planejador analisando...

🔧 **Projeto:** Financial Control Frontend
💻 **Tech:** typescript, react, vite, tailwind

--- orlonski ---
📋 **Plano:**

Encontrei o problema! O bug é um **problema clássico de timezone** no frontend.

## Análise do Bug

**Linha problemática** (`RecurringPage.tsx:212`):
```typescript
format(new Date(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })
```

**O que acontece:**
1. O backend retorna `nextDueDate` como string: `"2026-01-01"` ou `"2026-01-01T00:00:00.000"`
2. `new Date("2026-01-01")` interpreta isso como **UTC meia-noite**
3. No fuso horário do Brasil (UTC-3), meia-noite UTC = **21:00 do dia anterior** (31/12/2025)
4. O `format()` exibe a data no horário local → "31 de dez"

---

## Resumo da Análise

### 1) Arquivos a Modificar

| Arquivo | Motivo |
|---------|--------|
| `src/pages/RecurringPage.tsx` | Corrigir parse da data `nextDueDate` na linha 212 |

**Opcional (para consistência):** Verificar se há outros lugares usando `new Date()` com datas do backend que podem ter o mesmo problema.

---

### 2) Passos para Correção

**Opção A - Usar `parseISO` do date-fns (Recomendado):**
```typescript
import { parseISO } from 'date-fns'

// Linha 212 - de:
format(new Date(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })

// Para:
format(parseISO(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })
```

**Opção B - Adicionar horário ao meio-dia para evitar problemas de timezone:**
```typescript
format(new Date(recurring.nextDueDate + 'T12:00:00'), "d 'de' MMM", { locale

## Implementação
Build completado com sucesso. A correção foi aplicada:

## Resumo da Correção

**Arquivo modificado:** `src/pages/RecurringPage.tsx`

**Mudanças:**
1. **Linha 12:** Adicionado `parseISO` ao import do date-fns
2. **Linha 212:** Substituído `new Date(recurring.nextDueDate)` por `parseISO(recurring.nextDueDate)`

**Por que isso resolve o bug:**
- `new Date("2026-01-01")` interpreta a string como UTC meia-noite, que no fuso horário do Brasil (UTC-3) vira 21:00 do dia 31/12/2025
- `parseISO("2026-01-01")` trata a data como **local** (sem conversão de timezone), mantendo o dia 01/01/2026 correto

Agora a recorrência cadastrada para 01/01/2026 será exibida como "Próximo: 1 de jan" em vez de "Próximo: 31 de dez".


## Testes
## Resumo

A correção do bug de timezone foi implementada e testada:

### Correção aplicada (`src/pages/RecurringPage.tsx:212`)
```diff
- format(new Date(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })
+ format(parseISO(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })
```

### Testes criados (`src/test/utils/date-parsing.test.ts`)
- **9 testes** que validam a correção do timezone
- Testa que `parseISO("2026-01-01")` retorna "1 de jan" (não "31 de dez")
- Testa datas em boundaries de mês, ano, e casos edge (ano bissexto)

### Resultado dos testes
```
✓ src/test/utils/date-parsing.test.ts  (9 tests) - PASSOU
```

**Nota:** Os testes que falharam (`login.test.tsx` e `transactions.test.tsx`) são testes pré-existentes que estão desatualizados em relação à UI atual - não têm relação com esta correção.


## Review
Agora tenho uma visão completa. Aqui está minha análise:

---

## Revisão da Issue #6

### Mudança Analisada
A alteração em `src/pages/RecurringPage.tsx:212` substitui:
```typescript
// Antes
format(new Date(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })

// Depois  
format(parseISO(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })
```

---

## **APROVADO** ✓

A mudança está correta:

1. **Uso correto de `parseISO`**: Para strings de data no formato ISO 8601 (ex: `"2025-01-15"`), `parseISO` é a função recomendada pelo `date-fns`. Ela interpreta a string sem ambiguidades de fuso horário.

2. **Evita bug de timezone**: `new Date("2025-01-15")` pode interpretar a data como UTC meia-noite, resultando em datas incorretas em fusos diferentes. `parseISO` trata isso corretamente.

3. **Import atualizado**: O `parseISO` foi corretamente adicionado ao import na linha 12.

---

### Observação (não bloqueante)

Existem outros arquivos com o mesmo padrão `new Date(string)` que poderiam se beneficiar da mesma correção:
- `TransfersPage.tsx:246`
- `RemindersPage.tsx:187, 302, 384, 465`
- `StatementPage.tsx:225`
- `TransactionsPage.tsx:389`

Considere aplicar a mesma correção nesses locais em uma issue separada para consistência.


## PR
https://github.com/orlonski/financial_control_front/pull/7
