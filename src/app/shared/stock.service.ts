import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import "rxjs/add/operator/toPromise";
import * as d3 from "d3";

import { parseJson, handleError } from '../shared/http-helpers';
import { DataPoint, Stock } from './stock.model';


@Injectable()
export class StockService {

  stockList: {stock: Stock, color: string}[] = [];

  w = 1100;
  h = 350;
  paddingX = 40;
  paddingY = 5;
  chartRef: d3.Selection<any>;
  xScale: d3.time.Scale<number, number>;
  yScale: d3.scale.Linear<number, number>;  
  xAxis: d3.svg.Axis;
  yAxis: d3.svg.Axis;
  lineFunc: d3.svg.Line<DataPoint>;

  lineRef: HTMLDivElement;
  leftBase = 317;
  mouseX = 0;

  constructor(private http: Http) { }

  updateMouseX(xPos: number) {
 	  this.mouseX = xPos;
  }

  createGraph(graph: HTMLDivElement, line: HTMLDivElement) {
    this.chartRef = d3.select(graph)
                      .append('svg')
                      .attr('width', this.w + 'px')
                      .attr('height', this.h + 'px');

    this.lineRef = line;
    console.log(this.lineRef);

    this.xScale = d3.time.scale();
    this.yScale = d3.scale.linear();
    this.xAxis = d3.svg.axis().orient('bottom');
    this.yAxis = d3.svg.axis().orient('left');

    // Draw axis first
    this.chartRef.append('g')
                  .attr('transform', `translate(0, ${this.h - this.paddingX})`)
                  .attr('class', 'x axis');
    this.chartRef.append('g')
                  .attr('transform', `translate(${this.paddingX}, 0)`)
                  .attr('class', 'y axis');

    this.lineFunc = d3.svg.line<DataPoint>()
                          .x((d, i) => this.xScale(d.date))
                          .y(d => this.yScale(d.price));
  }

  addStocktoChart(stockInfo: Stock) {
    this.stockList.push({stock: stockInfo, color: this.randomColor()});

    // Find appropriate scale based on min and max values in stock collection
    let minDate = d3.max(this.stockList, d => d3.min( d.stock.data, d2 => d2.date.getTime()) );
    let maxDate = d3.max(this.stockList, d => Date.parse(d.stock.newestDate));

    let minPrice = 999999;
    let maxPrice = 0;
    this.stockList.forEach(stockCol => {
      let stockMinPrice = d3.min(stockCol.stock.data, d => d.price);
      let stockMaxPrice = d3.max(stockCol.stock.data, d => d.price);
      if (stockMinPrice < minPrice) minPrice = stockMinPrice;
      if (stockMaxPrice > maxPrice) maxPrice = stockMaxPrice; 
    });

    this.xScale.domain([minDate, maxDate]).range([this.paddingX, this.w]);
    this.yScale.domain([minPrice, maxPrice]).range([this.h - this.paddingX, this.paddingX]);

    // Update x-axis labels
    let timeFormat = d3.time.format("%b '%y");
    this.xAxis.scale(this.xScale).tickFormat(timeFormat);
    this.yAxis.scale(this.yScale).ticks(6);

    this.chartRef.selectAll('g.x.axis').transition().duration(500).call(this.xAxis);
    this.chartRef.selectAll('g.y.axis').transition().duration(500).call(this.yAxis);
    this.chartRef.selectAll('.axis line, .axis path')
                  .attr('stroke', 'aliceblue')
                  .attr('shape-rendering', 'crispEdges')
                  .attr('fill', 'none')
                  .attr('color', 'aliceblue')
                  .attr('stroke-width', 1);

    this.chartRef.selectAll('.axis text')
                  .attr('font-size', '12px')
                  .attr('fill', 'aliceblue')
                  .attr('shape-rendering', 'crispEdges');

    // Apply list of stocks as new data
    let lines = this.chartRef.selectAll('.line')
                              .data(this.stockList.map(stockCol => stockCol.stock.data))
                              .attr('class', 'line');

    // Transition existing lines
    lines.transition().duration(500)
          .attr('d', this.lineFunc);

    // Add non-existing lines
    lines.enter()
          .append('svg:path')
          .attr('class', 'line')
          .attr('d', this.lineFunc)
          .attr('fill', 'none')
          .attr('stroke', (d, i) => this.stockList[i].color)
          .attr('stroke-width', 1.5);
    lines.exit();
  }

  /** Generate a random, evenly distributed color */
  randomColor(): string {
    let golden_ratio_conjugate = 0.618033988749895;
    let h = Math.random();
    h += golden_ratio_conjugate;
    h %= 1;
    return this.hslToRgb(h, 0.5, 0.60);
  }

  hslToRgb(h, s, l) {
      let r, g, b;
      if(s == 0){
          r = g = b = l; // achromatic
      } else {
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }
      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  }

  showLine() {
    //this.lineRef.setAttribute('left', this.mouseX + 'px');
  }

  getStockData(stockSymbol: string) {
    return this.http
                .get(`/api/getstockdata/${stockSymbol}`)
                .toPromise()
                .then(parseJson)
                .then(this.formatResponse)
                .then(stockInfo => this.addStocktoChart(stockInfo))
                .catch(handleError);
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
      let numberDate = new Date(dayData[0]);
      let formattedDayData = {
        date: numberDate,
        price: dayData[1]
      };
      formattedData.data.push(formattedDayData);
    });
    return formattedData;
  }

}