export default class Range {
  constructor() {
    // range 上的最大值, 最小值
    this.minValue = 0;
    this.maxValue = 0;
    // 刻度比率 1刻度代表多少数值
    this.ratio = 0;
    // 最小刻度间隔
    this.minInterval = 36;
  }

  // 更新range
  // updateRange() {
  //   const { min, max } = getCurrentMaxAndMin();
  // }
}
