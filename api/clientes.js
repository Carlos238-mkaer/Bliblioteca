import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { nome, email, senha } = req.body || {};

  if (!nome || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ erro: 'Nome e e-mail válidos são obrigatórios' });
  }
  if (!senha || senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
  }

  try {
    const senha_hash = await bcrypt.hash(senha, 10);

    const [cliente] = await sql`
      INSERT INTO clientes (nome, email, senha_hash)
      VALUES (${nome}, ${email}, ${senha_hash})
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
