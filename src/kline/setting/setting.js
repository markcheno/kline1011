export default class Setting {
  constructor() {
    this.symbol = null;
    this.period = null;
    this.chartPadding = {
      left: 0,
      right: 0,
    };
    this.timelineAreaHeight = 30;
    // candle 蜡烛图 line 分时图
    this.chartType = 'line';
    this.candlechart = [{
      name: 'volumeChartLayout',
      chartPlotters: 'VolumePlotter',
      chartInfoPlotters: 'VolumeInfoPlotter',
      boundaryGap: ['15%', '0%'],
      indicator: {
        min: 0,
        max: 'volume',
      },
    }, {
      name: 'mainChartLayout',
      chartPlotters: 'CandlestickPlotter',
      chartInfoPlotters: 'CandlestickInfoPlotter',
      boundaryGap: ['10%', '10%'],
      indicator: {
        min: 'low',
        max: 'high',
      },
    }];
    this.lineChart = [{
      name: 'lineChartLayout',
      chartPlotters: 'LineChartPlotter',
      chartInfoPlotters: 'LineChartInfoPlotter',
      boundaryGap: ['10%', '50%'],
      indicator: {
        min: 'low',
        max: 'high',
      },
    }];
  }

  getChart() {
    return this.chartType === 'candle' ? this.candlechart : this.lineChart;
  }

  init(option) {
    const { symbol, period } = option;
    this.setPeriod(period);
    this.setSymbol(symbol);
  }

  setSymbol(symbol) {
    this.symbol = symbol;
  }

  setPeriod(period) {
    this.period = period;
  }

  getSymbol() {
    return this.symbol;
  }

  getPeriod() {
    return this.period;
  }
}
