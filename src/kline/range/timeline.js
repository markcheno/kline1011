import Manager from '../manage/manager';

export default class Timeline {
  constructor() {
    // 需要至少大于2
    this.timeCount = 5;
    this.timeArray = [];
    this.timeInterval = 0;
  }


  getData() {
    const { dataSource } = Manager.instance;
    const { firstIndex, lastIndex } = dataSource;
    return {
      timeArray: this.timeArray,
      firstIndex,
      lastIndex,
      dataSource,
    };
  }

  updateTimeline() {
    const { dataSource } = Manager.instance;
    const { firstIndex, lastIndex } = dataSource;
    const allData = dataSource.getAllData();
    const interval = Math.floor((lastIndex - firstIndex) / this.timeCount);
    let start = firstIndex % interval;
    start = interval - start + firstIndex;
    const timeArray = [];
    while (start <= lastIndex) {
      /* global moment */
      const value = moment(allData[start].time).format('YYYY-MM-DD');
      timeArray.push({
        index: start,
        value,
      });
      start += interval;
    }
    this.timeArray = timeArray;
  }

  calcInterval() {
    const { width } = this;
    let { minInterval } = this;
    if (width < minInterval) minInterval = width;
  }
}
