/* camaleao.js: faz o site virar a loja do cliente (modo demonstração).
   - No admin.html: cria a aba "Camaleão" (fotos -> cores -> link da demo).
   - No index.html: se o endereço tiver ?demo=..., mostra o site como a loja escolhida.
   Nada daqui lê ou grava livros, compras, clientes ou configurações reais. */
(function () {
  'use strict';

  // ---------- Cores ----------
  const h2r = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const r2h = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, p) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v * (1 - p) + y[i] * p)); };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
      p: ['🏋️|Plano mensal|Acesso livre|119.9|0', '📅|Plano trimestral|Melhor preço|299.9|0', '🧘|Aula de yoga|Turma pequena|35|1', '🚴|Spinning|Aula em grupo|30|1', '🥤|Whey protein|900 g|129.9|2', '💊|Creatina|300 g|89.9|2'] }
  ];
  const tipo = id => T.find(t => t.id === id) || T[0];
  const slug = n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '') || 'loja';

  // Capa desenhada na hora (emoji sobre um degradê da cor da loja)
  function capa(emoji, cor, i) {
    const a = mix(cor, '#ffffff', 0.82 - 0.05 * (i % 3)), b = mix(cor, '#ffffff', 0.58);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><rect width="300" height="340" fill="url(#g)"/><text x="150" y="200" font-size="110" text-anchor="middle">' + emoji + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // A "ficha" da loja: tudo que a demonstração precisa, a partir de tipo + nome + cor
  function montarFicha(id, nome, cor) {
    const t = tipo(id);
    nome = String(nome || '').trim().slice(0, 40) || t.nome;
    const c = /^#[0-9a-f]{6}$/i.test(cor || '') ? cor.toLowerCase() : t.cor;
    return {
      nome, tipo: t.id, icone: t.icone, cats: t.cats, frase: t.frase,
      cfg: {
        cor_principal: c, cor_fundo: mix(c, '#ffffff', 0.95), cor_texto: mix(c, '#000000', 0.86),
        cor_fundo_escuro: mix(c, '#000000', 0.93), cor_texto_escuro: '#ece8e3',
        nome_site: nome, hero_selo: t.selo, hero_titulo: t.titulo.replace('{nome}', nome), hero_subtitulo: t.sub
      },
      prods: t.p.map((s, i) => {
        const [e, n, d, v, k] = s.split('|');
        return { id: 'demo-' + (i + 1), titulo: n, autor: d, genero: t.cats[+k], preco: parseFloat(v), capa_url: capa(e, c, i) };
      })
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

  async function reduzirFoto(arq) {
    const im = await abrirImagem(arq);
    const e = Math.min(1, 900 / im.width), c = document.createElement('canvas');
    c.width = Math.round(im.width * e); c.height = Math.round(im.height * e);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }

  function montarLink(base, o) {
    const u = new URL(base, location.href);
    u.search = '';
    u.searchParams.set('demo', o.tipo); u.searchParams.set('nome', o.nome); u.searchParams.set('cor', o.cor);
    if (o.foto) u.searchParams.set('foto', '1');
    return u.href;
  }

  const ativo = () => new URLSearchParams(location.search).has('demo');

  // ---------- index.html: mostra a loja ----------
  function iniciarDemo() {
    const w = window, q = new URLSearchParams(location.search);
    const f = montarFicha(q.get('demo'), q.get('nome'), q.get('cor'));
    const s = slug(f.nome);
    let filtro = null;
    const aviso = m => w.showNotification(m);
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
    w.adicionarLivroAoCarrinho = function (id, titulo, preco) {
      if (carrinho.some(i => i.livro_id === id)) return aviso('Este produto já está no carrinho');
      carrinho.push({ item: titulo, valor: preco, livro_id: id });
      w.renderCart(); renderizar(); aviso('Adicionado ao carrinho');
    };
    w.removerDoCarrinho = function (i) { carrinho.splice(i, 1); w.renderCart(); renderizar(); };
    w.handleCheckout = function () { w.closeModal('cartModal'); aviso('Demonstração: aqui o cliente paga com o Pix da loja.'); };
    ['handleLoginSubmit', 'handleRegisterSubmit', 'handleReviewSubmit', 'handleContactSubmit'].forEach(n => {
      w[n] = function (e) { e.preventDefault(); aviso('Demonstração: este botão funciona no site final.'); };
    });

    // 2. Troca os textos de "livraria" por textos de loja (e os contatos reais por contatos de exemplo)
    const DIC = [
      ['danielcostas211@gmail.com', 'contato@' + s + '.com.br'], ['@clube_do_livro._oficial', '@' + s],
      ['Catálogo de Livros', 'Nossos Produtos'], ['Ver todos os livros', 'Ver todos os produtos'], ['Clube de Leitura', 'Novidades'],
      ['Opiniões dos Leitores', 'Opiniões dos Clientes'], ['Comunidade de Leitores', 'Comunidade de Clientes'], ['Minha Biblioteca', 'Meus Pedidos'],
      ['Leitura Digital Ilimitada', 'Feito com carinho'], ['Acervo Digital', 'Catálogo'], ['Um espaço calmo para desacelerar e ler.', f.frase],
      ['Espaço pronto para leituras', 'Atendimento com carinho'], ['as suas leituras', 'as suas compras'],
      ['livros', 'produtos'], ['Livros', 'Produtos'], ['livro', 'produto'], ['Livro', 'Produto'], ['leitores', 'clientes'], ['biblioteca', 'loja'],
      ['Biblioteca Digital', f.nome]
    ];
    const trocar = t => { DIC.forEach(([a, b]) => { t = t.split(a).join(b); }); return t; };
    const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nos = []; while (it.nextNode()) nos.push(it.currentNode);
    nos.forEach(n => { const novo = trocar(n.nodeValue); if (novo !== n.nodeValue) n.nodeValue = novo; });
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => { a.href = 'mailto:contato@' + s + '.com.br'; });
    document.querySelectorAll('a[href*="instagram.com"]').forEach(a => { a.href = '#'; a.removeAttribute('target'); });
    document.querySelectorAll('input[placeholder^="Pesquisar"]').forEach(i => { i.placeholder = 'Pesquisar produtos...'; });
    document.querySelectorAll('a[href="admin.html"]').forEach(a => { a.style.display = 'none'; });
    document.getElementById('addToCartForm').parentElement.style.display = 'none';
    const botMsg = w.adicionarMensagemBot;
    w.adicionarMensagemBot = t => botMsg(trocar(t));

    // 3. Aplica cores e textos da loja (só na tela; nada é salvo)
    w.aplicarConfiguracoes(f.cfg);
    document.title = f.nome + ' (demonstração)';
    w.aplicarTemaSalvo();
    w.renderCart();

    // 4. Monta categorias, produtos e opiniões de exemplo
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

    // 5. Foto da loja como banner (só quando a demo foi aberta no mesmo navegador do painel)
    let foto = null;
    if (q.get('foto') === '1') { try { foto = localStorage.getItem('camaleao_foto'); } catch (e) {} }
    if (foto) {
      const img = new Image(); img.src = foto; img.alt = f.nome; img.className = 'absolute inset-0 w-full h-full object-cover';
      const slide = document.createElement('div'); slide.className = 'relative block flex-shrink-0 min-w-full aspect-[16/9] sm:aspect-[21/8]';
      slide.appendChild(img);
      const trilho = document.getElementById('bannersTrack'); trilho.innerHTML = ''; trilho.appendChild(slide);
      document.getElementById('bannersSection').classList.remove('hidden');
    }

    // 6. Ícones da loja e faixa avisando que é uma demonstração
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

    const sec = document.createElement('section');
    sec.id = 'aba-camaleao'; sec.className = 'tab-content hidden';
    sec.innerHTML = `
      <h2 class="serif-font text-xl font-medium text-warmgray-800 mb-1">Camaleão</h2>
      <p class="text-xs text-warmgray-700 mb-5 max-w-xl">Mostre o site já com a cara da loja do cliente. Escolha o tipo de negócio, escreva o nome e (se quiser) envie fotos do lugar: o site pega as cores das fotos. Nada disso muda o seu site de verdade.</p>
      <div class="bg-white rounded-2xl border border-cream-200 p-6 max-w-md shadow-2xs space-y-3">
        <input type="text" id="camNome" maxlength="40" placeholder="Nome da loja (ex: Café do Bairro)" class="w-full text-xs p-2.5 rounded-lg border border-cream-200 focus:ring-2 focus:ring-sage-500/40 outline-none">
        <select id="camTipo" class="w-full text-xs p-2.5 rounded-lg border border-cream-200 outline-none"></select>
        <div>
          <label class="block text-xs font-medium text-warmgray-700 mb-1">Fotos do lugar (até 5, opcional)</label>
          <input type="file" id="camFotos" accept="image/*" multiple class="w-full text-xs p-2 rounded-lg border border-cream-200 bg-cream-50">
        </div>
        <div id="camCoresBox" class="hidden">
          <p id="camCoresMsg" class="text-[11px] text-gray-400 mb-2"></p>
          <div id="camSwatches" class="flex gap-2 flex-wrap"></div>
        </div>
        <label class="flex items-center justify-between gap-3 text-xs text-warmgray-700">
          <span>Cor principal da loja</span>
          <input type="color" id="camCor" class="w-10 h-8 rounded border border-cream-200 cursor-pointer">
        </label>
        <button type="button" id="camGerar" class="w-full bg-sage-500 hover:bg-sage-600 text-white text-xs font-medium py-2.5 rounded-lg transition shadow-xs">Gerar demonstração</button>
        <div id="camResultado" class="hidden space-y-2 pt-3 border-t border-cream-100">
          <a id="camAbrir" target="_blank" rel="noopener" class="block text-center bg-warmgray-800 hover:bg-sage-600 text-white text-xs font-medium py-2.5 rounded-lg transition">Abrir demonstração</a>
          <button type="button" id="camCopiar" class="w-full bg-white border border-cream-200 hover:bg-cream-50 text-warmgray-800 text-xs font-medium py-2.5 rounded-lg transition">Copiar link para enviar</button>
          <p class="text-[11px] text-gray-400 leading-relaxed">O botão "Abrir" mostra também a foto da loja, mas só funciona neste navegador. O link copiado funciona em qualquer celular, sem a foto.</p>
        </div>
      </div>`;
    main.appendChild(sec);

    const $ = id => sec.querySelector('#' + id);
    let foto = null, cores = 0, link = '';
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

    $('camGerar').addEventListener('click', () => {
      const nome = $('camNome').value.trim();
      if (!nome) { alert('Digite o nome da loja.'); $('camNome').focus(); return; }
      const o = { tipo: $('camTipo').value, nome, cor: $('camCor').value };
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
