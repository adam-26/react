// @flow

/**
 * A very simple react stateless component for caching component render output on the server.
 * @param cacheKey
 * @param render
 * @param props
 * @constructor
 */
const Cache = ({cacheKey, render, ...props}) => render(props);
Cache.displayName = 'Cache';
Cache.getKey = ({ cacheKey, render, ...props }) => cacheKey(props);
export default Cache;
