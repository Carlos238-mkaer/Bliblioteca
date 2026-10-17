import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Confere se quem fez o pedido está logado como administrador.
// Se não estiver, já responde com o erro e devolve false (a rota deve parar).
export async function exigirAdmin(req, res) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7).trim() : '';

  if (!token) {
    res.status(401).json({ erro: 'Entre como administrador para continuar' });
    return false;
  }

  try {
    // 1. O token é de uma sessão válida do Supabase?
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data || !data.user) {
      res.status(401).json({ erro: 'Sessão inválida ou expirada. Entre novamente.' });
      return false;
    }

    // 2. Essa pessoa está na lista de administradores?
    const { data: admin, error: erroAdmin } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (erroAdmin) throw erroAdmin;

    if (!admin) {
      res.status(403).json({ erro: 'Esta conta não tem permissão de administrador' });
      return false;
    }

    return true;
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao verificar a permissão' });
    return false;
  }
}
