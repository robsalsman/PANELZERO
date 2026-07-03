// Pointer-event gesture recognizer: tap / swipe / hold / trace. No libraries.
// Emits callbacks; the game routes them to the scroll controller or the active challenge.
const TAP_MAX_DIST = 12;
const TAP_MAX_MS = 350;
const SWIPE_MIN_DIST = 32;

export class Input {
  constructor(el, handlers) {
    this.el = el;
    this.h = handlers; // { onDown, onMove, onUp, onTap, onSwipe }
    this.active = false;
    this.id = null;
    this.start = null;
    this.swiped = false;

    el.addEventListener('pointerdown', (e) => this._down(e));
    el.addEventListener('pointermove', (e) => this._move(e));
    el.addEventListener('pointerup', (e) => this._up(e));
    el.addEventListener('pointercancel', (e) => this._up(e, true));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _pt(e) {
    return { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  _down(e) {
    if (this.active) return; // single-pointer game
    this.active = true;
    this.id = e.pointerId;
    this.swiped = false;
    this.start = this._pt(e);
    this.el.setPointerCapture?.(e.pointerId);
    this.h.onDown?.(this.start);
  }

  _move(e) {
    if (!this.active || e.pointerId !== this.id) return;
    const p = this._pt(e);
    this.h.onMove?.(p, this.start);
    // detect swipe mid-gesture (snappy dodges — don't wait for pointerup)
    if (!this.swiped) {
      const dx = p.x - this.start.x;
      const dy = p.y - this.start.y;
      if (Math.hypot(dx, dy) >= SWIPE_MIN_DIST) {
        this.swiped = true;
        const dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
        this.h.onSwipe?.(dir, this.start, p);
      }
    }
  }

  _up(e, cancelled = false) {
    if (!this.active || e.pointerId !== this.id) return;
    this.active = false;
    const p = this._pt(e);
    this.h.onUp?.(p, this.start);
    if (!cancelled && !this.swiped) {
      const dist = Math.hypot(p.x - this.start.x, p.y - this.start.y);
      const ms = p.t - this.start.t;
      if (dist <= TAP_MAX_DIST && ms <= TAP_MAX_MS) this.h.onTap?.(p);
    }
  }
}
