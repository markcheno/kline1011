// 指标相关
const layoutIndicator = {
  volume: {
    name: 'volumeChartLayout',
    chartPlotters: 'VolumePlotter',
    chartInfoPlotters: 'VolumeInfoPlotter',
    boundaryGap: ['15%', '0%'],
    chartConfig: {
      sign: 'Volume',
    },
  },
  MACD: {
    name: 'MACDChartLayout',
    chartPlotters: 'MACDPlotter',
    chartInfoPlotters: 'MACDInfoPLotter',
    boundaryGap: ['30%%', '30%'],
    chartConfig: {
      sign: 'MACD',
      data: {
        short: 12,
        long: 26,
        middle: 9,
      },
    },
  },
};

// 计算 MA 指标
function calcMAIndicator(option) {
  const { type, allData, appendLength, decimalDigits, MAConfig } = option;
  const MAArray = MAConfig.data;
  const MASign = MAConfig.sign;
  const MASize = MAArray.map(item => item.replace('MA', ''));
  const start = 0;
  let end = allData.length - 1;
  let maxMASize = 0;
  if (appendLength) {
    maxMASize = Math.max(...MASize);
    end = appendLength - 1 + maxMASize;
  }
  const total = {};
  MAArray.forEach(item => {
    total[item] = 0;
  });
  const calc = (item, index, element) => {
    const size = Number(item.replace('MA', ''));
    total[item] += element[MASign];
    const startMA = allData[index - size];
    if (startMA) {
      total[item] -= startMA[MASign];
      element[type][item] = (total[item] / size).toFixed(decimalDigits);
    } else {
      element[type][item] = (total[item] / (index + 1)).toFixed(decimalDigits);
    }
  };
  for (let i = start; i <= end; i++) {
    allData[i][type] = {};
    Object.keys(total).forEach(item => {
      calc(item, i, allData[i]);
    });
  }
  return maxMASize;
}

// 计算基础数 EMA 指数移动平均线 indicator: 指标名称 N: 周期
function calcEMAIndicator(option, indicator, N) {
  const { start, end, data, key } = option;
  const type = key || `${indicator}${N}`;
  for (let i = start; i <= end; i++) {
    const dataItem = data[i];
    const preDataItem = data[i - 1];
    if (!dataItem) continue;
    const priceToday = dataItem[indicator];
    const lastEMA = preDataItem && preDataItem[type];
    if (!lastEMA) {
      dataItem[type] = priceToday;
    } else {
      dataItem[type] = (2 / (N + 1)) * priceToday + ((N - 1) / (N + 1)) * lastEMA;
    }
  }
  return type;
}

// 计算MACD 指标 short：短周期 long：长周期 middle：中周期
function calcMACDIndicator(option) {
  const { allData, appendLength, MACDConfig } = option;
  const MACDperiod = MACDConfig.data;
  const start = 0;
  // 计算得出append时需要重新计算的EMA个数
  const getReloadSise = (N) => {
    if (!appendLength) return allData.length - 1;
    return appendLength - 1 + Math.ceil(3.45 * (N + 1));
  };
  // 分别计算长短周期的EMA
  const maxShortSize = getReloadSise(MACDperiod.short);
  const shortType = calcEMAIndicator({ start, end: maxShortSize, data: allData }, 'close', MACDperiod.short);
  const maxLongSize = getReloadSise(MACDperiod.long);
  const longType = calcEMAIndicator({ start, end: maxLongSize, data: allData }, 'close', MACDperiod.long);
  // 计算对应的EIF
  for (let i = start; i <= Math.max(maxShortSize, maxLongSize); i++) {
    const dataItem = allData[i];
    dataItem.DIF = dataItem[shortType] - dataItem[longType];
  }
  // 计算DEA
  const maxMiddleSIze = getReloadSise(MACDperiod.middle);
  calcEMAIndicator({ start, end: maxMiddleSIze, data: allData, key: 'DEA' }, 'DIF', MACDperiod.middle);
  // 计算对应MACD
  for (let i = start; i <= Math.max(maxShortSize, maxLongSize, maxMiddleSIze); i++) {
    const dataItem = allData[i];
    dataItem.MACD = ((dataItem.DIF - dataItem.DEA) * 2).toFixed(2);
  }
  return Math.max(maxShortSize, maxLongSize, maxMiddleSIze);
}

// 计算对应的指标 option: 需要计算指标的区间内数据 , chartIndicator, decimalDigits
function calcIndicator(option) {
  const { allData, appendLength, setting } = option;
  const { decimalDigits } = setting;
  const chart = setting.getChart();
  // 指标重新计算时, 需重新计算的allData的最大last的下标
  let needMainReloadLastIndex = -1;
  let needReloadLastIndex = -1;
  chart.forEach(item => {
    const type = item.chartConfig.sign;
    const { chartIndicator } = item;
    switch (type) {
      case 'MACD':
        needMainReloadLastIndex = calcMACDIndicator({
          allData,
          appendLength,
          MACDConfig: item.chartConfig,
          decimalDigits,
        });
        break;
      default:
        break;
    }
    chartIndicator && Object.keys(chartIndicator).forEach(indicatorItem => {
      let maxReloadIndex = -1;
      switch (indicatorItem) {
        case 'MA':
          maxReloadIndex = calcMAIndicator({
            type,
            allData,
            appendLength,
            MAConfig: chartIndicator.MA,
            decimalDigits,
          });
          break;
        default:
          break;
      }
      needReloadLastIndex = Math.max(needReloadLastIndex, maxReloadIndex);
    });
  });
  return Math.max(needReloadLastIndex, needMainReloadLastIndex);
}

export { layoutIndicator, calcIndicator };
