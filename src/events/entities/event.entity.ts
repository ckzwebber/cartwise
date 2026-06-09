export interface Event {
  userId: number;
  productId: number;
  type: EVENT_TYPE;
  createdAt: Date;
}

export const EVENT_TYPE = {
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  ADD_TO_LIST: 'ADD_TO_LIST',
  PURCHASE: 'PURCHASE',
} as const;

export type EVENT_TYPE = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];
