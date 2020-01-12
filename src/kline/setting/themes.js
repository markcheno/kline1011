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
      BOLL: {
        lineWidth: 1.5,
        MID: '#406fa9',
        UP: '#d84028',
        LOW: '#468d33',
      },
      ENV: {
        lineWidth: 1.5,
        EnvUp: '#ffbb22',
        EnvLow: '#a920ae',
      },
      CG: {
        lineWidth: 1.5,
        CGLine: '#1E90FF',
        CGTrendPositive: '#ed5555',
        CGTrendNegative: '#2fa69a',
        BuySellFont: 'normal bold 12px sans-serif',
        BuySellFillPositive: 'rgba(237,85,85, .3)',
        BuySellFillNegative: 'rgba(47,166,154, .3)',
      },
    };
    this.Font = {
      Default: '12px Tahoma',
    };
  }
}
