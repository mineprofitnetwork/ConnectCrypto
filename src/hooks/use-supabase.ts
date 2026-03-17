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
    // Robust check for missing ID or filter values
    const hasFilter = !!queryOptions.eq;
    const filterValue = queryOptions.eq?.[1];
    const isFilterValueMissing = filterValue === undefined || filterValue === null || filterValue === 'undefined' || filterValue === '';

    if (hasFilter && isFilterValueMissing) {
      console.log(`[useSupabaseQuery] Missing filter value for table ${table}, skipping query.`);
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        let query = supabase.from(table).select(queryOptions.select || '*');

        if (queryOptions.eq) {
          // Double check before calling .eq
          const val = queryOptions.eq[1];
          if (val === undefined || val === null || val === 'undefined') {
            console.warn(`[useSupabaseQuery] Attempted to query ${table} with undefined value in .eq filter.`);
            setData(null);
            setLoading(false);
            return;
          }
          query = query.eq(queryOptions.eq[0], val);
        }

        if (queryOptions.order) {
          query = query.order(queryOptions.order[0], queryOptions.order[1]);
        }

        if (queryOptions.limit) {
          query = query.limit(queryOptions.limit);
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) {
          console.error(`[useSupabaseQuery] Error fetching ${table}:`, fetchError);
          setError(fetchError);
        } else {
          setData(result as T[]);
        }
      } catch (err: any) {
        console.error(`[useSupabaseQuery] Unexpected error fetching ${table}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Setup Realtime subscription
    const subscription = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes' as any,
        { event: '*', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<any>) => {
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
    if (!id || id === 'undefined') {
      console.log(`[useSupabaseDoc] Missing ID for table ${table}, skipping fetch.`);
      setLoading(false);
      return;
    }

    async function fetchDoc() {
      setLoading(true);
      try {
        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error(`[useSupabaseDoc] Error fetching ${table} document ${id}:`, fetchError);
          setError(fetchError);
        } else {
          setData(result as T);
        }
      } catch (err: any) {
        console.error(`[useSupabaseDoc] Unexpected error fetching ${table} document ${id}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDoc();

    const subscription = supabase
      .channel(`${table}-${id}-changes`)
      .on('postgres_changes' as any,
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


