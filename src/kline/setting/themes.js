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
      MA: {
        lineWidth: 1.5,
        MALineColor: ['#a920ae', '#ffbb22', '#a8a8a8'],
        infoColor: '#333',
        infoFont: '12px sans-serif',
      },
      MACD: {
        lineWidth: 1.5,
        DIF: '#ffbb22',
        DEA: '#a920ae',
        MACDInfo: '#CD853F',
        MACDpositive: '#ed5555',
        MACDnegative: '#2fa69a',
        infoColor: '#333',
        infoFont: '12px sans-serif',
      },
      BOLL: {
        lineWidth: 1.5,
        MID: '#406fa9',
        UP: '#d84028',
        LOW: '#468d33',
        infoColor: '#333',
        infoFont: '12px sans-serif',
      },
      ENV: {
        lineWidth: 1.5,
        EnvUp: '#ffbb22',
        EnvLow: '#a920ae',
        infoColor: '#333',
        infoFont: '12px sans-serif',
      },
      CG: {
        lineWidth: 1.5,
        CGLine: '#1E90FF',
        CGTrendPositive: '#ed5555',
        CGTrendNegative: '#2fa69a',
        BuySellFont: 'normal bold 12px sans-serif',
        BuySellFillPositive: 'rgba(237,85,85, .3)',
        BuySellFillNegative: 'rgba(47,166,154, .3)',
        infoFont: '12px sans-serif',
      },
      Volume: {
        infoColor: '#333',
        infoFont: '12px sans-serif',
      },
      VR: {
        lineWidth: 1.5,
        infoColor: '#333',
        infoFont: '12px sans-serif',
        VRColor: '#CD853F',
      },
      WR: {
        lineWidth: 1.5,
        infoColor: '#333',
        infoFont: '12px sans-serif',
        WRColor: '#FFA500',
      },
      RSI: {
        lineWidth: 1.5,
        infoColor: '#333',
        infoFont: '12px sans-serif',
        RSI1: '#F4A460',
        RSI2: '#FFD700',
      },
      KDJ: {
        lineWidth: 1.5,
        infoColor: '#333',
        infoFont: '12px sans-serif',
        K: '#FFA500',
        D: '#800080',
        J: '#00BFFF',
      },
      CCI: {
        lineWidth: 1.5,
        infoColor: '#333',
        infoFont: '12px sans-serif',
        CCI: '#FFA500',
      },
    };
    this.Font = {
      Default: '12px Tahoma',
    };
  }
}
