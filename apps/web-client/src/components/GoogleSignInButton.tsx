'use client';

import { useEffect, useRef } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Minimal typing for the slice of Google Identity Services we use.
interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

/**
 * Renders the official Google Sign-In button. On success it hands the ID token
 * (JWT credential) back via `onCredential`, which the caller posts to
 * `POST /auth/google`. Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID (the Web OAuth
 * client id) — renders nothing if it isn't configured.
 */
export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
}: {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'continue_with' | 'signup_with';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    function init() {
      const g = window.google;
      if (!g?.accounts?.id || !ref.current || cancelled) return;
      g.accounts.id.initialize({
        client_id: clientId!,
        callback: (resp) => {
          if (resp.credential) cbRef.current(resp.credential);
        },
      });
      ref.current.innerHTML = '';
      g.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text,
        logo_alignment: 'center',
      });
    }

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => {
      cancelled = true;
      script?.removeEventListener('load', init);
    };
  }, [clientId, text]);

  if (!clientId) return null;
  return <div ref={ref} className="flex justify-center" />;
}
