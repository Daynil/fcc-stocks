import { Component } from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';

import { AttributionComponent } from './shared/attribution.component';
import { SocketService } from './shared/socket.service';
import { StockGraphComponent } from './stock-graph/stock-graph.component';
import { StockListComponent } from './stock-list/stock-list.component';
import { StockService } from './shared/stock.service';

@Component({
  moduleId: module.id,
  selector: 'my-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  directives: [AttributionComponent, StockGraphComponent, StockListComponent],
  providers: [HTTP_PROVIDERS, SocketService, StockService],
  viewBindings: [StockService]
})
export class AppComponent {
  socket: SocketIOClient.Socket;

  constructor(private stockService: StockService) {}

  addStock(stockInput: HTMLInputElement) {
    let stockName = stockInput.value;
    if (stockName.length < 1) return;
    stockInput.value = '';
    this.stockService.getStockData(stockName);
  }
}