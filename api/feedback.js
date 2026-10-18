import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Carrega o verificador de administrador só quando a rota exige. Assim, se ele falhar
// ao iniciar (arquivo no lugar errado, pacote faltando...), os clientes não são afetados.
async function verificarAdmin(req, res) {
  try {
    const { exigirAdmin } = await import('../lib/auth-admin.js');
    return await exigirAdmin(req, res);
  } catch (e) {
    console.error('Falha ao carregar lib/auth-admin.js:', e);
    res.status(500).json({
      erro: 'O verificador de administrador não pôde ser carregado no servidor',
      codigo: 'verificador_indisponivel',
      detalhe: e.message
    });
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Ler os feedbacks (nomes e e-mails) é só para o administrador
    if (!(await verificarAdmin(req, res))) return;

    try {
      const feedbacks = await sql`
        SELECT id, nome, email, mensagem, criado_em
        FROM feedbacks
        ORDER BY criado_em DESC
      `;
      return res.status(200).json(feedbacks);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro ao buscar feedbacks' });
    }
  }

  if (req.method === 'POST') {
    const { nome, email, mensagem } = req.body || {};

    if (!nome || !email || !mensagem) {
      return res.status(400).json({ erro: 'Envie nome, email e mensagem' });
    }

    try {
      const [novo] = await sql`
        INSERT INTO feedbacks (nome, email, mensagem)
        VALUES (${nome}, ${email}, ${mensagem})
        RETURNING id
      `;
      return res.status(201).json(novo);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro ao enviar feedback' });
    }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
