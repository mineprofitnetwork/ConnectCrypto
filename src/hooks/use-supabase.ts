import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useSupabaseQuery<T>(
  table: string,
  queryOptions: {
    select?: string;
    eq?: [string, unknown];
    order?: [string, { ascending?: boolean }];
    limit?: number;
  } = {}
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase.from(table).select(queryOptions.select || '*');

      if (queryOptions.eq) {
        query = query.eq(queryOptions.eq[0], queryOptions.eq[1]);
      }

      if (queryOptions.order) {
        query = query.order(queryOptions.order[0], queryOptions.order[1]);
      }

      if (queryOptions.limit) {
        query = query.limit(queryOptions.limit);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError);
      } else {
        setData(result as T[]);
      }
      setLoading(false);
    }

    fetchData();

    // Setup Realtime subscription
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          console.log("Change detected:", payload);
          fetchData(); // Simplest way to handle updates for now
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [table, queryOptions.select, queryOptions.eq?.[0], queryOptions.eq?.[1], queryOptions.order?.[0], JSON.stringify(queryOptions.order?.[1]), queryOptions.limit]);

  return { data, loading, error };
}

export function useSupabaseDoc<T>(table: string, id: string | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchDoc() {
      setLoading(true);
      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        setError(fetchError);
      } else {
        setData(result as T);
      }
      setLoading(false);
    }

    fetchDoc();

    const subscription = supabase
      .channel(`${table}-${id}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
        () => fetchDoc()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [table, id]);

  return { data, loading, error };
}
