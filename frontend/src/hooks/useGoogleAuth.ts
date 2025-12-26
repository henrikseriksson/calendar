import { useState, useCallback, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import type { AccountId, TokenData, AuthState } from '../types';

const STORAGE_KEY = 'calendar_auth';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

function loadAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { work: null, private: null };
}

function saveAuthState(state: AuthState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isTokenValid(token: TokenData | null): boolean {
  if (!token) return false;
  // Add 60 second buffer
  return token.expiresAt > Date.now() + 60000;
}

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);
  const [connectingAccount, setConnectingAccount] = useState<AccountId | null>(null);
  const pendingAccountRef = useRef<AccountId | null>(null);

  // Persist auth state changes
  useEffect(() => {
    saveAuthState(authState);
  }, [authState]);

  // Success handler using implicit flow (returns access_token directly)
  const handleSuccess = useCallback(
    (tokenResponse: { access_token: string; expires_in?: number; scope?: string; token_type?: string }) => {
      const accountId = pendingAccountRef.current;
      if (!accountId) {
        console.error('No pending account for token');
        return;
      }

      // Debug: Log full token response
      console.log('=== Google Auth Success ===');
      console.log('Account:', accountId);
      console.log('Token type:', tokenResponse.token_type);
      console.log('Expires in:', tokenResponse.expires_in);
      console.log('Scope:', tokenResponse.scope);
      console.log('Access token (first 30 chars):', tokenResponse.access_token?.substring(0, 30));

      const tokenData: TokenData = {
        accessToken: tokenResponse.access_token,
        expiresAt: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
      };

      setAuthState((prev) => ({
        ...prev,
        [accountId]: tokenData,
      }));
      
      pendingAccountRef.current = null;
      setConnectingAccount(null);
    },
    []
  );

  const handleError = useCallback((error: unknown) => {
    console.error('Google login failed:', error);
    pendingAccountRef.current = null;
    setConnectingAccount(null);
  }, []);

  // Use implicit flow to get access_token directly
  const login = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: handleError,
    scope: CALENDAR_SCOPE,
    flow: 'implicit', // This returns access_token directly, not authorization code
  });

  const connect = useCallback(
    (accountId: AccountId) => {
      console.log('Connecting account:', accountId);
      pendingAccountRef.current = accountId;
      setConnectingAccount(accountId);
      login();
    },
    [login]
  );

  const disconnect = useCallback((accountId: AccountId) => {
    setAuthState((prev) => ({
      ...prev,
      [accountId]: null,
    }));
  }, []);

  const getToken = useCallback(
    (accountId: AccountId): string | null => {
      const tokenData = authState[accountId];
      if (isTokenValid(tokenData)) {
        return tokenData!.accessToken;
      }
      return null;
    },
    [authState]
  );

  const isConnected = useCallback(
    (accountId: AccountId): boolean => {
      return isTokenValid(authState[accountId]);
    },
    [authState]
  );

  const needsReconnect = useCallback(
    (accountId: AccountId): boolean => {
      const tokenData = authState[accountId];
      // Has token but it's expired
      return tokenData !== null && !isTokenValid(tokenData);
    },
    [authState]
  );

  return {
    connect,
    disconnect,
    getToken,
    isConnected,
    needsReconnect,
    isConnecting: connectingAccount !== null,
    connectedAccounts: {
      work: isTokenValid(authState.work),
      private: isTokenValid(authState.private),
    },
  };
}
