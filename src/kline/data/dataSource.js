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
    scale: 10,
  }

  constructor() {
    // 原数据
    this.data = [];
    // 保留小数点
    this.decimalDigits = 0;
    this.currentMaxAndMin = {
      min: Number.MAX_SAFE_INTEGER,
      max: Number.MIN_SAFE_INTEGER,
    };
    this.firstIndex = -1;
    this.lastIndex = -1;
    this.maxCountInArea = -1;
  }

  // 计算最大蜡烛图个数
  updateMaxCountInArea(width) {
    const candleStickMode = DataSource.candleStick;
    const columnWidth = candleStickMode.itemWidth[candleStickMode.scale] + candleStickMode.spaceWidth[candleStickMode.scale];
    this.maxCountInArea = Math.ceil(width / columnWidth);
  }

  updateData(data) {
    this.data = data;
    this.updateCurrentData();
  }

  getDataByIndex(index) {
    return this.data[index];
  }

  // 更新当前视图数据
  updateCurrentData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = this.lastIndex - this.maxCountInArea;
    this.setCurrentMaxAndMin();
  }

  // 获取当前视图数据
  getCurrentData() {
    return [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex);
  }

  // 设置当前视图中的最大最小值
  setCurrentMaxAndMin() {
    const currentData = this.getCurrentData();
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    currentData.forEach(item => {
      if (min > item.close) min = item.close;
      if (max < item.close) max = item.close;
    });
    this.currentMaxAndMin = { min, max };
  }

  // 获取当前视图中的最大最小值
  getCurrentMaxAndMin() {
    return this.currentMaxAndMin;
  }
}
