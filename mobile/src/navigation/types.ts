import type { Book } from '@buggybooks/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type CatalogStackParamList = {
  Catalog: undefined;
  BookDetail: { bookId: string; book?: Book };
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
};

export type MainTabParamList = {
  CatalogTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
  ChaosTab: undefined;
};

