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
    nome = limparTxt(nome, 40) || t.nome;
    const c = /^#[0-9a-f]{6}$/i.test(cor || '') ? cor.toLowerCase() : t.cor;
    const cats = kp ? kp.cats : t.cats;
    const prods = kp ? kp.prods.map(p => [p.e, p.n, p.d, p.v, p.k]) : t.p.map(s => { const a = s.split('|'); return [a[0], a[1], a[2], parseFloat(a[3]), +a[4]]; });
    const P = k && k.design && k.design.pal;   // paleta da IA só vale se o texto for legível sobre o fundo
    const claro = P && contraste(P.fundo, P.texto) >= 4.5, escuro = P && contraste(P.fundoEscuro, P.textoEscuro) >= 4.5;
    return {
      nome, tipo: t.id, icone: t.icone, cats, frase: t.frase, design: k ? k.design : null,
      wpp: limparFone(x.wpp), insta: limparInsta(x.insta), end: limparTxt(x.end, 90), hor: limparTxt(x.hor, 70),
      cfg: {
        cor_principal: c, cor_fundo: claro ? P.fundo : mix(c, '#ffffff', 0.95), cor_texto: claro ? P.texto : mix(c, '#000000', 0.86),
        cor_fundo_escuro: escuro ? P.fundoEscuro : mix(c, '#000000', 0.93), cor_texto_escuro: escuro ? P.textoEscuro : '#ece8e3',
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

  // Links antigos (index.html?demo=...) são levados para a página própria da loja (loja.html)
  const ativo = () => new URLSearchParams(location.search).has('demo') && !/loja\.html$/.test(location.pathname);
  function iniciarDemo() { location.replace('loja.html' + location.search); }

  // ---------- admin.html: aba "Camaleão" ----------
  // ---------- Estúdio: formulário + prévia (usado pela página camaleao.html) ----------
  function montarEstudio(sec, ext) {
    ext = ext || {};
    const api = { chamar: ext.chamarApiAdmin || window.chamarApiAdmin, ler: ext.lerRespostaApi || window.lerRespostaApi, upload: ext.resolverUrlCapa || window.resolverUrlCapa };
    const campo = 'w-full text-xs p-2.5 rounded-lg border border-cream-200 focus:ring-2 focus:ring-sage-500/40 outline-none';
    const cartao = 'bg-white rounded-2xl border border-cream-200 p-5 shadow-2xs space-y-3';
    const titulo = (n, t, d) => '<div><h3 class="text-sm font-semibold text-warmgray-800"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sage-500 text-white text-[10px] mr-1.5">' + n + '</span>' + t + '</h3>' + (d ? '<p class="text-[11px] text-gray-400 mt-1 leading-relaxed">' + d + '</p>' : '') + '</div>';
    sec.innerHTML = `
      <h2 class="serif-font text-xl font-medium text-warmgray-800 mb-1">Camaleão</h2>
      <p class="text-xs text-warmgray-700 mb-5 max-w-2xl">Envie fotos da loja e a IA monta um site novo e independente: estrutura, cores, fonte, textos, seções e produtos. Você confere a prévia ao lado e envia o link. Nada disso muda o seu site de verdade.</p>
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-6 items-start">
        <div class="space-y-4 min-w-0">
          <div class="${cartao}">
            ${titulo(1, 'A loja')}
            <input type="text" id="camNome" maxlength="40" placeholder="Nome da loja (ex: Café do Bairro)" class="${campo}">
            <select id="camTipo" class="${campo}"></select>
          </div>
          <div class="${cartao}">
            ${titulo(2, 'Fotos e IA', 'Fachada, interior, cardápio ou vitrine. Evite fotografar pessoas.')}
            <input type="file" id="camFotos" accept="image/*" multiple class="w-full text-xs p-2 rounded-lg border border-cream-200 bg-cream-50">
            <button type="button" id="camIA" class="w-full bg-warmgray-800 hover:bg-sage-600 text-white text-xs font-medium py-2.5 rounded-lg transition shadow-xs">✨ Montar o site com IA</button>
            <p id="camIAMsg" class="hidden text-[11px] text-gray-400 leading-relaxed"></p>
            <div id="camCoresBox" class="hidden">
              <p id="camCoresMsg" class="text-[11px] text-gray-400 mb-2"></p>
              <div id="camSwatches" class="flex gap-2 flex-wrap"></div>
            </div>
            <label class="flex items-center justify-between gap-3 text-xs text-warmgray-700">
              <span>Cor principal da loja</span>
              <input type="color" id="camCor" class="w-10 h-8 rounded border border-cream-200 cursor-pointer">
            </label>
          </div>
          <div class="${cartao}">
            ${titulo(3, 'Contato', 'Opcional. Com o WhatsApp, o pedido do carrinho vai direto para a loja.')}
            <input type="tel" id="camWpp" placeholder="WhatsApp com DDD (ex: 19 99999-9999)" class="${campo}">
            <input type="text" id="camInsta" placeholder="Instagram (ex: @cafedobairro)" class="${campo}">
            <input type="text" id="camEnd" maxlength="90" placeholder="Endereço (ex: Rua das Flores, 120, Campinas)" class="${campo}">
            <input type="text" id="camHor" maxlength="70" placeholder="Horário (ex: Seg a Sáb, 8h às 19h)" class="${campo}">
          </div>
          <div class="${cartao}">
            ${titulo(4, 'Produtos', 'Um por linha: emoji nome | descrição | preço | categoria. Vazio = produtos de exemplo do tipo de loja.')}
            <textarea id="camProdutos" rows="6" placeholder="🍕 Pizza Calabresa | Molho da casa | 52,00 | Pizzas" class="${campo} font-mono"></textarea>
          </div>
          <button type="button" id="camGerar" class="w-full bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium py-3 rounded-xl transition shadow-xs">Gerar e ver a prévia</button>
        </div>

        <div class="min-w-0 lg:sticky lg:top-4">
          <div class="bg-white rounded-2xl border border-cream-200 p-3 shadow-2xs">
            <div class="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div id="camDevices" class="flex gap-1 text-[11px]">
                <button type="button" data-w="390" data-h="680" class="px-3 py-1 rounded-full">📱 Celular</button>
                <button type="button" data-w="768" data-h="720" class="px-3 py-1 rounded-full">Tablet</button>
                <button type="button" data-w="100%" data-h="720" class="px-3 py-1 rounded-full">💻 Computador</button>
              </div>
              <div id="camAcoes" class="hidden flex gap-1.5 flex-wrap">
                <button type="button" id="camApresentar" class="text-[11px] bg-sage-500 hover:bg-sage-600 text-white px-3 py-1.5 rounded-lg transition">▶ Apresentar ao cliente</button>
                <a id="camAbrir" target="_blank" rel="noopener" class="text-[11px] bg-warmgray-800 hover:bg-sage-600 text-white px-3 py-1.5 rounded-lg transition">Abrir em nova aba</a>
                <button type="button" id="camCopiar" class="text-[11px] bg-white border border-cream-200 hover:bg-cream-50 text-warmgray-800 px-3 py-1.5 rounded-lg transition">Copiar link</button>
              </div>
            </div>
            <div id="camMoldura" class="mx-auto rounded-xl overflow-hidden border border-cream-200 bg-cream-50 transition-all" style="width:390px;max-width:100%">
              <p id="camVazio" class="text-xs text-gray-400 text-center px-6 py-24 leading-relaxed">A prévia do site aparece aqui depois de "Gerar e ver a prévia".</p>
              <iframe id="camPrevia" title="Prévia da demonstração" class="hidden w-full border-0 bg-white" style="height:680px"></iframe>
            </div>
            <p class="text-[11px] text-gray-400 mt-3 leading-relaxed">O link copiado funciona em qualquer celular e leva as fotos que foram enviadas ao site. Na demo, o pedido do carrinho e a mensagem de contato abrem o WhatsApp da loja.</p>
          </div>
        </div>
      </div>`;

    const $ = id => sec.querySelector('#' + id);
    let foto = null, cores = 0, link = '', iaTxt = null, iaDes = null, ultimaPrevia = '';
    if (ext.apresentar) $('camApresentar').addEventListener('click', () => ext.apresentar(ultimaPrevia, link));
    else $('camApresentar').remove();
    const urlsEnviadas = {};   // fotos já enviadas ao site (não repete o envio)
    $('camTipo').innerHTML = T.map(t => '<option value="' + t.id + '">' + t.emoji + ' ' + t.nome + '</option>').join('');
    $('camCor').value = T[0].cor;
    $('camTipo').addEventListener('change', () => { if (!cores) $('camCor').value = tipo($('camTipo').value).cor; });

    // Troca o tamanho da prévia (celular, tablet, computador)
    function aparelho(botao) {
      sec.querySelectorAll('#camDevices button').forEach(b => {
        b.className = 'px-3 py-1 rounded-full transition ' + (b === botao ? 'bg-sage-500 text-white' : 'bg-white border border-cream-200 text-warmgray-700');
      });
      $('camMoldura').style.width = botao.dataset.w.endsWith('%') ? '100%' : botao.dataset.w + 'px';
      $('camPrevia').style.height = botao.dataset.h + 'px';
    }
    sec.querySelectorAll('#camDevices button').forEach(b => b.addEventListener('click', () => aparelho(b)));
    aparelho(sec.querySelector('#camDevices button'));

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

    // Monta o parâmetro "d" do link: produtos digitados + design da IA + fotos enviadas
    function montarD(urls) {
      const cats = [], p = [], j = {};
      $('camProdutos').value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 12).forEach(l => {
        const c = l.split('|').map(x => x.trim());
        const m = /^(\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)?\s*(.*)$/u.exec(c[0] || '');
        if (!m || !m[2]) return;
        const preco = parseFloat(String(c[2] || '').replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const cat = limparTxt(c[3], 24) || 'Produtos';
        if (!cats.includes(cat)) cats.push(cat);
        p.push([m[1] || '🛍️', m[2], c[1] || '', preco, cats.indexOf(cat)]);
      });
      if (p.length) { j.p = p; j.c = cats; }
      if (iaTxt) { j.s = iaTxt.selo; j.t = iaTxt.titulo; j.u = iaTxt.subtitulo; }
      if (iaDes) {
        const d = iaDes, x = d.textos || {};
        if (d.paleta) j.pl = [d.paleta.principal, d.paleta.fundo, d.paleta.texto, d.paleta.fundoEscuro, d.paleta.textoEscuro];
        if (d.layout) { j.lh = d.layout.hero; j.lp = d.layout.produtos; }
        j.f = d.fonte; j.r = d.cantos === 'retos' ? 'r' : 's'; j.h = d.tema === 'escuro' ? 'e' : 'c'; j.o = d.secoes;
        j.x = { ct: x.catalogo_titulo, cs: x.catalogo_selo, st: x.sobre_titulo, sx: x.sobre_texto, cta: x.cta };
        j.df = (d.diferenciais || []).map(v => [v.icone, v.titulo, v.texto]);
      }
      if (urls && urls.length) j.im = urls;
      if (!Object.keys(j).length) return '';
      return btoa(unescape(encodeURIComponent(JSON.stringify(j)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // Preenche o formulário com o que a IA encontrou (sem apagar o que você já digitou)
    function aplicarIA(f) {
      iaTxt = { selo: f.selo, titulo: f.titulo, subtitulo: f.subtitulo };
      iaDes = f.design || null;
      if (f.nome && !$('camNome').value.trim()) $('camNome').value = f.nome;
      if (T.some(t => t.id === f.tipo)) $('camTipo').value = f.tipo;
      const corIA = (iaDes && iaDes.paleta && iaDes.paleta.principal) || (f.cores && f.cores[0]);
      if (corIA) $('camCor').value = corIA;
      if (f.whatsapp && !$('camWpp').value.trim()) $('camWpp').value = f.whatsapp;
      if (f.instagram && !$('camInsta').value.trim()) $('camInsta').value = '@' + f.instagram;
      if (f.endereco && !$('camEnd').value.trim()) $('camEnd').value = f.endereco;
      if (f.horario && !$('camHor').value.trim()) $('camHor').value = f.horario;
      $('camProdutos').value = (f.produtos || []).map(p => p.emoji + ' ' + p.nome + ' | ' + p.descricao + ' | ' + p.preco.toFixed(2).replace('.', ',') + ' | ' + p.categoria).join('\n');
      const aviso = [iaDes && iaDes.estilo ? 'Estilo "' + iaDes.estilo + '": montei paleta, fonte, seções e textos.' : 'Montei os textos e os produtos.'];
      aviso.push(f.lidoDaFoto ? 'Li os produtos e preços das fotos: confira os valores.' : 'Não vi preços nas fotos, então criei produtos de exemplo.');
      if (!f.nome) aviso.push('Não achei o nome da loja: digite o nome.');
      aviso.push('Clique em "Gerar e ver a prévia".');
      $('camIAMsg').textContent = '✨ ' + aviso.join(' ');
      $('camIAMsg').classList.remove('hidden');
    }

    $('camIA').addEventListener('click', async () => {
      const arqs = [...$('camFotos').files].slice(0, 3);
      if (!arqs.length) { alert('Escolha pelo menos uma foto do lugar (fachada, cardápio ou vitrine).'); return; }
      const b = $('camIA'), ori = b.textContent;
      b.disabled = true; b.textContent = 'A IA está olhando as fotos...';
      try {
        const fotos = [];
        for (const a of arqs) fotos.push(await reduzirFoto(a, 1024, 0.7));
        const resp = await api.chamar('/api/camaleao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fotos }) });
        const dados = await api.ler(resp);
        aplicarIA(dados.ficha);
      } catch (err) { alert(err.message || 'Não foi possível ler as fotos com a IA.'); }
      finally { b.disabled = false; b.textContent = ori; }
    });

    // Envia as fotos para o armazenamento do site (assim o link mostra as fotos em qualquer celular)
    async function enviarFotos(arqs) {
      const urls = [];
      for (let i = 0; i < arqs.length; i++) {
        const a = arqs[i], chave = a.name + a.size + a.lastModified;
        if (!urlsEnviadas[chave]) {
          const blob = await (await fetch(await reduzirFoto(a, 1280, 0.75))).blob();
          urlsEnviadas[chave] = await api.upload(new File([blob], 'camaleao-' + i + '.jpg', { type: 'image/jpeg' }), null);
        }
        urls.push(urlsEnviadas[chave]);
      }
      return urls;
    }

    $('camGerar').addEventListener('click', async () => {
      const nome = $('camNome').value.trim();
      if (!nome) { alert('Digite o nome da loja.'); $('camNome').focus(); return; }
      if ($('camWpp').value.trim() && !limparFone($('camWpp').value)) { alert('WhatsApp inválido. Use o DDD e o número, por exemplo: 19 99999-9999.'); $('camWpp').focus(); return; }
      if ($('camInsta').value.trim() && !limparInsta($('camInsta').value)) { alert('Instagram inválido. Use só o nome de usuário, por exemplo: @cafedobairro.'); $('camInsta').focus(); return; }
      const b = $('camGerar'), ori = b.textContent;
      b.disabled = true;
      let urls = [];
      const arqs = [...$('camFotos').files].slice(0, 3);
      if (arqs.length && typeof api.upload === 'function') {
        b.textContent = 'Enviando as fotos...';
        try { urls = await enviarFotos(arqs); }
        catch (err) { alert('Não consegui enviar as fotos ao site, então elas só aparecem neste navegador.\n\n' + (err.message || '')); }
      }
      const o = { tipo: $('camTipo').value, nome, cor: $('camCor').value, wpp: $('camWpp').value, insta: $('camInsta').value, end: $('camEnd').value, hor: $('camHor').value, d: montarD(urls) };
      let comFoto = false;
      try {
        if (foto && !urls.length) { localStorage.setItem('camaleao_foto', foto); comFoto = true; } else localStorage.removeItem('camaleao_foto');
      } catch (err) { /* sem foto local */ }
      link = montarLink('loja.html', o);
      const previa = montarLink('loja.html', Object.assign({}, o, { foto: comFoto }));
      $('camAbrir').href = previa; ultimaPrevia = previa;
      $('camAcoes').classList.remove('hidden');
      $('camVazio').classList.add('hidden');
      $('camPrevia').classList.remove('hidden');
      $('camPrevia').src = previa;
      b.disabled = false; b.textContent = ori;
      if (window.innerWidth < 1024) $('camMoldura').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('camCopiar').addEventListener('click', () => {
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => alert('Link copiado!')).catch(() => prompt('Copie o link:', link));
      else prompt('Copie o link:', link);
    });
  }

  // ---------- admin.html: botão que leva ao Camaleão ----------
  function iniciarAdmin() {
    const nav = document.querySelector('#adminPanel nav');
    if (!nav || document.getElementById('btnCamaleao')) return;
    const a = document.createElement('a');
    a.id = 'btnCamaleao'; a.href = 'camaleao.html';
    a.className = 'px-4 py-2 rounded-full font-medium bg-sage-500 hover:bg-sage-600 text-white transition inline-flex items-center gap-1.5 sm:ml-auto';
    a.innerHTML = '🦎 <span>Camaleão</span> <span aria-hidden="true">→</span>';
    nav.appendChild(a);
  }

  const Camaleao = { versao: 7, TIPOS: T, montarEstudio, montarFicha, extrairCores, reduzirFoto, montarLink, ativo, iniciarDemo, fmtFone, limparFone, util: { mix, esc, lumi, contraste }, ficha: null };
  window.Camaleao = Camaleao;
  if (document.getElementById('adminPanel')) iniciarAdmin();
})();
