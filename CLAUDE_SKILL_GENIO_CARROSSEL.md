# Genio Carrossel — Claude Code Skill

## Objetivo
Criar carrosséis profissionais para Instagram usando o MCP Server do Genio Carrossel.

## Configuração MCP
Arquivo `.claude/mcp.json` na raiz do projeto:
```json
{
  "mcpServers": {
    "genio-carrossel": {
      "type": "streamable-http",
      "url": "https://utxlyvxjnosuhbnfqlja.supabase.co/functions/v1/mcp-server",
      "headers": {
        "x-api-key": "COLE_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

## Tools Disponíveis

### generate_carousel
Cria um carrossel completo com dados do perfil do usuário preenchidos automaticamente.

**Parâmetros obrigatórios:**
- `topic` (string): Título/gancho do carrossel
- `slides` (array): Lista de slides

**Parâmetros opcionais:**
- `template`: "editorial" | "moderno" | "bold" | "minimal" (default: bold)
- `fontFamily`: "serif" | "sans" (default: sans)
- `titleSize`: "normal" | "grande" | "impacto" (default: grande)
- `bodySize`: "pequeno" | "medio" | "grande" (default: grande)
- `bgMode`: "dark" | "light" (default: dark)
- `accentColor`: HSL sem wrapper, ex: "217 91% 60%" (default: vermelho)
- `accentName`: Nome da cor

**Estrutura de cada slide:**
- `type`: "cover" (primeiro), "content" (meio), "cta" (final opcional)
- `title`: Headline curto e impactante (max ~15 palavras)
- `body`: Texto do corpo (~40-80 palavras para content, vazio para cover)
- `hasImage`: true/false

### get_carousel_schema
Retorna o schema completo do CarouselData com dicas e exemplo.

### get_profile
Busca o perfil do usuário (nome, handle, nicho, audiência, tom de voz). Use para personalizar o conteúdo.

### list_projects / get_project / update_project / delete_project
CRUD de projetos salvos.

## Regras de Conteúdo

1. **Cover (1º slide):** Gancho forte, provocativo, que gera curiosidade. Sem body text. `hasImage: true`.
2. **Content (slides do meio):** Título curto e impactante + body com argumento/história. 2-4 slides.
3. **CTA (último, opcional):** Call-to-action claro. "Salva", "Compartilha", "Comenta".
4. **Total ideal:** 4-6 slides.
5. **Tom:** Direto, sem firulas. Frases curtas. Use pontos finais para ritmo.
6. **Evite:** Listas genéricas, clichês motivacionais, texto longo demais.

## Cores de Destaque (HSL)
- Vermelho: "1 83% 55%"
- Laranja: "25 95% 53%"
- Amarelo: "45 93% 47%"
- Verde: "142 71% 45%"
- Azul: "217 91% 60%"
- Roxo: "263 70% 50%"
- Rosa: "330 81% 60%"
- Branco: "0 0% 90%"

## Workflow Recomendado

1. Chame `get_profile` para entender o nicho/tom do usuário
2. Crie o conteúdo dos slides alinhado ao perfil
3. Chame `generate_carousel` com topic + slides
4. Informe ao usuário para abrir o app e visualizar/exportar

## Exemplo Completo

```json
{
  "topic": "5 erros que matam seu LinkedIn",
  "template": "bold",
  "bgMode": "dark",
  "accentColor": "217 91% 60%",
  "accentName": "Azul",
  "slides": [
    {
      "type": "cover",
      "title": "5 erros que estão matando seu LinkedIn.",
      "body": "",
      "hasImage": true
    },
    {
      "type": "content",
      "title": "Erro #1: Perfil sem foto.",
      "body": "Perfis sem foto profissional recebem 14x menos visualizações. Sua foto é seu cartão de visitas digital. Não precisa ser perfeita, precisa ser profissional.",
      "hasImage": false
    },
    {
      "type": "content",
      "title": "Erro #2: Headline genérica.",
      "body": "\"Profissional dedicado e proativo\" não diz nada. Sua headline deve responder: o que você faz, pra quem, e qual resultado entrega. Em uma frase.",
      "hasImage": false
    },
    {
      "type": "content",
      "title": "Erro #3: Postar sem estratégia.",
      "body": "Postar todo dia sem saber pra quem é pior que não postar. Defina 3 pilares de conteúdo. Alterne entre autoridade, conexão e conversão.",
      "hasImage": false
    },
    {
      "type": "cta",
      "title": "Quer corrigir esses erros?",
      "body": "Salva esse post e manda pra alguém que precisa ouvir isso. Comenta qual erro você mais comete.",
      "hasImage": false
    }
  ]
}
```
