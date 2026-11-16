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

  // Listas permitidas: tudo que vem do link (parâmetro d) é conferido contra elas
  const FONTES = ['Playfair Display', 'Lora', 'Montserrat', 'Poppins', 'Oswald', 'DM Serif Display', 'Nunito', 'Raleway', 'Merriweather'];
  const ICONES = ['heart', 'leaf', 'clock', 'star', 'truck', 'shield-check', 'sparkles', 'coffee', 'award', 'smile', 'users', 'map-pin', 'flame', 'gift', 'thumbs-up', 'scissors', 'wheat', 'utensils', 'flower-2', 'dumbbell', 'wrench', 'paw-print', 'shirt', 'zap', 'sun', 'wallet'];
  const SECOES_OK = ['sobre', 'diferenciais', 'catalogo', 'galeria', 'avaliacoes', 'contato'];
  const hexOk = v => (/^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : '');
  // Fotos só valem se estiverem no armazenamento de capas do próprio site
  const urlFoto = u => (/^https:\/\/[^\s"'<>]+\/storage\/v1\/object\/public\/capas-livros\/[^\s"'<>?#]+\.(jpe?g|png|webp)$/i.test(String(u || '')) ? String(u) : '');
  const lumi = h => { const [r, g, b] = h2r(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contraste = (a, b) => { const x = lumi(a), y = lumi(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
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
      const pl = (Array.isArray(j.pl) ? j.pl : []).map(hexOk), x = j.x && typeof j.x === 'object' ? j.x : {};
      const design = {
        pal: pl.length === 5 && pl.every(Boolean) ? { principal: pl[0], fundo: pl[1], texto: pl[2], fundoEscuro: pl[3], textoEscuro: pl[4] } : null,
        fonte: FONTES.includes(j.f) ? j.f : '', retos: j.r === 'r', tema: j.h === 'e' || j.h === 'c' ? j.h : '',
        secoes: (Array.isArray(j.o) ? j.o : []).filter((v, i, a) => SECOES_OK.includes(v) && a.indexOf(v) === i),
        txt: { ct: limparTxt(x.ct, 30), cs: limparTxt(x.cs, 24), st: limparTxt(x.st, 40), sx: limparTxt(x.sx, 320), cta: limparTxt(x.cta, 22) },
        dif: (Array.isArray(j.df) ? j.df : []).slice(0, 3).map(a => ({ i: ICONES.includes(a[0]) ? a[0] : 'star', t: limparTxt(a[1], 28), x: limparTxt(a[2], 90) })).filter(v => v.t),
        imgs: (Array.isArray(j.im) ? j.im : []).map(urlFoto).filter(Boolean).slice(0, 4),
        layout: { hero: ['imagem', 'dividido', 'centro'].includes(j.lh) ? j.lh : '', produtos: ['grade', 'lista', 'compacto'].includes(j.lp) ? j.lp : '' }
      };
      const temDesign = !!(design.pal || design.fonte || design.retos || design.tema || design.secoes.length || design.txt.sx || design.txt.ct || design.dif.length || design.imgs.length || design.layout.hero || design.layout.produtos);
      if (!prods.length && !temDesign) return null;
      return { cats, prods, selo: limparTxt(j.s, 60), titulo: limparTxt(j.t, 90), sub: limparTxt(j.u, 160), design: temDesign ? design : null };
    } catch (e) { return null; }
  }

  // A "ficha" da loja: tudo que a demonstração precisa
  function montarFicha(id, nome, cor, extra) {
    const t = tipo(id), x = extra || {}, k = lerCustom(x.d), kp = k && k.prods.length ? k : null;
   
