import Manager from '../manage/manager';

export default class Timeline {
  constructor() {
    this.minDate = 0;
    this.maxDate = 0;
    this.minInterval = 0;
    this.width = 0;
  }


  getData() {
    return {
      minDate: this.minDate,
      maxDate: this.maxDate,
    };
  }

  updateTimeline(layout) {
    const area = layout.timelineArea;
    const { dataSource } = Manager.instance;
    const minDate = dataSource.getDataByIndex(dataSource.firstIndex).time;
    const maxDate = dataSource.getDataByIndex(dataSource.lastIndex).time;
    /* global moment */
    this.minDate = moment(minDate).format('YYYY-MM-DD');
    this.maxDate = moment(maxDate).format('YYYY-MM-DD');
    this.width = area.getWidth();
  }

  calcInterval() {
    const { width } = this;
    let { minInterval } = this;
    if (width < minInterval) minInterval = width;
  }
}
