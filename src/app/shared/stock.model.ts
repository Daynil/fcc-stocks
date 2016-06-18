export interface Stock {
  data: DataPoint[];
  symbol: string;
  name: string;
  newestDate: string;
  oldestDate: string;
}

export interface DataPoint {
  date: number;
  price: number;
}