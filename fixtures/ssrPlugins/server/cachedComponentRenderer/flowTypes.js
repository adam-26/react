// @flow
import CachedComponentContext from './CachedComponentContext';

export interface CachedComponentProvider {
  getCachedComponents(url: string, callback: (err: any, cachedData: mixed) => void): void;
  setCachedComponents(url: string, ctx: CachedComponentContext, callback: (err: any) => void): void;
}
