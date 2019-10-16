export class Area {
  constructor(name) {
    this.name = name;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.rangeWidth = 100;
  }

  getName() {
    return this.name;
  }

  getLeft() {
    return this.left;
  }

  getRight() {
    return this.right;
  }

  getTop() {
    return this.top;
  }

  getBottom() {
    return this.bottom;
  }

  getCenter() {
    return (this.right + this.left) / 2;
  }

  getWidth() {
    return this.right - this.left;
  }

  getHeight() {
    return this.bottom - this.top;
  }

  getPlace() {
    return {
      left: this.getLeft(),
      top: this.getTop(),
      right: this.getRight(),
      bottom: this.getBottom(),
    };
  }

  getRect() {
    return {
      x: this.getLeft(),
      y: this.getTop(),
      width: this.getWidth(),
      height: this.getHeight(),
    };
  }

  contains(x, y) {
    return x >= this.getLeft() && x <= this.getRight() && y >= this.getTop() && y <= this.getBottom();
  }

  layout(place) {
    const { left, right, top, bottom } = place;
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  onMouseDown() {}

  onMouseMove() {}

  onMouseLeave() {}

  onMouseUp() {}
}

export class ChartArea extends Area {
  constructor(name) {
    super(name);
  }

  onMouseMove() {
    console.log('ChartArea onMouseMove');
  }
}

export class RangeArea extends Area {
  constructor(name) {
    super(name);
  }

  onMouseMove() {
    console.log('RangeArea onMouseMove');
  }
}

export class TimelineArea extends Area {
  constructor(name) {
    super(name);
  }

  onMouseMove() {
    console.log('TimelineArea onMouseMove');
  }
}
