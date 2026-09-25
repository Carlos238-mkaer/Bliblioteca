// Configuração do cliente Supabase
// Substitua SUPABASE_KEY pela sua "Publishable key" COMPLETA (copie de novo do painel do Supabase,
// a que você colou na conversa estava cortada).

const SUPABASE_URL = "https://ggjtnlotacjywacdgmoh.supabase.co";
const SUPABASE_KEY = "sb_publishable_GWscBwSjCzcGIt1BSCtY7A_O1Ug7iPJ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
