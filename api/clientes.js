import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { nome, email } = req.body || {};

  if (!nome || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ erro: 'Nome e e-mail válidos são obrigatórios' });
  }

  try {
    const [cliente] = await sql`
      INSERT INTO clientes (nome, email)
      VALUES (${nome}, ${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, nome, email
    `;

    if (!cliente) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
    }
    return res.status(201).json(cliente);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
  }
}
