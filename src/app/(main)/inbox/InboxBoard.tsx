'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Conversation } from '@/types/api'

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const initial = (conversation.otherUserName?.[0] ?? '?').toUpperCase()
  const scope = conversation.isPageConversation
    ? conversation.currentUserOwnsPage
      ? `Page inbox: ${conversation.pageName ?? ''}`
      : `To page: ${conversation.pageName ?? ''}`
    : conversation.status === 'Pending'
      ? 'Message request'
      : 'Personal'

  return (
    <Link
      href={`/inbox/${conversation.token}`}
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
      {conversation.lastMessageAt && <time data-conversation-time>{format(new Date(conversation.lastMessageAt), 'dd.MM HH:mm')}</time>}
      {conversation.unreadCount > 0 && <b data-conversation-badge>{conversation.unreadCount}</b>}
    </Link>
  )
}

export function InboxBoard({ conversations }: { conversations: Conversation[] }) {
  const [tab, setTab] = useState<'personal' | 'page' | 'requests'>(() => {
    if (conversations.some(c => (c.listKey ?? 'personal') === 'personal')) return 'personal'
    if (conversations.some(c => c.listKey === 'page')) return 'page'
    if (conversations.some(c => c.listKey === 'requests')) return 'requests'
    return 'personal'
  })
  const [query, setQuery] = useState('')
  const [pageFilter, setPageFilter] = useState('')

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
            ) : visible.map(c => <ConversationRow key={c.token} conversation={c} />)}
          </div>
        </section>
      </div>
    </>
  )
}
