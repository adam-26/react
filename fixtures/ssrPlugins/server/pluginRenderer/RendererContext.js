// @flow

export default class RendererContext {
  _log: mixed;
  _start: mixed;

  constructor(log?: mixed = console.log): void {
    this._log = log;
  }

  log(message: string): void {
    this._log(message);
  }

  startRender(): void {
    this._start = process.hrtime();
  }

  // TODO: Collect stats about render performance, allow other plugins to add additional stats (cache hit/miss, etc)
  finishRender(): void {
    const end = process.hrtime(this._start);
    const nanoseconds = (end[0] * 1e9) + end[1];
    const milliseconds = nanoseconds / 1e6;
    this.log(`[ReactPartialFrameRenderer.read: ${milliseconds}ms]`);
    this._start = null;
  }
}
