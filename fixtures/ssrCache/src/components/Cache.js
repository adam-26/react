// @flow
import React /*, { Component }*/ from 'react';

// const CacheFrame = ({cacheKey, render, ...props}) => render(props);
// CacheFrame.displayName = 'CacheFrame';
// CacheFrame.getCacheKey = ({ cacheKey, render, ...props }) => cacheKey(props);
//
// // Required for the partial renderer to internally create a frame, this is required for caching.
// const Cache = (props) => React.Children.toArray(<CacheFrame {...props} />);
// Cache.displayName = 'Cache';
//
// export default Cache;

// TODO: Does this 'requirement' make it impossible to implement electrode style SSR cache?
// Its also possible to cache components directly... add demo for caching the <Page /> component via static '.getCacheKey()'

const Cache = ({cacheKey, render, ...props}) => render(props);
Cache.displayName = 'Cache';
Cache.getCacheKey = ({ cacheKey, render, ...props }) => cacheKey(props);
export default Cache;
