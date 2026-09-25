import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const avaliacoes = await sql`
        SELECT a.nota, a.comentario, a.criado_em, cl.nome, cl.email
        FROM avaliacoes a
        JOIN clientes cl ON cl.id = a.cliente_id
        ORDER BY a.criado_em DESC
      `;
      return res.status(200).json(avaliacoes);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro ao buscar avaliações' });
    }
  }

  if (req.method === 'POST') {
    const { cliente_id, nota, comentario } = req.body || {};

    if (!cliente_id || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ erro: 'Dados inválidos (nota deve ser de 1 a 5)' });
    }

    try {
      const [nova] = await sql`
        INSERT INTO avaliacoes (cliente_id, nota, comentario)
        VALUES (${cliente_id}, ${nota}, ${comentario || null})
        RETURNING id
      `;
      return res.status(201).json(nova);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro ao enviar avaliação' });
    }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
