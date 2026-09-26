// Hand-friendly types mapped 1:1 from Go DTOs (internal/*/dto/*.go).
// Wire truth is `src/generated/schema.ts`; these are ergonomic aliases.

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type TicketStatus = "DRAFT" | "ACTIVE" | "PAUSED";
export type OrderStatus = "PENDING" | "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
export type AttendeeStatus = "REGISTERED" | "CHECKED_IN" | "CANCELLED";
export type CheckinOutcome = "CHECKED_IN" | "ALREADY_CHECKED_IN" | "INVALID_CODE" | "CANCELLED" | "WRONG_EVENT" | "REVERTED";
export type CheckinMethod = "qr" | "manual";

/** Pagination query. Server defaults page=1 perPage=20 max 100. */
export interface PageQuery {
  page?: number;
  perPage?: number;
}

/** Normalized page: server omits page/perPage on some routes; SDK fills from request. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// --- Auth ---
export interface RegisterInput { email: string; password: string; firstName?: string; lastName?: string }
export interface LoginInput { email: string; password: string }
export interface OrgMembership { id: string; slug: string; name: string; role: string; joinedAt?: string }
export interface Me { id: string; email: string; emailVerified: boolean; profile: { firstName?: string; lastName?: string }; organizations?: OrgMembership[] }

// --- Organizations ---
export interface CreateOrgInput { name: string; slug?: string; logo?: string }
export interface UpdateOrgInput { name?: string; slug?: string; logo?: string }
export interface Org { id: string; name: string; slug: string; logoUrl?: string; role?: string; createdAt: string }
export interface OrgMember { userId: string; email: string; name: string; emailVerified: boolean; role: string; joinedAt: string }
export interface OrgInvite { id: string; email: string; role: string; expiresAt: string; createdAt: string }
export interface Permission { object: string; action: string }
export interface CustomRole { id: string; name: string; permissions: Permission[]; holders: number; createdAt: string }

// --- Events ---
export interface CreateEventInput {
  title: string; slug?: string; description?: string; venue?: string; location?: string;
  startsAt?: string; endsAt?: string; capacity?: number;
}
export type UpdateEventInput = Partial<CreateEventInput> & { clearCover?: boolean };
export interface EventFilter extends PageQuery { status?: EventStatus; from?: string; to?: string; q?: string; sort?: "starts" | "created" }
export interface RallyaEvent {
  id: string; title: string; slug: string; description?: string; venue?: string; location?: string;
  startsAt?: string; endsAt?: string; capacity?: number; coverUrl?: string;
  status: EventStatus; createdAt: string; updatedAt: string;
}
export interface EventImage { id: string; url: string; publicId: string; format?: string; bytes: number; width?: number; height?: number; createdAt: string }

// --- Tickets ---
export interface CreateTicketInput {
  name: string; description?: string; priceCents: number; currency?: string;
  quantityTotal: number; maxPerOrder?: number; saleStartsAt?: string; saleEndsAt?: string;
}
export type UpdateTicketInput = Partial<CreateTicketInput>;
export interface TicketType {
  id: string; eventId: string; name: string; description?: string;
  priceCents: number; currency: string; quantityTotal: number; quantitySold: number;
  remaining: number; forSale: boolean; unavailableReason?: string;
  maxPerOrder?: number; saleStartsAt?: string; saleEndsAt?: string;
  status: TicketStatus; soldOut: boolean; createdAt: string;
}

// --- Orders ---
export interface CreateOrderInput { ticketTypeId: string; quantity: number; idempotencyKey?: string }
export interface Order {
  id: string; eventId: string; ticketTypeId: string; quantity: number;
  priceCents: number; currency: string; status: OrderStatus; expiresAt?: string; createdAt: string;
}
export interface CheckoutResponse { url: string; sessionId: string }

// --- Attendees ---
export interface Attendee {
  id: string; orderId?: string; unitIndex: number; eventId: string; userId?: string;
  email: string; name?: string; status: AttendeeStatus;
  qrPayload?: string; checkedInAt?: string; createdAt: string;
}

// --- Check-in ---
export interface ScanResult { outcome: CheckinOutcome; method: CheckinMethod; attendeeId?: string; checkedInAt?: string }
export interface CheckinStats { registered: number; checkedIn: number; cancelled: number; total: number }

// --- Kits ---
export type CollectionStatus = "PENDING" | "COLLECTED" | "VOIDED";
export interface KitType {
  id: string; eventId: string; name: string; description?: string;
  quantityTotal: number; pending: number; collected: number; voided: number;
  remaining: number; createdAt: string;
}
export interface KitCollection {
  id: string; kitId: string; kitName?: string; eventId: string; attendeeId: string;
  status: CollectionStatus; collectedAt?: string; collectedBy?: string; createdAt: string;
}
export interface KitCollectionFilter { kitId?: string; status?: CollectionStatus; attendeeId?: string }

// --- Audit / Admin ---
export interface AuditEvent {
  id: string; orgId?: string; actorId?: string; action: string;
  objectType: string; objectId?: string; before?: string; after?: string; createdAt: string;
}
export interface PolicyDiff { added: number; removed: number; total: number }
