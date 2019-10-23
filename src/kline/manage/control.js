import Manager from './manager';

export default class Control {
  static leftMouseDown = false;

  static getLeftMouseDownStatus() {
    return this.leftMouseDown;
  }

  // 注册鼠标事件
  static registerMouseEvent() {
    const manager = Manager.instance;
    const overlayCanvas = $(manager.canvas.overlayCanvas);
    // 获取当前鼠标所在位置
    const getMouesePlace = e => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y };
    };
    overlayCanvas.bind('contextmenu', e => {
      // 注册鼠标右键事件
      e.cancelBubble = true;
      e.returnValue = false;
      e.preventDefault();
      e.stopPropagation();
      return false;
    }).mousedown(e => {
      // 注册左键按下事件
      if (e.which !== 1) return;
      this.leftMouseDown = true;
      manager.onMouseDown(getMouesePlace(e));
    }).mousemove(e => {
      manager.onMouseMove(getMouesePlace(e), this.leftMouseDown);
    }).mouseup(e => {
      if (e.which !== 1) return;
      this.leftMouseDown = false;
    }).mouseleave(() => {
      this.leftMouseDown = false;
    });
  }

  static showCursor(cursor = 'default') {
    const manager = Manager.instance;
    manager.canvas.mainCanvas.style.cursor = cursor;
    manager.canvas.overlayCanvas.style.cursor = cursor;
  }

  static hideCursor() {
    const manager = Manager.instance;
    manager.canvas.mainCanvas.style.cursor = 'none';
    manager.canvas.overlayCanvas.style.cursor = 'none';
  }

  static redrawView(x) {
    Manager.instance.redraw(x);
  }
}
