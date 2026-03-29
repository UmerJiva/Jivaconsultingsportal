// lib/useApi.js
import { useState, useEffect, useCallback } from 'react';

export function useApi(url, options = {}) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const { skip = false, deps = [] } = options;

  const fetch_ = useCallback(async (overrideUrl) => {
    if (skip) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(overrideUrl || url);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url, skip, ...deps]); // eslint-disable-line

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

export async function apiCall(url, method = 'GET', body = null) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
