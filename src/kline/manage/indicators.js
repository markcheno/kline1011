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
    boundaryGap: ['30%', '30%'],
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

// 计算分时图上的均线
function calcAverageLine(option) {
  const { allData, decimalDigits } = option;
  let priceToTal = 0;
  allData.forEach((item, index) => {
    if (item) {
      const { close } = item;
      priceToTal += close;
      item.average = (priceToTal / (index + 1)).toFixed(decimalDigits);
    }
  });
}

// 计算基础数 EMA 指数移动平均线 indicator: 指标名称 N: 周期
function calcEMAIndicator(option, indicatorOption, N) {
  const { start, end, data, key, parentType } = option;
  const indicator = typeof indicatorOption === 'string' ? indicatorOption : indicatorOption.value;
  const type = key || `EMA${indicator}${N}`;
  for (let i = start; i <= end; i++) {
    const dataItem = data[i];
    const preDataItem = data[i - 1];
    if (!dataItem) continue;
    const priceToday = indicatorOption.parent ? dataItem[indicatorOption.parent][indicator] : dataItem[indicator];
    let lastEMA;
    if (preDataItem) {
      lastEMA = parentType ? preDataItem[parentType][type] : preDataItem[type];
    }
    const EMA = lastEMA ? (2 / (N + 1)) * priceToday + ((N - 1) / (N + 1)) * lastEMA : priceToday;
    if (parentType) {
      (dataItem[parentType]) || (dataItem[parentType] = {});
      dataItem[parentType][type] = EMA;
    } else {
      dataItem[type] = EMA;
    }
  }
  return type;
}

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
    if (!allData[i][type]) allData[i][type] = {};
    Object.keys(total).forEach(item => {
      calc(item, i, allData[i]);
    });
  }
  return maxMASize;
}

// 计算 BOLL 指标
function calcBOLLIndicator(option) {
  const { type, allData, appendLength, decimalDigits, BOLLConfig } = option;
  // 计算中轨线 MID
  const middleReloadIndex = calcMAIndicator(Object.assign(option, {
    MAConfig: {
      sign: BOLLConfig.sign,
      data: [`MA${BOLLConfig.N}`],
    },
  }));
  // 获得对应index 的中轨线
  const getMidByIndex = (index) => Number(allData[index][type][`MA${BOLLConfig.N}`]);
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = appendLength - 1 + middleReloadIndex;
  }
  for (let i = start; i <= end; i++) {
    const dataItem = allData[i];
    const MID = getMidByIndex(i);
    let distanceTotal = 0;
    let count = 0;
    for (let NIndex = i - BOLLConfig.N + 1; NIndex <= i; NIndex++) {
      if (allData[NIndex]) {
        distanceTotal += Math.pow((allData[NIndex][BOLLConfig.sign] - MID), 2);
        count++;
      }
    }
    const BOLL = Math.sqrt(distanceTotal / count).toFixed(decimalDigits);
    dataItem[type].MID = MID;
    dataItem[type].UP = (MID + 2 * BOLL).toFixed(decimalDigits);
    dataItem[type].LOW = (MID - 2 * BOLL).toFixed(decimalDigits);
  }
  return middleReloadIndex;
}

// 计算 ENV 指标
function calcENVIndicator(option) {
  const { type, allData, appendLength, decimalDigits, ENVConfig } = option;
  // 计算对应N的 MA
  const middleReloadIndex = calcMAIndicator(Object.assign(option, {
    MAConfig: {
      sign: ENVConfig.sign,
      data: [`MA${ENVConfig.N}`],
    },
  }));
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = appendLength - 1 + middleReloadIndex;
  }
  for (let i = start; i <= end; i++) {
    const dataItem = allData[i];
    const MA = dataItem[type][`MA${ENVConfig.N}`];
    const EnvUp = MA * (1 + ENVConfig.n2 / 100);
    const EnvLow = MA * (1 - ENVConfig.n2 / 100);
    dataItem[type].EnvUp = EnvUp.toFixed(decimalDigits);
    dataItem[type].EnvLow = EnvLow.toFixed(decimalDigits);
  }
  return middleReloadIndex;
}

// 计算 CG 指标
function calcCGIndicator(option) {
  const { type, allData, appendLength } = option;
  const start = 0;
  // 计算得出append时需要重新计算的EMA个数
  const getReloadSise = (N) => {
    if (!appendLength) return allData.length - 1;
    return appendLength - 1 + Math.ceil(3.45 * (N + 1));
  };
  // 计算主趋势线的颜色
  const getCGLineColor = (preData, nowData) => {
    if (!preData) return 'CGTrendPositive';
    const preCGEMA = preData[type].EMAEMAclose1010;
    const nowCGEMA = nowData[type].EMAEMAclose1010;
    const result = nowCGEMA - preCGEMA < 0 ? 1 : 0;
    return 1 - result === 0 ? 'CGTrendNegative' : 'CGTrendPositive';
  };
  // 计算MA55
  const middleReloadIndex = calcMAIndicator(Object.assign(option, {
    MAConfig: {
      sign: 'close',
      data: ['MA55'],
    },
  }));
  const maxShortSize = getReloadSise(5);
  const maxLongSize = getReloadSise(10);
  // 分别计算EMA(C, 5) EMA(C, 10)
  calcEMAIndicator({ start, end: maxShortSize, data: allData, parentType: type }, 'close', 5);
  calcEMAIndicator({ start, end: maxLongSize, data: allData, parentType: type }, 'close', 10);
  // 计算 EMA(EMA(C,10),10)
  calcEMAIndicator({ start, end: maxLongSize, data: allData, parentType: type }, { parent: type, value: 'EMAclose10' }, 10);
  // 计算看多, 看空
  const end = Math.max(maxShortSize, maxLongSize, middleReloadIndex);
  for (let i = start; i <= end; i++) {
    const preData = allData[i - 1];
    const nowData = allData[i];
    // 计算CG指标主趋势线
    allData[i][type].CGtrendColor = getCGLineColor(preData, nowData);
    if (!preData) continue;
    const preEMAclose5 = preData[type].EMAclose5;
    const preEMAclose10 = preData[type].EMAclose10;
    const nowEMAclose5 = nowData[type].EMAclose5;
    const nowEMAclose10 = nowData[type].EMAclose10;
    if (preEMAclose5 > preEMAclose10 && nowEMAclose5 < nowEMAclose10) {
      allData[i][type].CGBuySell = 'CGSell';
    } else if (preEMAclose5 < preEMAclose10 && nowEMAclose5 > nowEMAclose10) {
      allData[i][type].CGBuySell = 'CGBuy';
    }
  }
  return end;
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
      case 'Line':
        needReloadLastIndex = calcAverageLine({
          allData,
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
        case 'BOLL':
          maxReloadIndex = calcBOLLIndicator({
            type,
            allData,
            appendLength,
            BOLLConfig: chartIndicator.BOLL,
            decimalDigits,
          });
          break;
        case 'ENV':
          maxReloadIndex = calcENVIndicator({
            type,
            allData,
            appendLength,
            ENVConfig: chartIndicator.ENV,
            decimalDigits,
          });
          break;
        case 'CG':
          maxReloadIndex = calcCGIndicator({
            type,
            allData,
            appendLength,
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
