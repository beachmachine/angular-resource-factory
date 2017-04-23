(function (root, factory) {
    var resolved = [],
        required = ["require","exports","module","angular"],
        i, len = required.length;

    if (typeof define === "function" && define.amd) {
        define("ngresourcefactory",["require","exports","module","angular"], factory);
    } else if (typeof exports === "object") {
        for (i = 0; i < len; i += 1) {
            resolved.push(require(required[i]));
        }

        module.exports = factory.apply({}, resolved);
    } else {
        for (i = 0; i < len; i += 1) {
            resolved.push(root[required[i]]);
        }

        root["ngresourcefactory"] = factory.apply({}, resolved);
    }
}(this, function (require,exports,module,angular) {
    
    /**
 * Angular ResourceFactory
 * Copyright 2016 Andreas Stocker
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


(function () {
    'use strict';

    var
        app = angular.module('ngResourceFactory', [
            'ngResource'
        ]);

})();

/**
 * Angular ResourceCacheService
 * Copyright 2016 Andreas Stocker
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


(function () {
    'use strict';

    var
        module = angular.module('ngResourceFactory');

    /**
     * Factory service to create new cache.
     *
     * @name ResourceCacheService
     * @ngdoc factory
     */
    module.factory('ResourceCacheService',
        function () {
            'ngInject';

            var
                caches = {};

            /**
             * Constructor function for the cache.
             *
             * @name ResourceCache
             * @ngdoc constructor
             * @constructor
             */
            function constructor (name, pkAttr, options) {
                var
                    self = this,

                    /**
                     * The cache object
                     * @type {{}}
                     */
                    cache = {},

                    /**
                     * Mapping of cache keys to boolean that indicates whether to use the `dataAttr` or not
                     * @type {{}}
                     */
                    cacheUseDataAttr = {},

                    /**
                     * Mapping of cache keys to boolean that indicates whether the value is managed or not
                     * @type {{}}
                     */
                    cacheIsManaged = {},

                    /**
                     * Mapping of cache keys to timestamps for automatic invalidation
                     * @type {{}}
                     */
                    cacheTimestamps = {};

                options = angular.extend({
                    /**
                     * Name of the attribute to get the ID of the objects
                     * @type {String|null}
                     */
                    pkAttr: null,

                    /**
                     * Name of the attribute to get the URL of the objects
                     * @type {String|null}
                     */
                    urlAttr: null,

                    /**
                     * Name of the attribute to get the actual data from
                     * @type {String|null}
                     */
                    dataAttr: null,

                    /**
                     * Dependent caches
                     * @type {Array<String>}
                     */
                    dependent: [],

                    /**
                     * Time to live for cache entries in seconds
                     * @type {int}
                     */
                    ttl: 60 * 60
                }, options || {});

                // initialize the cache
                init();

                /**
                 * Refreshes the cache entries with the new value or values. The existing objects in the cache
                 * are matched by the `pkAttr` value, and additionally by the `urlAttr`, if available.
                 *
                 * @memberOf ResourceCache
                 * @param {Object|Array<Object>} value
                 */
                self.refresh = function (value) {
                    // refresh the existing values in the cache with the new entries
                    if (angular.isArray(value)) {
                        console.log("ResourceCacheService: Refresh existing entries with list of new entries on the cache '" + name + "'.");

                        refreshEach(value);
                    }
                    // refresh the existing values in the cache with the new entry
                    else if (angular.isObject(value)) {
                        console.log("ResourceCacheService: Refresh existing entries with new entry on the cache '" + name + "'.");

                        refreshSingle(value);
                    }
                    else {
                        console.log("ResourceCacheService: Unable to refresh existing entries on the cache '" + name + "' as given value is neither an array nor an object.");
                    }
                };

                /**
                 * Creates a cache entry for the given value and puts it on the cache.
                 *
                 * @memberOf ResourceCache
                 * @param key
                 * @param value
                 * @param useDataAttr
                 * @param [refresh]
                 */
                self.insert = function (key, value, useDataAttr, refresh) {
                    console.log("ResourceCacheService: Insert value with key '" + key + "' on the cache '" + name + "'.");

                    var
                        isManaged = angular.isObject(value) || angular.isArray(value),
                        status = 200,
                        headers = isManaged ? {'content-type': 'application/json'} : {},
                        statusText = 'OK',
                        entry = [status, value, headers, statusText];

                    useDataAttr = !!useDataAttr;
                    refresh = angular.isUndefined(refresh) ? true : !!refresh;

                    if (key) {
                        cache[key] = entry;
                        cacheUseDataAttr[key] = useDataAttr && isManaged;
                        cacheIsManaged[key] = isManaged;
                        createOrUpdateTimestamp(key);

                        // only refresh existing data if `refresh` parameter was not set to false
                        if (refresh) {
                            self.refresh(getDataForEntry(entry, useDataAttr));
                        }
                    }
                };

                /**
                 * Puts the given entry with the given key on the cache.
                 *
                 * @memberOf ResourceCache
                 * @param key
                 * @param value
                 * @param useDataAttr
                 */
                self.put = function (key, value, useDataAttr) {
                    console.log("ResourceCacheService: Put entry with key '" + key + "' on the cache '" + name + "'.");

                    useDataAttr = !!useDataAttr;

                    var
                        /**
                         * Indicates if value is managed by the cache, which means it is refreshed if new calls
                         * return the same object.
                         * @type {boolean}
                         */
                        isManaged = false;

                    if (key) {
                        // store the actual data object, not the serialized string, for JSON
                        if (value && value[2] && isJsonContentType(value[2]['content-type'])) {
                            console.log("ResourceCacheService: Use deserialized data for key '" + key + "' on the cache '" + name + "'.");

                            value[1] = value[1] ? angular.fromJson(value[1]) : null;
                            isManaged = true;
                        }
                        else {
                            console.log("ResourceCacheService: Use raw data for key '" + key + "' on the cache '" + name + "'.");

                            useDataAttr = false;
                            isManaged = false;
                        }

                        cache[key] = value;
                        cacheUseDataAttr[key] = useDataAttr;
                        cacheIsManaged[key] = isManaged;
                        createOrUpdateTimestamp(key);

                        // only refresh the cache entries if the value is already a cache entry (which is
                        // always an array), not a promise.
                        if (isManaged) {
                            self.refresh(getDataForEntry(value, useDataAttr));
                        }
                    }
                };

                /**
                 * Gets the entry with the given key from the cache, or undefined.
                 *
                 * @memberOf ResourceCache
                 * @param key
                 * @param useCacheTtl
                 * @returns {*|undefined}
                 */
                self.get = function (key, useCacheTtl) {
                    var
                        value = undefined;

                    // `useCacheTtl` should default to true
                    useCacheTtl = angular.isUndefined(useCacheTtl) || !!useCacheTtl ? true : false;

                    if (cache.hasOwnProperty(key)) {
                        if (!useCacheTtl || isEntryAlive(key)) {
                            console.log("ResourceCacheService: Get entry with key '" + key + "' from the cache '" + name + "'.");

                            value = cache[key];

                            // serialize to string for managed objects
                            if (cacheIsManaged[key]) {
                                value = angular.copy(value);
                                value[1] = angular.toJson(value[1]);
                            }
                        }
                        else {
                            console.log("ResourceCacheService: Entry with key '" + key + "' exceeded TTL on the cache '" + name + "'.");

                            self.remove(key);
                        }
                    }
                    else {
                        console.log("ResourceCacheService: Unable to get entry with key '" + key + "' from the cache '" + name + "'.");
                    }

                    return value;
                };

                /**
                 * Removes the entry with the given key from the cache.
                 *
                 * @memberOf ResourceCache
                 * @param key
                 */
                self.remove = function (key) {
                    if (cache.hasOwnProperty(key)) {
                        console.log("ResourceCacheService: Remove entry with key '" + key + "' from the cache '" + name + "'.");

                        delete cache[key];
                        delete cacheTimestamps[key];
                        delete cacheUseDataAttr[key];
                        delete cacheIsManaged[key];
                    }
                };

                /**
                 * Removes all entries from the cache.
                 *
                 * @memberOf ResourceCache
                 */
                self.removeAll = function () {
                    console.log("ResourceCacheService: Remove all entries from the cache '" + name + "'.");

                    for (var key in cache) {
                        if (cache.hasOwnProperty(key)) {
                            delete cache[key];
                            delete cacheTimestamps[key];
                            delete cacheUseDataAttr[key];
                            delete cacheIsManaged[key];
                        }
                    }
                };

                /**
                 * Removes all list entries from the cache.
                 *
                 * @memberOf ResourceCache
                 */
                self.removeAllLists = function () {
                    console.log("ResourceCacheService: Remove all list entries from the cache '" + name + "'.");

                    for (var key in cache) {
                        if (cache.hasOwnProperty(key) && angular.isArray(getDataForKey(key))) {
                            delete cache[key];
                            delete cacheTimestamps[key];
                            delete cacheUseDataAttr[key];
                            delete cacheIsManaged[key];
                        }
                    }
                };

                /**
                 * Removes all list entries from the cache.
                 *
                 * @memberOf ResourceCache
                 */
                self.removeAllObjects = function () {
                    console.log("ResourceCacheService: Remove all object entries from the cache '" + name + "'.");

                    for (var key in cache) {
                        if (cache.hasOwnProperty(key) && angular.isObject(getDataForKey(key))) {
                            delete cache[key];
                            delete cacheTimestamps[key];
                            delete cacheUseDataAttr[key];
                            delete cacheIsManaged[key];
                        }
                    }
                };

                /**
                 * Removes all raw entries from the cache.
                 *
                 * @memberOf ResourceCache
                 */
                self.removeAllRaw = function () {
                    console.log("ResourceCacheService: Remove all raw entries from the cache '" + name + "'.");

                    for (var key in cache) {
                        if (cache.hasOwnProperty(key) && !cacheIsManaged[key]) {
                            delete cache[key];
                            delete cacheTimestamps[key];
                            delete cacheUseDataAttr[key];
                            delete cacheIsManaged[key];
                        }
                    }
                };

                /**
                 * Removes all entries of the dependent caches, including the dependent caches of the
                 * dependent caches (and so on ...).
                 *
                 * @memberOf ResourceCache
                 */
                self.removeAllDependent = function () {
                    var
                        dependentCacheNames = collectDependentCacheNames(self, []);

                    for (var i = 0; i < dependentCacheNames.length; i++) {
                        caches[dependentCacheNames[i]].removeAll();
                    }
                };

                /**
                 * Destroys the cache object.
                 *
                 * @memberOf ResourceCache
                 */
                self.destroy = function () {
                    var
                        cacheIndex = caches.indexOf(self),
                        isManaged = cacheIndex !== -1;

                    if (isManaged) {
                        console.log("ResourceCacheService: Destroy the cache '" + name + "'.");

                        self.removeAll();
                        caches.splice(cacheIndex, 1);
                    }
                };

                /**
                 * Retrieve information regarding the cache.
                 *
                 * @memberOf ResourceCache
                 * @returns {{id: *, size: number}}
                 */
                self.info = function () {
                    console.log("ResourceCacheService: Get cache information from the cache '" + name + "'.");

                    var
                        size = 0;

                    // calculate the cache size
                    for (var key in cache) {
                        if (cache.hasOwnProperty(key)) {
                            size++;
                        }
                    }

                    return {
                        'id': name,
                        'size': size,
                        'options': options
                    }
                };

                /**
                 * Cache interface to put entries using `dataAttr` on the cache.
                 *
                 * @memberOf ResourceCache
                 * @type {{put: constructor.withDataAttrNoTtl.put, get: constructor.withDataAttrNoTtl.get, remove: (*), removeAll: (*), info: (*)}}
                 */
                self.withDataAttr = {
                    put: function (key, value) {
                        return self.put(key, value, true);
                    },
                    get: function (key) {
                        return self.get(key, true);
                    },
                    remove: self.remove,
                    removeAll: self.removeAll,
                    info: self.info
                };

                /**
                 * Cache interface to put entries without using `dataAttr` on the cache.
                 *
                 * @memberOf ResourceCache
                 * @type {{put: constructor.withDataAttrNoTtl.put, get: constructor.withDataAttrNoTtl.get, remove: (*), removeAll: (*), info: (*)}}
                 */
                self.withoutDataAttr = {
                    put: function (key, value) {
                        return self.put(key, value, false);
                    },
                    get: function (key) {
                        return self.get(key, true);
                    },
                    remove: self.remove,
                    removeAll: self.removeAll,
                    info: self.info
                };

                /**
                 * Cache interface to put entries using `dataAttr` on the cache and ignoring TTL.
                 *
                 * @memberOf ResourceCache
                 * @type {{put: constructor.withDataAttrNoTtl.put, get: constructor.withDataAttrNoTtl.get, remove: (*), removeAll: (*), info: (*)}}
                 */
                self.withDataAttrNoTtl = {
                    put: function (key, value) {
                        return self.put(key, value, true);
                    },
                    get: function (key) {
                        return self.get(key, false);
                    },
                    remove: self.remove,
                    removeAll: self.removeAll,
                    info: self.info
                };

                /**
                 * Cache interface to put entries without using `dataAttr` on the cache and ignoring TTL.
                 *
                 * @memberOf ResourceCache
                 * @type {{put: constructor.withDataAttrNoTtl.put, get: constructor.withDataAttrNoTtl.get, remove: (*), removeAll: (*), info: (*)}}
                 */
                self.withoutDataAttrNoTtl = {
                    put: function (key, value) {
                        return self.put(key, value, false);
                    },
                    get: function (key) {
                        return self.get(key, false);
                    },
                    remove: self.remove,
                    removeAll: self.removeAll,
                    info: self.info
                };

                /**
                 * Checks if the given content type string indicates JSON.
                 * @param contentType
                 * @return {boolean}
                 */
                function isJsonContentType (contentType) {
                    if (!contentType) {
                        return false;
                    }
                    return (contentType === 'application/json' || String(contentType).indexOf('application/json;') === 0);
                }

                /**
                 * Gets the cache data for the given key.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param key
                 */
                function getDataForKey (key) {
                    if (cache.hasOwnProperty(key)) {
                        var
                            entry = cache[key],
                            useDataAttr = cacheUseDataAttr[key];

                        return getDataForEntry(entry, useDataAttr);
                    }
                }

                /**
                 * Gets the cache data for the given cache entry.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param value
                 * @param useDataAttr
                 * @returns {*}
                 */
                function getDataForEntry (value, useDataAttr) {
                    var
                        data = value[1];

                    if (useDataAttr && options.dataAttr && data) {
                        return data[options.dataAttr]
                    }
                    else {
                        return data;
                    }
                }

                /**
                 * Sets the cache data for the given key.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param key
                 * @param newData
                 */
                function setDataForKey (key, newData) {
                    if (cache.hasOwnProperty(key)) {
                        var
                            entry = cache[key],
                            entryUseDataAttr = cacheUseDataAttr[key],
                            entryData = entry[1];

                        if (entryUseDataAttr && options.dataAttr && entryData) {
                            entryData[options.dataAttr] = newData;
                        }
                        else {
                            entryData = newData;
                        }

                        entry[1] = entryData;
                    }
                }

                /**
                 * Returns the current unix epoch in seconds.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @returns {int}
                 */
                function getCurrentTimestamp () {
                    return Math.floor(Date.now() / 1000);
                }

                /**
                 * Sets the timestamp for the given key to the current unix epoch in seconds.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param key
                 * @returns {int}
                 */
                function createOrUpdateTimestamp (key) {
                    cacheTimestamps[key] = getCurrentTimestamp();
                    return cacheTimestamps[key];
                }

                /**
                 * Checks if the cache entry for the given key is still alive. Also returns
                 * `false` if there is no cache entry for the given key.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param key
                 * @returns {boolean}
                 */
                function isEntryAlive (key) {
                    if (cache.hasOwnProperty(key)) {
                        var
                            entryAge = getCurrentTimestamp() - cacheTimestamps[key];

                        return entryAge <= options.ttl;
                    }

                    return false;
                }

                /**
                 * Takes a new cache entry and refreshes the existing instances of the entry, matching by the
                 * `pkAttr` value.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param {Object} newData
                 */
                function refreshSingle (newData) {
                    var
                        urlAttr = options.urlAttr;

                    // inserts the data on the cache as individual entry, if we have the URL information on the data
                    if (urlAttr && newData && newData[urlAttr]) {
                        self.insert(newData[urlAttr], newData, false, false);
                    }

                    for (var key in cache) {
                        if (cache.hasOwnProperty(key) && cacheIsManaged[key]) {
                            var
                                entry = cache[key],
                                entryUseDataAttr = cacheUseDataAttr[key],
                                entryData = getDataForEntry(entry, entryUseDataAttr),
                                isList = angular.isArray(entryData);

                            // refresh the objects matching the new object within the list entries in the cache
                            if (isList) {
                                for (var i = 0; i < entryData.length; i++) {
                                    if (entryData[i][pkAttr] === newData[pkAttr]) {
                                        // additionally compare the `urlAttr`, if available
                                        if (!urlAttr || (urlAttr && entryData[i][urlAttr] === newData[urlAttr])) {
                                            entryData[i] = newData;
                                        }
                                    }
                                }

                                // update the cache entry with the new data
                                setDataForKey(key, entryData);
                            }
                            // refresh the objects matching the new object in the cache
                            else {
                                if (entryData[pkAttr] === newData[pkAttr]) {
                                    // additionally compare the `urlAttr`, if available
                                    if (!urlAttr || (urlAttr && entryData[urlAttr] === newData[urlAttr])) {
                                        setDataForKey(key, newData);

                                        // for object entries we can update the entries timestamp
                                        createOrUpdateTimestamp(key);
                                    }
                                }
                            }
                        }
                    }
                }

                /**
                 * Refreshes each entry in the given list using the `refreshSingle` method.
                 *
                 * @memberOf ResourceCache
                 * @private
                 * @param {Array<Object>} newEntries
                 */
                function refreshEach (newEntries) {
                    for (var i = 0; i < newEntries.length; i++) {
                        refreshSingle(newEntries[i]);
                    }
                }

                /**
                 * Initializes the cache object.
                 *
                 * @memberOf ResourceCache
                 * @private
                 */
                function init () {
                    // make sure the given name is not used yet
                    if (caches.hasOwnProperty(name)) {
                        throw Error("Name '" + name + "' is already used by another cache.");
                    }

                    caches[name] = self;
                }
            }

            /**
             * Calls the removeAll method on all managed caches.
             *
             * @memberOf ResourceCache
             * @static
             */
            constructor.removeAll = function () {
                for (var key in caches) {
                    if (caches.hasOwnProperty(key)) {
                        caches[key].removeAll();
                    }
                }
            };

            /**
             * Gets the cache with the given name, or null.
             *
             * @memberOf ResourceCache
             * @static
             * @param key
             * @returns {*|null}
             */
            constructor.get = function (key) {
                if (caches.hasOwnProperty(key)) {
                    return caches[key];
                }

                console.log("ResourceCacheService: Cache '" + key + "' does not exist.");

                return null;
            };

            /**
             * Gets the cache information for all managed caches as mapping of cacheId to the result
             * of the info method on the cache.
             *
             * @memberOf ResourceCache
             * @static
             * @returns {{}}
             */
            constructor.info = function () {
                var
                    infos = {};

                for (var key in caches) {
                    if (caches.hasOwnProperty(key)) {
                        var
                            info = caches[key].info();

                        infos[info.id] = info;
                    }
                }

                return infos;
            };

            /**
             * Collects all dependent caches of the given cache, including the dependent caches of the dependent
             * caches (and so on ...).
             *
             * @memberOf ResourceCacheService
             * @private
             * @param {Object} cache
             * @param {Array<String>|undefined} collectedDependentCacheNames
             * @returns {Array<String>}
             */
            function collectDependentCacheNames (cache, collectedDependentCacheNames) {
                var
                    cacheDependentCacheNames = cache.info()['options']['dependent'];

                // default `collectedDependentCacheNames` to empty list
                collectedDependentCacheNames = collectedDependentCacheNames || [];

                for (var i = 0; i < cacheDependentCacheNames.length; i++) {
                    var
                        cacheDependentCacheName = cacheDependentCacheNames[i],
                        cacheDependentCache = caches[cacheDependentCacheName];

                    if (cacheDependentCache) {
                        // push cache name to the collected dependent caches, if existing
                        collectedDependentCacheNames.push(cacheDependentCacheName);

                        // only collect cache dependencies if not already collected, to prevent circles
                        if (collectedDependentCacheNames.indexOf(cacheDependentCacheName) === -1) {
                            collectDependentCacheNames(cacheDependentCache, collectedDependentCacheNames)
                        }
                    }
                }

                return collectedDependentCacheNames;
            }

            return constructor;
        }
    );
})();

/**
 * Angular ResourceFactoryService
 * Copyright 2016 Andreas Stocker
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


(function () {
    'use strict';

    var
        module = angular.module('ngResourceFactory');

    /**
     * Factory service to create new resource classes. This factory is used to inject a `{@link ResourceFactory}`
     * to create new resource services.
     *
     * @name ResourceFactoryService
     * @ngdoc factory
     * @param {service} $q
     * @param {service} $resource
     * @param {ResourceCacheService} ResourceCacheService Default cache service
     * @param {ResourcePhantomIdNegativeInt} ResourcePhantomIdNegativeInt Default phantom ID generator
     * @see ResourceFactory
     * @example
     *  // Define a resource service for an REST endpoint.
     *  angular.module('example').factory('ExampleResourceService',
     *      function(ResourceFactoryService) {
     *          return ResourceFactoryService('ExampleResourceService', 'http://example.api/example/:pk/', {
     *              queryDataAttr: 'results',
     *              queryTotalAttr: 'count',
     *              pkAttr: 'pk',
     *              urlAttr: 'url'
     *          });
     *      }
     *  );
     */
    module.factory('ResourceFactoryService',
        ['$q', '$resource', 'ResourceCacheService', 'ResourcePhantomIdNegativeInt', function ($q,
                  $resource,
                  ResourceCacheService,
                  ResourcePhantomIdNegativeInt) {
            'ngInject';

            /**
             * Constructor function for creating a resource service. The resource service is used to make calls to the
             * REST-API via the "method" functions. These are the default method functions:
             * ```javascript
             * {
             *     // Undo all changes on the instance using the cache or by reloading the data from the server
             *     'restore': {method:'GET', isArray:false},
             *     // Get a single instance from the API
             *     'get': {method:'GET', isArray:false},
             *     // Get a single instance from the API bypassing the cache
             *     'getNoCache': {method:'GET', isArray:false},
             *     // Get a list of instances from the API
             *     'query': {method:'GET', isArray:true},
             *     // Get a list of instances from the API bypassing the cache
             *     'queryNoCache': {method:'GET', isArray:true},
             *     // Save a new instance
             *     'save': {method:'POST', isArray:false},
             *     // Update an existing instance
             *     'update': {method:'PATCH', isArray:false},
             *     // Delete an instance
             *     'remove': {method:'DELETE', isArray:false},
             * }
             * ```
             *
             * You can extend or override these methods by using the `options.extraMethods` option.
             *
             * Each of these methods is available as "static" version on the returned resource class, or as instance
             * method on a resource instance. The instance methods have a `"$"` prefix. Each of these methods,
             * static and instance versions, exists with a `"Bg"` postfix to make the call in the "background". This
             * means you do not see a loading bar if you are using `angular-loading-bar` ({@link http://chieffancypants.github.io/angular-loading-bar/}).
             *
             * @name ResourceFactory
             * @ngdoc constructor
             * @param {String} name Name of the resource service
             * @param {String} url URL to the resource
             * @param {Object} options Options for the resource
             * @param {Boolean} options.stripTrailingSlashes Strip trailing slashes from request URLs. Defaults to `false`.
             * @param {Boolean} options.ignoreLoadingBar Ignore the resource for automatic loading bars. Defaults to `false`.
             * @param {Boolean} options.generatePhantomIds Generate IDs for phantom records created via the `new` method. Defaults to `true`.
             * @param {ResourcePhantomIdFactory} options.phantomIdGenerator Phantom ID generator instance used for generating phantom IDs. Defaults to `{@link ResourcePhantomIdNegativeInt}`.
             * @param {String[]} options.dependent List of resource services to clean the cache for on modifying requests.
             * @param {Object} options.extraMethods Extra request methods to put on the resource service.
             * @param {Object} options.extraFunctions Extra functions to put on the resource service instance.
             * @param {String} options.pkAttr Attribute name where to find the ID of objects. Defaults to `"pk"`.
             * @param {String} options.urlAttr Attribute name where to find the URL of objects. Defaults to `"url"`.
             * @param {String} options.queryDataAttr Attribute name where to find the data on the query call (resource list calls). Defaults to `null`.
             * @param {String} options.queryTotalAttr Attribute name where to find the total amount of data on the query call (resource list calls). Defaults to `null`.
             * @param {String} options.cacheClass Resource cache class constructor function to use (see `{@link ResourceCache}`). Defaults to `{@link ResourceCacheService}`.
             * @param {Function} options.toInternal Function to post-process data coming from response. Gets `obj`, `headersGetter` and `status` and should return the processed `obj`.
             * @param {Function} options.fromInternal Function to post-process data that is going to be sent. Gets `obj` and `headersGetter` and should return the processed `obj`.
             * @constructor
             * @example
             *  // Getting and updating an resource instance
             *  var ex = ExampleResourceService.get({pk: 123});
             *  ex.$promise.then(function() {
             *      ex.test = 456;
             *      ex.$update();
             *  });
             * @example
             *  // Saving a new resource instance
             *  var ex = ExampleResourceService.new({test: 789});
             *  ex.$save();
             * @example
             *  // Saving or updating a resource instance
             *  var ex = get_a_new_or_existing_instance_from_somewhere();
             *  ex.test = 123;
             *  ex.$persist();
             */
            return function (name, url, options) {
                /**
                 * Options for the resource
                 * @type {Object}
                 */
                options = angular.extend({
                    /**
                     * Option to strip trailing slashes from request URLs
                     * @type {Boolean}
                     */
                    stripTrailingSlashes: false,

                    /**
                     * Option to ignore the resource for automatic loading bars
                     * @type {Boolean}
                     */
                    ignoreLoadingBar: false,

                    /**
                     * Generate IDs for phantom records created via the `new`
                     * method on the resource service
                     * @type {Boolean}
                     */
                    generatePhantomIds: true,

                    /**
                     * Phantom ID generator instance to use
                     * @type {ResourcePhantomIdFactory}
                     */
                    phantomIdGenerator: ResourcePhantomIdNegativeInt,

                    /**
                     * List of resource services to clean the cache for, on modifying requests
                     * @type {Array<String>}
                     */
                    dependent: [],

                    /**
                     * Extra methods to put on the resource service
                     * @type {Object}
                     */
                    extraMethods: {},

                    /**
                     * Extra functions to put on the resource instances
                     * @type {Object}
                     */
                    extraFunctions: {},

                    /**
                     * Attribute name where to find the ID of objects
                     * @type {String}
                     */
                    pkAttr: 'pk',

                    /**
                     * Attribute name where to find the URL of objects
                     * @type {String}
                     */
                    urlAttr: 'url',

                    /**
                     * Attribute name where to find the data on the query call
                     * @type {String|null}
                     */
                    queryDataAttr: null,

                    /**
                     * Attribute name where to find the total amount of data on the query call
                     * @type {String|null}
                     */
                    queryTotalAttr: null,

                    /**
                     * Storage for the query filters
                     * @type {*}
                     */
                    queryFilter: {},

                    /**
                     * Resource cache class constructor function to use (see `{@link ResourceCache}`)
                     * @type {Function}
                     */
                    cacheClass: ResourceCacheService,

                    /**
                     * Function to post-process data coming from response
                     * @param obj
                     * @param headersGetter
                     * @param status
                     * @return {*}
                     */
                    toInternal: function (obj, headersGetter, status) {
                        return obj;
                    },

                    /**
                     * Function to post-process data that is going to be sent
                     * @param obj
                     * @param headersGetter
                     * @return {*}
                     */
                    fromInternal: function (obj, headersGetter) {
                        return obj;
                    }
                }, options || {});

                var
                    resource,

                    /**
                     * Default parameter configuration
                     * @type {{}}
                     */
                    paramsDefaults = {},

                    /**
                     * Parameter configuration for save (insert). Used to
                     * disable the PK url template for save
                     * @type {{}}
                     */
                    saveParams = {},

                    /**
                     * The cache instance for the resource.
                     * @type {ResourceCacheService}
                     */
                    cache = new options.cacheClass(name, options.pkAttr, {
                        dataAttr: options.queryDataAttr,
                        pkAttr: options.pkAttr,
                        urlAttr: options.urlAttr,
                        dependent: options.dependent,
                        ttl: 15 * 60
                    }),

                    /**
                     * Interceptor that puts the returned object on the cache an invalidates the
                     * dependent resource services caches.
                     * @type {Object}
                     */
                    insertingInterceptor = {
                        response: function (response) {
                            var
                                data = response.data,
                                url = options.urlAttr ? data[options.urlAttr] : null;

                            cache.removeAllRaw();
                            cache.removeAllLists();
                            cache.removeAllDependent();

                            /*
                             * Insert the cached object if we have an URL on the returned instance. Else we have
                             * to invalidate the whole object cache.
                             */
                            if (url) {
                                cache.insert(url, data, false);
                            }
                            else {
                                cache.removeAllObjects();
                            }

                            return data;
                        }
                    },

                    /**
                     * Interceptor that puts the returned object on the cache an invalidates the
                     * dependent resource services caches.
                     * @type {Object}
                     */
                    modifyingInterceptor = {
                        response: function (response) {
                            var
                                data = response.data,
                                url = options.urlAttr ? data[options.urlAttr] : response.config.url;

                            cache.removeAllRaw();
                            cache.removeAllLists();
                            cache.removeAllDependent();

                            /*
                             * Update the cached object if we have an URL on the returned instance. Else we have
                             * to invalidate the whole object cache.
                             */
                            if (url) {
                                cache.insert(url, data, false);
                            }
                            else {
                                cache.removeAllObjects();
                            }

                            return data;
                        }
                    },

                    /**
                     * Interceptor that removes the cache for the deleted object, removes all list caches, and
                     * invalidates the dependent resource services caches.
                     * @type {Object}
                     */
                    deletingInterceptor = {
                        response: function (response) {
                            var
                                data = response.data,
                                url = options.urlAttr ? data[options.urlAttr] : response.config.url;

                            cache.removeAllRaw();
                            cache.removeAllLists();
                            cache.removeAllDependent();

                            /*
                             * Remove the cached object if we have an URL on the returned instance. Else we have
                             * to invalidate the whole object cache.
                             */
                            if (url) {
                                cache.remove(url);
                            }
                            else {
                                cache.removeAllObjects();
                            }

                            return data;
                        }
                    },

                    /**
                     * Parses the response text as JSON and returns it as object.
                     * @param responseText
                     * @param headersGetter
                     * @param status
                     * @return {Object|Array|string|number}
                     */
                    transformResponseFromJson = function (responseText, headersGetter, status) {
                        console.log("ResourceFactoryService: Deserialize data.");

                        return responseText ? angular.fromJson(responseText) : null;
                    },

                    /**
                     * Calls the `toInternal` function on each object of the response array.
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @return {*}
                     */
                    queryTransformResponseToInternal = function (responseData, headersGetter, status) {
                        console.log("ResourceFactoryService: Post-process query data for internal use.");

                        // iterate over the response data, if it was an array
                        if (angular.isArray(responseData)) {
                            for (var i = 0; i < responseData.length; i++) {
                                responseData[i] = options.toInternal(responseData[i], headersGetter, status);
                            }
                        }
                        // else just call the `toInternal` function on the response object
                        else {
                            responseData = options.toInternal(responseData, headersGetter, status);
                        }

                        return responseData;
                    },

                    /**
                     * Calls the `toInternal` function on the response data object.
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @return {*}
                     */
                    singleTransformResponseToInternal = function (responseData, headersGetter, status) {
                        console.log("ResourceFactoryService: Post-process data for internal use.");

                        return options.toInternal(responseData, headersGetter, status);
                    },

                    /**
                     * Transforms query responses to get the actual data from the `queryDataAttr` option, if
                     * configured. Also sets the `total` attribute on the list if `queryTotalAttr` is configured.
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @returns {Array|Object}
                     */
                    queryTransformResponseData = function (responseData, headersGetter, status) {
                        var
                            result = null;

                        // get data on success status from `queryDataAttr`, if configured
                        if (status >= 200 && status < 300) {
                            // get the data from the `queryDataAttr`, if configured
                            if (options.queryDataAttr) {
                                console.log("ResourceFactoryService: Get data from '" + options.queryDataAttr + "' attribute.");

                                // get the data from the configured `queryDataAttr` only if we have a response object.
                                // else we just want the result to be the response data.
                                if (responseData) {
                                    result = responseData[options.queryDataAttr];
                                }
                                else {
                                    result = responseData;
                                }
                            }
                            // if no data `queryDataAttr` is defined, use the response data directly
                            else {
                                result = responseData;
                            }

                            // get the total from the `queryTotalAttr`, if configured
                            if (options.queryTotalAttr && responseData && responseData[options.queryTotalAttr]) {
                                console.log("ResourceFactoryService: Get total from '" + options.queryTotalAttr + "' attribute.");

                                result.total = responseData[options.queryTotalAttr];
                            }
                        }
                        // on any other status just return the responded object
                        else {
                            result = responseData;
                        }

                        return result;
                    },

                    /**
                     * Serializes the request data as JSON and returns it as string.
                     * @param requestData
                     * @param headersGetter
                     * @return {string}
                     */
                    transformRequestToJson = function (requestData, headersGetter) {
                        console.log("ResourceFactoryService: Serialize data.");

                        var
                            filterPrivate = function (key) {
                                return String(key)[0] === '$';
                            },
                            keys = angular.isObject(requestData) ? Object.keys(requestData) : [],
                            privateKeys = keys.filter(filterPrivate);

                        for (var i = 0; i < privateKeys.length; i++) {
                            delete requestData[privateKeys[i]];
                        }

                        return angular.toJson(requestData);
                    },

                    /**
                     * Calls the `fromInternal` function on the request data object.
                     * @param requestData
                     * @param headersGetter
                     * @return {*}
                     */
                    singleTransformRequestFromInternal = function (requestData, headersGetter) {
                        console.log("ResourceFactoryService: Post-process data for external use.");

                        return options.fromInternal(angular.copy(requestData), headersGetter);
                    },

                    /**
                     * Method configuration for the ng-resource
                     * @type {Object}
                     */
                    methods = {
                        restore: {
                            method: 'GET',
                            isArray: false,
                            withCredentials: true,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            cache: cache.withoutDataAttrNoTtl,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        get: {
                            method: 'GET',
                            isArray: false,
                            withCredentials: true,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            cache: cache.withoutDataAttr,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        getNoCache: {
                            method: 'GET',
                            isArray: false,
                            withCredentials: true,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        query: {
                            method: 'GET',
                            isArray: true,
                            withCredentials: true,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            cache: cache.withDataAttr,
                            transformResponse: [
                                transformResponseFromJson,
                                queryTransformResponseData,
                                queryTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        queryNoCache: {
                            method: 'GET',
                            isArray: true,
                            withCredentials: true,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            transformResponse: [
                                transformResponseFromJson,
                                queryTransformResponseData,
                                queryTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        save: {
                            method: 'POST',
                            isArray: false,
                            withCredentials: true,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: insertingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        update: {
                            method: 'PATCH',
                            isArray: false,
                            withCredentials: true,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: modifyingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        remove: {
                            method: 'DELETE',
                            isArray: false,
                            withCredentials: true,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: deletingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        }
                    };

                // extend the methods with the given extra methods
                angular.extend(methods, options.extraMethods);

                // offer methods for querying without a loading bar (using a 'Bg' suffix)
                for (var methodName in methods) {
                    if (methods.hasOwnProperty(methodName)) {
                        var
                            bgMethodName = methodName + 'Bg',
                            bgMethodConfig = angular.copy(methods[methodName]);

                        bgMethodConfig.ignoreLoadingBar = true;

                        methods[bgMethodName] = bgMethodConfig;
                    }
                }

                // build the default params configuration
                paramsDefaults[options.pkAttr] = '@' + options.pkAttr;
                saveParams[options.pkAttr] = null;

                methods.save.params = saveParams;

                // build the resource object
                resource = $resource(url, paramsDefaults, methods, {
                    stripTrailingSlashes: options.stripTrailingSlashes
                });

                /**
                 * Gets the PK attribute name
                 *
                 * @memberOf ResourceFactory
                 * @return {String|null}
                 */
                resource.getPkAttr = function () {
                    return options.pkAttr;
                };

                /**
                 * Gets the data attribute name
                 *
                 * @memberOf ResourceFactory
                 * @return {String|null}
                 */
                resource.getDataAttr = function () {
                    return options.dataAttr;
                };

                /**
                 * Returns an object holding the filter data for query request
                 *
                 * @memberOf ResourceFactory
                 * @returns {*}
                 */
                resource.getQueryFilters = function () {
                    return options.queryFilter;
                };

                /**
                 * Sets the object holding the filter data for query request
                 *
                 * @memberOf ResourceFactory
                 * @param filters
                 * @returns {*}
                 */
                resource.setQueryFilters = function (filters) {
                    return angular.copy(filters, options.queryFilter);
                };

                /**
                 * Sets the given filter options if the aren't already set on the filter object
                 *
                 * @memberOf ResourceFactory
                 * @param defaultFilters
                 * @returns {*}
                 */
                resource.setDefaultQueryFilters = function (defaultFilters) {
                    var
                        filters = angular.extend({}, defaultFilters, options.queryFilter);

                    return angular.copy(filters, options.queryFilter);
                };

                /**
                 * Queries the resource with the configured filters.
                 *
                 * @memberOf ResourceFactory
                 * @returns {*}
                 */
                resource.filter = function (filters) {
                    filters = angular.extend({}, resource.getQueryFilters(), filters);
                    return resource.query(filters);
                };

                /**
                 * Queries the resource with the configured filters without using the cache.
                 *
                 * @memberOf ResourceFactory
                 * @returns {*}
                 */
                resource.filterNoCache = function (filters) {
                    filters = angular.extend({}, resource.getQueryFilters(), filters);
                    return resource.queryNoCache(filters);
                };

                /**
                 * Creates a new instance for the resource
                 *
                 * @memberOf ResourceFactory
                 * @param params
                 * @return {*}
                 */
                resource.new = function (params) {
                    var
                        phantomInstance = new resource(params);

                    // Generate phantom ID if desired
                    if (options.pkAttr && options.generatePhantomIds && options.phantomIdGenerator) {
                        phantomInstance[options.pkAttr] = options.phantomIdGenerator.generate(phantomInstance);
                    }

                    return phantomInstance;
                };

                /**
                 * Checks if the given instance is a phantom instance (instance not persisted to the REST API yet)
                 *
                 * @memberOf ResourceFactory
                 * @param instance
                 * @return {boolean|undefined}
                 */
                resource.isPhantom = function (instance) {
                    var
                        pkValue = instance ? instance[options.pkAttr] : undefined;

                    // Check if phantom ID if all configured correctly
                    if (options.pkAttr && options.generatePhantomIds && options.phantomIdGenerator) {
                        return options.phantomIdGenerator.isPhantom(pkValue, instance);
                    }

                    return undefined;
                };

                /**
                 * Gets a list of instances from the given instances where the given attribute name matches
                 * the given attribute value.
                 *
                 * @memberOf ResourceFactory
                 * @param instances
                 * @param attrName
                 * @param attrValue
                 */
                resource.filterInstancesByAttr = function (instances, attrName, attrValue) {
                    var
                        filterAttrValue = function (item) {
                            return item ? item[attrName] == attrValue : false; // use == here to match '123' to 123
                        };

                    return instances.filter(filterAttrValue);
                };

                /**
                 * Gets the first instance from the given instances where the given attribute name matches
                 * the given attribute value.
                 *
                 * @memberOf ResourceFactory
                 * @param instances
                 * @param attrName
                 * @param attrValue
                 * @return {*}
                 */
                resource.getInstanceByAttr = function (instances, attrName, attrValue) {
                    var
                        result = null,
                        filteredInstances = resource.filterInstancesByAttr(instances, attrName, attrValue);

                    if (filteredInstances.length) {
                        if (filteredInstances.length > 1) {
                            console.warn("ResourceFactoryService: Found more than 1 instances where '" + attrName + "' is '" + attrValue + "' on given '" + name + "' instances.");
                        }

                        result = filteredInstances[0];
                    }

                    return result;
                };

                /**
                 * Gets the first instance from the given instances where the PK attribute has the given value.
                 *
                 * @memberOf ResourceFactory
                 * @param instances
                 * @param pkValue
                 * @return {Object|undefined}
                 */
                resource.getInstanceByPk = function (instances, pkValue) {
                    return resource.getInstanceByAttr(instances, options.pkAttr, pkValue);
                };

                /**
                 * Gets the name of the resource.
                 *
                 * @memberOf ResourceFactory
                 * @return {String}
                 */
                resource.getResourceName = function () {
                    return name;
                };

                /**
                 * Gets the cache instance.
                 *
                 * @memberOf ResourceFactory
                 * @return {ResourceCacheService}
                 */
                resource.getCache = function () {
                    return cache;
                };

                /**
                 * Creates a new store for the resource
                 *
                 * @memberOf ResourceFactory
                 * @return {ResourceStore}
                 */
                resource.createStore = function (instances) {
                    return new ResourceStore(resource, instances, null);
                };

                /**
                 * Saves the given resource instance to the REST API. Uses the `$save` method if instance
                 * is phantom, else the `$update` method.
                 *
                 * @memberOf ResourceFactory
                 * @param instance
                 * @param [params]
                 * @return {*}
                 */
                resource.persist = function (instance, params) {
                    // make sure `instance` has a value
                    instance = instance || {};

                    var
                        saveFn = resource.isPhantom(instance) ? resource.save : resource.update;

                    if (saveFn) {
                        return saveFn({}, instance, params);
                    }
                    else {
                        console.error("ResourceFactoryService: Object to persist is not a valid resource instance.");

                        var
                            reject = $q.reject(instance);

                        reject.$promise = reject; // fake promise API of resource

                        return reject;
                    }
                };

                /*
                 * Add some of the resource methods as instance methods on the
                 * prototype of the resource.
                 */
                angular.extend(resource.prototype, {
                    /**
                     * Saves or updates the instance
                     * @param params
                     * @return {*}
                     */
                    $persist: function (params) {
                        var
                            result = resource.persist(this, params);

                        return result.$promise || result;
                    },

                    /**
                     * Checks if instance is a phantom record (not saved via the REST API yet)
                     * @return {*}
                     */
                    $isPhantom: function () {
                        return resource.isPhantom(this);
                    }
                });

                /*
                 * Add extra functions as instance methods on the prototype of
                 * the resource.
                 */
                angular.extend(resource.prototype, options.extraFunctions);

                return resource;
            };

            /**
             * Constructor function for a resource store. A resource store manages inserts, updates and
             * deletes of instances, can create sub-stores that commit changes to the parent store, and
             * sets up relations between resource types (e.g. to update reference keys).
             *
             * @name ResourceStore
             * @ngdoc constructor
             * @param resource
             * @param managedInstances
             * @param parentStore
             * @constructor
             */
            function ResourceStore (resource, managedInstances, parentStore) {
                var
                    self = this,

                    /**
                     * Name of the resource service
                     * @type {String}
                     */
                    resourceName = resource.getResourceName(),

                    /**
                     * Indicator for running execution (stops another execution from being issued)
                     * @type {boolean}
                     */
                    executionRunning = false,

                    /**
                     * Contains relations to other stores (for updating references)
                     * @type {Array<ResourceStoreRelation>}
                     */
                    relations = [],

                    /**
                     * Stores resource items that are visible for the user (not queued for remove)
                     * @type {Array}
                     */
                    visibleQueue = [],

                    /**
                     * Stores resource items queued for persisting (save or update)
                     * @type {Array}
                     */
                    persistQueue = [],

                    /**
                     * Stores resource items queued for deleting
                     * @type {Array}
                     */
                    removeQueue = [],

                    /**
                     * Callbacks executed before each item persists
                     * @type {Array}
                     */
                    beforePersistListeners = [],

                    /**
                     * Callbacks executed after each item persists
                     * @type {Array}
                     */
                    afterPersistListeners = [],

                    /**
                     * Callbacks executed before each item removes
                     * @type {Array}
                     */
                    beforeRemoveListeners = [],

                    /**
                     * Callbacks executed after each item removes
                     * @type {Array}
                     */
                    afterRemoveListeners = [];

                /**
                 * Manage given instances. The new instances object may be a ng-resource result,
                 * a promise, a list of instances or a single instance.
                 *
                 * @memberOf ResourceStore
                 * @param newInstances
                 */
                self.manage = function (newInstances) {
                    var
                        doManage = function (newInstances) {
                            console.log("ResourceStore: Manage given '" + resourceName + "' instances.");

                            // Support for single instances by converting it to an array
                            if (!angular.isArray(newInstances)) {
                                newInstances = [newInstances];
                            }

                            for (var i = 0; i < newInstances.length; i++) {
                                var
                                    newInstance = newInstances[i];

                                // If the instance is not managed yet, manage it
                                if (!newInstance.$store) {
                                    // Make the store available on the instance
                                    newInstance.$store = self;

                                    // Add the instance to the list of managed instances
                                    addResourceInstance(managedInstances, newInstance);
                                    addResourceInstance(visibleQueue, newInstance);
                                }
                                // If the instances is already managed by another store, print an error
                                else if (newInstance.$store !== self) {
                                    console.error("ResourceStore: '" + resourceName + "' instance already managed by another store.");
                                }
                                // If the instance is already managed by this store, do nothing but logging
                                else {
                                    console.log("ResourceStore: '" + resourceName + "' instance already managed by the store.");
                                }
                            }
                        };

                    // Support ng-resource objects and promises
                    if (isPromiseLike(newInstances) || isPromiseLike(newInstances.$promise)) {
                        var
                            promise = isPromiseLike(newInstances) ? newInstances : newInstances.$promise,
                            defer = $q.defer();

                        promise
                            .then(doManage)
                            .then(function () {
                                defer.resolve(newInstances);
                            });

                        return defer.promise;
                    }
                    // Synchronous if we have no promise
                    else {
                        doManage(newInstances);
                        return $q.resolve(newInstances);
                    }
                };

                /**
                 * Forget (un-manage) given instances. The instances object may be a ng-resource result,
                 * a promise, a list of instances or a single instance.
                 *
                 * @memberOf ResourceStore
                 * @param oldInstances
                 */
                self.forget = function (oldInstances) {
                    var
                        doForget = function (oldInstances) {
                            console.log("ResourceStore: Forget given '" + resourceName + "' instances.");

                            // Support for single instances by converting it to an array
                            if (!angular.isArray(oldInstances)) {
                                oldInstances = [oldInstances];
                            }

                            for (var i = 0; i < oldInstances.length; i++) {
                                var
                                    oldInstance = oldInstances[i];

                                // If the instance is not managed yet, manage it
                                if (oldInstance.$store === self) {
                                    // Remove the store attribute from the instance
                                    delete oldInstance.$store;

                                    // Remove the instance from the list of managed instances
                                    removeResourceInstance(managedInstances, oldInstance);
                                    removeResourceInstance(visibleQueue, oldInstance);
                                    removeResourceInstance(persistQueue, oldInstance);
                                    removeResourceInstance(removeQueue, oldInstance);
                                }
                                // If the instances is already managed by another store, print an error
                                else if (oldInstance.$store !== self) {
                                    console.error("ResourceStore: '" + resourceName + "' instance managed by another store.");
                                }
                                // If the instance is already managed by this store, do nothing but logging
                                else {
                                    console.log("ResourceStore: '" + resourceName + "' instance is not managed.");
                                }
                            }
                        };

                    // Support ng-resource objects and promises
                    if (isPromiseLike(oldInstances) || isPromiseLike(oldInstances.$promise)) {
                        var
                            promise = isPromiseLike(oldInstances) ? oldInstances : oldInstances.$promise,
                            defer = $q.defer();

                        promise
                            .then(doForget)
                            .then(function () {
                                defer.resolve(oldInstances);
                            });

                        return defer.promise;
                    }
                    // Synchronous if we have no promise
                    else {
                        doForget(oldInstances);
                        return $q.resolve(oldInstances);
                    }
                };

                /**
                 * Returns a new instance managed by the store.
                 *
                 * @memberOf ResourceStore
                 * @param params
                 * @return {*}
                 */
                self.new = function (params) {
                    var
                        newInstance = resource.new(params);

                    self.manage(newInstance);

                    return newInstance;
                };

                /**
                 * Queues given instance for persistence.
                 *
                 * @memberOf ResourceStore
                 * @param instances
                 */
                self.persist = function (instances) {
                    console.log("ResourceStore: Queue '" + resourceName + "' instances for persist.");

                    if (!angular.isArray(instances)) {
                        instances = [instances];
                    }

                    for (var i = 0; i < instances.length; i++) {
                        var
                            instance = instances[i];

                        if (instance.$store === self) {
                            addResourceInstance(persistQueue, instance);
                            addResourceInstance(visibleQueue, instance);
                            removeResourceInstance(removeQueue, instance);
                        }
                        else {
                            console.error("ResourceStore: '" + resourceName + "' instance is not managed by this store.");
                        }
                    }
                };

                /**
                 * Queues given instance for deletion.
                 *
                 * @memberOf ResourceStore
                 * @param instances
                 */
                self.remove = function (instances) {
                    console.log("ResourceStore: Queue '" + resourceName + "' instances for remove.");

                    if (!angular.isArray(instances)) {
                        instances = [instances];
                    }

                    for (var i = 0; i < instances.length; i++) {
                        var
                            instance = instances[i];

                        if (instance.$store === self) {
                            removeResourceInstance(persistQueue, instance);
                            removeResourceInstance(visibleQueue, instance);
                            addResourceInstance(removeQueue, instance);
                        }
                        else {
                            console.error("ResourceStore: '" + resourceName + "' instance is not managed by this store.");
                        }
                    }
                };

                /**
                 * Commits changes to the parent store
                 *
                 * @memberOf ResourceStore
                 */
                self.commit = function () {
                    // Check if there is a parent store first. We cannot commit to a parent store
                    // if there is no parent store.
                    if (!parentStore) {
                        console.error("ResourceStore: Cannot commit '" + resourceName + "' instances as there is no parent store.");
                        return;
                    }

                    console.log("ResourceStore: Commit '" + resourceName + "' instance changes to parent store.");

                    // Commit the persist queue to the parent store
                    for (var i = 0; i < persistQueue.length; i++) {
                        var
                            childPersistInstance = copy(persistQueue[i]),
                            parentPersistInstance = parentStore.getByInstance(childPersistInstance);

                        delete childPersistInstance.$store;

                        if (!parentPersistInstance) {
                            parentPersistInstance = copy(childPersistInstance);
                            parentStore.manage(parentPersistInstance);
                        }
                        else {
                            merge(childPersistInstance, parentPersistInstance);
                        }

                        parentStore.persist(parentPersistInstance);
                    }

                    // Commit the remove queue to the parent store
                    for (var j = 0; j < removeQueue.length; j++) {
                        var
                            childRemoveInstance = copy(removeQueue[i]),
                            parentRemoveInstance = parentStore.getByInstance(childRemoveInstance);

                        delete childRemoveInstance.$store;

                        if (!parentRemoveInstance) {
                            parentRemoveInstance = copy(childRemoveInstance);
                            parentStore.manage(parentRemoveInstance);
                        }
                        else {
                            merge(childRemoveInstance, parentRemoveInstance);
                        }

                        parentStore.remove(parentRemoveInstance);
                    }
                };

                /**
                 * Executes the change queue on this an all related stores and clears the change queue if clearAfter is
                 * set to true (default).
                 *
                 * @memberOf ResourceStore
                 * @param [clearAfter]
                 * @return {Promise}
                 */
                self.executeAll = function (clearAfter) {
                    // `clearAfter` should default to true
                    clearAfter = angular.isUndefined(clearAfter) || !!clearAfter;

                    var
                        defer = $q.defer(),

                        /**
                         * Executes the related stores
                         * @return {Promise}
                         */
                        executeRelated = function () {
                            var
                                promises = [];

                            for (var i = 0; i < relations.length; i++) {
                                var
                                    relation = relations[i],
                                    relatedStore = relation.getRelatedStore();

                                // Add the execution of the related store to the list of
                                // promises to resolve
                                promises.push(relatedStore.executeAll(clearAfter));
                            }

                            return $q.all(promises);
                        };

                    // Execute the store itself, then execute the related stores. If everything
                    // went well, resolve the returned promise, else reject it.
                    self.execute(clearAfter)
                        .then(executeRelated)
                        .then(defer.resolve)
                        .catch(defer.reject);

                    return defer.promise;
                };

                /**
                 * Execute the change queue and clears the change queue if clearAfter is set to true (default).
                 *
                 * @memberOf ResourceStore
                 * @param [clearAfter]
                 * @return {Promise}
                 */
                self.execute = function (clearAfter) {
                    // `clearAfter` should default to true
                    clearAfter = angular.isUndefined(clearAfter) || !!clearAfter;

                    // Cannot execute when already executing
                    if (executionRunning) {
                        return $q.reject("Another execution is already running.");
                    }

                    // If there is a parent store raise an error
                    if (parentStore) {
                        throw "Executing the store is only possible on the topmost store";
                    }

                    // Execution started
                    executionRunning = true;

                    var
                        defer = $q.defer(),

                        /**
                         * Sets the running flag to false
                         * @param reason
                         * @return {*}
                         */
                        handleError = function (reason) {
                            executionRunning = false;
                            defer.reject(reason);
                        },

                        /**
                         * Calls a list of listener functions with given item as parameter
                         * @param item
                         * @param listeners
                         */
                        callListeners = function (item, listeners) {
                            for (var i = 0; i < listeners.length; i++) {
                                listeners[i](item);
                            }
                        },

                        relationsRemove = function (pkValue) {
                            for (var i = 0; i < relations.length; i++) {
                                relations[i].handleRemove(pkValue);
                            }
                        },

                        relationsUpdate = function (oldPkValue, newPkValue) {
                            for (var i = 0; i < relations.length; i++) {
                                relations[i].handleUpdate(oldPkValue, newPkValue);
                            }
                        },

                        /**
                         * Executes a single REST API call on the given item with the given function. Calls the given
                         * before and after listeners and resolves the given defer after all this is done.
                         * @param item
                         * @param execFn
                         * @param defer
                         * @param beforeListeners
                         * @param afterListeners
                         * @param isRemove
                         */
                        executeSingle = function (item, execFn, beforeListeners, afterListeners, defer, isRemove) {
                            // Call the before listeners
                            callListeners(item, beforeListeners);

                            // Execute the REST API call
                            execFn({}, item).$promise
                                .then(function (response) {
                                    // Forget referencing instances on related stores if this was a successful
                                    // remove on the REST API
                                    if (isRemove && item) {
                                        relationsRemove(item[resource.getPkAttr()]);
                                    }

                                    // If the response contains the saved object (with the PK from the REST API) then
                                    // set the new PK on the item.
                                    if (response && response[resource.getPkAttr()]) {
                                        var
                                            oldPkValue = item ? item[resource.getPkAttr()] : null,
                                            newPkValue = response ? response[resource.getPkAttr()] : null;

                                        // Update the FK values on referencing instances on related stores if this
                                        // was a successful insert or update on the REST API
                                        if (!isRemove) {
                                            relationsUpdate(oldPkValue, newPkValue);
                                        }

                                        item[resource.getPkAttr()] = newPkValue;
                                    }

                                    // Then call the after listeners
                                    callListeners(item, afterListeners);

                                    // And resolve the promise with the item
                                    defer.resolve(item);
                                })
                                .catch(defer.reject);
                        },

                        /**
                         * Executes the remove queue. Returns a promise that resolves as soon as all
                         * REST API calls are done.
                         * @return {Promise}
                         */
                        executeRemoves = function () {
                            var
                                promises = [],
                                queue = self.getRemoveQueue();

                            // Iterate over the queue
                            for (var i = 0; i < queue.length; i++) {
                                var
                                    item = queue[i];

                                // Only non-phantom entries should be removed (phantoms don't exist anyway)
                                if (!item.$isPhantom()) {
                                    var
                                        defer = $q.defer();

                                    promises.push(defer.promise);

                                    // Execute the single REST API call
                                    executeSingle(item, resource.remove, beforeRemoveListeners, afterRemoveListeners, defer, true);
                                }
                            }

                            return $q.all(promises);
                        },

                        /**
                         * Executes the update queue. Returns a promise that resolves as soon as all
                         * REST API calls are done.
                         * @return {Promise}
                         */
                        executeUpdates = function () {
                            var
                                promises = [],
                                queue = self.getUpdateQueue();

                            // Iterate over the queue
                            for (var i = 0; i < queue.length; i++) {
                                var
                                    item = queue[i],
                                    defer = $q.defer();

                                promises.push(defer.promise);

                                // Execute the single REST API call
                                executeSingle(item, resource.update, beforePersistListeners, afterPersistListeners, defer, false);
                            }

                            return $q.all(promises);
                        },

                        /**
                         * Executes the save (insert) queue. Returns a promise that resolves as soon as all
                         * REST API calls are done.
                         * @return {Promise}
                         */
                        executeSaves = function () {
                            var
                                promises = [],
                                queue = self.getSaveQueue();

                            // Iterate over the queue
                            for (var i = 0; i < queue.length; i++) {
                                var
                                    item = queue[i],
                                    defer = $q.defer();

                                promises.push(defer.promise);

                                // Execute the single REST API call
                                executeSingle(item, resource.save, beforePersistListeners, afterPersistListeners, defer, false);
                            }

                            return $q.all(promises);
                        },

                        /**
                         * Clears the change queues.
                         */
                        clear = function () {
                            if (clearAfter) {
                                persistQueue.length = 0;
                                removeQueue.length = 0;
                            }

                            // Execution finished
                            executionRunning = false;
                        };

                    // Execute the REST API call queue
                    $q.when()
                        .then(executeRemoves)
                        .then(executeUpdates)
                        .then(executeSaves)
                        .then(clear)
                        .then(defer.resolve)
                        .catch(handleError);

                    return defer.promise;
                };

                /**
                 * Creates a new child store from the current store. This store can make changes
                 * to it's managed instances and it will not affect the current stores
                 * instances until the child store commits.
                 *
                 * @memberOf ResourceStore
                 * @param [instances]
                 * @return {ResourceStore}
                 */
                self.createChildStore = function (instances) {
                    instances = instances || managedInstances;

                    var
                        childStoreManagedInstances = copy(instances);

                    return new ResourceStore(resource, childStoreManagedInstances, self);
                };

                /**
                 * Adds a relation to another store.
                 *
                 * @memberOf ResourceStore
                 * @param config
                 * @return {ResourceStoreRelation}
                 */
                self.createRelation = function (config) {
                    config = angular.extend({
                        relatedStore: null,
                        fkAttr: null,
                        onDelete: 'forget',
                        onUpdate: 'update'
                    }, config);

                    var
                        relation = new ResourceStoreRelation(self, config.relatedStore, config.fkAttr, config.onUpdate, config.onDelete);

                    relations.push(relation);

                    return relation;
                };

                /**
                 * Removes a relation from the store.
                 *
                 * @memberOf ResourceStore
                 * @param relation
                 */
                self.removeRelation = function (relation) {
                    var
                        relationIndex = relations.indexOf(relation),
                        relationFound = relationIndex !== -1;

                    if (relationFound) {
                        relations.splice(relationIndex, 1);
                    }
                };

                /**
                 * Gets the managed instance from the store that matches the given
                 * PK attribute value.
                 *
                 * @memberOf ResourceStore
                 * @param pkValue
                 * @return {Object|undefined}
                 */
                self.getByPk = function (pkValue) {
                    return resource.getInstanceByPk(managedInstances, pkValue);
                };

                /**
                 * Gets the managed instance from the store that matches the given
                 * instance (which might by an copy that is not managed or managed by
                 * another store). The instances are matched by their PK attribute.
                 *
                 * @memberOf ResourceStore
                 * @param instance
                 * @return {Object|undefined}
                 */
                self.getByInstance = function (instance) {
                    var
                        pkValue = instance ? instance[resource.getPkAttr()] : undefined;

                    return self.getByPk(pkValue);
                };

                /**
                 * Gets a list of instances visible for the user.
                 *
                 * @memberOf ResourceStore
                 * @return {Array}
                 */
                self.getManagedInstances = function () {
                    return managedInstances.slice();
                };

                /**
                 * Gets a list of instances visible for the user.
                 *
                 * @memberOf ResourceStore
                 * @return {Array}
                 */
                self.getVisibleQueue = function () {
                    return visibleQueue.slice();
                };

                /**
                 * Gets a list of instances marked for persist.
                 *
                 * @memberOf ResourceStore
                 * @return {Array}
                 */
                self.getPersistQueue = function () {
                    return persistQueue.slice();
                };

                /**
                 * Gets a list of instances marked for remove.
                 *
                 * @memberOf ResourceStore
                 * @return {Array}
                 */
                self.getRemoveQueue = function () {
                    return removeQueue.slice();
                };

                /**
                 * Gets a list of instances marked for save (insert).
                 *
                 * @memberOf ResourceStore
                 * @return {Array}
                 */
                self.getSaveQueue = function () {
                    var
                        filterPhantom = function (instance) {
                            return instance.$isPhantom();
                        };

                    return persistQueue.filter(filterPhantom);
                };

                /**
                 * Gets a list of instances marked for update.
                 *
                 * @memberOf ResourceStore
                 * @return {Array}
                 */
                self.getUpdateQueue = function () {
                    var
                        filterNonPhantom = function (instance) {
                            return !instance.$isPhantom();
                        };

                    return persistQueue.filter(filterNonPhantom);
                };

                /**
                 * Gets the managed resource service.
                 *
                 * @memberOf ResourceStore
                 * @return {*}
                 */
                self.getResource = function () {
                    return resource;
                };

                /**
                 * Adds a before-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.addBeforePersistListener = function (fn) {
                    beforePersistListeners.push(fn);
                };

                /**
                 * Removes a before-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.removeBeforePersistListener = function (fn) {
                    var
                        fnIndex = beforePersistListeners.indexOf(fn),
                        fnFound = fnIndex !== -1;

                    if (fnFound) {
                        beforePersistListeners.splice(fnIndex, 1);
                    }
                };

                /**
                 * Adds a after-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.addAfterPersistListener = function (fn) {
                    afterPersistListeners.push(fn);
                };

                /**
                 * Removes a after-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.removeAfterPersistListener = function (fn) {
                    var
                        fnIndex = afterPersistListeners.indexOf(fn),
                        fnFound = fnIndex !== -1;

                    if (fnFound) {
                        afterPersistListeners.splice(fnIndex, 1);
                    }
                };

                /**
                 * Removes a before-remove listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.removeBeforeRemoveListener = function (fn) {
                    var
                        fnIndex = beforeRemoveListeners.indexOf(fn),
                        fnFound = fnIndex !== -1;

                    if (fnFound) {
                        beforeRemoveListeners.splice(fnIndex, 1);
                    }
                };

                /**
                 * Adds a after-remove listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.addAfterRemoveListener = function (fn) {
                    afterRemoveListeners.push(fn);
                };

                /**
                 * Removes a after-remove listener.
                 *
                 * @memberOf ResourceStore
                 * @param fn
                 */
                self.removeAfterRemoveListener = function (fn) {
                    var
                        fnIndex = afterRemoveListeners.indexOf(fn),
                        fnFound = fnIndex !== -1;

                    if (fnFound) {
                        afterRemoveListeners.splice(fnIndex, 1);
                    }
                };

                /**
                 * Adds the given instance to the given list of instances. Does nothing if the instance
                 * is already in the list of instances.
                 *
                 * @memberOf ResourceStore
                 * @param instances
                 * @param instance
                 */
                function addResourceInstance (instances, instance) {
                    var
                        matchingInstances = resource.filterInstancesByAttr(instances, resource.getPkAttr(), instance[resource.getPkAttr()]);

                    if (!!matchingInstances.length) {
                        for (var i = 0; i < matchingInstances.length; i++) {
                            var
                                matchingInstanceIndex = instances.indexOf(matchingInstances[i]),
                                matchingInstanceFound = matchingInstanceIndex !== -1;

                            if (matchingInstanceFound) {
                                instances.splice(matchingInstanceIndex, 1, instance);
                            }
                        }
                    }
                    else {
                        instances.push(instance);
                    }
                }

                /**
                 * Removes the given instance from the given list of instances. Does nothing if the instance
                 * is not in the list of instances.
                 *
                 * @memberOf ResourceStore
                 * @private
                 * @param instances
                 * @param instance
                 */
                function removeResourceInstance (instances, instance) {
                    var
                        matchingInstances = resource.filterInstancesByAttr(instances, resource.getPkAttr(), instance[resource.getPkAttr()]);

                    if (!!matchingInstances.length) {
                        for (var i = 0; i < matchingInstances.length; i++) {
                            var
                                matchingInstanceIndex = instances.indexOf(matchingInstances[i]),
                                matchingInstanceFound = matchingInstanceIndex !== -1;

                            if (matchingInstanceFound) {
                                instances.splice(matchingInstanceIndex, 1);
                            }
                        }
                    }
                }

                /**
                 * Internal function for checking if an object can be treated as an promise.
                 *
                 * @memberOf ResourceStore
                 * @private
                 * @param obj
                 * @return {*|boolean}
                 */
                function isPromiseLike (obj) {
                    return obj && angular.isFunction(obj.then);
                }

                /**
                 * Populates the destination object `dst` by copying the non-private data from `src` object. The data
                 * on the `dst` object will be a deep copy of the data on the `src`. This function will not copy
                 * attributes of the `src` whose names start with "$". These attributes are considered private. The
                 * method will also keep the private attributes of the `dst`.
                 *
                 * @memberOf ResourceStore
                 * @private
                 * @param dst {Undefined|Object|Array} Destination object
                 * @param src {Object|Array} Source object
                 * @param [keepMissing] boolean Keep attributes on dst that are not present on src
                 * @return {*}
                 */
                function populate (dst, src, keepMissing) {
                    // keepMissing defaults to true
                    keepMissing = angular.isUndefined(keepMissing) ? true : !!keepMissing;
                    dst = dst || undefined;

                    var
                        key,
                        preserve = !!dst,
                        preservedObjects = {};

                    /*
                     * As we do remove all "private" properties from the source, so they are not copied
                     * to the destination object, we make a copy of the source first. We do not want to
                     * modify the actual source object.
                     */
                    src = angular.copy(src);
                    for (key in src) {
                        if (src.hasOwnProperty(key) && key[0] === '$') {
                            delete src[key];
                        }
                    }

                    /*
                     * Only preserve if we got a destination object. Save "private" object keys of destination before
                     * copying the source object over the destination object. We restore these properties afterwards.
                     */
                    if (preserve) {
                        for (key in dst) {
                            if (dst.hasOwnProperty(key)) {
                                // keep private attributes
                                if (key[0] === '$') {
                                    preservedObjects[key] = dst[key];
                                }
                                // keep attribute if not present on source
                                else if (keepMissing && !src.hasOwnProperty(key)) {
                                    preservedObjects[key] = dst[key];
                                }
                            }
                        }
                    }

                    // do the actual copy
                    dst = angular.copy(src, dst);

                    /*
                     * Now we can restore the preserved data on the destination object again.
                     */
                    if (preserve) {
                        for (key in preservedObjects) {
                            if (preservedObjects.hasOwnProperty(key)) {
                                dst[key] = preservedObjects[key];
                            }
                        }
                    }

                    return dst;
                }

                /**
                 * Copies the source object to the destination object (or array). Keeps private
                 * attributes on the `dst` object (attributes starting with $ are private).
                 *
                 * @memberOf ResourceStore
                 * @private
                 * @param src
                 * @param [dst]
                 * @return {*}
                 */
                function copy (src, dst) {
                    // if we are working on an array, copy each instance of the array to
                    // the dst.
                    if (angular.isArray(src)) {
                        dst = angular.isArray(dst) ? dst : [];
                        dst.length = 0;

                        for (var i = 0; i < src.length; i++) {
                            dst.push(populate(null, src[i], false));
                        }
                    }
                    // else we can just copy the src object.
                    else {
                        dst = populate(dst, src, false);
                    }

                    return dst;
                }

                /**
                 * Merges the source object to the destination object (or array). Keeps private
                 * attributes on the `dst` object (attributes starting with $ are private).
                 *
                 * @memberOf ResourceStore
                 * @private
                 * @param src
                 * @param [dst]
                 * @return {*}
                 */
                function merge (src, dst) {
                    // if we are working on an array, copy each instance of the array to
                    // the dst.
                    if (angular.isArray(src)) {
                        dst = angular.isArray(dst) ? dst : [];
                        dst.length = 0;

                        for (var i = 0; i < src.length; i++) {
                            dst.push(populate(null, src[i], true));
                        }
                    }
                    // else we can just copy the src object.
                    else {
                        dst = populate(dst, src, true);
                    }

                    return dst;
                }

                /**
                 * Initializes the store instance
                 *
                 * @memberOf ResourceStore
                 * @private
                 */
                function init () {
                    managedInstances = managedInstances || [];
                    parentStore = parentStore || null;

                    var
                        managed = self.manage(managedInstances),

                        /**
                         * Maps instances to a list of PKs
                         * @param instance
                         * @return {*|undefined}
                         */
                        mapPk = function (instance) {
                            return instance ? String(instance[resource.getPkAttr()]) : undefined;
                        },

                        /**
                         * Filters instances to given list of PKs
                         * @param pks
                         * @return {Function}
                         */
                        filterPks = function (pks) {
                            return function (instance) {
                                return instance ? pks.indexOf(String(instance[resource.getPkAttr()])) !== -1 : false;
                            }
                        };

                    // Initialize queues with the state of the parent store, if there is a parent store.
                    if (parentStore) {
                        managed.then(
                            function () {
                                console.log("ResourceStore: Copy state from parent store.");

                                var
                                    parentVisibleQueuePks = parentStore.getVisibleQueue().map(mapPk),
                                    parentPersistQueuePks = parentStore.getPersistQueue().map(mapPk),
                                    parentRemoveQueuePks = parentStore.getRemoveQueue().map(mapPk);

                                // Initialize the visible, persist and remove queue with the state
                                // from the parent store.
                                visibleQueue = managedInstances.filter(filterPks(parentVisibleQueuePks));
                                persistQueue = managedInstances.filter(filterPks(parentPersistQueuePks));
                                removeQueue = managedInstances.filter(filterPks(parentRemoveQueuePks));
                            }
                        );
                    }
                }

                // Initialize the store
                init();
            }

            /**
             * Constructor class for a relation between two stores.
             *
             * @name ResourceStoreRelation
             * @ngdoc constructor
             * @param store
             * @param relatedStore
             * @param fkAttr
             * @param onUpdate
             * @param onRemove
             * @constructor
             */
            function ResourceStoreRelation (store, relatedStore, fkAttr, onUpdate, onRemove) {
                var
                    self = this;

                /*
                 * Implementation of pre-defined update behaviours
                 */
                switch (onUpdate) {
                    case 'update':
                        onUpdate = function (referencingStore, referencingInstance, oldReferencedInstancePk, newReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResource().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to '" + newReferencedInstancePk + "'.");

                            referencingInstance[fkAttr] = newReferencedInstancePk;
                        };
                        break;
                    case 'null':
                        onUpdate = function (referencingStore, referencingInstance, oldReferencedInstancePk, newReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResource().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to null.");

                            referencingInstance[fkAttr] = null;
                        };
                        break;
                }

                /*
                 * Implementation of pre-defined remove behaviours
                 */
                switch (onRemove) {
                    case 'forget':
                        onRemove = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Forget '" + relatedStore.getResource().getResourceName() + "' instance '" + oldReferencedInstancePk + "' referencing instance.");

                            referencingStore.forget(referencingInstance);
                        };
                        break;
                    case 'null':
                        onRemove = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResource().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to null.");

                            referencingInstance[fkAttr] = null;
                        };
                        break;
                }

                /**
                 * Gets the store the relation is configured on.
                 *
                 * @memberOf ResourceStoreRelation
                 * @return {*}
                 */
                self.getStore = function () {
                    return store;
                };

                /**
                 * Gets the store the configured store is related on.
                 *
                 * @memberOf ResourceStoreRelation
                 * @return {*}
                 */
                self.getRelatedStore = function () {
                    return relatedStore;
                };

                /**
                 * Gets the FK attribute name.
                 *
                 * @memberOf ResourceStoreRelation
                 * @return {string}
                 */
                self.getFkAttr = function () {
                    return fkAttr;
                };

                /**
                 * Updates the referencing instances where the fkAttr has the given old
                 * value to the given new value.
                 *
                 * @memberOf ResourceStoreRelation
                 * @param oldPkValue
                 * @param newPkValue
                 */
                self.handleUpdate = function (oldPkValue, newPkValue) {
                    console.log("ResourceStoreRelation: Handle update of referenced instance on '" + relatedStore.getResource().getResourceName() + "' store.");

                    var
                        referencingInstances = relatedStore.getManagedInstances();

                    for (var i = 0; i < referencingInstances.length; i++) {
                        var
                            referencingInstance = referencingInstances[i];

                        if (referencingInstance && referencingInstance[fkAttr] == oldPkValue && oldPkValue != newPkValue) {
                            onUpdate(relatedStore, referencingInstance, oldPkValue, newPkValue, fkAttr);
                        }
                    }
                };

                /**
                 * Lets the related store forget stale referencing instances, e.g. because the
                 * referenced instance was deleted.
                 *
                 * @memberOf ResourceStoreRelation
                 * @param pkValue
                 */
                self.handleRemove = function (pkValue) {
                    console.log("ResourceStoreRelation: Handle remove of referenced instance on '" + relatedStore.getResource().getResourceName() + "' store.");

                    var
                        referencingInstances = relatedStore.getManagedInstances();

                    for (var i = 0; i < referencingInstances.length; i++) {
                        var
                            referencingInstance = referencingInstances[i];

                        if (referencingInstance && referencingInstance[fkAttr] == pkValue) {
                            onRemove(relatedStore, referencingInstance, pkValue, fkAttr);
                        }
                    }
                }
            }
        }]
    );
})();

/**
 * Angular ResourcePhantomIdFactoryService
 * Copyright 2016 Andreas Stocker
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


(function () {
    'use strict';

    var
        module = angular.module('ngResourceFactory');

    /**
     * Factory service to generate new resource phantom id generators.
     *
     * @name ResourcePhantomIdFactoryService
     * @ngdoc service
     * @example
     *  // Example of a phantom ID generator that uses negative numbers as phantom IDs.
     *  angular.module('example').factory('ExampleIdFactory',
     *      function(ResourcePhantomIdFactoryService) {
     *          var lastPkValue = 0;
     *
     *          return ResourcePhantomIdFactoryService.createPhantomIdFactory({
     *              generate: function () {
     *                  return --lastPkValue;
     *              },
     *              is: function (pkValue) {
     *                  return pkValue < 0;
     *              }
     *          });
     *      }
     *  );
     */
    module.service('ResourcePhantomIdFactoryService',
        function () {
            'ngInject';

            var
                self = this;

            /**
             * Creates a new phantom id generator with the given configuration.
             *
             * @memberOf ResourcePhantomIdFactoryService
             * @param config
             * @return {ResourcePhantomIdFactory}
             */
            self.createPhantomIdFactory = function (config) {
                config = angular.extend({
                    generate: function () { },
                    is: function () { }
                }, config);

                return new ResourcePhantomIdFactory(config.generate, config.is);
            };

            /**
             * Constructor function for a phantom id generate. Takes a function that generates the PK, and a
             * functions that checks if the given PK is a phantom PK.
             *
             * @name ResourcePhantomIdFactory
             * @ngdoc constructor
             * @param generateFn
             * @param isPhantomFn
             * @constructor
             */
            function ResourcePhantomIdFactory (generateFn, isPhantomFn) {
                var
                    self = this;

                /**
                 * Generates a new phantom PK value
                 *
                 * @memberof ResourcePhantomIdFactory
                 * @param instance
                 * @return {*}
                 */
                self.generate = function (instance) {
                    return generateFn(instance);
                };

                /**
                 * Checks if the given PK value on the given instance is a phantom PK value
                 *
                 * @memberof ResourcePhantomIdFactory
                 * @param pkValue
                 * @param instance
                 * @return {*}
                 */
                self.isPhantom = function (pkValue, instance) {
                    return isPhantomFn(pkValue, instance);
                };
            }
        }
    );

    /**
     * Resource phantom id generator that generates negative integer IDs
     *
     * @name ResourcePhantomIdNegativeInt
     * @ngdoc factory
     * @param {ResourcePhantomIdFactoryService} ResourcePhantomIdFactoryService Phantom ID factory service
     */
    module.factory('ResourcePhantomIdNegativeInt',
        ['ResourcePhantomIdFactoryService', function (ResourcePhantomIdFactoryService) {
            'ngInject';

            var
                lastPkValue = 0;

            return ResourcePhantomIdFactoryService.createPhantomIdFactory({
                generate: function () {
                    return --lastPkValue;
                },
                is: function (pkValue) {
                    return pkValue < 0;
                }
            });
        }]
    );

    /**
     * Resource phantom id generator that generates UUID4 IDs
     *
     * @name ResourcePhantomIdUuid4
     * @ngdoc factory
     * @param {ResourcePhantomIdFactoryService} ResourcePhantomIdFactoryService Phantom ID factory service
     */
    module.factory('ResourcePhantomIdUuid4',
        ['ResourcePhantomIdFactoryService', function (ResourcePhantomIdFactoryService) {
            'ngInject';

            var
                generatedIds = [];

            return ResourcePhantomIdFactoryService.createPhantomIdFactory({
                generate: function () {
                    var
                        pkValue = uuid4();

                    generatedIds.push(pkValue);
                    return pkValue;
                },
                is: function (pkValue) {
                    return generatedIds.indexOf(pkValue) !== -1;
                }
            });

            function uuid4 () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var
                        r = Math.random() * 16|0,
                        v = c === 'x' ? r : (r&0x3|0x8);

                    return v.toString(16);
                });
            }
        }]
    );
})();

    return angular.module("ngResourceFactory");
    
}));