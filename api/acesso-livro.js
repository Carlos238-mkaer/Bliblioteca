import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

const sql = neon(process.env.DATABASE_URL);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { cliente_id, livro_id } = req.body || {};

  if (!cliente_id || !livro_id) {
    return res.status(400).json({ erro: 'Envie cliente_id e livro_id' });
  }

  try {
    // 1. Confirma que este cliente realmente comprou este livro
    const compras = await sql`
      SELECT id FROM compras
      WHERE cliente_id = ${cliente_id} AND livro_id = ${livro_id}
      LIMIT 1
    `;

    if (compras.length === 0) {
      return res.status(403).json({ erro: 'Você ainda não comprou este livro' });
    }

    // 2. Busca todas as partes já disponíveis desse livro (inclui partes futuras automaticamente)
    const { data: partes, error } = await supabaseAdmin
      .from('partes_livro')
      .select('numero_parte, capitulo_inicio, capitulo_fim, arquivo_url')
      .eq('livro_id', livro_id)
      .order('numero_parte', { ascending: true });

    if (error) throw error;

    // 3. Gera um link temporário e seguro para cada parte (expira em 10 minutos)
    const partesComLink = await Promise.all(
      (partes || []).map(async (parte) => {
        const { data: signedData, error: signedError } = await supabaseAdmin
          .storage
          .from('arquivos-livros')
          .createSignedUrl(parte.arquivo_url, 60 * 10);

        if (signedError) throw signedError;

        return {
          numero_parte: parte.numero_parte,
          capitulo_inicio: parte.capitulo_inicio,
          capitulo_fim: parte.capitulo_fim,
          link: signedData.signedUrl,
        };
      })
    );

    return res.status(200).json({ partes: partesComLink });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao liberar acesso ao livro' });
  }
}
