

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
  genre?: string;
  description?: string;
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

export interface PaginatedBooks {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

class DataStore {
  private data: AppData;
  private readonly defaultBooks: Book[] = [
    { id: '1', title: 'The Great Buggy Gatsby', author: 'F. Scott Fitzgerald', price: 10.99, genre: 'Classic', description: 'A story of wealth, obsession, and bugs in the Jazz Age.', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop' },
    { id: '2', title: 'To Kill a Mockingbird Exception', author: 'Harper Lee', price: 15.50, genre: 'Classic', description: 'A coming-of-age tale with unhandled exceptions.', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop' },
    { id: '3', title: '1984 Bugs', author: 'George Orwell', price: 12.00, genre: 'Dystopian', description: 'Big Bug is watching your code.', image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop' },
    { id: '4', title: 'Pride and Prejudice and Performance Issues', author: 'Jane Austen', price: 9.99, genre: 'Classic', description: 'A tale of love, society, and slow query performance.', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop' },
    { id: '5', title: 'The Null and the Furious', author: 'Cormac McCarthy', price: 13.99, genre: 'Thriller', description: 'Null pointer exceptions wreak havoc on the open road.', image: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=600&auto=format&fit=crop' },
    { id: '6', title: 'Harry Potter and the Goblet of Fire Events', author: 'J.K. Rowling', price: 19.99, genre: 'Fantasy', description: 'Asynchronous magic tournaments and event loop chaos.', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=600&auto=format&fit=crop' },
    { id: '7', title: 'The Hitchhiker\'s Guide to the API', author: 'Douglas Adams', price: 11.50, genre: 'Sci-Fi', description: 'The answer to life, the universe, and REST endpoints is 42.', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop' },
    { id: '8', title: 'Moby Stack Overflow', author: 'Herman Melville', price: 8.99, genre: 'Classic', description: 'Captain Ahab\'s obsessive pursuit of the white stack trace.', image: 'https://images.unsplash.com/photo-1623018035782-b269248df916?q=80&w=600&auto=format&fit=crop' },
    { id: '9', title: 'War and Parse', author: 'Leo Tolstoy', price: 17.99, genre: 'Classic', description: 'An epic battle between JSON and XML parsers.', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=600&auto=format&fit=crop' },
    { id: '10', title: 'Crime and Refactoring', author: 'Fyodor Dostoevsky', price: 14.50, genre: 'Thriller', description: 'A developer\'s guilt-ridden journey of merging to production.', image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=600&auto=format&fit=crop' },
    { id: '11', title: 'Brave New Debug World', author: 'Aldous Huxley', price: 11.99, genre: 'Dystopian', description: 'A world where logging is banned and breakpoints are illegal.', image: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=600&auto=format&fit=crop' },
    { id: '12', title: 'Of Memory and Men', author: 'John Steinbeck', price: 9.50, genre: 'Classic', description: 'Two developers dream of the perfect memory allocation scheme.', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600&auto=format&fit=crop' },
    { id: '13', title: 'Fahrenheit 500: Internal Server Error', author: 'Ray Bradbury', price: 12.99, genre: 'Dystopian', description: 'A society that burns documentation.', image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600&auto=format&fit=crop' },
    { id: '14', title: 'The Catcher in the Deploy', author: 'J.D. Salinger', price: 10.00, genre: 'Classic', description: 'Holden catches failed deployments before they hit production.', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop' },
    { id: '15', title: 'Don Quixote de la Repository', author: 'Miguel de Cervantes', price: 16.99, genre: 'Classic', description: 'A delusional developer tilts at windmill microservices.', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop' },
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

  public getBooksPaginated(query: string, page: number, limit: number): PaginatedBooks {
    let filtered = this.data.books;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.genre && b.genre.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const books = filtered.slice(start, start + limit);

    return { books, total, page, totalPages, limit };
  }

  public getBookById(id: string): Book | undefined {
    return this.data.books.find(b => b.id === id);
  }

  public getCart(): Book[] {
    return this.data.cart;
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

