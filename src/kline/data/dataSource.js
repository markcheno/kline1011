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
    // 当前时间段数据
    this.currentData = [];
    // 保留小数点
    this.decimalDigits = 0;
    this.firstIndex = -1;
    this.lastIndex = -1;
    this.maxCountInArea = -1;
  }

  getColumnWidth() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.itemWidth[candleStickMode.scale] + candleStickMode.spaceWidth[candleStickMode.scale];
  }

  getColumnCenter() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.itemWidth[candleStickMode.scale] / 2;
  }

  // 计算最大蜡烛图个数
  updateMaxCountInArea(width) {
    const columnWidth = this.getColumnWidth();
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
    this.currentData = [].concat(JSON.parse(JSON.stringify(this.data))).splice(this.firstIndex, this.lastIndex);
  }

  // 获取当前视图数据
  getCurrentData() {
    return this.currentData;
  }
}
