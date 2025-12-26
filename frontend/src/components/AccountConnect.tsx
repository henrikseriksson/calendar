import type { AccountId } from '../types';

type AccountConnectProps = {
  onConnect: (accountId: AccountId) => void;
  onDisconnect: (accountId: AccountId) => void;
  connectedAccounts: { work: boolean; private: boolean };
  isConnecting: boolean;
};

export function AccountConnect({
  onConnect,
  onDisconnect,
  connectedAccounts,
  isConnecting,
}: AccountConnectProps) {
  return (
    <div className="account-connect">
      <AccountButton
        accountId="work"
        label="Work"
        color="#3b82f6"
        isConnected={connectedAccounts.work}
        isConnecting={isConnecting}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
      <AccountButton
        accountId="private"
        label="Private"
        color="#22c55e"
        isConnected={connectedAccounts.private}
        isConnecting={isConnecting}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </div>
  );
}

type AccountButtonProps = {
  accountId: AccountId;
  label: string;
  color: string;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: (accountId: AccountId) => void;
  onDisconnect: (accountId: AccountId) => void;
};

function AccountButton({
  accountId,
  label,
  color,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: AccountButtonProps) {
  if (isConnected) {
    return (
      <button
        className="account-button connected"
        style={{ '--account-color': color } as React.CSSProperties}
        onClick={() => onDisconnect(accountId)}
      >
        <span className="status-dot" />
        {label}
        <span className="disconnect-label">✕</span>
      </button>
    );
  }

  return (
    <button
      className="account-button"
      style={{ '--account-color': color } as React.CSSProperties}
      onClick={() => onConnect(accountId)}
      disabled={isConnecting}
    >
      + Connect {label}
    </button>
  );
}

