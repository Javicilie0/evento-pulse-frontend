import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

let _conn: HubConnection | null = null
let _startPromise: Promise<void> | null = null

export async function getFeedConnection(getToken: () => Promise<string | null>): Promise<HubConnection> {
  if (!_conn) {
    _conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/feed`, {
        accessTokenFactory: () => getToken().then(t => t ?? ''),
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()
  }

  if (_conn.state === HubConnectionState.Disconnected) {
    _startPromise = _conn.start().catch(() => { _startPromise = null })
    await _startPromise
  } else if (_startPromise) {
    await _startPromise
  }

  return _conn
}
