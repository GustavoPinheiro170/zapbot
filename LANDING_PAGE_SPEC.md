# 🚀 Especificação de Landing Page: Atlas-inspired AI SaaS

Documento de especificação técnica, visual, estrutural e comportamental para a criação de uma Landing Page SaaS de IA com estética minimalista, editorial e de alto padrão (*premium tech*).

---

## 📌 1. Visão Geral & Metadados

- **Nome do Projeto:** Atlas-inspired AI SaaS Landing Page
- **Objetivo:** Especificação completa para replicar o design e a experiência interativa da página de referência.
- **Direcionamento de Design:** `Minimalista` • `Premium` • `Editorial` • `Tecnológico` • `Clean`
- **Fluxo Narrativo:**
  $$\text{Problema / Benefício} \longrightarrow \text{Demonstração do Produto} \longrightarrow \text{Capacidades} \longrightarrow \text{Colaboração} \longrightarrow \text{Aprendizado} \longrightarrow \text{Time de IA} \longrightarrow \text{Segurança} \longrightarrow \text{Onboarding} \longrightarrow \text{CTA}$$

---

## 🎨 2. Design Tokens & Identidade Visual

### 2.1 Paleta de Cores
| Token | Valor Hex / Definição | Aplicação / Regras |
| :--- | :--- | :--- |
| `background` | `#FFFFFF` | Fundo predominante da página |
| `light_section` | `#F7F7F8` | Seção de time / showcase secundário |
| `dark_section` | `#05070D` | Seção técnica de segurança / contraste final |
| `primary_text` | `#08090B` | Headlines principais e títulos |
| `secondary_text` | `#5F6269` | Subtítulos e corpos de texto |
| `muted_text` | `#8A8D94` | Eyebrows, legendas e textos de apoio |
| `border` | `#E8E9EC` | Bordas sutis de cards e divisores |
| `button` | `#050505` | Cor de fundo dos botões principais (Pill CTA) |
| `button_text` | `#FFFFFF` | Texto e ícones dos botões |
| `accent_gradient` | `linear-gradient(135deg, #2446FF, #7B3FF2, #FF2E9A, #FF1744, #FFB000)` | **Apenas bordas de screenshots e micro-destaques** (não usar como fundo) |
| `glow` | Azul / Roxo com grande blur e baixa opacidade | Iluminação sutil sobre a seção escura |

### 2.2 Tipografia
- **Font Family:** `Inter`, `SF Pro Display`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Pesos:**
  - Headlines: `700` (Bold)
  - Body: `400` (Regular)
  - Buttons / Eyebrows: `600` (Semi-bold)
- **Letter Spacing em Títulos:** `-0.045em` *(tracking negativo para visual compacto e editorial)*

| Nível | Desktop | Mobile | Line Height |
| :--- | :--- | :--- | :--- |
| **Hero Headline** | 52px – 64px | 38px – 44px | `0.98 – 1.05` |
| **Section Heading** | 38px – 48px | 32px – 38px | `1.00 – 1.08` |
| **Body** | 14px – 16px | 14px – 15px | `1.45 – 1.60` |
| **Eyebrow / Pill** | 11px – 13px | 11px – 12px | `1.20` |

### 2.3 Layout & Grid
- **Largura Máxima do Container:** `1180px – 1240px`
- **Largura do Bloco de Texto (Hero):** `650px – 760px`
- **Largura do Bloco de Texto (Features):** `360px – 460px`
- **Padding Lateral:** `52px – 72px` (Desktop) | `20px – 24px` (Mobile)
- **Espaçamento entre Seções:** `140px – 220px` *(respiro vertical acentuado)*
- **Border Radius:**
  - `small`: `8px`
  - `medium`: `14px`
  - `large`: `20px`
  - `screenshot`: `14px – 18px`
- **Sombras:**
  - Card: `0 12px 40px rgba(0, 0, 0, 0.08)`
  - Screenshot: `0 18px 50px rgba(0, 0, 0, 0.12)`

---

## 🧭 3. Diretrizes de Estilo Global

### ✅ Boas Práticas (Must Have)
- **Muito espaço negativo (whitespace):** Garante a sensação de produto sofisticado.
- **Alto contraste tipográfico:** Títulos pretos, densos e compactos contra fundos limpos.
- **Economia de cores:** Base monocromática com acento no gradiente multicolorido.
- **Screenshots como objetos físicos:** Molduras de gradiente de 3px a 5px com sombra e cantos arredondados.
- **Mascote 3D:** Humanização da tecnologia com robô 3D minimalista.
- **Ritmo editorial lento:** Seções que respiram e guiam o olhar naturalmente.

### 🚫 O que evitar (Anti-patterns)
- Excesso de cartões e dashboards carregados.
- Planos de fundo complexos, gradientes dominantes ou texturas pesadas.
- Sombras pretas duras e efeitos neon estridentes.
- Tipografia decorativa ou itálicos excessivos.
- Múltiplos CTAs concorrentes na mesma dobra.
- Animações rápidas e mecânicas.

---

## 🏗️ 4. Estrutura e Blueprint das Seções

### 1. Header (`#header`)
- **Tipo:** Minimal Navigation.
- **Layout:** Logo compacto à esquerda + Botão CTA em formato de pílula à direita.
- **Dimensões:** Altura `52px – 64px`, padding lateral `24px – 52px`.
- **Fundo:** Transparente com transição para blur sutil no scroll.
- **Mobile:** Manter apenas Logo e botão CTA.

---

### 2. Hero Section (`#hero`)
- **Alinhamento:** Centralizado.
- **Conteúdo:**
  1. Headline compacta de 2 linhas (`52-64px`).
  2. Subheadline explicativa de 1 a 2 linhas (`16px`, `#5F6269`).
  3. Mascote 3D posicionado logo abaixo do texto (`240px – 360px`).
- **Visual do Mascote:** Robô 3D futurista branco com acabamento fosco/studio lighting e visor azul luminoso.
- **Animações:**
  - Headline com fade-up (`opacity: 0 -> 1`, `translateY: 24px -> 0`).
  - Subheadline com fade-up escalonado (delay de 100ms).
  - Mascote com escala sutil (`0.96 -> 1.00`) e animação de flutuação contínua (`floating vertical`).

---

### 3. Vitrine Principal do Produto (`#product_showcase_01`)
- **Tipo:** Large Product Screenshot.
- **Layout:** Centralizado, ocupando de 90% a 100% da largura do container.
- **Tratamento Visual:**
  - Moldura de `3px – 5px` com `accent_gradient`.
  - Border-radius de `14px – 18px`.
  - Sombra suave profunda `0 18px 50px rgba(0,0,0,0.12)`.
- **Animação:** Revelação progressiva via escala e fade no scroll reveal.

---

### 4. Benefícios em Tríade (`#feature_triplet`)
- **Tipo:** Three Column Benefits.
- **Layout:** 3 colunas no Desktop, 1 coluna no Mobile.
- **Estilo:** Sem bordas de cartões; tipografia direta e limpa.
  - Títulos: `12px – 14px`, peso 600.
  - Corpo: `11px – 13px`, cor `#666970`.

---

### 5. Seções de Funcionalidades Divididas (Split Features)

#### Split 01 — Integrações & Conectividade (`#feature_split_01`)
- **Layout:** Texto 40% (esquerda) + Visual 60% (direita).
- **Conteúdo:** Headline curta (2-3 linhas) + Descrição (2-4 linhas).
- **Visual:** Mascote 3D interagindo com screenshot da interface e ícones flutuantes de integração.
- **Motion:** Efeito parallax suave nos ícones flutuantes com delays assimétricos.

#### Split 02 — Colaboração & Conversação (`#feature_split_02`)
- **Layout:** Visual 50% (esquerda) + Texto 50% (direita).
- **Visual:** Painel de chat/cartão flutuante minimalista com micro-sombras.
- **Conteúdo:** Demonstração da fluidez da IA no fluxo de trabalho.

#### Split 03 — Inteligência Contextual & Aprendizado (`#feature_split_03`)
- **Layout:** Texto 45% (esquerda) + Visual 55% (direita).
- **Visual:** Mascote analisando pequenos cartões de dados e contextos em cascata.
- **Conteúdo:** Explicação do aprendizado contínuo do agente.

---

### 6. Seção de Time de Agentes (`#team_section`)
- **Tipo:** Centered Showcase.
- **Background:** `#F7F7F8` *(cinza muito claro para respiro visual)*.
- **Alinhamento:** Centralizado.
- **Conteúdo:**
  - Grupo de mascotes/agentes especializados.
  - Headline de alto impacto.
  - Descrição concisa.
  - Screenshot da interface de orquestração com escala reduzida.
- **Motion:** Entrada sequencial dos agentes com micro-floating.

---

### 7. Seção de Segurança & Governança (`#security_section`)
- **Tipo:** Dark Technical Feature.
- **Background:** `#05070D` *(fundo escuro de alto contraste)*.
- **Cores:** Texto em `#FFFFFF`, subtítulos em `#8A8D94`.
- **Visual:** Wireframe técnico/esquemático do mascote com opacidade `0.25 – 0.55` e glow azul sutil ao fundo.
- **Motion:** Fade-in lento do wireframe e pulso imperceptível de iluminação.

---

### 8. Onboarding & Conversão Final (`#onboarding_cta`)
- **Tipo:** 3-Step Flow + CTA Pill.
- **Alinhamento:** Centralizado.
- **Estrutura:**
  - Headline em formato de pergunta provocativa.
  - **3 Passos Visuais:** Mini-screenshots numeradas do fluxo de ativação (3 colunas desktop / 1 coluna mobile).
  - **Botão CTA:** Formato Pill preto (`#050505`) com texto branco.
  - Link secundário discreto logo abaixo.

---

### 9. Rodapé Minimalista (`#footer`)
- **Estilo:** Espaçamento `70px – 100px` superior, tipografia `9px – 11px`, cor `#777A80`.
- **Conteúdo:** Copyright, links de contato, termos de serviço e privacidade dispostos horizontalmente de forma sóbria.

---

## 🧩 5. Componentes Principais

### Botão Pill (`Button`)
```css
.btn-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 22px;
  background-color: #050505;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9999px;
  border: none;
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease;
  cursor: pointer;
}

.btn-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-pill:active {
  transform: scale(0.98);
}
```

### Moldura de Screenshot (`ScreenshotFrame`)
```css
.screenshot-frame {
  position: relative;
  padding: 4px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2446FF, #7B3FF2, #FF2E9A, #FF1744, #FFB000);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.screenshot-frame img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  background: #FFFFFF;
}
```

### Cartão Flutuante (`FloatingCard`)
```css
.floating-card {
  background: #FFFFFF;
  border: 1px solid #E8E9EC;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
}
```

---

## ✨ 6. Sistema de Movimento & Microinterações

- **Curva de Bézier Padrão:** `cubic-bezier(0.22, 1, 0.36, 1)`
- **Durações:**
  - Micro-interações (hover, botões): `150ms – 220ms`
  - Transições normais (reveal): `400ms – 650ms`
  - Animações amplas (entradas de seções): `700ms – 1000ms`
- **Scroll Reveal:**
  - Estado Inicial: `opacity: 0; transform: translateY(24px);`
  - Estado Final: `opacity: 1; transform: translateY(0);`
  - Gatilho: `IntersectionObserver` com threshold de `0.15`.
- **Efeito Floating (Flutuação Contínua):**
  - Duração: `4s – 7s` (infinito, ease-in-out alternado).
  - Translação vertical: `4px – 12px`.
  - Rotação: `0.5deg – 2deg`.
- **Acessibilidade (`prefers-reduced-motion`):**
  - Desativar automaticamente parallax e floating.
  - Manter apenas transições instantâneas de fade essencial.

---

## 📱 7. Responsividade & Breakpoints

| Breakpoint | Largura | Comportamento Principal |
| :--- | :--- | :--- |
| **Mobile** | `< 768px` | Layout em coluna única, heróis centralizados, padding de 20-24px, tamanho mínimo de toque de 44px para CTAs. |
| **Tablet** | `768px – 1023px` | Grids intermediários, redução proporcional de títulos para 36-42px. |
| **Desktop** | `1024px – 1439px` | Grids assimétricos (40/60 ou 50/50), textos restritos a max 460px para legibilidade ideal. |
| **Wide** | `≥ 1440px` | Container restrito a `1240px` centralizado com margens generosas. |

---

## 🖼️ 8. Especificação dos Assets

1. **Mascote 3D (`assets/mascot.webp`):**
   - Estilo: Render 3D de alta definição, robô branco futurista com iluminação suave de estúdio e visor azul profundo luminoso.
   - Fundo: Transparente (formato WebP/AVIF com canal alpha).
2. **Screenshots da Interface (`assets/ui-*.webp`):**
   - Mockups fieis da aplicação em alta densidade de pixels (2x).
   - Otimizados para carregamento rápido.
3. **Wireframe de Segurança (`assets/wireframe.svg`):**
   - Ilustração técnica vetorial em linhas monocromáticas translúcidas com efeito de malha 3D.

---

## ⚙️ 9. Árvore de Componentes & Arquitetura

```
App
├── Header (Minimal Nav + Pill CTA)
├── Hero (Headline + Subtitle + 3D Mascot)
├── ProductShowcase (Gradient-bordered large UI)
├── FeatureTriplet (3 Core Benefits)
├── SplitFeature [01] (Integrations + Parallax Icons)
├── SplitFeature [02] (Collaboration Floating Card)
├── SplitFeature [03] (Contextual Intelligence)
├── TeamShowcase (Light Section + Agent Group)
├── SecuritySection (Dark Section + Technical Wireframe)
├── OnboardingCTA (3 Steps Flow + Primary CTA)
└── Footer (Minimal links + Copyright)
```

---

## 🎯 10. Checklist de Prioridade de Replicação

- [ ] **1. Whitespace Extremo:** Espaçamentos verticais de `140px+` entre blocos para garantir visual editorial.
- [ ] **2. Tipografia Compacta:** Headlines grandes com `letter-spacing: -0.045em` e `line-height` muito justo.
- [ ] **3. Borda Gradiente nos Screenshots:** Moldura multicolorida vibrante de 4px nas capturas de tela.
- [ ] **4. Mascote 3D:** Inserção do robô futurista para humanizar e dar personalidade à interface.
- [ ] **5. Alternância Editorial:** Ritmo dinâmico alternando texto à esquerda e imagem à direita.
- [ ] **6. Micro-animações Polidas:** Movimentos suaves e sutis usando `cubic-bezier(0.22, 1, 0.36, 1)`.
- [ ] **7. Seção Dark de Segurança:** Quebra visual com fundo `#05070D` antes da conversão final.

---

## 🤖 11. Prompts de Referência para IA / Geradores

### Prompt de Geração Visual / Frontend:
> *"Crie uma landing page SaaS premium de IA inspirada na composição da referência: fundo branco predominante, tipografia sans-serif moderna, headlines grandes e compactas, muito espaço negativo, screenshots do produto tratados como mockups premium com bordas gradientes vibrantes, mascote 3D futurista como elemento narrativo, seções alternadas de texto e produto, uma seção central em cinza muito claro, uma seção de segurança em fundo quase preto e CTA final minimalista com três passos. Use fade-up, scale, parallax e floating extremamente sutis. O resultado deve parecer uma startup de tecnologia sofisticada e não um template genérico."*

### Prompt Negativo:
> *"Dashboard carregado, excesso de cards, gradientes gigantes no fundo, neon exagerado, sombras pesadas, fontes decorativas, animações rápidas, múltiplos CTAs concorrentes, layouts genéricos de templates bootstrap."*
