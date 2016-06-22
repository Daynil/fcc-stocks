export interface Stock {
  data: DataPoint[];
  symbol: string;
  name: string;
  newestDate: string;
  oldestDate: string;
  color?: string;
  hover?: boolean;
  priceSelected?: number;
}

export interface DataPoint {
  date: Date;
  price: number;
}