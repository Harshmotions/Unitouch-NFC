export interface Profile {
  id: string;
  username: string;
  fullName: string;
  designation?: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  portfolio?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  cardType: "standard" | "premium" | "metal";
  quantity: number;
  shippingAddress: ShippingAddress;
  profilePhotoUrl?: string;
  existingDesignUrl?: string;
  additionalNotes?: string;
  paymentStatus: "pending" | "paid" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderStatus: OrderStatus;
  amount: number;
  trackingNumber?: string;
  adminNotes?: string;
  profileId?: string;
  createdAt: string;
}

export type OrderStatus =
  | "received"
  | "in_review"
  | "designing"
  | "printing"
  | "shipped"
  | "delivered";

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AnalyticsEvent {
  id: string;
  profileId: string;
  username: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type EventType =
  | "page_view"
  | "whatsapp_click"
  | "website_click"
  | "contact_save"
  | "instagram_click"
  | "linkedin_click"
  | "email_click"
  | "phone_click"
  | "youtube_click"
  | "portfolio_click";

export interface CardVariant {
  id: "standard" | "premium" | "metal";
  name: string;
  price: number;
  priceInPaise: number;
  features: string[];
  isPopular?: boolean;
}
