import Manager from '../manage/manager';

export default class Range {
  constructor(option) {
    this.name = null;
    // 两边留白策略
    this.boundaryGap = ['0%', '0%'];
    // range的标识字段
    this.chartConfig = {};
    // 视图上指标
    this.chartIndicator = {};
    Object.assign(this, option);
    // range 上的最大值, 最小值
    this.minValue = 0;
    this.maxValue = 0;
    this.height = 0;
    this.top = 0;
    // 刻度比率 1刻度代表多少数值
    this.ratio = 0;
    // 最小刻度间隔
    this.minInterval = 25;
    this.gradations = [];
  }

  // 计算range区间内的大小值 根据该主图的配置 及 对应指标数据综合计算
  calcMaxAndMinByIndicator(data) {
    const { chartConfig, chartIndicator } = this;
    const chartType = chartConfig.sign;
    const signArray = [];
    switch (chartType) {
      case 'Candle':
        signArray.push({ value: 'high' });
        signArray.push({ value: 'low' });
        break;
      case 'Line':
        signArray.push({ value: 'close' });
        break;
      case 'Volume':
        signArray.push({ value: 'volume' });
        signArray.push({ value: 0 });
        break;
      case 'MACD':
        signArray.push({ value: 'MACD' });
        signArray.push({ value: 'DIF' });
        signArray.push({ value: 'DEA' });
        break;
      case 'VR':
        signArray.push({ value: 'VR' });
        break;
      case 'WR':
        signArray.push({ value: 'WR' });
        signArray.push({ value: 0 });
        break;
      case 'RSI':
        signArray.push({ value: 'RSI1' });
        signArray.push({ value: 'RSI2' });
        break;
      default:
        break;
    }
    chartIndicator && Object.keys(chartIndicator).forEach(item => {
      switch (item) {
        case 'MA':
          chartIndicator.MA.data.forEach(MAitem => {
            signArray.push({
              parent: chartType,
              value: MAitem,
            });
          });
          break;
        case 'BOLL':
          ['MID', 'UP', 'LOW'].forEach(BOLLitem => {
            signArray.push({
              parent: chartType,
              value: BOLLitem,
            });
          });
          break;
        case 'ENV':
          ['EnvUp', 'EnvLow'].forEach(ENVitem => {
            signArray.push({
              parent: chartType,
              value: ENVitem,
            });
          });
          break;
        case 'CG':
          ['MA55', 'EMAEMAclose1010'].forEach(CGitem => {
            signArray.push({
              parent: chartType,
              value: CGitem,
            });
          });
          break;
        default:
          break;
      }
    });
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    data.forEach(dataItem => {
      const valueArray = signArray.map(signItem => {
        let value;
        const signItemValue = signItem.value;
        const signItemParent = signItem.parent;
        if (signItemParent) {
          value = typeof signItemValue === 'string' ? (dataItem[signItemParent][signItemValue] || 0) : signItemValue;
        } else {
          value = typeof signItemValue === 'string' ? (dataItem[signItemValue] || 0) : signItemValue;
        }
        return value;
      });
      let minNow = Math.min(...valueArray);
      let maxNow = Math.max(...valueArray);
      if (window.isNaN(minNow) || window.isNaN(maxNow)) {
        console.error('range 极限值计算错误');
        minNow = 0;
        maxNow = 0;
      }
      if (min > minNow) min = minNow;
      if (max < maxNow) max = maxNow;
    });
    // 不同chart对最大最小值会有不同的处理, 比如MACD
    const dealResult = this.dealMaxAndMinByType({
      min,
      max,
    });
    return dealResult;
  }

  updateRangeMinAndMAx() {
    const data = Manager.instance.dataSource.getCurrentData();
    const result = this.calcMaxAndMinByIndicator(data);
    this.minValue = result.min;
    this.maxValue = result.max;
  }

  getGradations() {
    return this.gradations;
  }

  // 坐标换算值
  toValue(y) {
    return this.maxValue - (y - this.top) / this.ratio;
  }

  // 值换算坐标
  toY(value) {
    // 一条线时单独处理
    if (!this.ratio) return this.top + this.height / 2;
    return this.top + Math.floor((this.maxValue - value) * this.ratio);
  }

  // 值换算高度
  toHeight(value) {
    return Math.floor(value * this.ratio);
  }

  // 高度换算值
  heightToValue(height) {
    return this.maxValue - this.toValue(this.top + height);
  }

  // 更新range
  updateRange(layout) {
    this.updateRangeMinAndMAx();
    const area = layout.getRangeArea();
    const { top, bottom } = area.getPlace();
    this.height = bottom - top;
    this.top = top;
    if (Number(this.maxValue) === Number(this.minValue)) {
      this.ratio = 0;
    } else {
      this.ratio = this.height / (this.maxValue - this.minValue);
    }
    this.updateGradations();
  }

  // 计算间隔
  calcInterval() {
    const { height } = this;
    let { minInterval } = this;
    /* global math */
    const reduceValue = math.format(this.maxValue - this.minValue, { precision: 14 });
    if (height <= minInterval) minInterval = height;
    if (Number(reduceValue) === 0) return 0;
    // const intervalValue = this.heightToValue(minInterval);
    // return intervalValue;
    let number = reduceValue < 1 ? -(reduceValue.split('.')[1].length + 2) : reduceValue.split('.')[0].length - 2;
    let interval;
    for (; ; number++) {
      interval = Math.pow(10, number);
      if (this.toHeight(interval) > minInterval) { break; }
      interval = 2 * interval;
      if (this.toHeight(interval) > minInterval) { break; }
      interval = 2.5 * interval;
      if (this.toHeight(interval) > minInterval) { break; }
      interval = 5 * interval;
      if (this.toHeight(interval) > minInterval) { break; }
    }
    return interval;
  }

  // 更新range刻度
  updateGradations() {
    // 判断该range刻度是否需要单独处理
    const result = this.isOtheGradations(this.chartConfig.sign);
    if (result) return;
    const { decimalDigits } = Manager.instance.setting;
    const interval = this.calcInterval();
    this.gradations = [];
    // 一条直线时单独处理
    if (interval === 0) {
      this.gradations.push({
        text: Number(0).toFixed(decimalDigits),
        y: this.top + this.height / 2,
      });
      return;
    }
    // 开始位置取整
    let start = Number(this.toValue(this.top + 15));
    do {
      this.gradations.push({
        text: start.toFixed(decimalDigits),
        y: this.toY(start) + 0.5,
      });
      start -= interval;
    } while (start > this.minValue);
  }


  // 判断该range刻度是否需要单独处理
  isOtheGradations(type) {
    let result = false;
    switch (type) {
      case 'MACD':
        this.updateMACDgradations();
        result = true;
        break;
      case 'Volume':
        this.updateVolumeGradations();
        result = true;
        break;
      case 'WR':
        this.updateWRGradations();
        result = true;
        break;
      default:
        break;
    }
    return result;
  }

  // 不同chart对最大最小值会有不同的处理, 比如MACD
  dealMaxAndMinByType(data) {
    const { decimalDigits } = Manager.instance.setting;
    const { boundaryGap } = this;
    const { min, max } = data;
    const topBoundaryGap = boundaryGap[0].split('%')[0] / 100;
    const bottomBoundaryGap = boundaryGap[1].split('%')[0] / 100;
    const reduce = max - min;
    if (this.chartConfig.sign === 'MACD') {
      return this.updateMACDmaxAndMin(data, {
        topBoundaryGap,
        bottomBoundaryGap,
      });
    }
    return {
      min: (min - reduce * bottomBoundaryGap).toFixed(decimalDigits),
      max: (max + reduce * topBoundaryGap).toFixed(decimalDigits),
    };
  }

  // MACD固定式最大最小值
  updateMACDmaxAndMin(data, option) {
    const { bottomBoundaryGap, topBoundaryGap } = option;
    let { min, max } = data;
    const maxAbs = Math.max(Math.abs(min), Math.abs(max));
    if (max <= 0) {
      max = maxAbs;
    } else if (min >= 0) {
      min = -maxAbs;
    } else if (Math.abs(min) < Math.abs(max)) {
      min = -maxAbs;
    } else {
      max = maxAbs;
    }
    const reduce = max - min;
    return {
      min: (min - reduce * bottomBoundaryGap).toFixed(2),
      max: (max + reduce * topBoundaryGap).toFixed(2),
    };
  }

  // MACD固定式刻度
  updateMACDgradations() {
    const { minValue, maxValue, boundaryGap } = this;
    const boundaryGapTop = boundaryGap[0].split('%')[0] / 100;
    const boundaryGapBottom = boundaryGap[1].split('%')[0] / 100;
    const topValue = (1 - boundaryGapTop) * maxValue;
    const bottomValue = (1 - boundaryGapBottom) * minValue;
    this.gradations = [];
    this.gradations.push({
      text: Number(topValue).toFixed(2),
      y: this.toY(topValue),
    });
    this.gradations.push({
      text: Number(bottomValue).toFixed(2),
      y: this.toY(bottomValue),
    });
    this.gradations.push({
      text: '0.00',
      y: this.toY(0),
    });
  }

  // 成交量式刻度
  updateVolumeGradations() {
    // minValue,
    const { maxValue, boundaryGap } = this;
    const boundaryGapTop = boundaryGap[0].split('%')[0] / 100;
    // const boundaryGapBottom = boundaryGap[1].split('%')[0] / 100;
    const topValue = (1 - boundaryGapTop) * maxValue;
    // const bottomValue = (1 - boundaryGapBottom) * minValue;
    this.gradations = [];
    this.gradations.push({
      text: Number(topValue).toFixed(0),
      y: this.toY(topValue),
    });
  }

  // WR式刻度
  updateWRGradations() {
    const { decimalDigits } = Manager.instance.setting;
    const { minValue, boundaryGap } = this;
    const boundaryGapBottom = boundaryGap[1].split('%')[0] / 100;
    const bottomValue = (1 - boundaryGapBottom) * minValue;
    this.gradations = [];
    const WRGradations = [0, bottomValue / 2, bottomValue];
    WRGradations.forEach(item => {
      this.gradations.push({
        text: Number(item).toFixed(decimalDigits),
        y: this.toY(item),
      });
    });
  }
}
