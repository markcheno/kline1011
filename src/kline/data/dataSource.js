import Manager from '../manage/manager';
import Control from '../manage/control';

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
    this.maxCountInLayout = -1;
    this.lastMoveCount = 0;
    // 左侧空白
    this.leftIndentCount = 0;
    this.savedLeftIndentCount = 0;
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
    this.maxCountInArea = Math.floor(width / columnWidth);
  }

  // 计算整个图表中最大蜡烛图个数
  updateMaxCountInLayout() {
    const { width } = Manager.instance.canvas.mainCanvas;
    const columnWidth = this.getColumnWidth();
    this.maxCountInLayout = Math.ceil(width / columnWidth);
  }

  updateData(data) {
    // const isuUpdate = this.data.length;
    const { chartType } = Manager.instance.setting;
    this.data = data;
    // 更新range width
    this.updateRangeWidth();
    if (chartType === 'candle') {
      this.updateMaxCountInArea();
      // 更新区间内的时间
      this.initCandleCurrentData();
    } else if (chartType === 'line') {
      this.initLineData();
    }
  }

  getDataByIndex(index) {
    return this.data[index];
  }

  // 初始化当前蜡烛视图数据
  initCandleCurrentData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = this.lastIndex - this.maxCountInArea + 1;
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex - this.firstIndex + 1);
  }

  // 初始化当前分时视图数据
  initLineData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = 0;
    this.currentData = this.getAllData();
  }

  // 更新当前视图数据
  updateCurrentData(updateLength) {
    this.lastIndex += updateLength;
    this.firstIndex = this.lastIndex - this.maxCountInArea + 1;
    this.savedFirstIndex += updateLength;
    console.log('updateCurrentData设置123123', this.firstIndex, this.lastIndex);
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex - this.firstIndex + 1);
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
    const chart = manager.setting.getChart();
    chart.forEach(item => {
      const result = this.calcMaxAndMinByIndicator(data, item.indicator, item.boundaryGap);
      const rangeWidth = Math.max(context.measureText(result.min).width, context.measureText(result.max).width);
      this.updateMaxRangeWidth(rangeWidth + 25);
    });
  }

  move(x) {
    // 右移大于0, 左移小于0
    const moveCount = Math.floor(x / this.getColumnWidth());
    if (moveCount === this.lastMoveCount || !moveCount) return;
    this.lastMoveCount = moveCount;
    this.leftIndentCount = this.validateLeftIndentCount(moveCount);
    this.firstIndex = this.validateFirstIndex(moveCount);
    this.lastIndex = this.validateLastIndex();
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex - this.firstIndex);
  }

  validateLeftIndentCount(moveCount) {
    let { leftIndentCount } = this;
    const { savedFirstIndex, savedLeftIndentCount } = this;
    const index = savedFirstIndex - moveCount;
    // savedLeftIndentCount = index < 0 ? savedLeftIndentCount - moveCount : savedLeftIndentCount + 1;
    // console.log('123', savedFirstIndex, moveCount);
    // if (leftIndentCount || index < 0) {
    //   console.log('moveCount', index, savedLeftIndentCount, moveCount);
    //   leftIndentCount = savedLeftIndentCount + moveCount;
    //   leftIndentCount = Math.max(leftIndentCount, 0);
    // }
    if (leftIndentCount) {
      leftIndentCount = savedLeftIndentCount + moveCount;
    } else if (index <= 0) {
      leftIndentCount = savedLeftIndentCount + moveCount - this.test;
    }
    return leftIndentCount;
  }

  validateFirstIndex(moveCount) {
    const { leftIndentCount, savedLeftIndentCount } = this;
    if (leftIndentCount) return 0;
    if (savedLeftIndentCount === moveCount) return 0;
    const maxIndex = this.getAllData().length - 1;
    const index = this.savedFirstIndex - moveCount;
    const lastIndexLimit = maxIndex - Math.round(this.maxCountInArea / 2);
    if (index > lastIndexLimit) return lastIndexLimit;
    return index;
  }

  validateLastIndex() {
    const maxIndex = this.getAllData().length - 1;
    const index = this.firstIndex + this.maxCountInArea - 1 - this.leftIndentCount;
    return Math.min(maxIndex, index);
  }

  startMove() {
    this.test = 0;
    this.savedFirstIndex = this.firstIndex;
    this.savedLeftIndentCount = this.leftIndentCount;
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
