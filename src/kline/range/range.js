import Manager from '../manage/manager';

export default class Range {
  constructor(option) {
    this.name = null;
    // 两边留白策略
    this.boundaryGap = ['0%', '0%'];
    // range的标识字段
    this.indicator = {};
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

  calcMaxAndMinByIndicator(data) {
    const { indicator } = this;
    let min = Array.prototype.toString.call(indicator.min) === '[object String]' ? Number.MAX_SAFE_INTEGER : indicator.min;
    let max = Array.prototype.toString.call(indicator.max) === '[object String]' ? Number.MIN_SAFE_INTEGER : indicator.max;
    data.forEach(item => {
      if (min > item[indicator.min]) min = item[indicator.min];
      if (max < item[indicator.max]) max = item[indicator.max];
    });
    const top = this.boundaryGap[0].split('%')[0] / 100;
    const bottom = this.boundaryGap[1].split('%')[0] / 100;
    const reduce = max - min;
    return {
      min: min - reduce * bottom,
      max: max + reduce * top,
    };
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
    return this.top + Math.floor((this.maxValue - value) * this.ratio);
  }

  // 值换算高度
  toHeight(value) {
    return Math.floor(value * this.ratio);
  }

  // 更新range
  updateRange(layout) {
    this.updateRangeMinAndMAx();
    const area = layout.rangeArea;
    const top = area.getTop();
    const bottom = area.getBottom();
    this.height = bottom - top;
    this.top = top;
    this.ratio = this.height / (this.maxValue - this.minValue);
    this.updateGradations();
  }

  // 计算间隔
  calcInterval() {
    const { height } = this;
    let { minInterval } = this;
    /* global math */
    const reduceValue = math.format(this.maxValue - this.minValue, { precision: 14 });
    if (height <= minInterval) minInterval = height;
    let number = reduceValue < 1 ? -(reduceValue.split('.')[1].length + 2) : reduceValue.split('.')[0].length - 2;
    let interval;
    for (; ; number++) {
      interval = Math.pow(10, number);
      if (this.toHeight(interval) > minInterval) { break; }
      interval = 2 * interval;
      if (this.toHeight(interval) > minInterval) { break; }
      interval = 5 * interval;
      if (this.toHeight(interval) > minInterval) { break; }
    }
    return interval;
  }

  // 更新刻度
  updateGradations() {
    const interval = this.calcInterval();
    this.gradations = [];
    // 开始位置取整
    let start = Math.floor(this.maxValue / interval) * interval;
    do {
      this.gradations.push({
        text: start,
        y: this.toY(start) + 0.5,
      });
      start -= interval;
    } while (start > this.minValue);
  }
}
