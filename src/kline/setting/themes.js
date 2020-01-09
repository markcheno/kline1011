export default class Theme {
  constructor() {
    this.Color = {
      Positive: '#ed5555',
      Negative: '#2fa69a',
      Background: '#fff',
      BackgroundGrid: '#333',
      Normal: '#333',
      Grid: '#333',
      BackgroundGridColor: '#eee',
    };
    this.Line = {
      fillColor: 'rgba(45, 113, 174, .2)',
      strokeColor: '#2D71AE',
      strokeLineWidth: 2,
      averageLineColor: '#e7b269',
      averageLineWidth: 1.5,
      MA: ['#a920ae', '#ffbb22', '#a8a8a8'],
      MACD: {
        lineWidth: 1.5,
        DIF: '#ffbb22',
        DEA: '#a920ae',
        MACDpositive: '#ed5555',
        MACDnegative: '#2fa69a',
      },
    };
    this.Font = {
      Default: '12px Tahoma',
    };
  }
}
