import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const compras = await sql`
        SELECT co.id, cl.email, cl.nome, co.item, co.valor, co.status, co.criado_em
        FROM compras co
        JOIN clientes cl ON cl.id = co.cliente_id
        ORDER BY co.criado_em DESC
      `;
      return res.status(200).json(compras);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro ao buscar compras' });
    }
  }

  if (req.method === 'POST') {
    const { cliente_id, item, valor } = req.body || {};

    if (!cliente_id || !item || typeof valor !== 'number' || valor <= 0) {
      return res.status(400).json({ erro: 'Envie cliente_id, item e valor válidos' });
    }

    try {
      const [compra] = await sql`
        INSERT INTO compras (cliente_id, item, valor)
        VALUES (${cliente_id}, ${item}, ${valor})
        RETURNING id, item, valor, status
      `;
      return res.status(201).json(compra);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro ao registrar compra' });
    }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
