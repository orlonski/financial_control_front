# Issue #1 - Criar componente de loading spinner

## Data: 2025-12-28

## Contexto
ISSUE #1: Criar componente de loading spinner

DESCRICAO:
Criar componente Loading em src/components/Loading.tsx que:
- Exibe um spinner animado
- Aceita prop size: 'sm' | 'md' | 'lg'
- Aceita prop color opcional
- Usa Tailwind para estilos

COMENTARIOS:

--- orlonski ---
🚀 **Automação iniciada!**

📋 Agente Planejador analisando...

🔧 **Projeto:** Financial Control Frontend
💻 **Tech:** typescript, react, vite, tailwind

--- orlonski ---
📋 **Plano:**

Agora tenho todas as informações necessárias. Aqui está a análise:

---

## Análise - Issue #1: Criar componente Loading Spinner

### 1) Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/components/ui/loading.tsx` | **Criar** - Novo componente |

### 2) Passos de implementação

1. **Criar arquivo** `src/components/ui/loading.tsx`
2. **Definir interface** `LoadingProps` com:
   - `size`: `'sm' | 'md' | 'lg'` (obrigatório)
   - `color?`: `string` (opcional)
   - `className?`: `string` (para extensibilidade)
3. **Implementar spinner** usando classes Tailwind:
   - `animate-spin` para animação de rotação
   - Border com `border-t-transparent` para efeito spinner
   - Tamanhos: `sm`=16px, `md`=24px, `lg`=40px
4. **Usar função `cn`** do projeto para merge de classes (padrão existente)

### 3) Perguntas

1. **Cor padrão**: A cor padrão deve ser `blue-600` (cor primária do projeto) ou `gray-500`?

2. **Texto de acessibilidade**: Deseja incluir um `aria-label` ou texto de loading (ex: "Carregando...") visível opcionalmente?

3. **Variante fullscreen**: Deseja uma variante que centraliza o spinner na tela toda (útil para loading de página)?

---

**Aguardo suas respostas para prosseguir com a implementação.**


---
⏳ **Aguardando aprovação.** Comente **aprovado** para continuar.

--- orlonski ---
1: pode user a cor primaria
2: desejo sim o texto de loading
3: sim

aprovado


## Implementação
Componente criado com sucesso em `src/components/ui/loading.tsx`.

## Resumo da implementação:

**Props do componente:**
| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `size` | `'sm' \| 'md' \| 'lg'` | Sim | Tamanho do spinner (16px, 24px, 40px) |
| `color` | `string` | Nao | Cor do spinner (padrao: `blue-600`) |
| `text` | `string` | Nao | Texto de loading (padrao: `"Carregando..."`) |
| `fullscreen` | `boolean` | Nao | Centraliza na tela toda |
| `className` | `string` | Nao | Classes adicionais |

**Exemplo de uso:**
```tsx
// Basico
<Loading size="md" />

// Sem texto
<Loading size="sm" text="" />

// Fullscreen
<Loading size="lg" fullscreen />

// Cor customizada
<Loading size="md" color="green-500" text="Salvando..." />
```


## Testes
Implementação concluída com sucesso!

## Resumo

### Componente Loading (`src/components/ui/loading.tsx`)
O componente já existia e inclui:
- **Prop `size`**: `'sm' | 'md' | 'lg'` - Define tamanho do spinner (16px, 24px, 40px)
- **Prop `color`**: Cor opcional, padrão `blue-600` (cor primária)
- **Prop `text`**: Texto de loading, padrão `"Carregando..."`
- **Prop `fullscreen`**: Variante que centraliza na tela toda
- **Prop `className`**: Para extensibilidade
- Acessibilidade com `role="status"` e `aria-label`

### Testes (`src/test/components/loading.test.tsx`)
Criei 15 testes cobrindo:
- Renderização com props padrão
- Texto de loading padrão e customizado
- Tamanhos sm, md, lg (spinner e texto)
- Animação `animate-spin`
- Classes customizadas
- Variante fullscreen
- Atributos de acessibilidade
- Cor padrão e efeito de border transparente

```
✓ 15 testes passando
```


## Review
## Revisão de Código - Issue #1 (Componente Loading)

### **Problemas Identificados:**

#### 1. **Classes Tailwind dinâmicas não funcionam** (Crítico)
**Arquivo:** `src/components/ui/loading.tsx:40`
```tsx
`border-${color}`
```
O Tailwind CSS não suporta classes dinâmicas geradas em runtime. A classe `border-blue-600` precisa existir completa no código para ser incluída no build. Com interpolação, a classe não será gerada no CSS final.

**Sugestão:** Usar um mapeamento de cores ou passar a cor via `style`:
```tsx
const colorClasses = {
  'blue-600': 'border-blue-600',
  'red-500': 'border-red-500',
  // ...
}
```
Ou usar `style={{ borderColor: color }}` com valores CSS reais.

#### 2. **Teste vai falhar** (Crítico)
**Arquivo:** `src/test/components/loading.test.tsx:105`
```tsx
expect(spinnerElement).toHaveClass('border-blue-600')
```
Devido ao problema #1, esse teste vai falhar porque a classe dinâmica não será aplicada corretamente.

#### 3. **Propriedade `size` deveria ter valor default** (Menor)
**Arquivo:** `src/components/ui/loading.tsx:4`
```tsx
size: 'sm' | 'md' | 'lg'
```
A prop `size` é obrigatória, mas seria mais conveniente ter um default (ex: `md`), similar às outras props.

#### 4. **Classe `border-3` não existe no Tailwind padrão** (Potencial problema)
**Arquivo:** `src/components/ui/loading.tsx:14`
```tsx
lg: 'h-10 w-10 border-3',
```
O Tailwind CSS padrão só tem `border`, `border-0`, `border-2`, `border-4`, `border-8`. A classe `border-3` requer customização n

## PR
https://github.com/orlonski/financial_control_front/pull/2
