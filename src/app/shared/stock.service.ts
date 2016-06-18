import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import "rxjs/add/operator/toPromise";
import * as d3 from "d3";

import { parseJson, handleError } from '../shared/http-helpers';
import { DataPoint, Stock } from './stock.model';


@Injectable()
export class StockService {

  stockList: Stock[] = [];

  chartRef: d3.Selection<any>;
  w = 1049;
  h = 241;
  xScale: d3.scale.Linear<number, number>;
  yScale: d3.scale.Linear<number, number>;  

  constructor(private http: Http) { }

  createGraph(el: HTMLDivElement) {
    this.chartRef = d3.select(el)
                      .append('svg')
                      .attr('width', this.w + 'px')
                      .attr('height', this.h + 'px');

    this.xScale = d3.scale.linear();
    this.yScale = d3.scale.linear();

    this.getStockData('FB')
        .then(stockInfo => this.addStocktoChart(stockInfo));
  }

  addStocktoChart(stockInfo: Stock) {
    this.stockList.push(stockInfo);
    let dataset = stockInfo.data;

    // Find appropriate scale based on min and max values in stock collection
    let minDate = d3.min(this.stockList, d => Date.parse(d.oldestDate));
    let maxDate = d3.max(this.stockList, d => Date.parse(d.newestDate));

    let minPrice = 999999;
    let maxPrice = 0;
    this.stockList.forEach(stock => {
      let stockMinPrice = d3.min(stock.data, d => d.price);
      let stockMaxPrice = d3.max(stock.data, d => d.price);
      if (stockMinPrice < minPrice) minPrice = stockMinPrice;
      if (stockMaxPrice > maxPrice) maxPrice = stockMaxPrice; 
    });

    this.xScale.domain([minDate, maxDate]).range([0, this.w]);

    this.yScale.domain([minPrice, maxPrice]).range([this.h, 0]);

    // Create and append line to chart
    let line = d3.svg.line<DataPoint>()
                  .x((d, i) => this.xScale(d.date))
                  .y(d => this.yScale(d.price));

    this.chartRef.append('svg:path')
                  .attr('d', line(dataset))
                  .attr('fill', 'none')
                  .attr('stroke', 'hsl(191, 100%, 50%)')
                  .attr('stroke-width', 1.5);
  }

  getStockData(stockSymbol: string) {
    return this.http
                .get(`/api/getstockdata/${stockSymbol}`)
                .toPromise()
                .then(parseJson)
                .then(this.formatResponse)
                .catch(handleError)
  }

  private formatResponse(dataset) {
    let data = dataset.dataset;
    let formattedData: Stock = <Stock>{};
    formattedData.symbol = data.dataset_code;
    let nameEnd = data.name.indexOf('(') - 1;
    formattedData.name = data.name.slice(0, nameEnd);
    formattedData.newestDate = data.newest_available_date;
    formattedData.oldestDate = data.oldest_available_date;
    formattedData.data = [];
    data.data.forEach(dayData => {
      let numberDate = Date.parse(dayData[0]);
      let formattedDayData = {
        date: numberDate,
        price: dayData[1]
      };
      formattedData.data.push(formattedDayData);
    });
    return formattedData;
  }

}