// 指标相关
const layoutIndicator = {
  volume: {
    name: 'volumeChartLayout',
    chartPlotters: 'VolumePlotter',
    boundaryGap: ['25%', '0%'],
    chartConfig: {
      sign: 'Volume',
    },
  },
  MACD: {
    name: 'MACDChartLayout',
    chartPlotters: 'MACDPlotter',
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
  VR: {
    name: 'VRChartLayout',
    chartPlotters: 'VRPlotter',
    boundaryGap: ['10%', '10%'],
    chartConfig: {
      sign: 'VR',
      N: 26,
    },
  },
  WR: {
    name: 'WRChartLayout',
    chartPlotters: 'WRPlotter',
    boundaryGap: ['20%', '20%'],
    chartConfig: {
      sign: 'WR',
      N: 14,
    },
  },
  RSI: {
    name: 'RSIChartLayout',
    chartPlotters: 'RSIPlotter',
    boundaryGap: ['20%', '20%'],
    chartConfig: {
      sign: 'RSI',
      N1: 7,
      N2: 14,
    },
  },
  KDJ: {
    name: 'KDJChartLayout',
    chartPlotters: 'KDJPlotter',
    boundaryGap: ['20%', '20%'],
    chartConfig: {
      sign: 'KDJ',
      N: 9,
      m1: 3,
      m2: 3,
    },
  },
  CCI: {
    name: 'CCIChartLayout',
    chartPlotters: 'CCIPlotter',
    boundaryGap: ['20%', '20%'],
    chartConfig: {
      sign: 'CCI',
      N: 14,
    },
  },
  BIAS: {
    name: 'BIASChartLayout',
    chartPlotters: 'BIASPlotter',
    boundaryGap: ['20%', '20%'],
    chartConfig: {
      sign: 'BIAS',
      N1: 6,
      N2: 12,
      N3: 24,
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
  return 0;
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
    end = Math.min(appendLength - 1 + maxMASize, end);
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
  return end;
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
    end = Math.min(appendLength - 1 + middleReloadIndex, end);
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
  return end;
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
    end = Math.min(appendLength - 1 + middleReloadIndex, end);
  }
  for (let i = start; i <= end; i++) {
    const dataItem = allData[i];
    const MA = dataItem[type][`MA${ENVConfig.N}`];
    const EnvUp = MA * (1 + ENVConfig.n2 / 100);
    const EnvLow = MA * (1 - ENVConfig.n2 / 100);
    dataItem[type].EnvUp = EnvUp.toFixed(decimalDigits);
    dataItem[type].EnvLow = EnvLow.toFixed(decimalDigits);
  }
  return end;
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

// 计算VR指标 N:周期
function calcVRIndicator(option) {
  const { allData, appendLength, VRconfig, decimalDigits } = option;
  const { N } = VRconfig;
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + N, end);
  }
  let incTotal = 0;
  let decTotal = 0;
  let eqTotal = 0;
  for (let i = start; i <= end; i++) {
    const dataItem = allData[i];
    const startVR = allData[i - N];
    if (dataItem.open < dataItem.close) {
      incTotal += dataItem.volume;
    } else if (dataItem.open > dataItem.close) {
      decTotal += dataItem.volume;
    } else {
      eqTotal += dataItem.volume;
    }
    if (startVR) {
      if (startVR.open < startVR.close) {
        incTotal -= startVR.volume;
      } else if (startVR.open > startVR.close) {
        decTotal -= startVR.volume;
      } else {
        eqTotal -= startVR.volume;
      }
    }
    const vr = decTotal + eqTotal / 2 === 0 ? 0 : (incTotal + eqTotal / 2) / (decTotal + eqTotal / 2);
    allData[i].VR = vr.toFixed(decimalDigits);
  }
  return end;
}

// 计算WR N 周期
function calcWRIndicator(option) {
  const { allData, appendLength, WRconfig, decimalDigits } = option;
  const { N } = WRconfig;
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + N, end);
  }
  for (let i = start; i <= end; i++) {
    const dataItem = allData[i];
    let NIndex = Math.max(0, i - N + 1);
    let { low, high } = dataItem;
    const { close } = dataItem;
    for (; NIndex <= i; NIndex++) {
      const NItem = allData[NIndex];
      const NLow = NItem.low;
      const Nhigh = NItem.high;
      if (NLow < low) low = NLow;
      if (Nhigh > high) high = Nhigh;
    }
    const wr = ((high - close) * 100) / (high - low);
    allData[i].WR = 0 - wr.toFixed(decimalDigits);
  }
  return end;
}

// 计算RSI 指标
function calcRSIIndicator(option) {
  const { allData, appendLength, RSIConfig, decimalDigits } = option;
  const { N1, N2 } = RSIConfig;
  const start = 0;
  const maxSize = Math.max(N1, N2);
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + maxSize * 10, end);
  }
  const calcRSI = (period, key) => {
    for (let i = start; i <= end; i++) {
      let RSI = 0;
      if (i) {
        const dataItem = allData[i];
        const preDataItem = allData[i - 1];
        const interval = dataItem.close - preDataItem.close;
        const { pre_incVal, pre_decVal } = preDataItem;
        let current_incVal = 0;
        let current_decVal = 0;
        if (interval >= 0) {
          current_incVal = interval;
        } else {
          current_decVal = Math.abs(interval);
        }
        let sma_incVal = 0;
        let sma_decVal = 0;
        if (i === 1) {
          sma_incVal = current_incVal;
          sma_decVal = current_decVal;
        } else {
          sma_incVal = pre_incVal * (period - 1) / period + current_incVal * 1 / period;
          sma_decVal = pre_decVal * (period - 1) / period + current_decVal * 1 / period;
        }
        if (sma_incVal + sma_decVal === 0) {
          RSI = 0;
        } else {
          RSI = sma_incVal / (sma_incVal + sma_decVal) * 100;
        }
        allData[i].pre_incVal = sma_incVal;
        allData[i].pre_decVal = sma_decVal;
      }
      allData[i][`RSI${key}`] = RSI.toFixed(decimalDigits);
    }
  };
  calcRSI(N1, '1');
  calcRSI(N2, '2');
  return end;
}

// 计算KDJ 指标
function calcKDJIndicator(option) {
  const { allData, appendLength, KDJConfig, decimalDigits } = option;
  const { N, m1, m2 } = KDJConfig;
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + N * 10, end);
  }
  for (let i = start; i <= end; i++) {
    const dataItem = allData[i];
    if (i) {
      const preDataItem = allData[i - 1];
      const prev_k = preDataItem.K;
      const prev_d = preDataItem.D;
      let rsv = 0;
      let h = dataItem.high;
      let l = dataItem.low;
      const c = dataItem.close;
      // 设置周期内, 最高收盘价, 最低收盘价
      const startIndex = i - N + 1;
      for (let j = i, min = Math.max(startIndex, 0); j >= min; j--) {
        const startHigh = allData[j].high;
        const startLow = allData[j].low;
        if (startHigh > h) h = startHigh;
        if (startLow < l) l = startLow;
      }
      if (h !== l) rsv = (c - l) / (h - l) * 100;
      else rsv = 46;
      const KDJ_K = prev_k * (m1 - 1) / m1 + rsv * 1 / m1;
      const KDJ_D = prev_d * (m2 - 1) / m2 + KDJ_K * 1 / m2;
      const KDJ_J = 3 * KDJ_K - 2 * KDJ_D;
      dataItem.K = KDJ_K.toFixed(decimalDigits);
      dataItem.D = KDJ_D.toFixed(decimalDigits);
      dataItem.J = KDJ_J.toFixed(decimalDigits);
    } else {
      dataItem.K = Number(46).toFixed(decimalDigits);
      dataItem.D = Number(46).toFixed(decimalDigits);
      dataItem.J = Number(46).toFixed(decimalDigits);
    }
  }
  return end;
}

// 计算 CCI MA
function getCCIMA(option, period) {
  const { allData, start, end } = option;
  const cciMas = [];
  const count = Math.min(end - start + 1, period);
  let typ = 0;
  let ma = 0;
  for (let i = start; i <= end; i++) {
    const item = allData[i];
    const { close, low, high } = item;
    if (i < count) {
      typ = typ + (close + high + low) / 3;
      ma = typ / (i + 1);
    } else {
      const preItem = allData[i - count];
      const preClose = preItem.close;
      const preLow = preItem.low;
      const preHigh = preItem.high;
      typ = typ - ((preClose + preLow + preHigh) / 3);
      typ = typ + ((close + high + low) / 3);
      ma = typ / count;
    }
    cciMas.push(ma);
  }
  return cciMas;
}

// 计算CCI MD
function getCCIMD(option, period, cciMas) {
  const { allData, start, end } = option;
  const cciMds = [];
  const count = Math.min(end - start + 1, period);
  for (let i = 0; i <= end; i++) {
    let md = 0;
    let sum = 0;
    const ma = cciMas[i];
    const min = Math.max(i - count + 1, 0);
    let num = 0;
    for (let j = i; j >= min; j--) {
      const { close, low, high } = allData[j];
      const typ = (close + low + high) / 3;
      sum += Math.abs(typ - ma);
      num++;
    }
    md = sum / num;
    cciMds.push(md);
  }
  return cciMds;
}

// 计算CCI 指标
function calcCCIIndicator(option) {
  const { allData, appendLength, CCIConfig, decimalDigits } = option;
  const { N } = CCIConfig;
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + N, end);
  }
  const mas = getCCIMA({ start, end, allData }, N);
  const mds = getCCIMD({ start, end, allData }, N, mas);
  for (let i = 0; i <= end; i++) {
    const { close, high, low } = allData[i];
    const typ = (close + high + low) / 3;
    const ma = mas[i];
    const md = mds[i];
    let cci = 0;
    if (md === 0) {
      cci = 0;
    } else if (typ === ma) {
      cci = 0;
    } else {
      cci = ((typ - ma) / md) / 0.015;
    }
    allData[i].CCI = cci.toFixed(decimalDigits);
  }
  return end;
}

// 计算BIAS 指标
function calcBIASIndicator(option) {
  const { type, allData, appendLength, BIASConfig, decimalDigits } = option;
  const { N1, N2, N3 } = BIASConfig;
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + Math.max(N1, N2, N3), end);
  }
  const middleReloadIndex = calcMAIndicator(Object.assign(option, {
    MAConfig: {
      sign: 'close',
      data: [`MA${N1}`, `MA${N2}`, `MA${N3}`],
    },
  }));
  // 计算对应的BIAS
  const getBIAS = (i, index, N, dataItem) => {
    if (i < N - 1) {
      dataItem[`BIAS${index + 1}`] = null;
    } else {
      const { close } = dataItem;
      const ma = dataItem[type][`MA${N}`];
      const bias = ((close - ma) / ma) * 100;
      dataItem[`BIAS${index + 1}`] = bias.toFixed(decimalDigits);
    }
  };
  for (let i = start; i <= end; i++) {
    [N1, N2, N3].forEach((item, index) => {
      getBIAS(i, index, item, allData[i]);
    });
  }
  return Math.max(middleReloadIndex, end);
}

// 计算SAR 指标
function calcSARIndivator(option) {
  const { type, allData, appendLength, SARConfig, decimalDigits } = option;
  const { N, STEP, MVALUE } = SARConfig;
  const alpha = STEP / 100;
  const limit = MVALUE / 100;
  const period = N;
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = Math.min(appendLength - 1 + N, end);
  }
  let i = start;
  // 如果极限小于系数, 全部返回0
  if (limit < alpha || period <= 0) {
    for (; i <= end; i++) {
      if (!allData[i][type]) allData[i][type] = {};
      if (i < period) continue;
      allData[i][type].SAR = null;
      allData[i][type].SAROption = { up: 0, ep: 0, alpha: 0 };
    }
  }
  let up = false;
  let periodLowMin = allData[start].low;
  let periodHighMax = allData[start].high;
  let sar = 0;
  let ep = 0;
  let currentAlpha = alpha;
  i = start;
  for (; i <= end; i++) {
    if (!allData[i][type]) allData[i][type] = {};
    if (i < period) {
      // 计算周期开始前所有最低值最小的和所有最大值最大的
      const { low, high } = allData[i];
      if (low < periodLowMin) periodLowMin = low;
      if (high > periodHighMax) periodHighMax = high;
      allData[i][type].SAR = null;
      allData[i][type].SAROption = { up: 0, ep: 0, alpha: 0 };
      continue;
    } else if (i === period) {
      // 忽略前周期条的第一条, 确定第一个SAR值
      // 取周期后第一条的上一条, 和数组内的第一个数据的开盘价比对, 要确认是上涨还是下跌
      const perviClose = allData[i - 1].close;
      const firstOpen = allData[start].open;
      const distance = perviClose - firstOpen;
      if (distance > 0) {
        // 上涨
        up = true;
        sar = periodLowMin;
        const currentHigh = allData[i].high;
        ep = Math.max(periodHighMax, currentHigh);
      } else {
        // 下跌
        up = false;
        sar = periodHighMax;
        const currentLow = allData[i].low;
        ep = Math.min(periodLowMin, currentLow);
      }
      allData[i][type].SAR = sar.toFixed(decimalDigits);
      allData[i][type].SAROption = { up, ep, alpha };
    } else {
      // 周期后的第一条之后的其他数值的计算
      const current = allData[i];
      // eslint-disable-next-line no-lonely-if
      if (up) {
        // 继续上涨
        const currentHigh = current.high;
        const lastHigh = allData[i - 1].high;
        sar += currentAlpha * (lastHigh - sar);
        currentAlpha = Math.min(currentAlpha + alpha, limit);
        ep = Math.max(ep, currentHigh);
        // 算出来的当前SAR比当前的最低价还要低, 就翻转
        if (current.low < sar) {
          // 此时翻转, 即下跌
          up = false;
          sar = ep;
          ep = current.low;
          // 系数归到默认
          currentAlpha = alpha;
        }
        allData[i][type].SAR = sar.toFixed(decimalDigits);
        allData[i][type].SAROption = { up, ep, alpha: currentAlpha };
      } else {
        // 继续下跌
        const currentLow = current.low;
        const lastLow = allData[i - 1].low;
        sar += currentAlpha * (lastLow - sar);
        currentAlpha = Math.min(currentAlpha + alpha, limit);
        ep = Math.min(ep, currentLow);
        // 算出来的当前SAR比当前的最高价高, 就翻转
        if (current.high > sar) {
          // 此时翻转, 即上涨
          up = true;
          sar = ep;
          ep = current.high;
          currentAlpha = alpha;
        }
        allData[i][type].SAR = sar.toFixed(decimalDigits);
        allData[i][type].SAROption = { up, ep, alpha: currentAlpha };
      }
    }
  }
  return end;
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
        needMainReloadLastIndex = calcAverageLine({
          allData,
          decimalDigits,
        });
        break;
      case 'VR':
        needMainReloadLastIndex = calcVRIndicator({
          allData,
          appendLength,
          VRconfig: item.chartConfig,
          decimalDigits,
        });
        break;
      case 'WR':
        needMainReloadLastIndex = calcWRIndicator({
          allData,
          appendLength,
          WRconfig: item.chartConfig,
          decimalDigits,
        });
        break;
      case 'RSI':
        needMainReloadLastIndex = calcRSIIndicator({
          allData,
          appendLength,
          RSIConfig: item.chartConfig,
          decimalDigits,
        });
        break;
      case 'KDJ':
        needMainReloadLastIndex = calcKDJIndicator({
          allData,
          appendLength,
          KDJConfig: item.chartConfig,
          decimalDigits,
        });
        break;
      case 'CCI':
        needMainReloadLastIndex = calcCCIIndicator({
          allData,
          appendLength,
          CCIConfig: item.chartConfig,
          decimalDigits,
        });
        break;
      case 'BIAS':
        needMainReloadLastIndex = calcBIASIndicator({
          type,
          allData,
          appendLength,
          BIASConfig: item.chartConfig,
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
        case 'SAR':
          maxReloadIndex = calcSARIndivator({
            type,
            allData,
            appendLength,
            SARConfig: chartIndicator.SAR,
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
