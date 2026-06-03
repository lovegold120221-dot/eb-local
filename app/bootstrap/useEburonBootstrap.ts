import {useEffect, useRef, useState} from 'react';
import {NativeModules} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EBURON_MODEL, OLLAMA_SERVER} from '../constants/eburon';
import {tags, pull} from '../api/OllamaApi';
import type {LocalUser} from '../auth/AuthProvider';

const {OllamaServiceModule} = NativeModules;

export type BootstrapStatus =
  | 'idle'
  | 'starting-service'
  | 'checking-model'
  | 'downloading-model'
  | 'ready'
  | 'error';

const POLL_INTERVAL = 500;
const POLL_TIMEOUT = 30000;

async function waitForServer(): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < POLL_TIMEOUT) {
    try {
      const res = await fetch(`${OLLAMA_SERVER}/api/version`);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise<void>(resolve => {
      setTimeout(resolve, POLL_INTERVAL);
    });
  }
  throw new Error('Ollama server did not start within 30 seconds');
}

async function isEburonModelInstalled(): Promise<boolean> {
  const data = await tags();
  return Boolean(
    data.models?.some(
      (m: {name: string}) =>
        m.name === EBURON_MODEL ||
        m.name.startsWith('eburonmax/eburon-max:') ||
        m.name === 'eburonmax/eburon-max',
    ),
  );
}

export function useEburonBootstrap(user: LocalUser | null) {
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const storageKey = `eburon-model-ready:${user.email}:${EBURON_MODEL}`;

    async function run() {
      try {
        setStatus('starting-service');
        setMessage('Starting local Eburon AI service...');
        await OllamaServiceModule.startService();

        await waitForServer();

        setStatus('checking-model');
        setMessage('Checking Eburon Max model...');
        const installed = await isEburonModelInstalled();

        if (installed) {
          await AsyncStorage.setItem(storageKey, 'true');
          setStatus('ready');
          setProgress(1);
        setMessage('Eburon Max is ready.');
        try {
          OllamaServiceModule.updateNotification(
            'Eburon AI',
            'Eburon Max is ready',
            0,
            0,
          );
        } catch {} // best-effort
          return;
        }

        setStatus('downloading-model');
        setMessage('Downloading Eburon Max...');

        const session = pull(EBURON_MODEL, r => {
          setMessage(r.status || 'Downloading Eburon Max...');
          if (
            typeof r.completed === 'number' &&
            typeof r.total === 'number' &&
            r.total > 0
          ) {
            const pct = r.completed / r.total;
            setProgress(pct);
            try {
              OllamaServiceModule.updateNotification(
                'Downloading Eburon Max',
                `${Math.round(pct * 100)}% — ${r.status || 'Downloading...'}`,
                r.completed,
                r.total,
              );
            } catch {
              // notification update is best-effort
            }
          }
        });
        abortRef.current = session.abort;

        await session.promise;
        await AsyncStorage.setItem(storageKey, 'true');
        setStatus('ready');
        setProgress(1);
        setMessage('Eburon Max is ready.');
      } catch (e: any) {
        setStatus('error');
        setError(e?.message || 'Unknown error');
      }
    }

    run();

    return () => {
      abortRef.current?.();
    };
  }, [user]);

  return {status, progress, message, error};
}
