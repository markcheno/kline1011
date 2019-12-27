import Control from '../manage/control';

export class Area {
  constructor(name) {
    this.name = name;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.mouseDownPlace = {};
  }

  getName() {
    return this.name;
  }

  getCenter() {
    return (this.right + this.left) / 2;
  }

  getPlace() {
    return {
      left: this.left,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
    };
  }

  contains(x, y) {
    const { left, top, right, bottom } = this.getPlace();
    return x >= left && x <= right && y >= top && y <= bottom;
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

  onMouseUp() {}
}

export class ChartArea extends Area {
  constructor(name) {
    super(name);
    this.lastMoveX = 0;
  }

  onMouseDown(place) {
    this.mouseDownPlace = place;
    this.lastMoveX = 0;
    Control.showCursor('move');
    Control.startMove();
    Control.clearOverView();
  }

  // 更新移动起始的触摸点
  updateMoveStartPlace(place) {
    const { x, y } = place;
    this.mouseDownPlace = {
      x: x || this.mouseDownPlace.x,
      y: y || this.mouseDownPlace.y,
    };
    this.lastMoveX = 0;
  }

  onMouseMove(place, status) {
    if (status) {
      Control.showCursor('move');
      const moveX = place.x - this.mouseDownPlace.x || 0;
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
