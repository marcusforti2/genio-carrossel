export const extractFileText = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();
  const isMd = name.endsWith(".md") || name.endsWith(".txt") || file.type.startsWith("text/");
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (!isMd && !isPdf && !isDocx) {
    throw new Error("Formato não suportado. Use .md, .txt, .pdf ou .docx");
  }

  if (isMd) return (await file.text()).trim();

  if (isDocx) {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  const pdfjs: any = await import("pdfjs-dist");
  // @ts-ignore - worker URL
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it: any) => it.str).join(" "));
  }
  return parts.join("\n\n").trim();
};

export const AI_PROFILE_PROMPT = `Você é um especialista em branding pessoal e posicionamento digital. Vou te contar sobre mim, meu negócio e meu trabalho, e preciso que você organize TUDO em um texto único, completo e bem estruturado, que eu vou colar em uma ferramenta de IA que cria carrosséis para o Instagram.

O texto final precisa cobrir, em parágrafos corridos (sem títulos, sem bullet points), os seguintes pontos:

1. Quem eu sou (nome completo, o que faço profissionalmente, minha história curta).
2. Minha marca / empresa (nome, tagline, do que se trata).
3. Meu nicho de atuação (em 1-2 frases bem específicas).
4. Meu público-alvo detalhado (quem são, o que sentem, o que querem, o que os frustra).
5. O "inimigo em comum" entre mim e meu público (o que combatemos juntos, contra o que lutamos no mercado).
6. Minhas crenças e convicções fortes sobre o meu mercado (o que eu defendo, o que eu critico).
7. Meu tom de voz para conteúdo (ex: direto, provocativo, com ironia, técnico, acolhedor...).
8. Minha proposta de valor única (o que eu entrego de diferente, qual transformação eu gero).

Antes de escrever, me faça TODAS as perguntas que precisar para entender bem cada um desses pontos. Depois, gere o texto final, em português, em tom profissional mas humano, pronto para eu copiar e colar.

Comece agora me perguntando sobre o item 1.`;
