export default class Setting {
  constructor() {
    this.symbol = null;
    this.period = null;
    // 保留小数点
    this.decimalDigits = 2;
    this.chartPadding = {
      left: 0,
      right: 0,
    };
    this.timelineAreaHeight = 30;
    // candle 蜡烛图 line 分时图
    this.chartType = 'line';
    this.candlechart = [{
      name: 'mainChartLayout',
      chartPlotters: 'CandlestickPlotter',
      chartInfoPlotters: 'CandlestickInfoPlotter',
      boundaryGap: ['10%', '10%'],
      chartIndicator: {
        MA: {
          sign: 'close',
          data: ['MA5', 'MA10', 'MA20'],
        },
      },
      chartConfig: {
        sign: 'Candle',
      },
    }];
    this.lineChart = [{
      name: 'lineChartLayout',
      chartPlotters: 'LineChartPlotter',
      chartInfoPlotters: 'LineChartInfoPlotter',
      boundaryGap: ['20%', '50%'],
      chartConfig: {
        sign: 'Line',
      },
    }];
  }

  // 添加视图
  addChart(item) {
    const chart = this.chartType === 'candle' ? this.candlechart : this.lineChart;
    // 去重
    let isRepeat = false;
    chart.forEach(element => {
      if (element.name === item.name) isRepeat = true;
    });
    isRepeat || chart.unshift(item);
  }

  getChart() {
    return this.chartType === 'candle' ? this.candlechart : this.lineChart;
  }

  init(option) {
    const { symbol, period, decimalDigits } = option;
    this.setPeriod(period);
    this.setSymbol(symbol);
    this.setDecimalDigits(decimalDigits);
  }

  setSymbol(symbol) {
    this.symbol = symbol;
  }

  setPeriod(period) {
    this.period = period;
  }

  setDecimalDigits(decimalDigits) {
    this.decimalDigits = decimalDigits;
  }

  getChartType() {
    return this.chartType;
  }

  setChartType(type) {
    this.chartType = type;
  }

  getSymbol() {
    return this.symbol;
  }

  getPeriod() {
    return this.period;
  }
}
