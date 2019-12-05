export default class Setting {
  constructor() {
    this.symbol = null;
    this.period = null;
    this.chartPadding = {
      left: 0,
      right: 0,
    };
    this.timelineAreaHeight = 30;
    this.chart = [{
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
  }
}
