import Manager from '../manage/manager';

export default class DataSource {
  // 更新数据策略
  static updateMode = {
    DoNothing: 0,
    Refresh: 1,
    Update: 2,
    Append: 3,
  };

  static candleStick = {
    itemWidth: [1, 3, 3, 5, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29],
    spaceWidth: [1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 5, 5, 5, 5, 7, 7, 7],
  }

  constructor() {
    // 原数据
    this.data = [];
    // 当前时间段数据
    this.currentData = [];
    // 保留小数点
    this.decimalDigits = 0;
    // range 宽度
    this.rangeWidth = 0;
    this.firstIndex = -1;
    this.lastIndex = -1;
    this.savedFirstIndex = -1;
    this.maxCountInArea = -1;
    this.scale = 10;
    this.crossCursorSelectAt = {
      x: 0,
      y: 0,
    };
  }

  getColumnWidth() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.itemWidth[this.scale] + candleStickMode.spaceWidth[this.scale];
  }

  getColumnCenter() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.itemWidth[this.scale] / 2;
  }

  getSpaceWidth() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.spaceWidth[this.scale];
  }

  // 计算最大蜡烛图个数
  updateMaxCountInArea() {
    const width = Manager.instance.canvas.mainCanvas.width - this.rangeWidth;
    const columnWidth = this.getColumnWidth();
    this.maxCountInArea = Math.ceil(width / columnWidth);
  }

  updateData(data) {
    this.data = data;
    // 更新range width
    this.updateRangeWidth();
    this.updateMaxCountInArea();
    // 更新区间内的时间
    this.updateCurrentData();
  }

  getDataByIndex(index) {
    return this.data[index];
  }

  // 更新当前视图数据
  updateCurrentData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = this.lastIndex - this.maxCountInArea + 1;
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex - this.firstIndex);
  }

  // 获取当前视图数据
  getCurrentData() {
    return this.currentData;
  }

  // 获取所有的数据
  getAllData() {
    return this.data;
  }

  // 获取所有数据中的最大值, 最小值
  updateMaxRangeWidth(rangeWidth) {
    if (rangeWidth > this.rangeWidth) { this.rangeWidth = rangeWidth; }
  }


  calcMaxAndMinByIndicator(data, indicator, boundaryGap) {
    let min = Array.prototype.toString.call(indicator.min) === '[object String]' ? Number.MAX_SAFE_INTEGER : indicator.min;
    let max = Array.prototype.toString.call(indicator.max) === '[object String]' ? Number.MIN_SAFE_INTEGER : indicator.max;
    data.forEach(item => {
      if (min > item[indicator.min]) min = item[indicator.min];
      if (max < item[indicator.max]) max = item[indicator.max];
    });
    const top = boundaryGap[0].split('%')[0] / 100;
    const bottom = boundaryGap[1].split('%')[0] / 100;
    const reduce = max - min;
    return {
      min: min - reduce * bottom,
      max: max + reduce * top,
    };
  }

  // 更新range的最大宽度
  updateRangeWidth() {
    const manager = Manager.instance;
    const data = this.getAllData();
    const context = manager.canvas.mainContext;
    const { chart } = manager.setting;
    chart.forEach(item => {
      const result = this.calcMaxAndMinByIndicator(data, item.indicator, item.boundaryGap);
      const rangeWidth = Math.max(context.measureText(result.min).width, context.measureText(result.max).width);
      this.updateMaxRangeWidth(rangeWidth + 25);
    });
  }

  validateFirstIndex(moveCount) {
    const maxIndex = this.getAllData().length - 1;
    const index = this.savedFirstIndex - moveCount;
    const lastIndexLimit = maxIndex - this.maxCountInArea / 2;
    if (index < 0) return 0;
    if (index > lastIndexLimit) return lastIndexLimit;
    return index;
  }

  validateLastIndex() {
    const maxIndex = this.getAllData().length - 1;
    const index = this.firstIndex + this.maxCountInArea - 1;
    return Math.min(maxIndex, index);
  }

  // 开始移动
  move(x) {
    const moveCount = Math.floor(x / this.getColumnWidth());
    console.log('moveCount', x, moveCount);
    this.firstIndex = this.validateFirstIndex(moveCount);
    this.lastIndex = this.validateLastIndex();
    console.log(this.firstIndex, this.lastIndex);
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex - this.firstIndex);
  }

  startMove() {
    this.savedFirstIndex = this.firstIndex;
  }

  // 放大缩小
  scaleView(s) {
    const candleStickModeItemLength = DataSource.candleStick.itemWidth.length;
    this.scale += s;
    if (this.scale < 0) {
      this.scale = 0;
    } else if (this.scale >= candleStickModeItemLength) {
      this.scale = candleStickModeItemLength - 1;
    }
    this.updateMaxCountInArea();
    this.lastIndex = this.validateLastIndex();
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex - this.firstIndex);
  }

  // 更新十字线选中数据
  updateCrossCursorSelectAt(place) {
    this.crossCursorSelectAt = { ...place };
  }
}
