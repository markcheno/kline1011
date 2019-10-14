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

  getFirstIndex() {
    return this.firstIndex;
  }

  getLastIndex() {
    return this.lastIndex;
  }

  setFirstIndex(index) {
    this.firstIndex = index;
  }

  setLastIndex(index) {
    this.lastIndex = index;
  }

  // 更新数据
  updateData(data, mode) {
    console.log(data, mode);
    this.data = data.map(item => ({
      date: Number(item.ts),
      open: Number(item.o),
      high: Number(item.h),
      low: Number(item.l),
      close: Number(item.c),
      volume: Number(item.v),
    }));
  }

  // 获取当前视图数据
  getCurrentData() {
    return this.data.splice(this.getFirstIndex(), this.getLastIndex());
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
