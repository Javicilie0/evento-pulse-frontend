// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  userName: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  bio?: string
  roles: string[]
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

// ── Events ────────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'Going' | 'Interested'

export interface EventCard {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  genre: string
  imageUrl?: string
  address: string
  city: string
  latitude?: number
  longitude?: number
  organizerName: string
  organizerProfileId?: number
  likesCount: number
  savesCount: number
  goingCount: number
  interestedCount: number
  isLiked: boolean
  isSaved: boolean
  userAttendanceStatus?: AttendanceStatus | null
}

export interface EventComment {
  id: number
  userId: string
  userName: string
  authorImageUrl?: string
  content: string
  createdAt: string
  likesCount: number
  currentUserLiked: boolean
  canDelete: boolean
  replies: EventComment[]
}

export interface TicketOption {
  id: string
  name: string
  price: number
  currency: string
  availableCount?: number
  description?: string
}

export interface EventOccurrence {
  id: number
  startDateTime: string
  endDateTime: string
  status: string
  isAvailable: boolean
}

export interface EventDetails extends EventCard {
  latitude?: number
  longitude?: number
  organizerId: string
  organizerProfileId?: number
  businessWorkspaceId?: number
  imageUrls: string[]
  commentsCount: number
  comments: EventComment[]
  tickets: TicketOption[]
  occurrences: EventOccurrence[]
  similarEvents: EventCard[]
  canEdit: boolean
  canDelete: boolean
  canManageTickets: boolean
  isRecurring: boolean
  ticketingMode: 'GeneralAdmission' | 'Seating'
  venueLayoutId?: number
  isApproved: boolean
  hasPendingChanges: boolean
  currentUserPinned?: boolean
  currentUserSharedToProfile?: boolean
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export interface PostComment {
  id: number
  userId: string
  userName: string
  authorImageUrl?: string
  content: string
  createdAt: string
  likesCount: number
  currentUserLiked: boolean
  canDelete: boolean
  replies: PostComment[]
}

export interface Post {
  id: number
  authorId: string
  organizerProfileId?: number
  authorName: string
  authorImageUrl?: string
  content: string
  mediaType?: string
  mediaUrl?: string
  createdAt: string
  likesCount: number
  savesCount: number
  commentsCount: number
  isLiked: boolean
  isSaved: boolean
  canEdit: boolean
  canDelete: boolean
  comments?: PostComment[]
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface Conversation {
  token: string
  otherUserId: string
  otherUserName: string
  otherUserImageUrl?: string
  organizerProfileId?: number
  pageName?: string
  pageImageUrl?: string
  currentUserOwnsPage?: boolean
  isPageConversation?: boolean
  isIncomingRequest?: boolean
  listKey?: 'personal' | 'page' | 'requests'
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  status: 'Active' | 'Pending' | 'Declined'
}

export interface Message {
  id: number
  content: string
  senderId: string
  senderName: string
  senderImageUrl?: string
  createdAt: string
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export interface UserTicket {
  id: string
  eventId: number
  eventTitle: string
  eventStartTime: string
  eventAddress: string
  eventCity: string
  ticketType: string
  qrCodeUrl: string
  pdfUrl?: string
  isUsed: boolean
  purchasedAt: string
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  userName: string
  displayName?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  bio?: string
  isOrganizer?: boolean
  organizationName?: string
  website?: string
  profileStatusText?: string
  profileStatusEmoji?: string
  profileStatusUpdatedAt?: string
  profileStatusVisibility?: string
  pinnedEventId?: number
  followerCount: number
  followingCount: number
  followersCount?: number
  followingCountLegacy?: number
  postsCount?: number
  eventsCount?: number
  savedEventsCount?: number
  goingEventsCount?: number
  ticketsCount?: number
  vibeTags?: string[]
  eventsAttendedCount?: number
  eventsInterestedCount?: number
  likesGivenCount?: number
  monthlyEventsCount?: number
  monthlyNewFollowersCount?: number
  favouriteGenre?: string
  citiesVisitedCount?: number
  isFollowing: boolean
  currentUserFollows?: boolean
  isOwnProfile: boolean
  isCurrentUser?: boolean
  canStartConversation?: boolean
  canEditProfileStatus?: boolean
  roles: string[]
  pinnedEvent?: EventCard | null
  sharedEvents?: EventCard[]
  savedEvents?: EventCard[]
  goingEvents?: EventCard[]
  events?: EventCard[]
  posts?: Post[]
  memories?: Array<{
    eventId: number
    title: string
    city: string
    imageUrl?: string
    eventDate: string
    yearsAgo: number
  }>
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ── Event search params ────────────────────────────────────────────────────────

export interface EventSearchParams {
  page?: number
  pageSize?: number
  genre?: string
  city?: string
  keyword?: string
  dateFrom?: string
  dateTo?: string
  nearMe?: boolean
  lat?: number
  lng?: number
}
