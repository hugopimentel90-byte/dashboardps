import { supabase } from './supabase';

const LOCAL_STORAGE_KEY = '@bfla_oficina_servicos';

export const loadServicosOficina = async (oficina: string): Promise<string[]> => {
    let loadedFromSupabase = false;
    let servicosSupabase: string[] = [];

    // 1. Tentar carregar do Supabase
    try {
        const { data, error } = await supabase
            .from('oficina_servicos')
            .select('servicos')
            .eq('oficina', oficina)
            .single();

        if (data && !error && data.servicos) {
            loadedFromSupabase = true;
            servicosSupabase = data.servicos;
            
            // Backup no localStorage
            try {
                const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
                const parsed = localData ? JSON.parse(localData) : {};
                parsed[oficina] = servicosSupabase;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            } catch (e) {
                console.error("Erro ao fazer backup no localStorage", e);
            }
            return servicosSupabase;
        }
    } catch (err) {
        // Ignorar erro silenciosamente para usar o fallback
        console.error("Erro ao carregar do Supabase", err);
    }

    // 2. Fallback para LocalStorage
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            const parsed = JSON.parse(localData);
            const servicosLocal = parsed[oficina] || [];
            
            // Se carregou do localStorage e não veio do Supabase, tenta sincronizar para o Supabase
            if (!loadedFromSupabase && servicosLocal.length > 0) {
                 console.log("Sincronizando serviços do LocalStorage para o Supabase...");
                 saveServicosOficina(oficina, servicosLocal).catch(console.error);
            }

            return servicosLocal;
        }
    } catch (e) {
        console.error("Erro ao ler localStorage", e);
    }
    return [];
};

export const saveServicosOficina = async (oficina: string, servicos: string[]): Promise<void> => {
    // 1. Tentar salvar no Supabase
    try {
        await supabase
            .from('oficina_servicos')
            .upsert({
                oficina: oficina,
                servicos: servicos,
                updated_at: new Date().toISOString()
            }, { onConflict: 'oficina' });
    } catch (err) {
        // Fallback silencioso
    }

    // 2. Sempre salvar no LocalStorage como backup imediato
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = localData ? JSON.parse(localData) : {};
        parsed[oficina] = servicos;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
        console.error("Erro ao salvar no localStorage", e);
    }
};
