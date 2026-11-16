// api/camaleao.js: lê fotos de uma loja com o Gemini (plano gratuito do Google AI Studio)
// e devolve uma "ficha" com tipo, nome, contatos, produtos e o DESIGN do site (paleta, fonte, tema, seções e textos).
// Só o administrador logado pode usar (evita gastar o limite gratuito à toa).

export const config = { maxDuration: 60 };

const TIPOS = 'cafeteria, padaria, barbearia, roupas, petshop, restaurante, floricultura, academia, hamburgueria, pizzaria, sorveteria, doceria, salao, unhas, otica, papelaria, hortifruti, oficina, tatuagem, odonto, idiomas, celulares, outro';
const LISTA_TIPOS = TIPOS.split(', ');

// Os nomes de modelo mudam com o tempo: tenta um por vez até algum responder.
// Para forçar um modelo, crie a variável GEMINI_MODEL na Vercel.
const MODELOS = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'].filter(Boolean))];

const FONTES = ['Playfair Display', 'Lora', 'Montserrat', 'Poppins', 'Oswald', 'DM Serif Display', 'Nunito', 'Raleway', 'Merriweather'];
const ICONES = ['heart', 'leaf', 'clock', 'star', 'truck', 'shield-check', 'sparkles', 'coffee', 'award', 'smile', 'users', 'map-pin', 'flame', 'gift', 'thumbs-up', 'scissors', 'wheat', 'utensils', 'flower-2', 'dumbbell', 'wrench', 'paw-print', 'shirt', 'zap', 'sun', 'wallet'];
const SECOES = ['sobre', 'diferenciais', 'catalogo', 'galeria', 'avaliacoes', 'contato'];
const ESTILOS = ['acolhedor', 'moderno', 'luxo', 'divertido', 'rustico', 'minimalista', 'industrial'];

const PROMPT = `Você analisa fotos de um estabelecimento comercial real (fachada, interior, cardápio, vitrine, placa) para você DESENHAR um site de vendas sob medida para ele: a identidade visual, o tom dos textos, as seções e os produtos.

Responda SOMENTE com um JSON válido, sem texto antes ou depois, neste formato:
{
  "tipo": "<um destes ids: ${TIPOS}>",
  "nome": "<nome do estabelecimento se estiver legível numa placa, fachada ou cardápio; senão null>",
  "cores": ["#rrggbb", "... até 3 cores principais da marca, placa, fachada ou decoração"],
  "whatsapp": "<só se aparecer um número legível; só dígitos; senão null>",
  "instagram": "<só se aparecer o @ legível; senão null>",
  "endereco": "<só se aparecer escrito; senão null>",
  "horario": "<só se aparecer escrito; senão null>",
  "selo": "<frase curta, até 40 caracteres>",
  "titulo": "<título de destaque, até 60 caracteres; use {nome} no lugar do nome>",
  "subtitulo": "<uma frase, até 110 caracteres>",
  "categorias": ["<2 a 4 categorias>"],
  "lido_da_foto": true,
  "produtos": [ { "nome": "...", "descricao": "até 45 caracteres", "preco": 12.5, "categoria": "<uma das categorias>", "emoji": "<um emoji>" } ],
  "estilo": "<${ESTILOS.join(' | ')}>",
  "paleta": { "principal": "#rrggbb", "fundo": "#rrggbb", "texto": "#rrggbb", "fundo_escuro": "#rrggbb", "texto_escuro": "#rrggbb" },
  "fonte": "<${FONTES.join(' | ')}>",
  "layout": { "hero": "<imagem | dividido | centro>", "produtos": "<grade | lista | compacto>" },
  "cantos": "<suaves | retos>",
  "tema": "<claro | escuro>",
  "secoes": ["<ids na ordem em que aparecem na página: ${SECOES.join(', ')}>"],
  "textos": { "catalogo_titulo": "até 30 caracteres", "catalogo_selo": "até 24 caracteres", "sobre_titulo": "até 40 caracteres", "sobre_texto": "2 a 3 frases, até 320 caracteres", "cta": "texto do botão principal, até 22 caracteres" },
  "diferenciais": [ { "icone": "<${ICONES.join(' | ')}>", "titulo": "até 28 caracteres", "texto": "até 90 caracteres" } ]
}

Regras:
1. Nunca invente nome, telefone, instagram, endereço ou horário. Use null quando não estiver claramente legível nas fotos.
2. Se houver cardápio, tabela de preços ou vitrine com preços visíveis, leia os itens e os preços reais (em reais, número com ponto decimal) e use lido_da_foto true.
3. Se não houver preços visíveis, crie produtos de exemplo típicos desse tipo de negócio, com preços realistas em reais, e use lido_da_foto false.
4. Entre 6 e 8 produtos. Cada "categoria" deve ser uma das "categorias".
5. Não descreva nem identifique pessoas.
6. Design: a "paleta" deve vir das cores reais que você vê (placa, fachada, decoração). "fundo" é um tom claro suave, "texto" é escuro e legível sobre ele; "fundo_escuro" é bem escuro e "texto_escuro" é claro. Escolha "fonte", "cantos" e "tema" que combinem com o estilo do lugar (ex.: luxo = serifada, cantos retos, tema escuro; divertido = Poppins ou Nunito, cantos suaves).
7. Estrutura da página ("layout"): "hero" = "imagem" (foto grande de fundo, para lugares com fachada ou ambiente bonito), "dividido" (texto de um lado e imagem do outro) ou "centro" (texto centralizado, sem foto). "produtos" = "lista" (linhas, ótimo para cardápios e serviços), "grade" (cartões com imagem, ótimo para vitrines como roupas e flores) ou "compacto" (muitos itens pequenos).
8. "secoes": inclua só as que fazem sentido e sempre "catalogo" e "contato". Use "galeria" apenas se o lugar tiver um visual que valha mostrar.
9. Textos de "sobre_texto" e "diferenciais" devem descrever o que dá para ver ou o que é típico desse tipo de negócio, em tom caloroso. Nunca invente fatos verificáveis: ano de fundação, prêmios, certificações, nomes de pessoas, "entrega grátis" ou promoções.
10. Escreva em português do Brasil. Se o negócio não se encaixar em nenhum tipo, use "outro".`;

// Carrega o verificador de administrador só quando a rota é usada (mesmo padrão do feedback.js)
async function verificarAdmin(req, res) {
  try {
    const { exigirAdmin } = await import('../lib/auth-admin.js');
    return await exigirAdmin(req, res);
  } catch (e) {
    console.error('Falha ao carregar lib/auth-admin.js:', e);
    res.status(500).json({ erro: 'O verificador de administrador não pôde ser carregado no servidor', codigo: 'verificador_indisponivel', detalhe: e.message });
    return false;
  }
}

// ---------- Limpeza da resposta da IA (nunca confiar no texto que ela devolve) ----------
const txt = (s, n) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, n) : '');
const hex = s => (/^#[0-9a-f]{6}$/i.test(String(s || '').trim()) ? String(s).trim().toLowerCase() : null);
const emoji = e => { const v = typeof e === 'string' ? e.trim().slice(0, 8) : ''; return v && !/[A-Za-z0-9<>&"'\\]/.test(v) ? v : '🛍️'; };

function limparFicha(j) {
  const tipo = LISTA_TIPOS.includes(j.tipo) ? j.tipo : 'outro';
  const categorias = (Array.isArray(j.categorias) ? j.categorias : []).map(c => txt(c, 24)).filter(Boolean).slice(0, 4);
  if (!categorias.length) categorias.push('Produtos');
  const produtos = (Array.isArray(j.produtos) ? j.produtos : []).slice(0, 8).map(p => {
    const preco = Number(String((p && p.preco) ?? '').replace(',', '.'));
    const cat = txt(p && p.categoria, 24);
    return {
      nome: txt(p && p.nome, 40),
      descricao: txt(p && p.descricao, 50),
      preco: Number.isFinite(preco) ? Math.min(99999, Math.max(0, Math.round(preco * 100) / 100)) : 0,
      categoria: categorias.includes(cat) ? cat : categorias[0],
      emoji: emoji(p && p.emoji)
    };
  }).filter(p => p.nome);
  return {
    tipo,
    nome: txt(j.nome, 40) || null,
    cores: (Array.isArray(j.cores) ? j.cores : []).map(hex).filter(Boolean).slice(0, 3),
    whatsapp: String(j.whatsapp || '').replace(/\D/g, '').slice(0, 13) || null,
    instagram: txt(j.instagram, 31).replace(/^@/, '') || null,
    endereco: txt(j.endereco, 90) || null,
    horario: txt(j.horario, 70) || null,
    selo: txt(j.selo, 60),
    titulo: txt(j.titulo, 90),
    subtitulo: txt(j.subtitulo, 160),
    categorias,
    lidoDaFoto: j.lido_da_foto === true,
    produtos,
    design: limparDesign(j)
  };
}

const lista = (v, ok) => (Array.isArray(v) ? v : []).filter((x, i, a) => ok.includes(x) && a.indexOf(x) === i);

function limparDesign(j) {
  const p = j.paleta && typeof j.paleta === 'object' ? j.paleta : {};
  const pal = [hex(p.principal), hex(p.fundo), hex(p.texto), hex(p.fundo_escuro), hex(p.texto_escuro)];
  const t = j.textos && typeof j.textos === 'object' ? j.textos : {};
  const secoes = lista(j.secoes, SECOES);
  ['catalogo', 'contato'].forEach(id => { if (!secoes.includes(id)) secoes.push(id); });
  return {
    estilo: ESTILOS.includes(j.estilo) ? j.estilo : null,
    paleta: pal.every(Boolean) ? { principal: pal[0], fundo: pal[1], texto: pal[2], fundoEscuro: pal[3], textoEscuro: pal[4] } : null,
    fonte: FONTES.includes(j.fonte) ? j.fonte : null,
    layout: {
      hero: ['imagem', 'dividido', 'centro'].includes(j.layout && j.layout.hero) ? j.layout.hero : '',
      produtos: ['grade', 'lista', 'compacto'].includes(j.layout && j.layout.produtos) ? j.layout.produtos : ''
    },
    cantos: j.cantos === 'retos' ? 'retos' : 'suaves',
    tema: j.tema === 'escuro' ? 'escuro' : 'claro',
    secoes,
    textos: {
      catalogo_titulo: txt(t.catalogo_titulo, 30), catalogo_selo: txt(t.catalogo_selo, 24),
      sobre_titulo: txt(t.sobre_titulo, 40), sobre_texto: txt(t.sobre_texto, 320), cta: txt(t.cta, 22)
    },
    diferenciais: (Array.isArray(j.diferenciais) ? j.diferenciais : []).slice(0, 3).map(d => ({
      icone: ICONES.includes(d && d.icone) ? d.icone : 'star', titulo: txt(d && d.titulo, 28), texto: txt(d && d.texto, 90)
    })).filter(d => d.titulo)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
  if (!(await verificarAdmin(req, res))) return;

  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return res.status(500).json({ erro: 'Falta a variável GEMINI_API_KEY na Vercel', codigo: 'sem_chave' });

  const fotos = req.body && Array.isArray(req.body.fotos) ? req.body.fotos.slice(0, 4) : [];
  if (!fotos.length) return res.status(400).json({ erro: 'Envie pelo menos uma foto', codigo: 'sem_fotos' });

  const partes = [{ text: PROMPT }];
  for (const f of fotos) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(f));
    if (!m || m[2].length > 2500000) return res.status(400).json({ erro: 'Foto inválida ou grande demais', codigo: 'foto_invalida' });
    partes.push({ inlineData: { mimeType: m[1], data: m[2] } });
  }
  const corpo = JSON.stringify({ contents: [{ role: 'user', parts: partes }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } });

  let ultimoErro = '';
  for (const modelo of MODELOS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: corpo
      });

      if (r.status === 429) return res.status(429).json({ erro: 'O limite gratuito da IA foi atingido. Tente de novo em alguns minutos.', codigo: 'limite_ia' });
      if (r.status === 401 || r.status === 403) return res.status(502).json({ erro: 'O Google recusou a chave da IA. Confira a GEMINI_API_KEY na Vercel.', codigo: 'chave_recusada' });
      if (!r.ok) { ultimoErro = `${modelo}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`; continue; }

      const dados = await r.json();
      if (dados.promptFeedback && dados.promptFeedback.blockReason) {
        return res.status(422).json({ erro: 'A IA não conseguiu analisar estas fotos. Tente outras.', codigo: 'bloqueado' });
      }
      const texto = ((dados.candidates && dados.candidates[0] && dados.candidates[0].content && dados.candidates[0].content.parts) || []).map(p => p.text || '').join('');
      const json = JSON.parse(texto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim());
      return res.status(200).json({ ficha: limparFicha(json), modelo });
    } catch (e) {
      ultimoErro = `${modelo}: ${e.message}`;
    }
  }

  console.error('Camaleão IA falhou:', ultimoErro);
  return res.status(502).json({ erro: 'Não foi possível ler as fotos com a IA agora.', codigo: 'ia_indisponivel', detalhe: ultimoErro });
}
