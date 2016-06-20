export interface Stock {
  data: DataPoint[];
  symbol: string;
  name: string;
  newestDate: string;
  oldestDate: string;
}

export interface DataPoint {
  date: Date;
  price: number;
}

export interface StockColorArr extends Array<number[]|string>{
  0: number[];
  1: string;
}