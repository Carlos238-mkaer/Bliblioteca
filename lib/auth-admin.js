import { createClient } from '@supabase/supabase-js';

let clienteAdmin = null;

// O cliente é criado só quando precisa (e não ao carregar o arquivo), para que uma
// variável faltando na Vercel não derrube o resto do site.
function obterClienteAdmin() {
  if (clienteAdmin) return clienteAdmin;

  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    const erro = new Error('Faltam as variáveis SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY na Vercel');
    erro.codigo = 'servidor_sem_configuracao';
    throw erro;
  }

  clienteAdmin = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return clienteAdmin;
}

// Confere se quem fez o pedido está logado como administrador.
// Se não estiver, já responde com o erro e devolve false (a rota deve parar).
// Toda resposta de erro leva "codigo" (curto) e, quando útil, "detalhe" (o motivo).
export async function exigirAdmin(req, res) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7).trim() : '';

  if (!token) {
    res.status(401).json({ erro: 'Entre como administrador para continuar', codigo: 'sem_login' });
    return false;
  }

  try {
    const supabase = obterClienteAdmin();

    // 1. O token é de uma sessão válida do Supabase?
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      res.status(401).json({
        erro: 'Sessão inválida ou expirada. Entre novamente.',
        codigo: 'sessao_invalida',
        detalhe: error ? error.message : undefined
      });
      return false;
    }

    // 2. Essa pessoa está na lista de administradores?
    const { data: admin, error: erroAdmin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (erroAdmin) {
      console.error('Erro ao consultar a tabela admins:', erroAdmin);
      res.status(500).json({
        erro: 'Não foi possível consultar a lista de administradores',
        codigo: 'falha_consulta_admins',
        detalhe: erroAdmin.message
      });
      return false;
    }

    if (!admin) {
      res.status(403).json({
        erro: 'Esta conta não tem permissão de administrador',
        codigo: 'nao_admin'
      });
      return false;
    }

    return true;
  } catch (e) {
    console.error(e);
    res.status(500).json({
      erro: e.codigo === 'servidor_sem_configuracao' ? e.message : 'Erro ao verificar a permissão',
      codigo: e.codigo || 'erro_inesperado',
      detalhe: e.codigo ? undefined : e.message
    });
    return false;
  }
}
