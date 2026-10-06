import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
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
