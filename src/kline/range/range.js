import Manager from '../manage/manager';

export default class Range {
  constructor(name) {
    this.name = name;
    // range 上的最大值, 最小值
    this.minValue = 0;
    this.maxValue = 0;
    this.height = 0;
    this.top = 0;
    // 刻度比率 1刻度代表多少数值
    this.ratio = 0;
    // 最小刻度间隔
    this.minInterval = 36;
    this.gradations = [];
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
    const area = layout.rangeArea;
    const { dataSource } = Manager.instance;
    const { min, max } = dataSource.getCurrentMaxAndMin();
    const top = area.getTop();
    const bottom = area.getBottom();
    this.height = bottom - top;
    this.minValue = min;
    this.maxValue = max;
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
