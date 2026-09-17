import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export type FetchState<T> = {
  data: T
  loading: boolean
  error: string | null
}

export function useContent<Row, T>(
  table: string,
  seed: T,
  mapRows: (rows: Row[]) => T,
  orderColumn?: string
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: seed,
    loading: isSupabaseConfigured,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      if (!supabase) {
        setState({
          data: seed,
          loading: false,
          error: 'Supabase is not configured.',
        })
        return
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      try {
        let query = supabase.from(table).select('*')

        if (orderColumn) {
          query = query.order(orderColumn, { ascending: true })
        }

        const { data, error } = await query

        if (cancelled) return

        if (error) {
          console.error(
            `useContent error on table "${table}":`,
            error
          )

          setState({
            data: seed,
            loading: false,
            error: error.message,
          })

          return
        }

        const rows = (data ?? []) as Row[]

        setState({
          data: rows.length > 0 ? mapRows(rows) : mapRows([]),
          loading: false,
          error: null,
        })
      } catch (err) {
        if (cancelled) return

        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load content'

        console.error(
          `useContent exception on table "${table}":`,
          err
        )

        setState({
          data: seed,
          loading: false,
          error: message,
        })
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [table, orderColumn])

  return state
}
