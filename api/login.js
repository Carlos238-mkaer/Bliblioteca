import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const [cliente] = await sql`
      SELECT id, nome, email, senha_hash FROM clientes WHERE email = ${email}
    `;

    if (!cliente) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    return res.status(200).json({ id: cliente.id, nome: cliente.nome, email: cliente.email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao iniciar sessão' });
  }
}
