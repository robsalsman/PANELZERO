// Custom scroll controller (M0). Not native scroll: the page locks at the active
// panel until it's cleared, rubber-bands at the lock, and can auto-glide forward.
export class ScrollController {
  constructor() {
    this.y = 0;          // current scroll offset (px into the virtual page)
    this.vy = 0;         // momentum velocity px/s
    this.min = 0;
    this.max = 0;        // lock position — bottom bound until panel cleared
    this.dragging = false;
    this.frozen = false; // true while a challenge is active — no scrolling at all
    this.glideTarget = null;
    this._lastDragY = 0;
    this._lastDragT = 0;
  }

  setMax(max) { this.max = Math.max(0, max); }

  glideTo(y) {
    this.glideTarget = Math.max(this.min, Math.min(this.max, y));
    this.vy = 0;
  }

  jumpTo(y) {
    this.y = Math.max(this.min, Math.min(this.max, y));
    this.vy = 0;
    this.glideTarget = null;
  }

  dragStart(py) {
    if (this.frozen) return;
    this.dragging = true;
    this.glideTarget = null;
    this.vy = 0;
    this._lastDragY = py;
    this._lastDragT = performance.now();
  }

  dragMove(py) {
    if (!this.dragging || this.frozen) return;
    let dy = this._lastDragY - py; // drag up => scroll down
    // rubber-band resistance past bounds
    const over = this.y < this.min ? this.min - this.y : this.y > this.max ? this.y - this.max : 0;
    if (over > 0) dy *= 1 / (1 + over / 60);
    this.y += dy;
    const now = performance.now();
    const dt = Math.max(1, now - this._lastDragT) / 1000;
    this.vy = dy / dt;
    this._lastDragY = py;
    this._lastDragT = now;
  }

  dragEnd() {
    this.dragging = false;
  }

  update(dt) {
    if (this.dragging || this.frozen) return;

    if (this.glideTarget !== null) {
      // brisk glide — dead time between panels kills pacing
      const d = this.glideTarget - this.y;
      if (Math.abs(d) < 0.5) {
        this.y = this.glideTarget;
        this.glideTarget = null;
      } else {
        this.y += d * Math.min(1, dt * 11);
      }
      return;
    }

    // momentum
    if (Math.abs(this.vy) > 5) {
      this.y += this.vy * dt;
      this.vy *= Math.pow(0.02, dt); // heavy friction
    } else {
      this.vy = 0;
    }

    // spring back into bounds (rubber band release)
    if (this.y < this.min) {
      this.y += (this.min - this.y) * Math.min(1, dt * 10);
      if (this.min - this.y < 0.5) this.y = this.min;
      this.vy = 0;
    } else if (this.y > this.max) {
      this.y += (this.max - this.y) * Math.min(1, dt * 10);
      if (this.y - this.max < 0.5) this.y = this.max;
      this.vy = 0;
    }
  }

  atMax() {
    return this.y >= this.max - 2;
  }
}
