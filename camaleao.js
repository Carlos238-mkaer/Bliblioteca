/* camaleao.js: faz o site virar a loja do cliente (modo demonstração).
   - No admin.html: cria a aba "Camaleão" (dados da loja + fotos -> link da demo).
   - No index.html: se o endereço tiver ?demo=..., mostra o site como a loja escolhida.
   Nada daqui lê ou grava livros, compras, clientes ou configurações reais. */
(function () {
  'use strict';

  // ---------- Utilidades ----------
  const h2r = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const r2h = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, p) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v * (1 - p) + y[i] * p)); };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slug = n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '') || 'loja';

  // Contatos: só aceita formatos válidos (tudo vem do endereço do link, então é limpo aqui)
  function limparFone(s) {
    let d = String(s || '').replace(/\D/g, '');
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return d.length >= 12 && d.length <= 13 ? d : '';
  }
  function limparInsta(s) {
    s = String(s || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
    return /^[a-z0-9._]{1,30}$/i.test(s) ? s : '';
  }
  const limparTxt = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  function fmtFone(d) {
    const l = d.startsWith('55') ? d.slice(2) : '';
    if (l.length === 11) return '(' + l.slice(0, 2) + ') ' + l.slice(2, 7) + '-' + l.slice(7);
    if (l.length === 10) return '(' + l.slice(0, 2) + ') ' + l.slice(2, 6) + '-' + l.slice(6);
    return '+' + d;
  }

  // ---------- Tipos de loja (p = emoji|nome|descrição|preço|categoria) ----------
  const T = [
    { id: 'cafeteria', nome: 'Cafeteria', emoji: '☕', icone: 'coffee', cor: '#8b5e3c', selo: 'Café fresco todos os dias', titulo: '{nome}: o seu café favorito, sem pressa.', sub: 'Grãos selecionados, doces caseiros e um cantinho feito para ficar.', frase: 'Um bom café muda o dia.', cats: ['Cafés', 'Doces', 'Salgados'],
      p: ['☕|Espresso|Curto e intenso|7|0', '🥛|Cappuccino|Com espuma cremosa|12|0', '🧊|Café gelado|Refrescante|14|0', '🍰|Bolo do dia|Fatia caseira|13.5|1', '🥐|Croissant|Folhado na hora|11|1', '🥪|Sanduíche natural|Pão artesanal|18|2'] },
    { id: 'padaria', nome: 'Padaria', emoji: '🥖', icone: 'wheat', cor: '#c8892b', selo: 'Saindo do forno agora', titulo: '{nome}: pão quentinho a toda hora.', sub: 'Fermentação natural, doces do dia e tudo saindo do forno.', frase: 'Cheirinho de pão fresco.', cats: ['Pães', 'Doces', 'Salgados'],
      p: ['🥖|Pão artesanal|Fermentação natural|16|0', '🍞|Pão de forma|Macio e fresquinho|12|0', '🥐|Croissant|Manteiga de verdade|9.5|0', '🍩|Sonho|Recheio cremoso|7.5|1', '🎂|Bolo caseiro|Sabor do dia|38|1', '🥧|Empada|Massa que derrete|8|2'] },
    { id: 'barbearia', nome: 'Barbearia', emoji: '💈', icone: 'scissors', cor: '#3d5a6c', selo: 'Tradição e bom atendimento', titulo: '{nome}: estilo e cuidado em cada detalhe.', sub: 'Cortes, barba e produtos para você sair afiado.', frase: 'Sair daqui é sair renovado.', cats: ['Cortes', 'Barba', 'Produtos'],
      p: ['✂️|Corte clássico|Tesoura e máquina|55|0', '💈|Corte + barba|O combo completo|85|0', '🧔|Barba completa|Toalha quente|40|1', '🪒|Navalhado|Acabamento preciso|35|1', '🧴|Pomada modeladora|Fixação média|42|2', '🛢️|Óleo para barba|Hidrata e perfuma|48|2'] },
    { id: 'roupas', nome: 'Loja de roupas', emoji: '👕', icone: 'shirt', cor: '#b5476b', selo: 'Coleção nova chegou', titulo: '{nome}: peças para o seu jeito de ser.', sub: 'Novidades toda semana, com atendimento próximo e troca facilitada.', frase: 'Vista o que combina com você.', cats: ['Camisetas', 'Vestidos', 'Calças', 'Acessórios'],
      p: ['👕|Camiseta básica|Algodão macio|59.9|0', '👗|Vestido midi|Caimento leve|159.9|1', '👖|Calça jeans|Corte reto|189.9|2', '🧥|Jaqueta|Para meia-estação|239.9|2', '👜|Bolsa de ombro|Couro sintético|129.9|3', '🧣|Lenço estampado|Seda leve|49.9|3'] },
    { id: 'petshop', nome: 'Pet shop', emoji: '🐾', icone: 'paw-print', cor: '#3f8f7a', selo: 'Seu pet bem cuidado', titulo: '{nome}: carinho e cuidado para o seu pet.', sub: 'Banho, tosa, rações e acessórios para quem é da família.', frase: 'Quem ama, cuida.', cats: ['Banho e tosa', 'Rações', 'Brinquedos'],
      p: ['🛁|Banho completo|Shampoo especial|60|0', '✂️|Tosa higiênica|Rápida e segura|45|0', '🍖|Ração premium 10kg|Todas as idades|189.9|1', '🦴|Petisco natural|Sem corantes|19.9|1', '🎾|Bolinha|Resistente|15.9|2', '🧸|Mordedor|Borracha atóxica|24.9|2'] },
    { id: 'restaurante', nome: 'Restaurante', emoji: '🍽️', icone: 'utensils', cor: '#b8432f', selo: 'Almoço e jantar', titulo: '{nome}: comida feita com capricho.', sub: 'Pratos do dia, sobremesas caseiras e um ambiente para boas conversas.', frase: 'Sente, relaxe e aproveite.', cats: ['Pratos', 'Sobremesas', 'Bebidas'],
      p: ['🍝|Massa da casa|Molho artesanal|42|0', '🥩|Filé grelhado|Com guarnição|68|0', '🍕|Pizza|Massa fina|52|0', '🍮|Pudim|Receita da família|16|1', '🍫|Petit gâteau|Com sorvete|22|1', '🥤|Suco natural|Fruta da estação|12|2'] },
    { id: 'floricultura', nome: 'Floricultura', emoji: '🌸', icone: 'flower-2', cor: '#c2578a', selo: 'Flores fresquinhas', titulo: '{nome}: flores para cada momento.', sub: 'Buquês, plantas e presentes entregues com todo o cuidado.', frase: 'Uma flor diz o que palavras não dizem.', cats: ['Buquês', 'Plantas', 'Presentes'],
      p: ['💐|Buquê de rosas|12 rosas vermelhas|120|0', '🌻|Girassóis|Buquê alegre|85|0', '🪴|Suculenta|Vaso decorado|35|1', '🌿|Samambaia|Pede pouca luz|48|1', '🎁|Cesta presente|Flores e chocolates|160|2', '🕯️|Vela aromática|Lavanda|38|2'] },
    { id: 'academia', nome: 'Academia', emoji: '🏋️', icone: 'dumbbell', cor: '#d9562b', selo: 'Comece hoje mesmo', titulo: '{nome}: treine do seu jeito.', sub: 'Planos flexíveis, aulas em grupo e acompanhamento de perto.', frase: 'O primeiro passo é aparecer.', cats: ['Planos', 'Aulas', 'Suplementos'],
      p: ['🏋️|Plano mensal|Acesso livre|119.9|0', '📅|Plano trimestral|Melhor preço|299.9|0', '🧘|Aula de yoga|Turma pequena|35|1', '🚴|Spinning|Aula em grupo|30|1', '🥤|Whey protein|900 g|129.9|2', '💊|Creatina|300 g|89.9|2'] },
    { id: 'hamburgueria', nome: 'Hamburgueria', emoji: '🍔', icone: 'beef', cor: '#c2410c', selo: 'Artesanal de verdade', titulo: '{nome}: hambúrguer artesanal sem frescura.', sub: 'Blends da casa, batata crocante e molhos especiais.', frase: 'Sabor que a gente nunca esquece.', cats: ['Burgers', 'Porções', 'Bebidas'],
      p: ['🍔|Clássico da casa|Blend 160g, queijo e molho|32|0', '🥓|Bacon burger|Com bacon crocante|38|0', '🍔|Duplo cheddar|Dois blends e cheddar|44|0', '🍟|Batata frita|Porção crocante|22|1', '🧅|Onion rings|Empanadas na hora|24|1', '🥤|Refrigerante|Lata 350 ml|7|2'] },
    { id: 'pizzaria', nome: 'Pizzaria', emoji: '🍕', icone: 'pizza', cor: '#b91c1c', selo: 'Massa de fermentação lenta', titulo: '{nome}: pizza quentinha, do forno à sua mesa.', sub: 'Sabores tradicionais e especiais, com entrega rápida.', frase: 'Pizza boa une a mesa.', cats: ['Salgadas', 'Doces', 'Bebidas'],
      p: ['🍕|Margherita|Muçarela e manjericão|49|0', '🍕|Calabresa|Cebola e azeitonas|52|0', '🍕|Quatro queijos|Para os apaixonados|58|0', '🍫|Chocolate com morango|Pizza doce|54|1', '🍌|Banana com canela|Pizza doce|48|1', '🥤|Refrigerante 2L|Gelado|14|2'] },
    { id: 'sorveteria', nome: 'Sorveteria e açaí', emoji: '🍨', icone: 'ice-cream-cone', cor: '#7e3fa8', selo: 'Gelado do jeito que você gosta', titulo: '{nome}: o doce que refresca o dia.', sub: 'Açaí, sorvetes artesanais e acompanhamentos à vontade.', frase: 'Felicidade em casquinha.', cats: ['Açaí', 'Sorvetes', 'Milkshakes'],
      p: ['🍇|Açaí 300 ml|Com 3 acompanhamentos|18|0', '🍇|Açaí 500 ml|Com 3 acompanhamentos|26|0', '🍨|Sorvete 2 bolas|Casquinha ou copinho|14|1', '🍦|Sundae|Calda à escolha|16|1', '🥤|Milkshake|Chocolate ou morango|19|2', '🍓|Picolé artesanal|Frutas da estação|8|1'] },
    { id: 'doceria', nome: 'Confeitaria', emoji: '🎂', icone: 'cake-slice', cor: '#d6639a', selo: 'Doces feitos com amor', titulo: '{nome}: doces para adoçar os seus momentos.', sub: 'Bolos, tortas e docinhos para festas e para o dia a dia.', frase: 'A vida fica mais doce.', cats: ['Bolos', 'Docinhos', 'Tortas'],
      p: ['🎂|Bolo de aniversário|Recheio à escolha|120|0', '🍫|Brigadeiro gourmet|Cento|140|1', '🍓|Torta de morango|Fatia generosa|16|2', '🧁|Cupcake|Unidade decorada|9|0', '🍪|Cookie recheado|Unidade|10|1', '🍋|Torta de limão|Fatia|15|2'] },
    { id: 'salao', nome: 'Salão de beleza', emoji: '💇', icone: 'sparkles', cor: '#9d4e8c', selo: 'Realce a sua beleza', titulo: '{nome}: cuidado e beleza para você.', sub: 'Cabelo e estética com profissionais de confiança. Agende pelo WhatsApp.', frase: 'Sinta-se incrível.', cats: ['Cabelo', 'Estética', 'Produtos'],
      p: ['💇|Corte feminino|Com lavagem e finalização|90|0', '🎨|Coloração|Mão de obra|150|0', '💆|Escova modelada|Liso ou ondas|65|0', '🧖|Limpeza de pele|Sessão completa|120|1', '🧴|Shampoo profissional|300 ml|58|2', '💧|Hidratação|Tratamento profundo|80|0'] },
    { id: 'unhas', nome: 'Estúdio de unhas', emoji: '💅', icone: 'gem', cor: '#e0568a', selo: 'Unhas impecáveis', titulo: '{nome}: unhas lindas, do seu jeito.', sub: 'Manicure, alongamento e nail art com todo o cuidado.', frase: 'Detalhes que fazem a diferença.', cats: ['Manicure', 'Alongamento', 'Cuidados'],
      p: ['💅|Manicure simples|Esmaltação tradicional|35|0', '🦶|Pedicure|Com esfoliação|40|0', '✨|Esmaltação em gel|Dura até 21 dias|70|0', '💎|Alongamento em gel|Aplicação completa|160|1', '🎨|Nail art|Por unha|5|1', '🧴|Hidratação das mãos|Parafina|45|2'] },
    { id: 'otica', nome: 'Ótica', emoji: '👓', icone: 'glasses', cor: '#2f6f8f', selo: 'Enxergue o melhor da vida', titulo: '{nome}: a sua visão em boas mãos.', sub: 'Armações, lentes e óculos de sol com atendimento especializado.', frase: 'Ver bem é viver melhor.', cats: ['Armações', 'Solares', 'Serviços'],
      p: ['👓|Armação clássica|Acetato leve|289|0', '👓|Armação metal|Fina e resistente|349|0', '🕶️|Óculos de sol|Proteção UV400|259|1', '🕶️|Solar esportivo|Lente polarizada|329|1', '🔍|Lentes antirreflexo|Par, com tratamento|180|2', '🧼|Kit limpeza|Spray e flanela|25|2'] },
    { id: 'papelaria', nome: 'Papelaria', emoji: '✏️', icone: 'pencil', cor: '#2563a8', selo: 'Tudo para criar e organizar', titulo: '{nome}: tudo para estudar, criar e organizar.', sub: 'Material escolar, escritório e presentes criativos.', frase: 'Ideias começam no papel.', cats: ['Escolar', 'Escritório', 'Presentes'],
      p: ['📓|Caderno 10 matérias|Capa dura|34|0', '✏️|Kit canetas coloridas|12 cores|22|0', '🎒|Mochila escolar|Reforçada|129|0', '📎|Organizador de mesa|Madeira e metal|49|1', '🗂️|Pasta com elástico|Tamanho A4|9|1', '🎁|Agenda 2027|Planejamento semanal|42|2'] },
    { id: 'hortifruti', nome: 'Hortifruti', emoji: '🍎', icone: 'apple', cor: '#4d8f2f', selo: 'Fresquinho da horta', titulo: '{nome}: frutas e verduras fresquinhas.', sub: 'Produtos selecionados todos os dias, direto para a sua mesa.', frase: 'Do campo para a sua casa.', cats: ['Frutas', 'Verduras', 'Cestas'],
      p: ['🍎|Maçã|Preço por kg|9.9|0', '🍌|Banana prata|Preço por dúzia|7.5|0', '🥬|Alface crespa|Unidade|3.5|1', '🍅|Tomate|Preço por kg|8.9|1', '🥕|Cenoura|Preço por kg|5.9|1', '🧺|Cesta da semana|Frutas e legumes|59|2'] },
    { id: 'oficina', nome: 'Oficina mecânica', emoji: '🔧', icone: 'wrench', cor: '#44546a', selo: 'O seu carro em boas mãos', titulo: '{nome}: cuidado de verdade com o seu carro.', sub: 'Revisão, freios, suspensão e muito mais, com transparência.', frase: 'Segurança em cada quilômetro.', cats: ['Revisão', 'Freios e suspensão', 'Elétrica'],
      p: ['🛠️|Revisão completa|Mão de obra|220|0', '🛢️|Troca de óleo|Óleo e filtro à parte|90|0', '🛑|Pastilhas de freio|Dianteiras, mão de obra|150|1', '🚗|Alinhamento|Alinhar e balancear|120|1', '🔋|Troca de bateria|Instalação|60|2', '🔍|Diagnóstico eletrônico|Com scanner|110|2'] },
    { id: 'tatuagem', nome: 'Estúdio de tatuagem', emoji: '🖋️', icone: 'pen-tool', cor: '#3b3b4f', selo: 'Arte na pele', titulo: '{nome}: a sua história desenhada na pele.', sub: 'Projetos autorais, biossegurança e atendimento com hora marcada.', frase: 'Arte que fica.', cats: ['Tatuagem', 'Piercing', 'Cuidados'],
      p: ['🖋️|Tatuagem pequena|Até 5 cm|250|0', '🎨|Tatuagem média|Até 15 cm|600|0', '🌹|Fechamento de braço|Orçamento no WhatsApp|2500|0', '💎|Piercing de orelha|Joia inclusa|120|1', '✨|Piercing de nariz|Joia inclusa|140|1', '🧴|Pomada cicatrizante|Pós-tatuagem|45|2'] },
    { id: 'odonto', nome: 'Clínica odontológica', emoji: '🦷', icone: 'smile', cor: '#168aad', selo: 'Cuidando do seu sorriso', titulo: '{nome}: o seu sorriso em boas mãos.', sub: 'Avaliação, limpeza, clareamento e tratamentos com conforto.', frase: 'Sorrir faz bem.', cats: ['Prevenção', 'Estética', 'Tratamentos'],
      p: ['🦷|Consulta de avaliação|Primeira visita|90|0', '🪥|Limpeza|Profilaxia completa|150|0', '✨|Clareamento|Sessão em consultório|650|1', '😁|Lente de contato dental|Por dente|1200|1', '🔧|Restauração|Por dente|220|2', '📏|Aparelho ortodôntico|Mensalidade|180|2'] },
    { id: 'idiomas', nome: 'Escola de idiomas', emoji: '🌍', icone: 'languages', cor: '#1d6fb8', selo: 'Fale outro idioma com confiança', titulo: '{nome}: aprenda um novo idioma de verdade.', sub: 'Aulas dinâmicas, turmas reduzidas e professores experientes.', frase: 'Novos idiomas, novas portas.', cats: ['Cursos', 'Aulas particulares', 'Preparatórios'],
      p: ['📘|Inglês|Mensalidade, turma reduzida|289|0', '📗|Espanhol|Mensalidade, turma reduzida|289|0', '📕|Francês|Mensalidade, turma reduzida|299|0', '🎓|Aula particular|Valor por hora|110|1', '📝|Preparatório para prova|Mensalidade|320|2', '🗣️|Conversação|Aula em grupo|90|1'] },
    { id: 'celulares', nome: 'Celulares e assistência', emoji: '📱', icone: 'smartphone', cor: '#4338ca', selo: 'Tecnologia com garantia', titulo: '{nome}: tecnologia e assistência de confiança.', sub: 'Aparelhos, acessórios e reparos com garantia.', frase: 'O seu celular em boas mãos.', cats: ['Aparelhos', 'Acessórios', 'Reparos'],
      p: ['📱|Smartphone 128 GB|Lacrado, com garantia|1599|0', '🔌|Carregador rápido|20W com cabo|79|1', '🎧|Fone bluetooth|Bateria longa|129|1', '🛡️|Película de vidro|Com instalação|30|1', '🔧|Troca de tela|Com garantia|350|2', '🔋|Troca de bateria|Com garantia|180|2'] },
    { id: 'outro', nome: 'Outro tipo de loja', emoji: '🛍️', icone: 'store', cor: '#4f6f8f', selo: 'Atendimento de verdade', titulo: '{nome}: qualidade e atendimento que você merece.', sub: 'Conheça os nossos produtos e serviços e peça de forma rápida pelo WhatsApp.', frase: 'Bem-vindo, a casa é sua.', cats: ['Destaques', 'Novidades'],
      p: ['⭐|Produto destaque|O nosso mais pedido|59|0', '🛍️|Combo especial|Economize levando mais|99|0', '🎁|Kit presente|Pronto para presentear|79|0', '🆕|Lançamento|Acabou de chegar|69|1', '💡|Serviço personalizado|Fale com a gente|120|1', '🏷️|Oferta da semana|Por tempo limitado|49|1'] }
  ];
  const tipo = id => T.find(t => t.id === id) || T[0];

  // Capa desenhada na hora (emoji sobre um degradê da cor da loja)
  function capa(emoji, cor, i) {
    const a = mix(cor, '#ffffff', 0.80 - 0.05 * (i % 3)), b = mix(cor, '#ffffff', 0.55);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><rect width="300" height="340" fill="url(#g)"/><circle cx="262" cy="52" r="92" fill="#fff" opacity=".18"/><circle cx="34" cy="312" r="74" fill="#fff" opacity=".15"/><circle cx="150" cy="170" r="88" fill="#fff" opacity=".55"/><text x="150" y="205" font-size="104" text-anchor="middle">' + emoji + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Produtos personalizados: vêm no link (parâmetro d), então tudo é limpo aqui
  const emo = e => { const v = String(e || '').trim().slice(0, 8); return v && !/[A-Za-z0-9<>&"'\\]/.test(v) ? v : '🛍️'; };
  function lerCustom(d) {
    if (!d) return null;
    try {
      const j = JSON.parse(decodeURIComponent(escape(atob(String(d).replace(/-/g, '+').replace(/_/g, '/')))));
      const cats = (Array.isArray(j.c) ? j.c : []).map(c => limparTxt(c, 24)).filter(Boolean).slice(0, 5);
      if (!cats.length) cats.push('Produtos');
      const prods = (Array.isArray(j.p) ? j.p : []).slice(0, 12).map(a => ({
        e: emo(a[0]), n: limparTxt(a[1], 40), d: limparTxt(a[2], 50),
        v: Math.min(99999, Math.max(0, parseFloat(a[3]) || 0)),
        k: Math.max(0, Math.min(cats.length - 1, parseInt(a[4], 10) || 0))
      })).filter(p => p.n);
      if (!prods.length) return null;
      return { cats, prods, selo: limparTxt(j.s, 60), titulo: limparTxt(j.t, 90), sub: limparTxt(j.u, 160) };
    } catch (e) { return null; }
  }

  // A "ficha" da loja: tudo que a demonstração precisa
  function montarFicha(id, nome, cor, extra) {
    const t = tipo(id), x = extra || {}, k = lerCustom(x.d);
    nome = limparTxt(nome, 40) || t.nome;
    const c = /^#[0-9a-f]{6}$/i.test(cor || '') ? cor.toLowerCase() : t.cor;
    const cats = k ? k.cats : t.cats;
    const prods = k ? k.prods.map(p => [p.e, p.n, p.d, p.v, p.k]) : t.p.map(s => { const a = s.split('|'); return [a[0], a[1], a[2], parseFloat(a[3]), +a[4]]; });
    return {
      nome, tipo: t.id, icone: t.icone, cats, frase: t.frase,
      wpp: limparFone(x.wpp), insta: limparInsta(x.insta), end: limparTxt(x.end, 90), hor: limparTxt(x.hor, 70),
      cfg: {
        cor_principal: c, cor_fundo: mix(c, '#ffffff', 0.95), cor_texto: mix(c, '#000000', 0.86),
        cor_fundo_escuro: mix(c, '#000000', 0.93), cor_texto_escuro: '#ece8e3',
        nome_site: nome, hero_selo: (k && k.selo) || t.selo,
        hero_titulo: ((k && k.titulo) || t.titulo).replace('{nome}', nome), hero_subtitulo: (k && k.sub) || t.sub
      },
      prods: prods.map((a, i) => ({ id: 'demo-' + (i + 1), titulo: a[1], autor: a[2], genero: cats[a[4]], preco: a[3], capa_url: capa(a[0], c, i) }))
    };
  }

  // ---------- Fotos: cores dominantes e foto reduzida ----------
  function abrirImagem(arq) {
    return new Promise((ok, erro) => {
      const u = URL.createObjectURL(arq), im = new Image();
      im.onload = () => { URL.revokeObjectURL(u); ok(im); };
      im.onerror = () => { URL.revokeObjectURL(u); erro(new Error('Não consegui abrir a imagem "' + arq.name + '".')); };
      im.src = u;
    });
  }

  async function extrairCores(arquivos) {
    const baldes = {};
    for (const arq of arquivos) {
      const im = await abrirImagem(arq);
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(im, 0, 0, 64, 64);
      const d = x.getImageData(0, 0, 64, 64).data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 510;
        const s = mx === mn ? 0 : (mx - mn) / (255 - Math.abs(mx + mn - 255));
        if (s < 0.22 || l < 0.15 || l > 0.9) continue;       // ignora cinzas, preto e branco
        const k = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
        const o = baldes[k] || (baldes[k] = { r: 0, g: 0, b: 0, n: 0, p: 0 });
        o.r += r; o.g += g; o.b += b; o.n++; o.p += s * (1 - Math.abs(l - 0.5));
      }
    }
    const achadas = [];
    Object.values(baldes).sort((a, b) => b.p - a.p).forEach(o => {
      const cor = [o.r / o.n, o.g / o.n, o.b / o.n];
      const parecida = achadas.some(a => Math.hypot(a[0] - cor[0], a[1] - cor[1], a[2] - cor[2]) < 70);
      if (!parecida && achadas.length < 5) achadas.push(cor);
    });
    return achadas.map(r2h);
  }

  async function reduzirFoto(arq, max, qualidade) {
    const im = await abrirImagem(arq);
    const e = Math.min(1, (max || 900) / im.width), c = document.createElement('canvas');
    c.width = Math.round(im.width * e); c.height = Math.round(im.height * e);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', qualidade || 0.72);
  }

  function montarLink(base, o) {
    const u = new URL(base, location.href), f = montarFicha(o.tipo, o.nome, o.cor, o);
    u.search = '';
    u.searchParams.set('demo', f.tipo); u.searchParams.set('nome', f.nome); u.searchParams.set('cor', f.cfg.cor_principal);
    if (f.wpp) u.searchParams.set('wpp', f.wpp);
    if (f.insta) u.searchParams.set('insta', f.insta);
    if (f.end) u.searchParams.set('end', f.end);
    if (f.hor) u.searchParams.set('hor', f.hor);
    if (o.d) u.searchParams.set('d', o.d);
    if (o.foto) u.searchParams.set('foto', '1');
    return u.href;
  }

  const ativo = () => new URLSearchParams(location.search).has('demo');

  // ---------- index.html: mostra a loja ----------
  function iniciarDemo() {
    const w = window, q = new URLSearchParams(location.search);
    const f = montarFicha(q.get('demo'), q.get('nome'), q.get('cor'), { wpp: q.get('wpp'), insta: q.get('insta'), end: q.get('end'), hor: q.get('hor'), d: q.get('d') });
    const s = slug(f.nome);
    const aviso = m => w.showNotification(m);
    const wa = m => 'https://wa.me/' + f.wpp + '?text=' + encodeURIComponent(m);
    const igUrl = 'https://www.instagram.com/' + f.insta + '/';
    const real = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
    let filtro = null;
    Camaleao.ficha = f;

    // 1. Isola a demonstração: sem cliente, sem carrinho real, sem chamadas ao servidor
    clienteAtual = null; carrinho = [];
    ['carregarDestaque', 'carregarExclusivo', 'carregarBanners', 'carregarConfiguracoes', 'carregarCategorias', 'carregarAvaliacoes'].forEach(n => { w[n] = function () {}; });
    w.carregarComprasCliente = async function () {};
    w.carregarLivros = renderizar;
    w.filterCategory = function (c) {
      document.getElementById('categoriesMenu').classList.add('hidden');
      document.getElementById('categoriesArrow').classList.remove('rotate-180');
      filtro = c; renderizar();
    };
    const renderCartOriginal = w.renderCart;
    w.renderCart = function () {       // mostra R$ no carrinho (o site original usa €)
      renderCartOriginal();
      document.querySelectorAll('#cartItemsList p.text-gray-500, #cartTotal').forEach(e => { e.textContent = e.textContent.replace('€', 'R$ '); });
    };
    w.adicionarLivroAoCarrinho = function (id, titulo, preco) {
      if (carrinho.some(i => i.livro_id === id)) return aviso('Este produto já está no carrinho');
      carrinho.push({ item: titulo, valor: preco, livro_id: id });
      w.renderCart(); renderizar(); aviso('Adicionado ao carrinho');
    };
    w.removerDoCarrinho = function (i) { carrinho.splice(i, 1); w.renderCart(); renderizar(); };
    w.handleCheckout = function () {   // o pedido sai pelo WhatsApp da loja
      if (!carrinho.length) return aviso('O carrinho está vazio');
      if (!f.wpp) return aviso('Demonstração: com o WhatsApp da loja, o pedido é enviado por aqui.');
      const total = carrinho.reduce((t, i) => t + i.valor, 0);
      const msg = 'Olá! Gostaria de fazer um pedido:\n' + carrinho.map(i => '• ' + i.item + ' - ' + real(i.valor)).join('\n') + '\n\nTotal: ' + real(total);
      window.open(wa(msg), '_blank', 'noopener');
      w.closeModal('cartModal');
    };
    ['handleLoginSubmit', 'handleRegisterSubmit', 'handleReviewSubmit'].forEach(n => {
      w[n] = function (e) { e.preventDefault(); aviso('Demonstração: este botão funciona no site final.'); };
    });
    w.handleContactSubmit = function (e) {   // a mensagem do formulário vai para o WhatsApp
      e.preventDefault();
      if (!f.wpp) return aviso('Demonstração: com o WhatsApp da loja, a mensagem é enviada por aqui.');
      const nome = document.getElementById('contactNome').value, msg = document.getElementById('contactMensagem').value;
      window.open(wa('Olá! Sou ' + nome + '. ' + msg), '_blank', 'noopener');
      e.target.reset();
    };

    // 2. Troca os textos de "livraria" por textos de loja
    const contatoTxt = f.wpp ? fmtFone(f.wpp) : (f.insta ? '@' + f.insta : 'contato@' + s + '.com.br');
    const contatoHref = f.wpp ? wa('Olá! Vim pelo site.') : (f.insta ? igUrl : 'mailto:contato@' + s + '.com.br');
    const DIC = [
      ['Caso ocorra qualquer inconsistência no funcionamento da biblioteca, dúvidas sobre o registo e catálogo, ou se quiser deixar um feedback sobre o site, entre em contacto direto através do canal abaixo.', 'Tire dúvidas, faça seu pedido ou venha nos visitar. Respondemos o mais rápido possível.'],
      ['Encontrou algum problema ou tem uma sugestão?', 'Fale com a gente'], ['Enviar Feedback / Mensagem ao Suporte', 'Envie uma mensagem'],
      ['Qualquer dúvida ou problema no site, contate:', 'Fale com a gente:'], ['Suporte & Feedback', 'Contato'],
      ['danielcostas211@gmail.com', contatoTxt], ['@clube_do_livro._oficial', contatoTxt],
      ['Só pagar agora', 'Enviar pedido'], ['Finalizar Compra', f.wpp ? 'Enviar pedido pelo WhatsApp' : 'Finalizar pedido'],
      ['Catálogo de Livros', 'Nossos Produtos'], ['Ver todos os livros', 'Ver todos os produtos'], ['Clube de Leitura', 'Novidades'],
      ['Opiniões dos Leitores', 'Opiniões dos Clientes'], ['Comunidade de Leitores', 'Comunidade de Clientes'], ['Minha Biblioteca', 'Meus Pedidos'],
      ['Leitura Digital Ilimitada', f.wpp ? 'Peça pelo WhatsApp' : 'Feito com carinho'], ['Acervo Digital', 'Catálogo'],
      ['Um espaço calmo para desacelerar e ler.', f.frase], ['Espaço pronto para leituras', 'Atendimento com carinho'], ['as suas leituras', 'as suas compras'],
      ['livros', 'produtos'], ['Livros', 'Produtos'], ['livro', 'produto'], ['Livro', 'Produto'], ['leitores', 'clientes'], ['biblioteca', 'loja'],
      ['Biblioteca Digital', f.nome]
    ];
    const trocar = t => { DIC.forEach(([a, b]) => { t = t.split(a).join(b); }); return t; };
    const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nos = []; while (it.nextNode()) nos.push(it.currentNode);
    nos.forEach(n => { const novo = trocar(n.nodeValue); if (novo !== n.nodeValue) n.nodeValue = novo; });

    // 3. Limpa o que não faz sentido numa loja (login, links de livraria, formulário de opinião)
    document.querySelectorAll('a[href="admin.html"], #loginBtn, #registerBtn').forEach(e => { e.style.display = 'none'; });
    document.querySelectorAll('nav a').forEach(a => { if (/Novidades|Meus Pedidos/.test(a.textContent)) a.style.display = 'none'; });
    document.getElementById('addToCartForm').parentElement.style.display = 'none';
    document.getElementById('reviewForm').parentElement.style.display = 'none';
    document.getElementById('contactEmail').required = false;
    document.getElementById('contactEmail').style.display = 'none';
    document.getElementById('contactMensagem').placeholder = 'Escreva a sua mensagem...';
    document.querySelectorAll('input[placeholder^="Pesquisar"]').forEach(i => { i.placeholder = 'Pesquisar produtos...'; });
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.href = contatoHref;
      if (/^https?:/.test(contatoHref)) { a.target = '_blank'; a.rel = 'noopener'; }
    });
    const botaoConta = document.querySelector('#heroSection button[onclick*="registerModal"]');
    if (botaoConta) {
      if (f.wpp) { botaoConta.removeAttribute('onclick'); botaoConta.textContent = 'Falar no WhatsApp'; botaoConta.addEventListener('click', () => window.open(wa('Olá! Vim pelo site.'), '_blank', 'noopener')); }
      else botaoConta.style.display = 'none';
    }

    // 4. Assistente da loja (respostas sobre horário, endereço, pedido e contato)
    w.toggleChatBot = function () {
      chatBotAberto = !chatBotAberto;
      document.getElementById('chatBotPanel').classList.toggle('hidden', !chatBotAberto);
      if (chatBotAberto && !chatBotIniciado) {
        w.adicionarMensagemBot('Olá! Sou o assistente de ' + f.nome + '. Posso ajudar com produtos, horário, endereço e como fazer o seu pedido.');
        chatBotIniciado = true;
      }
    };
    w.responderChatBot = function (perg) {
      const p = perg.toLowerCase();
      const fale = f.wpp ? 'Chame a gente no WhatsApp ' + fmtFone(f.wpp) + '.' : 'Use os canais de contato no fim da página.';
      if (/^(oi|ol[aá]|bom dia|boa tarde|boa noite)/.test(p)) return 'Olá! Como posso ajudar?';
      if (/hor[aá]rio|abre|fecha|aberto/.test(p)) return f.hor ? 'Nosso horário: ' + f.hor + '.' : 'Para confirmar o horário, ' + fale.charAt(0).toLowerCase() + fale.slice(1);
      if (/endere|onde fica|onde|local|chegar/.test(p)) return f.end ? 'Estamos em: ' + f.end + '.' : 'Para saber o endereço, ' + fale.charAt(0).toLowerCase() + fale.slice(1);
      if (/pedido|comprar|encomend|carrinho|entrega/.test(p)) return 'Adicione os produtos ao carrinho e toque em "' + (f.wpp ? 'Enviar pedido pelo WhatsApp' : 'Finalizar pedido') + '". Confirmamos tudo com você.';
      if (/pag|pix|cart[aã]o|dinheiro/.test(p)) return 'As formas de pagamento combinamos no atendimento. ' + fale;
      if (/pre[cç]o|valor|quanto|custa/.test(p)) return 'O preço de cada produto aparece no card, no catálogo.';
      if (/whats|zap|contato|telefone|instagram|insta/.test(p)) return fale + (f.insta ? ' Instagram: @' + f.insta + '.' : '');
      return 'Não tenho certeza sobre isso. ' + fale;
    };

    // 5. Aplica cores e textos da loja (só na tela; nada é salvo)
    w.aplicarConfiguracoes(f.cfg);
    document.title = f.nome;
    w.aplicarTemaSalvo();
    w.renderCart();
    const botaoCarrinho = document.querySelector('#cartModal button[onclick="handleCheckout()"]');
    if (botaoCarrinho) botaoCarrinho.textContent = f.wpp ? 'Enviar pedido pelo WhatsApp' : 'Finalizar pedido';

    // 6. Categorias, produtos e opiniões de exemplo
    document.getElementById('categoriesList').innerHTML = f.cats.map((c, i) =>
      '<a href="#catalogo" onclick="filterCategory(Camaleao.ficha.cats[' + i + '])" class="flex items-center justify-between px-4 py-2 text-xs text-warmgray-700 hover:bg-sage-50 hover:text-sage-600 transition"><span>' + esc(c) + '</span></a>').join('');
    function renderizar() {
      const lista = f.prods.filter(p => !filtro || p.genero === filtro);
      document.getElementById('catalogEmptyState').classList.add('hidden');
      const grade = document.getElementById('catalogGrid');
      grade.classList.remove('hidden');
      grade.innerHTML = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">' + lista.map(p => w.construirCardLivroHtml(p)).join('') + '</div>';
      w.lucide.createIcons();
    }
    renderizar();
    document.getElementById('reviewsList').innerHTML = [['Mariana S.', 5, 'Tudo muito bem feito, voltarei com certeza!'], ['Rafael P.', 5, 'Atendimento excelente e produtos de qualidade.'], ['Camila T.', 4, 'Muito bom, já indiquei para os amigos.']].map(([n, e, c], i) =>
      '<div class="bg-white p-5 rounded-xl border border-cream-200 shadow-2xs space-y-3"><div class="flex items-center justify-between"><span class="text-xs font-semibold text-warmgray-800">' + n + '</span><span class="text-amber-400 text-xs">' + '★'.repeat(e) + '☆'.repeat(5 - e) + '</span></div><div class="text-[11px] text-sage-600 font-medium bg-sage-50 px-2 py-0.5 rounded w-fit">Produto: ' + esc(f.prods[i].titulo) + '</div><p class="text-xs text-warmgray-700 leading-relaxed italic">"' + c + '"</p></div>').join('');

    // 7. Contatos da loja: faixa de informações, seção de contato e botão flutuante do WhatsApp
    const SVG_IG = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';
    const cartao = (icone, rotulo, valor, href, extra) => {
      const ic = icone === 'insta' ? SVG_IG : '<i data-lucide="' + icone + '" class="w-4 h-4"></i>';
      const miolo = '<div class="p-2.5 bg-sage-500 text-white rounded-lg flex-shrink-0">' + ic + '</div><div class="min-w-0"><span class="block text-[10px] text-gray-500 uppercase tracking-wider">' + rotulo + '</span><span class="block text-sm font-semibold text-sage-800 break-words">' + esc(valor) + '</span></div>';
      const cls = 'flex items-center gap-3 bg-sage-50 p-3.5 rounded-xl border border-sage-200/60 ' + (extra || '');
      return href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener" class="' + cls + ' hover:bg-sage-100 transition">' + miolo + '</a>' : '<div class="' + cls + '">' + miolo + '</div>';
    };
    const itens = [];
    if (f.wpp) itens.push(['message-circle', 'WhatsApp', fmtFone(f.wpp), wa('Olá! Vim pelo site e gostaria de mais informações.')]);
    if (f.insta) itens.push(['insta', 'Instagram', '@' + f.insta, igUrl]);
    if (f.end) itens.push(['map-pin', 'Endereço', f.end, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.end)]);
    if (f.hor) itens.push(['clock', 'Horário', f.hor, '']);

    const caixaContato = document.querySelector('#contato .pt-2.space-y-3');
    if (caixaContato) {
      if (itens.length) caixaContato.innerHTML = itens.map(i => cartao(i[0], i[1], i[2], i[3])).join('');
      else caixaContato.style.display = 'none';
    }
    if (itens.length) {
      const faixa = document.createElement('section');
      faixa.className = 'px-4 sm:px-6 max-w-7xl mx-auto w-full';
      faixa.innerHTML = '<div class="flex flex-wrap gap-3">' + itens.map(i => cartao(i[0], i[1], i[2], i[3], 'flex-1 min-w-[220px]')).join('') + '</div>';
      document.getElementById('heroSection').after(faixa);
    }
    if (f.wpp) {
      const zap = document.createElement('a');
      zap.href = wa('Olá! Vim pelo site e gostaria de mais informações.');
      zap.target = '_blank'; zap.rel = 'noopener'; zap.setAttribute('aria-label', 'Falar no WhatsApp');
      zap.className = 'fixed bottom-20 right-5 z-40 rounded-full p-3.5 shadow-lg transition hover:scale-105';
      zap.style.background = '#25D366';
      zap.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
      document.body.appendChild(zap);
    }

    // 8. Foto da loja como banner (só quando a demo foi aberta no mesmo navegador do painel)
    let foto = null;
    if (q.get('foto') === '1') { try { foto = localStorage.getItem('camaleao_foto'); } catch (e) {} }
    if (foto) {
      const img = new Image(); img.src = foto; img.alt = f.nome; img.className = 'absolute inset-0 w-full h-full object-cover';
      const slide = document.createElement('div'); slide.className = 'relative block flex-shrink-0 min-w-full aspect-[16/9] sm:aspect-[21/8]';
      const leg = document.createElement('div'); leg.className = 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5 pb-8 sm:p-8';
      const h = document.createElement('h3'); h.className = 'serif-font text-lg sm:text-3xl font-semibold text-white'; h.textContent = f.nome;
      const sp = document.createElement('p'); sp.className = 'text-xs sm:text-base text-white/90 mt-1'; sp.textContent = f.cfg.hero_selo;
      leg.appendChild(h); leg.appendChild(sp); slide.appendChild(img); slide.appendChild(leg);
      const trilho = document.getElementById('bannersTrack'); trilho.innerHTML = ''; trilho.appendChild(slide);
      document.getElementById('bannersSection').classList.remove('hidden');
    }

    // 9. Ícones da loja e faixa avisando que é uma demonstração
    document.querySelectorAll('header [data-lucide="book-open"], footer [data-lucide="book-open"], #heroCard [data-lucide="library"]').forEach(e => e.setAttribute('data-lucide', f.icone));
    const barra = document.createElement('div');
    barra.className = 'text-center text-xs font-medium px-3 py-2';
    barra.style.cssText = 'background:rgb(var(--sage-600));color:#fff';
    barra.appendChild(document.createTextNode('Modo demonstração: ' + f.nome));
    const sair = document.createElement('a');
    sair.href = location.pathname; sair.textContent = 'Sair da demonstração';
    sair.style.cssText = 'color:#fff;text-decoration:underline;margin-left:12px';
    barra.appendChild(sair);
    document.body.insertBefore(barra, document.body.firstChild);
    w.lucide.createIcons();
  }

  // ---------- admin.html: aba "Camaleão" ----------
  function iniciarAdmin() {
    const nav = document.querySelector('#adminPanel nav'), main = document.querySelector('#adminPanel main');
    if (!nav || !main) return;
    const btn = document.createElement('button');
    btn.id = 'tabBtn-camaleao';
    btn.className = 'tab-btn px-4 py-2 rounded-full font-medium bg-white border border-cream-200 text-warmgray-700 transition';
    btn.textContent = 'Camaleão';
    btn.addEventListener('click', () => window.mudarAba('camaleao'));
    nav.appendChild(btn);

    const campo = 'w-full text-xs p-2.5 rounded-lg border border-cream-200 focus:ring-2 focus:ring-sage-500/40 outline-none';
    const sec = document.createElement('section');
    sec.id = 'aba-camaleao'; sec.className = 'tab-content hidden';
    sec.innerHTML = `
      <h2 class="serif-font text-xl font-medium text-warmgray-800 mb-1">Camaleão</h2>
      <p class="text-xs text-warmgray-700 mb-5 max-w-xl">Mostre o site já com a cara da loja do cliente: nome, cores, produtos de exemplo, WhatsApp e Instagram. Nada disso muda o seu site de verdade.</p>
      <div class="bg-white rounded-2xl border border-cream-200 p-6 max-w-md shadow-2xs space-y-3">
        <input type="text" id="camNome" maxlength="40" placeholder="Nome da loja (ex: Café do Bairro)" class="${campo}">
        <select id="camTipo" class="${campo}"></select>
        <p class="text-[11px] font-semibold text-warmgray-800 pt-1">Contato da loja <span class="font-normal text-gray-400">(opcional)</span></p>
        <input type="tel" id="camWpp" placeholder="WhatsApp com DDD (ex: 19 99999-9999)" class="${campo}">
        <input type="text" id="camInsta" placeholder="Instagram (ex: @cafedobairro)" class="${campo}">
        <input type="text" id="camEnd" maxlength="90" placeholder="Endereço (ex: Rua das Flores, 120, Campinas)" class="${campo}">
        <input type="text" id="camHor" maxlength="70" placeholder="Horário (ex: Seg a Sáb, 8h às 19h)" class="${campo}">
        <div>
          <label class="block text-xs font-medium text-warmgray-700 mb-1">Fotos do lugar (até 5, opcional)</label>
          <input type="file" id="camFotos" accept="image/*" multiple class="w-full text-xs p-2 rounded-lg border border-cream-200 bg-cream-50">
        </div>
        <button type="button" id="camIA" class="w-full bg-warmgray-800 hover:bg-sage-600 text-white text-xs font-medium py-2.5 rounded-lg transition shadow-xs">✨ Ler as fotos com IA</button>
        <p id="camIAMsg" class="hidden text-[11px] text-gray-400 leading-relaxed"></p>
        <div id="camCoresBox" class="hidden">
          <p id="camCoresMsg" class="text-[11px] text-gray-400 mb-2"></p>
          <div id="camSwatches" class="flex gap-2 flex-wrap"></div>
        </div>
        <label class="flex items-center justify-between gap-3 text-xs text-warmgray-700">
          <span>Cor principal da loja</span>
          <input type="color" id="camCor" class="w-10 h-8 rounded border border-cream-200 cursor-pointer">
        </label>
        <div>
          <label class="block text-xs font-medium text-warmgray-700 mb-1">Produtos da loja <span class="font-normal text-gray-400">(opcional, um por linha)</span></label>
          <textarea id="camProdutos" rows="6" placeholder="🍕 Pizza Calabresa | Molho da casa | 52,00 | Pizzas" class="${campo} font-mono"></textarea>
          <p class="text-[11px] text-gray-400 mt-1 leading-relaxed">Formato: emoji nome | descrição | preço | categoria. Se deixar vazio, a demo usa produtos de exemplo do tipo de loja.</p>
        </div>
        <button type="button" id="camGerar" class="w-full bg-sage-500 hover:bg-sage-600 text-white text-xs font-medium py-2.5 rounded-lg transition shadow-xs">Gerar demonstração</button>
        <div id="camResultado" class="hidden space-y-2 pt-3 border-t border-cream-100">
          <a id="camAbrir" target="_blank" rel="noopener" class="block text-center bg-warmgray-800 hover:bg-sage-600 text-white text-xs font-medium py-2.5 rounded-lg transition">Abrir demonstração</a>
          <button type="button" id="camCopiar" class="w-full bg-white border border-cream-200 hover:bg-cream-50 text-warmgray-800 text-xs font-medium py-2.5 rounded-lg transition">Copiar link para enviar</button>
          <p class="text-[11px] text-gray-400 leading-relaxed">O botão "Abrir" mostra também a foto da loja, mas só funciona neste navegador. O link copiado funciona em qualquer celular, sem a foto. Na demo, o pedido do carrinho e a mensagem de contato abrem o WhatsApp da loja.</p>
        </div>
      </div>`;
    main.appendChild(sec);

    const $ = id => sec.querySelector('#' + id);
    let foto = null, cores = 0, link = '', iaTxt = null;
    $('camTipo').innerHTML = T.map(t => '<option value="' + t.id + '">' + t.emoji + ' ' + t.nome + '</option>').join('');
    $('camCor').value = T[0].cor;
    $('camTipo').addEventListener('change', () => { if (!cores) $('camCor').value = tipo($('camTipo').value).cor; });

    $('camFotos').addEventListener('change', async e => {
      const arqs = [...e.target.files].slice(0, 5);
      foto = null; cores = 0; $('camCoresBox').classList.add('hidden'); $('camSwatches').innerHTML = '';
      if (!arqs.length) return;
      try {
        const achadas = await extrairCores(arqs);
        foto = await reduzirFoto(arqs[0]);
        cores = achadas.length;
        $('camCoresBox').classList.remove('hidden');
        $('camCoresMsg').textContent = cores ? 'Cores encontradas nas fotos. Toque para escolher a principal:' : 'Não achei uma cor marcante nas fotos. Escolha a cor abaixo.';
        achadas.forEach(c => {
          const b = document.createElement('button');
          b.type = 'button'; b.title = c; b.style.background = c;
          b.className = 'w-9 h-9 rounded-full border-2 border-white shadow';
          b.addEventListener('click', () => { $('camCor').value = c; });
          $('camSwatches').appendChild(b);
        });
        if (cores) $('camCor').value = achadas[0];
      } catch (err) { alert(err.message || 'Não foi possível ler as fotos.'); }
    });

    // Lê as linhas da caixa de produtos e monta o parâmetro "d" do link
    function montarD() {
      const linhas = $('camProdutos').value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 12);
      const cats = [], p = [];
      linhas.forEach(l => {
        const c = l.split('|').map(x => x.trim());
        const m = /^(\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)?\s*(.*)$/u.exec(c[0] || '');
        const nome = (m && m[2]) || '';
        if (!nome) return;
        const preco = parseFloat(String(c[2] || '').replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const cat = limparTxt(c[3], 24) || 'Produtos';
        if (!cats.includes(cat)) cats.push(cat);
        p.push([(m && m[1]) || '🛍️', nome, c[1] || '', preco, cats.indexOf(cat)]);
      });
      if (!p.length) return '';
      const j = { p, c: cats };
      if (iaTxt) { j.s = iaTxt.selo; j.t = iaTxt.titulo; j.u = iaTxt.subtitulo; }
      return btoa(unescape(encodeURIComponent(JSON.stringify(j)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // Preenche o formulário com o que a IA encontrou (sem apagar o que você já digitou)
    function aplicarIA(f) {
      iaTxt = { selo: f.selo, titulo: f.titulo, subtitulo: f.subtitulo };
      if (f.nome && !$('camNome').value.trim()) $('camNome').value = f.nome;
      if (T.some(t => t.id === f.tipo)) $('camTipo').value = f.tipo;
      if (f.cores && f.cores[0]) $('camCor').value = f.cores[0];
      if (f.whatsapp && !$('camWpp').value.trim()) $('camWpp').value = f.whatsapp;
      if (f.instagram && !$('camInsta').value.trim()) $('camInsta').value = '@' + f.instagram;
      if (f.endereco && !$('camEnd').value.trim()) $('camEnd').value = f.endereco;
      if (f.horario && !$('camHor').value.trim()) $('camHor').value = f.horario;
      $('camProdutos').value = (f.produtos || []).map(p => p.emoji + ' ' + p.nome + ' | ' + p.descricao + ' | ' + p.preco.toFixed(2).replace('.', ',') + ' | ' + p.categoria).join('\n');
      const aviso = [f.lidoDaFoto ? 'Li os produtos e preços das fotos: confira os nomes e valores na caixa de produtos.' : 'Não vi preços nas fotos, então criei produtos de exemplo. Edite se quiser.'];
      if (!f.nome) aviso.push('Não achei o nome da loja nas fotos: digite o nome.');
      $('camIAMsg').textContent = '✨ ' + aviso.join(' ');
      $('camIAMsg').classList.remove('hidden');
    }

    $('camIA').addEventListener('click', async () => {
      const arqs = [...$('camFotos').files].slice(0, 3);
      if (!arqs.length) { alert('Escolha pelo menos uma foto do lugar (fachada, cardápio ou vitrine).'); return; }
      const b = $('camIA'), ori = b.textContent;
      b.disabled = true; b.textContent = 'Lendo as fotos...';
      try {
        const fotos = [];
        for (const a of arqs) fotos.push(await reduzirFoto(a, 1024, 0.7));
        const resp = await window.chamarApiAdmin('/api/camaleao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fotos }) });
        const dados = await window.lerRespostaApi(resp);
        aplicarIA(dados.ficha);
      } catch (err) { alert(err.message || 'Não foi possível ler as fotos com a IA.'); }
      finally { b.disabled = false; b.textContent = ori; }
    });

    $('camGerar').addEventListener('click', () => {
      const nome = $('camNome').value.trim();
      if (!nome) { alert('Digite o nome da loja.'); $('camNome').focus(); return; }
      if ($('camWpp').value.trim() && !limparFone($('camWpp').value)) { alert('WhatsApp inválido. Use o DDD e o número, por exemplo: 19 99999-9999.'); $('camWpp').focus(); return; }
      if ($('camInsta').value.trim() && !limparInsta($('camInsta').value)) { alert('Instagram inválido. Use só o nome de usuário, por exemplo: @cafedobairro.'); $('camInsta').focus(); return; }
      const o = { tipo: $('camTipo').value, nome, cor: $('camCor').value, wpp: $('camWpp').value, insta: $('camInsta').value, end: $('camEnd').value, hor: $('camHor').value, d: montarD() };
      let comFoto = false;
      try {
        if (foto) { localStorage.setItem('camaleao_foto', foto); comFoto = true; } else localStorage.removeItem('camaleao_foto');
      } catch (err) { alert('Não consegui guardar a foto neste navegador. A demonstração vai sem ela.'); }
      link = montarLink('index.html', o);
      $('camAbrir').href = montarLink('index.html', Object.assign({}, o, { foto: comFoto }));
      $('camResultado').classList.remove('hidden');
    });

    $('camCopiar').addEventListener('click', () => {
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => alert('Link copiado!')).catch(() => prompt('Copie o link:', link));
      else prompt('Copie o link:', link);
    });
  }

  const Camaleao = { TIPOS: T, montarFicha, extrairCores, reduzirFoto, montarLink, ativo, iniciarDemo, ficha: null };
  window.Camaleao = Camaleao;
  if (document.getElementById('adminPanel')) iniciarAdmin();
})();
