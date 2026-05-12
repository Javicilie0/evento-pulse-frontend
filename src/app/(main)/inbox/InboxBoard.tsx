'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import type { Conversation } from '@/types/api'

const SWIPE_THRESHOLD = 72 // px to reveal delete

function ConversationRow({
  conversation,
  onDelete,
}: {
  conversation: Conversation
  onDelete: (token: string) => void
}) {
  const initial = (conversation.otherUserName?.[0] ?? '?').toUpperCase()
  const scope = conversation.isPageConversation
    ? conversation.currentUserOwnsPage
      ? `Page inbox: ${conversation.pageName ?? ''}`
      : `To page: ${conversation.pageName ?? ''}`
    : conversation.status === 'Pending'
    ? 'Message request'
    : 'Personal'

  const startXRef = useRef<number | null>(null)
  const [offsetX, setOffsetX] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null) return
    const delta = startXRef.current - e.touches[0].clientX
    if (delta > 0) {
      setOffsetX(Math.min(delta, SWIPE_THRESHOLD + 20))
    }
  }

  function onTouchEnd() {
    if (offsetX >= SWIPE_THRESHOLD) {
      setOffsetX(SWIPE_THRESHOLD)
      setSwiped(true)
    } else {
      setOffsetX(0)
      setSwiped(false)
    }
    startXRef.current = null
  }

  function cancel() {
    setOffsetX(0)
    setSwiped(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/api/messages/conversations/${conversation.token}`)
      onDelete(conversation.token)
    } catch {
      setDeleting(false)
      cancel()
    }
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Red delete backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 16,
          borderRadius: 8,
        }}
      >
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {deleting
            ? <span className="spinner-border spinner-border-sm text-white" />
            : <i className="bi bi-trash" style={{ fontSize: '1.2rem' }} />}
          Изтрий
        </button>
      </div>

      {/* Row — slides left to reveal delete */}
      <div
        style={{
          transform: `translateX(-${offsetX}px)`,
          transition: offsetX === 0 || offsetX === SWIPE_THRESHOLD ? 'transform 0.2s ease' : 'none',
          position: 'relative',
          background: 'var(--bs-body-bg, #fff)',
          borderRadius: 8,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={swiped ? cancel : undefined}
      >
        <Link
          href={swiped ? '#' : `/inbox/${conversation.token}`}
          onClick={swiped ? e => { e.preventDefault(); cancel() } : undefined}
          className={`social-conversation-row ${conversation.isIncomingRequest ? 'is-request' : ''}`}
          data-conversation-row
          data-list-key={conversation.listKey ?? 'personal'}
          data-page-name={conversation.pageName ?? ''}
        >
          {conversation.otherUserImageUrl ? (
            <img src={conversation.otherUserImageUrl} alt={conversation.otherUserName} />
          ) : (
            <span className="social-conversation-row__fallback">{initial}</span>
          )}
          <div>
            <strong data-conversation-name>{conversation.otherUserName}</strong>
            <small data-conversation-last>
              <span>{scope}</span>
              {conversation.lastMessage ? <span> - {conversation.lastMessage}</span> : null}
            </small>
          </div>
          {conversation.lastMessageAt && (
            <time data-conversation-time>{format(new Date(conversation.lastMessageAt), 'dd.MM HH:mm')}</time>
          )}
          {conversation.unreadCount > 0 && <b data-conversation-badge>{conversation.unreadCount}</b>}
        </Link>
      </div>
    </div>
  )
}

export function InboxBoard({ conversations: initial }: { conversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initial)
  const [tab, setTab] = useState<'personal' | 'page' | 'requests'>(() => {
    if (initial.some(c => (c.listKey ?? 'personal') === 'personal')) return 'personal'
    if (initial.some(c => c.listKey === 'page')) return 'page'
    if (initial.some(c => c.listKey === 'requests')) return 'requests'
    return 'personal'
  })
  const [query, setQuery] = useState('')
  const [pageFilter, setPageFilter] = useState('')

  const handleDelete = useCallback((token: string) => {
    setConversations(prev => prev.filter(c => c.token !== token))
  }, [])

  const grouped = useMemo(() => ({
    personal: conversations.filter(c => (c.listKey ?? 'personal') === 'personal'),
    page: conversations.filter(c => c.listKey === 'page'),
    requests: conversations.filter(c => c.listKey === 'requests'),
  }), [conversations])

  const pageFilters = useMemo(() => {
    const names = grouped.page.map(c => c.pageName).filter(Boolean) as string[]
    return Array.from(new Set(names)).sort()
  }, [grouped.page])

  const visible = grouped[tab].filter(c => {
    const haystack = [c.otherUserName, c.pageName, c.lastMessage].join(' ').toLowerCase()
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
    const matchesPage = tab !== 'page' || !pageFilter || c.pageName === pageFilter
    return matchesQuery && matchesPage
  })

  return (
    <>
      <div className="messages-search-bar" data-message-search>
        <i className="bi bi-search" />
        <input
          type="search"
          autoComplete="off"
          placeholder="Търси човек, страница или последно съобщение..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}>
            <i className="bi bi-x-lg" />
            <span>Изчисти</span>
          </button>
        )}
      </div>

      <nav className="messages-inbox-tabs" aria-label="Messages inbox">
        <button type="button" className={tab === 'personal' ? 'is-active' : ''} onClick={() => setTab('personal')}>
          <i className="bi bi-person" /><span>Лични</span><b>{grouped.personal.length}</b>
        </button>
        <button type="button" className={tab === 'page' ? 'is-active' : ''} onClick={() => setTab('page')}>
          <i className="bi bi-building" /><span>Страници</span><b>{grouped.page.length}</b>
        </button>
        {grouped.requests.length > 0 && (
          <button type="button" className={tab === 'requests' ? 'is-active' : ''} onClick={() => setTab('requests')}>
            <i className="bi bi-inbox" /><span>Заявки</span><b>{grouped.requests.length}</b>
          </button>
        )}
      </nav>

      <div className="social-message-board">
        <section className={`social-message-panel ${tab === 'requests' ? 'social-message-panel--requests' : tab === 'page' ? 'social-message-panel--page' : ''}`}>
          <div className="social-message-panel__head">
            <span className="groove-kicker">{tab === 'page' ? 'Page inbox' : tab === 'requests' ? 'Requests' : 'Personal'}</span>
            <h2>{tab === 'page' ? 'Messages to your public pages' : tab === 'requests' ? 'Needs approval' : 'Personal messages'}</h2>
          </div>

          {tab === 'page' && pageFilters.length > 1 && (
            <div className="messages-page-filter">
              <button type="button" className={!pageFilter ? 'is-active' : ''} onClick={() => setPageFilter('')}><span>Всички</span><b>{grouped.page.length}</b></button>
              {pageFilters.map(name => (
                <button key={name} type="button" className={pageFilter === name ? 'is-active' : ''} onClick={() => setPageFilter(name)}>
                  <span>{name}</span><b>{grouped.page.filter(c => c.pageName === name).length}</b>
                </button>
              ))}
            </div>
          )}

          <div className={`social-message-list ${tab === 'requests' ? 'social-message-list--compact' : ''}`}>
            {visible.length === 0 ? (
              <div className="social-empty-panel">
                <i className={tab === 'page' ? 'bi bi-building' : 'bi bi-chat-dots'} />
                <span>{query ? 'Няма разговори по това търсене.' : tab === 'page' ? 'Още няма съобщения към public pages.' : 'Няма разговори тук.'}</span>
              </div>
            ) : visible.map(c => (
              <ConversationRow key={c.token} conversation={c} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
