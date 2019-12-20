import Control from '../manage/control';

export class Area {
  constructor(name) {
    this.name = name;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.oldPlace = {};
    this.lastMoveLength = 0;
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

  onMouseLeave() {
    Control.clearOverView();
  }

  onMouseUp() {}
}

export class ChartArea extends Area {
  constructor(name) {
    super(name);
    this.lastMoveX = 0;
  }

  onMouseDown(place) {
    this.oldPlace = place;
    Control.showCursor('move');
    Control.startMove();
    Control.clearOverView();
  }

  // 更新移动起始的触摸点
  updateMoveStartPlace(place) {
    const { x, y } = place;
    this.oldPlace = {
      x: x || this.oldPlace.x,
      y: y || this.oldPlace.y,
    };
    this.lastMoveX = 0;
  }

  onMouseMove(place, status) {
    if (status) {
      Control.showCursor('move');
      const moveX = place.x - this.oldPlace.x || 0;
      if (this.lastMoveX !== moveX) {
        const direction = moveX - this.lastMoveX > 0 ? 'right' : 'left';
        this.lastMoveX = moveX;
        Control.move(moveX, direction, this);
        Control.redrawMainView();
      }
    } else {
      Control.updateCrossCursorSelectAt(place);
      Control.redrawOverView();
    }
  }
}

export class RangeArea extends Area {
  constructor(name) {
    super(name);
  }

  onMouseMove(place, status) {
    Control.clearOverView();
    if (status) {
      Control.showCursor();
    }
  }
}

export class TimelineArea extends Area {
  constructor(name) {
    super(name);
  }

  onMouseMove(place, status) {
    Control.clearOverView();
    if (status) {
      Control.showCursor('move');
    }
  }
}
