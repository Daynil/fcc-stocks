import { Component } from '@angular/core';

import { StockService } from '../shared/stock.service';
import { Stock } from '../shared/stock.model';

@Component({
  moduleId: module.id,
  selector: 'stock-list',
  templateUrl: 'stock-list.component.html',
  styleUrls: ['stock-list.component.css']
})
export class StockListComponent {

  stockList: Stock[];

  constructor(private stockService: StockService) {
    this.stockList = this.stockService.stockList;
  }

  colorHover(stock: Stock, state: string) {
    if (state === 'over') {
      if (!stock.hover) stock.hover = true; 
    } else if (stock.hover) stock.hover = false;
  }

  removeStock(stock: Stock) {
    this.stockService.removeStock(stock);
  }

}