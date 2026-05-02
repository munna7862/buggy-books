import fs from 'fs';
import path from 'path';

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
}

export interface AppData {
  books: Book[];
  cart: Book[];
  orders: Order[];
}

export interface Order {
  id: string;
  items: Book[];
  total: number;
  customerName: string;
  date: string;
}

class DataStore {
  private data: AppData;
  private readonly defaultBooks: Book[] = [
    {
      "id": "1",
      "title": "The Great Buggy Gatsby",
      "author": "F. Scott Fitzgerald",
      "price": 10.99,
      "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop"
    },
    {
      "id": "2",
      "title": "To Kill a Mockingbird Exception",
      "author": "Harper Lee",
      "price": 15.5,
      "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop"
    },
    {
      "id": "3",
      "title": "1984 Bugs",
      "author": "George Orwell",
      "price": 12,
      "image": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop"
    },
    {
      "id": "4",
      "title": "Pride and Prejudice and Performance Issues",
      "author": "Jane Austen",
      "price": 9.99,
      "image": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop"
    }
  ];

  constructor() {
    this.data = {
      books: [...this.defaultBooks],
      cart: [],
      orders: []
    };
  }

  public getBooks(): Book[] {
    return this.data.books;
  }

  public getCart(): Book[] {
    return this.data.cart;
  }

  public getBookById(id: string): Book | undefined {
    return this.data.books.find(b => b.id === id);
  }

  public addToCart(book: Book): void {
    this.data.cart.push(book);
  }

  public removeFromCart(bookId: string): boolean {
    const index = this.data.cart.findIndex(b => b.id === bookId);
    if (index === -1) return false;
    this.data.cart.splice(index, 1);
    return true;
  }

  public clearCart(): void {
    this.data.cart = [];
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  public addOrder(order: Order): void {
    this.data.orders.push(order);
  }

  public resetData(): void {
    this.data = {
      books: [...this.defaultBooks],
      cart: [],
      orders: []
    };
  }
}

export const dataStore = new DataStore();
