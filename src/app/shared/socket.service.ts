import { EventEmitter, Injectable } from '@angular/core';
import * as io from 'socket.io-client';

import { Stock } from './stock.model';

@Injectable()
export class SocketService {
  socket: SocketIOClient.Socket;
  pushStock: EventEmitter<Stock> = new EventEmitter<Stock>();
  removeStock: EventEmitter<Stock> = new EventEmitter<Stock>();

  constructor() {
    this.socket = io();
    this.socket.on('pushStock', stock => {
      this.pushStock.emit(stock);
    });
    this.socket.on('sliceStock', stock => {
      this.removeStock.emit(stock);
    })
  }

  emitStock(stock: Stock) {
    this.socket.emit('newStock', stock);
  }

  emitRemovedStock(stock: Stock) {
    this.socket.emit('removeStock', stock);
  }

}