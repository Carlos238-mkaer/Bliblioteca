# 📚 Biblioteca Digital

Plataforma de leitura online — um site simples e elegante para catálogo de livros, avaliações de leitores e gestão de conta, com visual suave inspirado em tons de sálvia e creme.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Funcionalidades

- 🔍 Barra de pesquisa por título, autor ou género
- 🗂️ Menu de categorias (Ficção & Romance, Desenvolvimento Pessoal, Filosofia & História, Ciência & Tecnologia, Poesia & Biografias)
- 👤 Modais de **Login** e **Registo** de conta
- ⭐ Formulário de avaliações de livros, com publicação dinâmica de novas opiniões
- ✉️ Formulário de contacto com o suporte
- 📱 Layout responsivo (mobile-first) com Tailwind CSS
- 🎨 Ícones via Lucide Icons

## 🛠️ Tecnologias utilizadas

- **HTML5**
- **Tailwind CSS** (via CDN)
- **Lucide Icons** (via CDN)
- **JavaScript puro** (vanilla JS, sem frameworks)
- Fontes: **Inter** e **Playfair Display** (Google Fonts)

> Este é um projeto front-end estático, sem dependências de build ou backend — funciona diretamente abrindo o `index.html` num navegador.

## 📁 Estrutura do projeto

```
biblioteca-digital/
├── index.html      # Página principal (HTML + CSS + JS embutidos)
└── README.md        # Este ficheiro
```

## 🚀 Como executar localmente

Como é um site estático, basta abrir o ficheiro no navegador:

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU-UTILIZADOR/biblioteca-digital.git
   cd biblioteca-digital
   ```
2. Abra o `index.html` diretamente no navegador, ou use uma extensão como **Live Server** (VS Code) para recarregamento automático.

## 📤 Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versão da Biblioteca Digital"
git branch -M main
git remote add origin https://github.com/SEU-UTILIZADOR/biblioteca-digital.git
git push -u origin main
```

## ▲ Publicar no Vercel

1. Aceda a [vercel.com](https://vercel.com) e faça login (pode usar a conta do GitHub).
2. Clique em **"Add New" → "Project"**.
3. Selecione o repositório `biblioteca-digital` que acabou de enviar para o GitHub.
4. Como é um projeto estático (sem framework), o Vercel deteta automaticamente — não é necessário configurar *build command* nem *output directory*. Basta confirmar e clicar em **"Deploy"**.
5. Em poucos segundos o site fica disponível num link do tipo:
   ```
   https://biblioteca-digital.vercel.app
   ```

> 💡 Sempre que fizer `git push` para o branch `main`, o Vercel volta a publicar automaticamente a nova versão.

## 📌 Próximos passos sugeridos

- [ ] Ligar o catálogo a uma base de dados real (atualmente está vazio/mockado)
- [ ] Implementar autenticação real (atualmente os formulários de login/registo são apenas simulados)
- [ ] Persistir as avaliações enviadas (atualmente ficam só na sessão do navegador)
- [ ] Adicionar página de detalhe de cada livro

## 📧 Contacto

Dúvidas ou sugestões: **danielcostas211@gmail.com**

## 📄 Licença

Este projeto está sob a licença MIT — sinta-se à vontade para usar e adaptar.
