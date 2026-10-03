/**
 * useBackendWakeup
 *
 * Pings the backend health endpoint on mount to wake up the Render
 * free-tier instance before any real API calls are made.
 *
 * Returns { awake, waking } so UI can show a "warming up" indicator.
 */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : 'http://localhost:5000';

const HEALTH_URL = `${BACKEND_URL}/api/health`;
const MAX_ATTEMPTS = 8;       // try for up to ~70 seconds
const INTERVAL_MS  = 9000;    // ping every 9 seconds

let globalAwake = false;       // module-level cache so multiple callers share state

export function useBackendWakeup() {
  const [awake, setAwake]   = useState(globalAwake);
  const [waking, setWaking] = useState(!globalAwake);
  const attempts = useRef(0);

  useEffect(() => {
    if (globalAwake) {
      setAwake(true);
      setWaking(false);
      return;
    }

    let timer;

    const ping = async () => {
      attempts.current += 1;
      try {
        await axios.get(HEALTH_URL, { timeout: 8000 });
        globalAwake = true;
        setAwake(true);
        setWaking(false);
        clearInterval(timer);
      } catch {
        if (attempts.current >= MAX_ATTEMPTS) {
          // Give up — let the individual pages handle their own errors
          setWaking(false);
          clearInterval(timer);
        }
      }
    };

    ping(); // immediate first attempt
    timer = setInterval(ping, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return { awake, waking };
}
