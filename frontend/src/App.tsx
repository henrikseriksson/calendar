import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CalendarGrid } from './components/CalendarGrid';
import { AccountConnect } from './components/AccountConnect';
import { ZoomControls } from './components/ZoomControls';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import type { CalEvent } from './types';
import './App.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function CalendarApp() {
  const [pxPerDay, setPxPerDay] = useState(100);
  const [demoMode, setDemoMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    connect,
    disconnect,
    getToken,
    connectedAccounts,
    isConnecting,
  } = useGoogleAuth();

  const {
    events,
    loading,
    error,
    refetch,
    getEventsForDay,
  } = useCalendarEvents({ getToken });

  // Demo mode: return empty events
  const demoGetEventsForDay = useCallback((): CalEvent[] => [], []);

  const hasConnectedAccount = connectedAccounts.work || connectedAccounts.private;
  const showCalendar = hasConnectedAccount || demoMode;

  return (
    <div className="app" ref={containerRef}>
      <header className="app-header">
        <h1 className="app-title">Calendar</h1>
        <div className="header-controls">
          <AccountConnect
            onConnect={connect}
            onDisconnect={disconnect}
            connectedAccounts={connectedAccounts}
            isConnecting={isConnecting}
          />
          {hasConnectedAccount && (
            <button className="refresh-button" onClick={refetch} disabled={loading}>
              ↻ Refresh
            </button>
          )}
        </div>
      </header>

      {!CLIENT_ID && (
        <div className="warning-banner">
          ⚠️ No Google Client ID configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.
        </div>
      )}

      {error && (
        <div className="error-banner">
          Error: {error}
          <button onClick={refetch}>Retry</button>
        </div>
      )}

      {!showCalendar ? (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>Welcome to Calendar</h2>
            <p>Connect your Google accounts to see your events in a unified view.</p>
            <p className="welcome-hint">
              You can connect both your work and private calendars.
            </p>
            <button 
              className="demo-button" 
              onClick={() => setDemoMode(true)}
            >
              Preview Calendar (Demo)
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <ZoomControls pxPerDay={pxPerDay} onZoomChange={setPxPerDay} />
            <div className="event-count">
              {demoMode ? (
                <span className="demo-label">Demo mode - <button onClick={() => setDemoMode(false)}>Exit</button></span>
              ) : (
                loading ? 'Loading...' : `${events.length} events`
              )}
            </div>
          </div>

          <CalendarGrid
            events={demoMode ? [] : events}
            pxPerDay={pxPerDay}
            getEventsForDay={demoMode ? demoGetEventsForDay : getEventsForDay}
          />
        </>
      )}
    </div>
  );
}

function App() {
  if (!CLIENT_ID) {
    return (
      <div className="app">
        <div className="setup-required">
          <h1>Setup Required</h1>
          <p>Please configure your Google OAuth Client ID:</p>
          <ol>
            <li>Create a project at <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
            <li>Enable the Google Calendar API</li>
            <li>Create OAuth 2.0 credentials (Web application)</li>
            <li>Add <code>http://localhost:5173</code> as authorized origin</li>
            <li>Create a <code>.env</code> file with: <code>VITE_GOOGLE_CLIENT_ID=your-client-id</code></li>
            <li>Restart the dev server</li>
          </ol>
          <p>See <a href="./SETUP.md">SETUP.md</a> for detailed instructions.</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <CalendarApp />
    </GoogleOAuthProvider>
  );
}

export default App;
