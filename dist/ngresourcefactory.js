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
                        if (value && value[2] && value[2]['content-type'] === 'application/json') {
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
     * Factory service to create new resource classes.
     *
     * @name ResourceFactoryService
     * @ngdoc factory
     * @param {service} $q
     * @param {service} $resource
     * @param {ResourceCacheService} ResourceCacheService Default cache service
     * @param {ResourcePhantomIdNegativeInt} ResourcePhantomIdNegativeInt Default phantom ID generator
     */
    module.factory('ResourceFactoryService',
        ['$q', '$resource', 'ResourceCacheService', 'ResourcePhantomIdNegativeInt', function ($q,
                  $resource,
                  ResourceCacheService,
                  ResourcePhantomIdNegativeInt) {
            'ngInject';

            /**
             * Constructor function for the resource.
             *
             * @name ResourceFactory
             * @ngdoc constructor
             * @param {String} name Name of the resource service
             * @param {String} url URL to the resource
             * @param {Object} options Options for the resource
             * @constructor
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
                    cache = new ResourceCacheService(name, options.pkAttr, {
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
                                data = response.data;

                            cache.removeAllLists();
                            cache.removeAllDependent();
                            cache.insert(data[options.urlAttr], data, false);

                            return response;
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
                                url = data[options.urlAttr];

                            cache.removeAllLists();
                            cache.removeAllDependent();
                            cache.insert(url, data, false);

                            return response;
                        }
                    },

                    /**
                     * Interceptor that removes the cache for the deleted object, removes all list caches, and
                     * invalidates the dependent resource services caches.
                     * @type {Object}
                     */
                    deletingInterceptor = {
                        response: function (response) {
                            cache.removeAllLists();
                            cache.removeAllDependent();
                            cache.remove(response.config.url);

                            return response;
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
                            if (options.queryDataAttr && responseData && responseData[options.queryDataAttr]) {
                                console.log("ResourceFactoryService: Get data from '" + options.queryDataAttr + "' attribute.");

                                result = responseData[options.queryDataAttr];
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
                            merge(parentPersistInstance, childPersistInstance);
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
                            merge(parentRemoveInstance, childRemoveInstance);
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
                                    if (response.data && response.data[resource.getPkAttr()]) {
                                        var
                                            oldPkValue = item ? item[resource.getPkAttr()] : null,
                                            newPkValue = response.data ? response.data[resource.getPkAttr()] : null;

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
     * Resource phantom id generator that generates negative integer IDs
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
                'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiY2FjaGUvY2FjaGVTZXJ2aWNlLmpzIiwiZmFjdG9yeS9mYWN0b3J5U2VydmljZS5qcyIsInBoYW50b21JZEZhY3RvcnkvcGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksTUFBTSxRQUFRLE9BQU8scUJBQXFCO1lBQ3RDOzs7O0FBSVo7QUM3QkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksU0FBUyxRQUFRLE9BQU87Ozs7Ozs7O0lBUTVCLE9BQU8sUUFBUTtRQUNYLFlBQVk7WUFDUjs7WUFFQTtnQkFDSSxTQUFTOzs7Ozs7Ozs7WUFTYixTQUFTLGFBQWEsTUFBTSxRQUFRLFNBQVM7Z0JBQ3pDO29CQUNJLE9BQU87Ozs7OztvQkFNUCxRQUFROzs7Ozs7b0JBTVIsbUJBQW1COzs7Ozs7b0JBTW5CLGlCQUFpQjs7Ozs7O29CQU1qQixrQkFBa0I7O2dCQUV0QixVQUFVLFFBQVEsT0FBTzs7Ozs7b0JBS3JCLFFBQVE7Ozs7OztvQkFNUixTQUFTOzs7Ozs7b0JBTVQsVUFBVTs7Ozs7O29CQU1WLFdBQVc7Ozs7OztvQkFNWCxLQUFLLEtBQUs7bUJBQ1gsV0FBVzs7O2dCQUdkOzs7Ozs7Ozs7Z0JBU0EsS0FBSyxVQUFVLFVBQVUsT0FBTzs7b0JBRTVCLElBQUksUUFBUSxRQUFRLFFBQVE7d0JBQ3hCLFFBQVEsSUFBSSwyRkFBMkYsT0FBTzs7d0JBRTlHLFlBQVk7Ozt5QkFHWCxJQUFJLFFBQVEsU0FBUyxRQUFRO3dCQUM5QixRQUFRLElBQUksaUZBQWlGLE9BQU87O3dCQUVwRyxjQUFjOzt5QkFFYjt3QkFDRCxRQUFRLElBQUksNEVBQTRFLE9BQU87Ozs7Ozs7Ozs7Ozs7Z0JBYXZHLEtBQUssU0FBUyxVQUFVLEtBQUssT0FBTyxhQUFhLFNBQVM7b0JBQ3RE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b0JBQ2hFO3dCQUNJLElBQUksS0FBSyxXQUFXLEdBQUc7d0JBQ3ZCLElBQUksTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJOztvQkFFL0IsT0FBTyxFQUFFLFNBQVM7Ozs7OztBQU10QyIsImZpbGUiOiJuZ3Jlc291cmNlZmFjdG9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQW5ndWxhciBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlXG4gKiBDb3B5cmlnaHQgMjAxNiBBbmRyZWFzIFN0b2NrZXJcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkXG4gKiBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbiAqIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZVxuICogU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRVxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4gKiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhclxuICAgICAgICBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnbmdSZXNvdXJjZUZhY3RvcnknLCBbXG4gICAgICAgICAgICAnbmdSZXNvdXJjZSdcbiAgICAgICAgXSk7XG5cbn0pKCk7XG4iLCIvKipcbiAqIEFuZ3VsYXIgUmVzb3VyY2VDYWNoZVNlcnZpY2VcbiAqIENvcHlyaWdodCAyMDE2IEFuZHJlYXMgU3RvY2tlclxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbiAqIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuICogcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlXG4gKiBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcbiAqIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyXG4gICAgICAgIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCduZ1Jlc291cmNlRmFjdG9yeScpO1xuXG4gICAgLyoqXG4gICAgICogRmFjdG9yeSBzZXJ2aWNlIHRvIGNyZWF0ZSBuZXcgY2FjaGUuXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZUNhY2hlU2VydmljZVxuICAgICAqIEBuZ2RvYyBmYWN0b3J5XG4gICAgICovXG4gICAgbW9kdWxlLmZhY3RvcnkoJ1Jlc291cmNlQ2FjaGVTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJ25nSW5qZWN0JztcblxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgY2FjaGVzID0ge307XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBjb25zdHJ1Y3RvciAobmFtZSwgcGtBdHRyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgY2FjaGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1hcHBpbmcgb2YgY2FjaGUga2V5cyB0byBib29sZWFuIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgdG8gdXNlIHRoZSBgZGF0YUF0dHJgIG9yIG5vdFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjYWNoZVVzZURhdGFBdHRyID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1hcHBpbmcgb2YgY2FjaGUga2V5cyB0byBib29sZWFuIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgdGhlIHZhbHVlIGlzIG1hbmFnZWQgb3Igbm90XG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlSXNNYW5hZ2VkID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1hcHBpbmcgb2YgY2FjaGUga2V5cyB0byB0aW1lc3RhbXBzIGZvciBhdXRvbWF0aWMgaW52YWxpZGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlVGltZXN0YW1wcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGFuZ3VsYXIuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBnZXQgdGhlIElEIG9mIHRoZSBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBrQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGdldCB0aGUgVVJMIG9mIHRoZSBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHVybEF0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBnZXQgdGhlIGFjdHVhbCBkYXRhIGZyb21cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZGF0YUF0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIERlcGVuZGVudCBjYWNoZXNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5PFN0cmluZz59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbnQ6IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaW1lIHRvIGxpdmUgZm9yIGNhY2hlIGVudHJpZXMgaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7aW50fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdHRsOiA2MCAqIDYwXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBjYWNoZVxuICAgICAgICAgICAgICAgIGluaXQoKTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlZnJlc2hlcyB0aGUgY2FjaGUgZW50cmllcyB3aXRoIHRoZSBuZXcgdmFsdWUgb3IgdmFsdWVzLiBUaGUgZXhpc3Rpbmcgb2JqZWN0cyBpbiB0aGUgY2FjaGVcbiAgICAgICAgICAgICAgICAgKiBhcmUgbWF0Y2hlZCBieSB0aGUgYHBrQXR0cmAgdmFsdWUsIGFuZCBhZGRpdGlvbmFsbHkgYnkgdGhlIGB1cmxBdHRyYCwgaWYgYXZhaWxhYmxlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdHxBcnJheTxPYmplY3Q+fSB2YWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVmcmVzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZWZyZXNoIHRoZSBleGlzdGluZyB2YWx1ZXMgaW4gdGhlIGNhY2hlIHdpdGggdGhlIG5ldyBlbnRyaWVzXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZWZyZXNoIGV4aXN0aW5nIGVudHJpZXMgd2l0aCBsaXN0IG9mIG5ldyBlbnRyaWVzIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaEVhY2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIGV4aXN0aW5nIHZhbHVlcyBpbiB0aGUgY2FjaGUgd2l0aCB0aGUgbmV3IGVudHJ5XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZWZyZXNoIGV4aXN0aW5nIGVudHJpZXMgd2l0aCBuZXcgZW50cnkgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2luZ2xlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVuYWJsZSB0byByZWZyZXNoIGV4aXN0aW5nIGVudHJpZXMgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicgYXMgZ2l2ZW4gdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDcmVhdGVzIGEgY2FjaGUgZW50cnkgZm9yIHRoZSBnaXZlbiB2YWx1ZSBhbmQgcHV0cyBpdCBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXNlRGF0YUF0dHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW3JlZnJlc2hdXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5pbnNlcnQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgdXNlRGF0YUF0dHIsIHJlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogSW5zZXJ0IHZhbHVlIHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBhbmd1bGFyLmlzT2JqZWN0KHZhbHVlKSB8fCBhbmd1bGFyLmlzQXJyYXkodmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gMjAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVycyA9IGlzTWFuYWdlZCA/IHsnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSA6IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dCA9ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSA9IFtzdGF0dXMsIHZhbHVlLCBoZWFkZXJzLCBzdGF0dXNUZXh0XTtcblxuICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9ICEhdXNlRGF0YUF0dHI7XG4gICAgICAgICAgICAgICAgICAgIHJlZnJlc2ggPSBhbmd1bGFyLmlzVW5kZWZpbmVkKHJlZnJlc2gpID8gdHJ1ZSA6ICEhcmVmcmVzaDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVtrZXldID0gZW50cnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVVzZURhdGFBdHRyW2tleV0gPSB1c2VEYXRhQXR0ciAmJiBpc01hbmFnZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUlzTWFuYWdlZFtrZXldID0gaXNNYW5hZ2VkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlT3JVcGRhdGVUaW1lc3RhbXAoa2V5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZWZyZXNoIGV4aXN0aW5nIGRhdGEgaWYgYHJlZnJlc2hgIHBhcmFtZXRlciB3YXMgbm90IHNldCB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlZnJlc2goZ2V0RGF0YUZvckVudHJ5KGVudHJ5LCB1c2VEYXRhQXR0cikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFB1dHMgdGhlIGdpdmVuIGVudHJ5IHdpdGggdGhlIGdpdmVuIGtleSBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXNlRGF0YUF0dHJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnB1dCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCB1c2VEYXRhQXR0cikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBQdXQgZW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9ICEhdXNlRGF0YUF0dHI7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEluZGljYXRlcyBpZiB2YWx1ZSBpcyBtYW5hZ2VkIGJ5IHRoZSBjYWNoZSwgd2hpY2ggbWVhbnMgaXQgaXMgcmVmcmVzaGVkIGlmIG5ldyBjYWxsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogcmV0dXJuIHRoZSBzYW1lIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdG9yZSB0aGUgYWN0dWFsIGRhdGEgb2JqZWN0LCBub3QgdGhlIHNlcmlhbGl6ZWQgc3RyaW5nLCBmb3IgSlNPTlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlWzJdICYmIHZhbHVlWzJdWydjb250ZW50LXR5cGUnXSA9PT0gJ2FwcGxpY2F0aW9uL2pzb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogVXNlIGRlc2VyaWFsaXplZCBkYXRhIGZvciBrZXkgJ1wiICsga2V5ICsgXCInIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlWzFdID0gdmFsdWVbMV0gPyBhbmd1bGFyLmZyb21Kc29uKHZhbHVlWzFdKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYW5hZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVzZSByYXcgZGF0YSBmb3Iga2V5ICdcIiArIGtleSArIFwiJyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWFuYWdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVVzZURhdGFBdHRyW2tleV0gPSB1c2VEYXRhQXR0cjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlSXNNYW5hZ2VkW2tleV0gPSBpc01hbmFnZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVPclVwZGF0ZVRpbWVzdGFtcChrZXkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlZnJlc2ggdGhlIGNhY2hlIGVudHJpZXMgaWYgdGhlIHZhbHVlIGlzIGFscmVhZHkgYSBjYWNoZSBlbnRyeSAod2hpY2ggaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsd2F5cyBhbiBhcnJheSksIG5vdCBhIHByb21pc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYW5hZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWZyZXNoKGdldERhdGFGb3JFbnRyeSh2YWx1ZSwgdXNlRGF0YUF0dHIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBlbnRyeSB3aXRoIHRoZSBnaXZlbiBrZXkgZnJvbSB0aGUgY2FjaGUsIG9yIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB1c2VDYWNoZVR0bFxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChrZXksIHVzZUNhY2hlVHRsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gYHVzZUNhY2hlVHRsYCBzaG91bGQgZGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHVzZUNhY2hlVHRsID0gYW5ndWxhci5pc1VuZGVmaW5lZCh1c2VDYWNoZVR0bCkgfHwgISF1c2VDYWNoZVR0bCA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1c2VDYWNoZVR0bCB8fCBpc0VudHJ5QWxpdmUoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEdldCBlbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhY2hlW2tleV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXJpYWxpemUgdG8gc3RyaW5nIGZvciBtYW5hZ2VkIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVJc01hbmFnZWRba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlWzFdID0gYW5ndWxhci50b0pzb24odmFsdWVbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEVudHJ5IHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBleGNlZWRlZCBUVEwgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVuYWJsZSB0byBnZXQgZW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIHRoZSBlbnRyeSB3aXRoIHRoZSBnaXZlbiBrZXkgZnJvbSB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlbW92ZSBlbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGVudHJpZXMgZnJvbSB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZW1vdmUgYWxsIGVudHJpZXMgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3QgZW50cmllcyBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGxMaXN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVtb3ZlIGFsbCBsaXN0IGVudHJpZXMgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhbmd1bGFyLmlzQXJyYXkoZ2V0RGF0YUZvcktleShrZXkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3QgZW50cmllcyBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGxPYmplY3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZW1vdmUgYWxsIG9iamVjdCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkgJiYgYW5ndWxhci5pc09iamVjdChnZXREYXRhRm9yS2V5KGtleSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVVzZURhdGFBdHRyW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlSXNNYW5hZ2VkW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhbGwgZW50cmllcyBvZiB0aGUgZGVwZW5kZW50IGNhY2hlcywgaW5jbHVkaW5nIHRoZSBkZXBlbmRlbnQgY2FjaGVzIG9mIHRoZVxuICAgICAgICAgICAgICAgICAqIGRlcGVuZGVudCBjYWNoZXMgKGFuZCBzbyBvbiAuLi4pLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFsbERlcGVuZGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbnRDYWNoZU5hbWVzID0gY29sbGVjdERlcGVuZGVudENhY2hlTmFtZXMoc2VsZiwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVwZW5kZW50Q2FjaGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVzW2RlcGVuZGVudENhY2hlTmFtZXNbaV1dLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIERlc3Ryb3lzIHRoZSBjYWNoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUluZGV4ID0gY2FjaGVzLmluZGV4T2Yoc2VsZiksXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBjYWNoZUluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYW5hZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBEZXN0cm95IHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlcy5zcGxpY2UoY2FjaGVJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmV0cmlldmUgaW5mb3JtYXRpb24gcmVnYXJkaW5nIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge3tpZDogKiwgc2l6ZTogbnVtYmVyfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmluZm8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEdldCBjYWNoZSBpbmZvcm1hdGlvbiBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemUgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgY2FjaGUgc2l6ZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZSc6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnb3B0aW9ucyc6IG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDYWNoZSBpbnRlcmZhY2UgdG8gcHV0IGVudHJpZXMgdXNpbmcgYGRhdGFBdHRyYCBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRoRGF0YUF0dHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnB1dChrZXksIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXQoa2V5LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiBzZWxmLnJlbW92ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsOiBzZWxmLnJlbW92ZUFsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbzogc2VsZi5pbmZvXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENhY2hlIGludGVyZmFjZSB0byBwdXQgZW50cmllcyB3aXRob3V0IHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e3B1dDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwucHV0LCBnZXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLmdldCwgcmVtb3ZlOiAoKiksIHJlbW92ZUFsbDogKCopLCBpbmZvOiAoKil9fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYud2l0aG91dERhdGFBdHRyID0ge1xuICAgICAgICAgICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wdXQoa2V5LCB2YWx1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldChrZXksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZW1vdmU6IHNlbGYucmVtb3ZlLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGw6IHNlbGYucmVtb3ZlQWxsLFxuICAgICAgICAgICAgICAgICAgICBpbmZvOiBzZWxmLmluZm9cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2FjaGUgaW50ZXJmYWNlIHRvIHB1dCBlbnRyaWVzIHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlIGFuZCBpZ25vcmluZyBUVEwuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRoRGF0YUF0dHJOb1R0bCA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHV0KGtleSwgdmFsdWUsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldChrZXksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiBzZWxmLnJlbW92ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsOiBzZWxmLnJlbW92ZUFsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbzogc2VsZi5pbmZvXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENhY2hlIGludGVyZmFjZSB0byBwdXQgZW50cmllcyB3aXRob3V0IHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlIGFuZCBpZ25vcmluZyBUVEwuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRob3V0RGF0YUF0dHJOb1R0bCA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHV0KGtleSwgdmFsdWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXQoa2V5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZTogc2VsZi5yZW1vdmUsXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbDogc2VsZi5yZW1vdmVBbGwsXG4gICAgICAgICAgICAgICAgICAgIGluZm86IHNlbGYuaW5mb1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBjYWNoZSBkYXRhIGZvciB0aGUgZ2l2ZW4ga2V5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXREYXRhRm9yS2V5IChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5ID0gY2FjaGVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9IGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldERhdGFGb3JFbnRyeShlbnRyeSwgdXNlRGF0YUF0dHIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgZGF0YSBmb3IgdGhlIGdpdmVuIGNhY2hlIGVudHJ5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB1c2VEYXRhQXR0clxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldERhdGFGb3JFbnRyeSAodmFsdWUsIHVzZURhdGFBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHZhbHVlWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VEYXRhQXR0ciAmJiBvcHRpb25zLmRhdGFBdHRyICYmIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhW29wdGlvbnMuZGF0YUF0dHJdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIGNhY2hlIGRhdGEgZm9yIHRoZSBnaXZlbiBrZXkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBuZXdEYXRhXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gc2V0RGF0YUZvcktleSAoa2V5LCBuZXdEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSA9IGNhY2hlW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlVc2VEYXRhQXR0ciA9IGNhY2hlVXNlRGF0YUF0dHJba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGEgPSBlbnRyeVsxXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJ5VXNlRGF0YUF0dHIgJiYgb3B0aW9ucy5kYXRhQXR0ciAmJiBlbnRyeURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGFbb3B0aW9ucy5kYXRhQXR0cl0gPSBuZXdEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlEYXRhID0gbmV3RGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlbMV0gPSBlbnRyeURhdGE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHVuaXggZXBvY2ggaW4gc2Vjb25kcy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7aW50fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lc3RhbXAgKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2V0cyB0aGUgdGltZXN0YW1wIGZvciB0aGUgZ2l2ZW4ga2V5IHRvIHRoZSBjdXJyZW50IHVuaXggZXBvY2ggaW4gc2Vjb25kcy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2ludH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVPclVwZGF0ZVRpbWVzdGFtcCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlVGltZXN0YW1wc1trZXldID0gZ2V0Q3VycmVudFRpbWVzdGFtcCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVUaW1lc3RhbXBzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIHRoZSBjYWNoZSBlbnRyeSBmb3IgdGhlIGdpdmVuIGtleSBpcyBzdGlsbCBhbGl2ZS4gQWxzbyByZXR1cm5zXG4gICAgICAgICAgICAgICAgICogYGZhbHNlYCBpZiB0aGVyZSBpcyBubyBjYWNoZSBlbnRyeSBmb3IgdGhlIGdpdmVuIGtleS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaXNFbnRyeUFsaXZlIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5QWdlID0gZ2V0Q3VycmVudFRpbWVzdGFtcCgpIC0gY2FjaGVUaW1lc3RhbXBzW2tleV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeUFnZSA8PSBvcHRpb25zLnR0bDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUYWtlcyBhIG5ldyBjYWNoZSBlbnRyeSBhbmQgcmVmcmVzaGVzIHRoZSBleGlzdGluZyBpbnN0YW5jZXMgb2YgdGhlIGVudHJ5LCBtYXRjaGluZyBieSB0aGVcbiAgICAgICAgICAgICAgICAgKiBgcGtBdHRyYCB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gbmV3RGF0YVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlZnJlc2hTaW5nbGUgKG5ld0RhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmxBdHRyID0gb3B0aW9ucy51cmxBdHRyO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGluc2VydHMgdGhlIGRhdGEgb24gdGhlIGNhY2hlIGFzIGluZGl2aWR1YWwgZW50cnksIGlmIHdlIGhhdmUgdGhlIFVSTCBpbmZvcm1hdGlvbiBvbiB0aGUgZGF0YVxuICAgICAgICAgICAgICAgICAgICBpZiAodXJsQXR0ciAmJiBuZXdEYXRhICYmIG5ld0RhdGFbdXJsQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaW5zZXJ0KG5ld0RhdGFbdXJsQXR0cl0sIG5ld0RhdGEsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGNhY2hlSXNNYW5hZ2VkW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkgPSBjYWNoZVtrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeVVzZURhdGFBdHRyID0gY2FjaGVVc2VEYXRhQXR0cltrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGEgPSBnZXREYXRhRm9yRW50cnkoZW50cnksIGVudHJ5VXNlRGF0YUF0dHIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0xpc3QgPSBhbmd1bGFyLmlzQXJyYXkoZW50cnlEYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIG9iamVjdHMgbWF0Y2hpbmcgdGhlIG5ldyBvYmplY3Qgd2l0aGluIHRoZSBsaXN0IGVudHJpZXMgaW4gdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudHJ5RGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJ5RGF0YVtpXVtwa0F0dHJdID09PSBuZXdEYXRhW3BrQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGRpdGlvbmFsbHkgY29tcGFyZSB0aGUgYHVybEF0dHJgLCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXVybEF0dHIgfHwgKHVybEF0dHIgJiYgZW50cnlEYXRhW2ldW3VybEF0dHJdID09PSBuZXdEYXRhW3VybEF0dHJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGFbaV0gPSBuZXdEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgY2FjaGUgZW50cnkgd2l0aCB0aGUgbmV3IGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RGF0YUZvcktleShrZXksIGVudHJ5RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIG9iamVjdHMgbWF0Y2hpbmcgdGhlIG5ldyBvYmplY3QgaW4gdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeURhdGFbcGtBdHRyXSA9PT0gbmV3RGF0YVtwa0F0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGRpdGlvbmFsbHkgY29tcGFyZSB0aGUgYHVybEF0dHJgLCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdXJsQXR0ciB8fCAodXJsQXR0ciAmJiBlbnRyeURhdGFbdXJsQXR0cl0gPT09IG5ld0RhdGFbdXJsQXR0cl0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RGF0YUZvcktleShrZXksIG5ld0RhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIG9iamVjdCBlbnRyaWVzIHdlIGNhbiB1cGRhdGUgdGhlIGVudHJpZXMgdGltZXN0YW1wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlT3JVcGRhdGVUaW1lc3RhbXAoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlZnJlc2hlcyBlYWNoIGVudHJ5IGluIHRoZSBnaXZlbiBsaXN0IHVzaW5nIHRoZSBgcmVmcmVzaFNpbmdsZWAgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gbmV3RW50cmllc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlZnJlc2hFYWNoIChuZXdFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmV3RW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFNpbmdsZShuZXdFbnRyaWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEluaXRpYWxpemVzIHRoZSBjYWNoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgZ2l2ZW4gbmFtZSBpcyBub3QgdXNlZCB5ZXRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOYW1lICdcIiArIG5hbWUgKyBcIicgaXMgYWxyZWFkeSB1c2VkIGJ5IGFub3RoZXIgY2FjaGUuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVzW25hbWVdID0gc2VsZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsbHMgdGhlIHJlbW92ZUFsbCBtZXRob2Qgb24gYWxsIG1hbmFnZWQgY2FjaGVzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVzW2tleV0ucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldHMgdGhlIGNhY2hlIHdpdGggdGhlIGdpdmVuIG5hbWUsIG9yIG51bGwuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfG51bGx9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlc1trZXldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IENhY2hlICdcIiArIGtleSArIFwiJyBkb2VzIG5vdCBleGlzdC5cIik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgaW5mb3JtYXRpb24gZm9yIGFsbCBtYW5hZ2VkIGNhY2hlcyBhcyBtYXBwaW5nIG9mIGNhY2hlSWQgdG8gdGhlIHJlc3VsdFxuICAgICAgICAgICAgICogb2YgdGhlIGluZm8gbWV0aG9kIG9uIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgICAgICogQHJldHVybnMge3t9fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5pbmZvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBpbmZvcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8gPSBjYWNoZXNba2V5XS5pbmZvKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm9zW2luZm8uaWRdID0gaW5mbztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBpbmZvcztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29sbGVjdHMgYWxsIGRlcGVuZGVudCBjYWNoZXMgb2YgdGhlIGdpdmVuIGNhY2hlLCBpbmNsdWRpbmcgdGhlIGRlcGVuZGVudCBjYWNoZXMgb2YgdGhlIGRlcGVuZGVudFxuICAgICAgICAgICAgICogY2FjaGVzIChhbmQgc28gb24gLi4uKS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVNlcnZpY2VcbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FjaGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPnx1bmRlZmluZWR9IGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXNcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtBcnJheTxTdHJpbmc+fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBjb2xsZWN0RGVwZW5kZW50Q2FjaGVOYW1lcyAoY2FjaGUsIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWVzID0gY2FjaGUuaW5mbygpWydvcHRpb25zJ11bJ2RlcGVuZGVudCddO1xuXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCBgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lc2AgdG8gZW1wdHkgbGlzdFxuICAgICAgICAgICAgICAgIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMgPSBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzIHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWNoZURlcGVuZGVudENhY2hlTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZURlcGVuZGVudENhY2hlTmFtZSA9IGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlRGVwZW5kZW50Q2FjaGUgPSBjYWNoZXNbY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZURlcGVuZGVudENhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwdXNoIGNhY2hlIG5hbWUgdG8gdGhlIGNvbGxlY3RlZCBkZXBlbmRlbnQgY2FjaGVzLCBpZiBleGlzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcy5wdXNoKGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSBjb2xsZWN0IGNhY2hlIGRlcGVuZGVuY2llcyBpZiBub3QgYWxyZWFkeSBjb2xsZWN0ZWQsIHRvIHByZXZlbnQgY2lyY2xlc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMuaW5kZXhPZihjYWNoZURlcGVuZGVudENhY2hlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdERlcGVuZGVudENhY2hlTmFtZXMoY2FjaGVEZXBlbmRlbnRDYWNoZSwgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgICAgIH1cbiAgICApO1xufSkoKTtcbiIsIi8qKlxuICogQW5ndWxhciBSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlXG4gKiBDb3B5cmlnaHQgMjAxNiBBbmRyZWFzIFN0b2NrZXJcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkXG4gKiBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbiAqIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZVxuICogU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRVxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4gKiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhclxuICAgICAgICBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnbmdSZXNvdXJjZUZhY3RvcnknKTtcblxuICAgIC8qKlxuICAgICAqIEZhY3Rvcnkgc2VydmljZSB0byBjcmVhdGUgbmV3IHJlc291cmNlIGNsYXNzZXMuXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlXG4gICAgICogQG5nZG9jIGZhY3RvcnlcbiAgICAgKiBAcGFyYW0ge3NlcnZpY2V9ICRxXG4gICAgICogQHBhcmFtIHtzZXJ2aWNlfSAkcmVzb3VyY2VcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlQ2FjaGVTZXJ2aWNlfSBSZXNvdXJjZUNhY2hlU2VydmljZSBEZWZhdWx0IGNhY2hlIHNlcnZpY2VcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnR9IFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnQgRGVmYXVsdCBwaGFudG9tIElEIGdlbmVyYXRvclxuICAgICAqL1xuICAgIG1vZHVsZS5mYWN0b3J5KCdSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCRxLFxuICAgICAgICAgICAgICAgICAgJHJlc291cmNlLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2VDYWNoZVNlcnZpY2UsXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50KSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIHJlc291cmNlIHNlcnZpY2VcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVVJMIHRvIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIHJlc291cmNlXG4gICAgICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lLCB1cmwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBPcHRpb25zIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBPcHRpb24gdG8gc3RyaXAgdHJhaWxpbmcgc2xhc2hlcyBmcm9tIHJlcXVlc3QgVVJMc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHN0cmlwVHJhaWxpbmdTbGFzaGVzOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogT3B0aW9uIHRvIGlnbm9yZSB0aGUgcmVzb3VyY2UgZm9yIGF1dG9tYXRpYyBsb2FkaW5nIGJhcnNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogR2VuZXJhdGUgSURzIGZvciBwaGFudG9tIHJlY29yZHMgY3JlYXRlZCB2aWEgdGhlIGBuZXdgXG4gICAgICAgICAgICAgICAgICAgICAqIG1ldGhvZCBvbiB0aGUgcmVzb3VyY2Ugc2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlUGhhbnRvbUlkczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogUGhhbnRvbSBJRCBnZW5lcmF0b3IgaW5zdGFuY2UgdG8gdXNlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtSZXNvdXJjZVBoYW50b21JZEZhY3Rvcnl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwaGFudG9tSWRHZW5lcmF0b3I6IFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnQsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIExpc3Qgb2YgcmVzb3VyY2Ugc2VydmljZXMgdG8gY2xlYW4gdGhlIGNhY2hlIGZvciwgb24gbW9kaWZ5aW5nIHJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheTxTdHJpbmc+fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW50OiBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRXh0cmEgbWV0aG9kcyB0byBwdXQgb24gdGhlIHJlc291cmNlIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGV4dHJhTWV0aG9kczoge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEV4dHJhIGZ1bmN0aW9ucyB0byBwdXQgb24gdGhlIHJlc291cmNlIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZXh0cmFGdW5jdGlvbnM6IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBBdHRyaWJ1dGUgbmFtZSB3aGVyZSB0byBmaW5kIHRoZSBJRCBvZiBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwa0F0dHI6ICdwaycsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRvIGZpbmQgdGhlIFVSTCBvZiBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB1cmxBdHRyOiAndXJsJyxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQXR0cmlidXRlIG5hbWUgd2hlcmUgdG8gZmluZCB0aGUgZGF0YSBvbiB0aGUgcXVlcnkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeURhdGFBdHRyOiBudWxsLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBBdHRyaWJ1dGUgbmFtZSB3aGVyZSB0byBmaW5kIHRoZSB0b3RhbCBhbW91bnQgb2YgZGF0YSBvbiB0aGUgcXVlcnkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVRvdGFsQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU3RvcmFnZSBmb3IgdGhlIHF1ZXJ5IGZpbHRlcnNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUgeyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeUZpbHRlcjoge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEZ1bmN0aW9uIHRvIHBvc3QtcHJvY2VzcyBkYXRhIGNvbWluZyBmcm9tIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBvYmpcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdG9JbnRlcm5hbDogZnVuY3Rpb24gKG9iaiwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBGdW5jdGlvbiB0byBwb3N0LXByb2Nlc3MgZGF0YSB0aGF0IGlzIGdvaW5nIHRvIGJlIHNlbnRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZnJvbUludGVybmFsOiBmdW5jdGlvbiAob2JqLCBoZWFkZXJzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2UsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIERlZmF1bHQgcGFyYW1ldGVyIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zRGVmYXVsdHMgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogUGFyYW1ldGVyIGNvbmZpZ3VyYXRpb24gZm9yIHNhdmUgKGluc2VydCkuIFVzZWQgdG9cbiAgICAgICAgICAgICAgICAgICAgICogZGlzYWJsZSB0aGUgUEsgdXJsIHRlbXBsYXRlIGZvciBzYXZlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHNhdmVQYXJhbXMgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGNhY2hlIGluc3RhbmNlIGZvciB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtSZXNvdXJjZUNhY2hlU2VydmljZX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlID0gbmV3IFJlc291cmNlQ2FjaGVTZXJ2aWNlKG5hbWUsIG9wdGlvbnMucGtBdHRyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhQXR0cjogb3B0aW9ucy5xdWVyeURhdGFBdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGtBdHRyOiBvcHRpb25zLnBrQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybEF0dHI6IG9wdGlvbnMudXJsQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVudDogb3B0aW9ucy5kZXBlbmRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0dGw6IDE1ICogNjBcbiAgICAgICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEludGVyY2VwdG9yIHRoYXQgcHV0cyB0aGUgcmV0dXJuZWQgb2JqZWN0IG9uIHRoZSBjYWNoZSBhbiBpbnZhbGlkYXRlcyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICogZGVwZW5kZW50IHJlc291cmNlIHNlcnZpY2VzIGNhY2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGluc2VydGluZ0ludGVyY2VwdG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gcmVzcG9uc2UuZGF0YTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbExpc3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsRGVwZW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuaW5zZXJ0KGRhdGFbb3B0aW9ucy51cmxBdHRyXSwgZGF0YSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBJbnRlcmNlcHRvciB0aGF0IHB1dHMgdGhlIHJldHVybmVkIG9iamVjdCBvbiB0aGUgY2FjaGUgYW4gaW52YWxpZGF0ZXMgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGRlcGVuZGVudCByZXNvdXJjZSBzZXJ2aWNlcyBjYWNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnlpbmdJbnRlcmNlcHRvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IGRhdGFbb3B0aW9ucy51cmxBdHRyXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbExpc3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsRGVwZW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuaW5zZXJ0KHVybCwgZGF0YSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBJbnRlcmNlcHRvciB0aGF0IHJlbW92ZXMgdGhlIGNhY2hlIGZvciB0aGUgZGVsZXRlZCBvYmplY3QsIHJlbW92ZXMgYWxsIGxpc3QgY2FjaGVzLCBhbmRcbiAgICAgICAgICAgICAgICAgICAgICogaW52YWxpZGF0ZXMgdGhlIGRlcGVuZGVudCByZXNvdXJjZSBzZXJ2aWNlcyBjYWNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBkZWxldGluZ0ludGVyY2VwdG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbExpc3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsRGVwZW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKHJlc3BvbnNlLmNvbmZpZy51cmwpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBQYXJzZXMgdGhlIHJlc3BvbnNlIHRleHQgYXMgSlNPTiBhbmQgcmV0dXJucyBpdCBhcyBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXNwb25zZVRleHRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R8QXJyYXl8c3RyaW5nfG51bWJlcn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24gPSBmdW5jdGlvbiAocmVzcG9uc2VUZXh0LCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogRGVzZXJpYWxpemUgZGF0YS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZVRleHQgPyBhbmd1bGFyLmZyb21Kc29uKHJlc3BvbnNlVGV4dCkgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyB0aGUgYHRvSW50ZXJuYWxgIGZ1bmN0aW9uIG9uIGVhY2ggb2JqZWN0IG9mIHRoZSByZXNwb25zZSBhcnJheS5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlc3BvbnNlRGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbCA9IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBQb3N0LXByb2Nlc3MgcXVlcnkgZGF0YSBmb3IgaW50ZXJuYWwgdXNlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIHRoZSByZXNwb25zZSBkYXRhLCBpZiBpdCB3YXMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkocmVzcG9uc2VEYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2VEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlRGF0YVtpXSA9IG9wdGlvbnMudG9JbnRlcm5hbChyZXNwb25zZURhdGFbaV0sIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSBqdXN0IGNhbGwgdGhlIGB0b0ludGVybmFsYCBmdW5jdGlvbiBvbiB0aGUgcmVzcG9uc2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZURhdGEgPSBvcHRpb25zLnRvSW50ZXJuYWwocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyB0aGUgYHRvSW50ZXJuYWxgIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZSBkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlc3BvbnNlRGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWwgPSBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogUG9zdC1wcm9jZXNzIGRhdGEgZm9yIGludGVybmFsIHVzZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnRvSW50ZXJuYWwocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUcmFuc2Zvcm1zIHF1ZXJ5IHJlc3BvbnNlcyB0byBnZXQgdGhlIGFjdHVhbCBkYXRhIGZyb20gdGhlIGBxdWVyeURhdGFBdHRyYCBvcHRpb24sIGlmXG4gICAgICAgICAgICAgICAgICAgICAqIGNvbmZpZ3VyZWQuIEFsc28gc2V0cyB0aGUgYHRvdGFsYCBhdHRyaWJ1dGUgb24gdGhlIGxpc3QgaWYgYHF1ZXJ5VG90YWxBdHRyYCBpcyBjb25maWd1cmVkLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVzcG9uc2VEYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybnMge0FycmF5fE9iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VEYXRhID0gZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgZGF0YSBvbiBzdWNjZXNzIHN0YXR1cyBmcm9tIGBxdWVyeURhdGFBdHRyYCwgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBkYXRhIGZyb20gdGhlIGBxdWVyeURhdGFBdHRyYCwgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnF1ZXJ5RGF0YUF0dHIgJiYgcmVzcG9uc2VEYXRhICYmIHJlc3BvbnNlRGF0YVtvcHRpb25zLnF1ZXJ5RGF0YUF0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogR2V0IGRhdGEgZnJvbSAnXCIgKyBvcHRpb25zLnF1ZXJ5RGF0YUF0dHIgKyBcIicgYXR0cmlidXRlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXNwb25zZURhdGFbb3B0aW9ucy5xdWVyeURhdGFBdHRyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIHRvdGFsIGZyb20gdGhlIGBxdWVyeVRvdGFsQXR0cmAsIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5xdWVyeVRvdGFsQXR0ciAmJiByZXNwb25zZURhdGEgJiYgcmVzcG9uc2VEYXRhW29wdGlvbnMucXVlcnlUb3RhbEF0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogR2V0IHRvdGFsIGZyb20gJ1wiICsgb3B0aW9ucy5xdWVyeVRvdGFsQXR0ciArIFwiJyBhdHRyaWJ1dGUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbCA9IHJlc3BvbnNlRGF0YVtvcHRpb25zLnF1ZXJ5VG90YWxBdHRyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvbiBhbnkgb3RoZXIgc3RhdHVzIGp1c3QgcmV0dXJuIHRoZSByZXNwb25kZWQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXNwb25zZURhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFNlcmlhbGl6ZXMgdGhlIHJlcXVlc3QgZGF0YSBhcyBKU09OIGFuZCByZXR1cm5zIGl0IGFzIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlcXVlc3REYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb24gPSBmdW5jdGlvbiAocmVxdWVzdERhdGEsIGhlYWRlcnNHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogU2VyaWFsaXplIGRhdGEuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJQcml2YXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKGtleSlbMF0gPT09ICckJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXMgPSBhbmd1bGFyLmlzT2JqZWN0KHJlcXVlc3REYXRhKSA/IE9iamVjdC5rZXlzKHJlcXVlc3REYXRhKSA6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaXZhdGVLZXlzID0ga2V5cy5maWx0ZXIoZmlsdGVyUHJpdmF0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJpdmF0ZUtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVxdWVzdERhdGFbcHJpdmF0ZUtleXNbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci50b0pzb24ocmVxdWVzdERhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyB0aGUgYGZyb21JbnRlcm5hbGAgZnVuY3Rpb24gb24gdGhlIHJlcXVlc3QgZGF0YSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXF1ZXN0RGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCA9IGZ1bmN0aW9uIChyZXF1ZXN0RGF0YSwgaGVhZGVyc0dldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBQb3N0LXByb2Nlc3MgZGF0YSBmb3IgZXh0ZXJuYWwgdXNlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZnJvbUludGVybmFsKGFuZ3VsYXIuY29weShyZXF1ZXN0RGF0YSksIGhlYWRlcnNHZXR0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBNZXRob2QgY29uZmlndXJhdGlvbiBmb3IgdGhlIG5nLXJlc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBtZXRob2RzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogY2FjaGUud2l0aG91dERhdGFBdHRyTm9UdGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBjYWNoZS53aXRob3V0RGF0YUF0dHIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0Tm9DYWNoZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBjYWNoZS53aXRoRGF0YUF0dHIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlOb0NhY2hlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyY2VwdG9yOiBpbnNlcnRpbmdJbnRlcmNlcHRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3I6IG1vZGlmeWluZ0ludGVyY2VwdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3I6IGRlbGV0aW5nSW50ZXJjZXB0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBleHRlbmQgdGhlIG1ldGhvZHMgd2l0aCB0aGUgZ2l2ZW4gZXh0cmEgbWV0aG9kc1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKG1ldGhvZHMsIG9wdGlvbnMuZXh0cmFNZXRob2RzKTtcblxuICAgICAgICAgICAgICAgIC8vIG9mZmVyIG1ldGhvZHMgZm9yIHF1ZXJ5aW5nIHdpdGhvdXQgYSBsb2FkaW5nIGJhciAodXNpbmcgYSAnQmcnIHN1ZmZpeClcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBtZXRob2ROYW1lIGluIG1ldGhvZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGhvZHMuaGFzT3duUHJvcGVydHkobWV0aG9kTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJnTWV0aG9kTmFtZSA9IG1ldGhvZE5hbWUgKyAnQmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJnTWV0aG9kQ29uZmlnID0gYW5ndWxhci5jb3B5KG1ldGhvZHNbbWV0aG9kTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBiZ01ldGhvZENvbmZpZy5pZ25vcmVMb2FkaW5nQmFyID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kc1tiZ01ldGhvZE5hbWVdID0gYmdNZXRob2RDb25maWc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBidWlsZCB0aGUgZGVmYXVsdCBwYXJhbXMgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIHBhcmFtc0RlZmF1bHRzW29wdGlvbnMucGtBdHRyXSA9ICdAJyArIG9wdGlvbnMucGtBdHRyO1xuICAgICAgICAgICAgICAgIHNhdmVQYXJhbXNbb3B0aW9ucy5wa0F0dHJdID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIG1ldGhvZHMuc2F2ZS5wYXJhbXMgPSBzYXZlUGFyYW1zO1xuXG4gICAgICAgICAgICAgICAgLy8gYnVpbGQgdGhlIHJlc291cmNlIG9iamVjdFxuICAgICAgICAgICAgICAgIHJlc291cmNlID0gJHJlc291cmNlKHVybCwgcGFyYW1zRGVmYXVsdHMsIG1ldGhvZHMsIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaXBUcmFpbGluZ1NsYXNoZXM6IG9wdGlvbnMuc3RyaXBUcmFpbGluZ1NsYXNoZXNcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIFBLIGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0UGtBdHRyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5wa0F0dHI7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGRhdGEgYXR0cmlidXRlIG5hbWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXREYXRhQXR0ciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGF0YUF0dHI7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJldHVybnMgYW4gb2JqZWN0IGhvbGRpbmcgdGhlIGZpbHRlciBkYXRhIGZvciBxdWVyeSByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0UXVlcnlGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5xdWVyeUZpbHRlcjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2V0cyB0aGUgb2JqZWN0IGhvbGRpbmcgdGhlIGZpbHRlciBkYXRhIGZvciBxdWVyeSByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZpbHRlcnNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5zZXRRdWVyeUZpbHRlcnMgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KGZpbHRlcnMsIG9wdGlvbnMucXVlcnlGaWx0ZXIpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTZXRzIHRoZSBnaXZlbiBmaWx0ZXIgb3B0aW9ucyBpZiB0aGUgYXJlbid0IGFscmVhZHkgc2V0IG9uIHRoZSBmaWx0ZXIgb2JqZWN0XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRlZmF1bHRGaWx0ZXJzXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2Uuc2V0RGVmYXVsdFF1ZXJ5RmlsdGVycyA9IGZ1bmN0aW9uIChkZWZhdWx0RmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcnMgPSBhbmd1bGFyLmV4dGVuZCh7fSwgZGVmYXVsdEZpbHRlcnMsIG9wdGlvbnMucXVlcnlGaWx0ZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoZmlsdGVycywgb3B0aW9ucy5xdWVyeUZpbHRlcik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFF1ZXJpZXMgdGhlIHJlc291cmNlIHdpdGggdGhlIGNvbmZpZ3VyZWQgZmlsdGVycy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5maWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzID0gYW5ndWxhci5leHRlbmQoe30sIHJlc291cmNlLmdldFF1ZXJ5RmlsdGVycygpLCBmaWx0ZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlLnF1ZXJ5KGZpbHRlcnMpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBRdWVyaWVzIHRoZSByZXNvdXJjZSB3aXRoIHRoZSBjb25maWd1cmVkIGZpbHRlcnMgd2l0aG91dCB1c2luZyB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZmlsdGVyTm9DYWNoZSA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnMgPSBhbmd1bGFyLmV4dGVuZCh7fSwgcmVzb3VyY2UuZ2V0UXVlcnlGaWx0ZXJzKCksIGZpbHRlcnMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UucXVlcnlOb0NhY2hlKGZpbHRlcnMpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGFyYW1zXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5uZXcgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcGhhbnRvbUluc3RhbmNlID0gbmV3IHJlc291cmNlKHBhcmFtcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcGhhbnRvbSBJRCBpZiBkZXNpcmVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnBrQXR0ciAmJiBvcHRpb25zLmdlbmVyYXRlUGhhbnRvbUlkcyAmJiBvcHRpb25zLnBoYW50b21JZEdlbmVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGhhbnRvbUluc3RhbmNlW29wdGlvbnMucGtBdHRyXSA9IG9wdGlvbnMucGhhbnRvbUlkR2VuZXJhdG9yLmdlbmVyYXRlKHBoYW50b21JbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGhhbnRvbUluc3RhbmNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDaGVja3MgaWYgdGhlIGdpdmVuIGluc3RhbmNlIGlzIGEgcGhhbnRvbSBpbnN0YW5jZSAoaW5zdGFuY2Ugbm90IHBlcnNpc3RlZCB0byB0aGUgUkVTVCBBUEkgeWV0KVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW58dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmlzUGhhbnRvbSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBrVmFsdWUgPSBpbnN0YW5jZSA/IGluc3RhbmNlW29wdGlvbnMucGtBdHRyXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBwaGFudG9tIElEIGlmIGFsbCBjb25maWd1cmVkIGNvcnJlY3RseVxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5wa0F0dHIgJiYgb3B0aW9ucy5nZW5lcmF0ZVBoYW50b21JZHMgJiYgb3B0aW9ucy5waGFudG9tSWRHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnBoYW50b21JZEdlbmVyYXRvci5pc1BoYW50b20ocGtWYWx1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIGZyb20gdGhlIGdpdmVuIGluc3RhbmNlcyB3aGVyZSB0aGUgZ2l2ZW4gYXR0cmlidXRlIG5hbWUgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAqIHRoZSBnaXZlbiBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBhdHRyTmFtZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBhdHRyVmFsdWVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5maWx0ZXJJbnN0YW5jZXNCeUF0dHIgPSBmdW5jdGlvbiAoaW5zdGFuY2VzLCBhdHRyTmFtZSwgYXR0clZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyQXR0clZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbSA/IGl0ZW1bYXR0ck5hbWVdID09IGF0dHJWYWx1ZSA6IGZhbHNlOyAvLyB1c2UgPT0gaGVyZSB0byBtYXRjaCAnMTIzJyB0byAxMjNcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlcy5maWx0ZXIoZmlsdGVyQXR0clZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgZmlyc3QgaW5zdGFuY2UgZnJvbSB0aGUgZ2l2ZW4gaW5zdGFuY2VzIHdoZXJlIHRoZSBnaXZlbiBhdHRyaWJ1dGUgbmFtZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICogdGhlIGdpdmVuIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGF0dHJOYW1lXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGF0dHJWYWx1ZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0SW5zdGFuY2VCeUF0dHIgPSBmdW5jdGlvbiAoaW5zdGFuY2VzLCBhdHRyTmFtZSwgYXR0clZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkSW5zdGFuY2VzID0gcmVzb3VyY2UuZmlsdGVySW5zdGFuY2VzQnlBdHRyKGluc3RhbmNlcywgYXR0ck5hbWUsIGF0dHJWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcmVkSW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcmVkSW5zdGFuY2VzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBGb3VuZCBtb3JlIHRoYW4gMSBpbnN0YW5jZXMgd2hlcmUgJ1wiICsgYXR0ck5hbWUgKyBcIicgaXMgJ1wiICsgYXR0clZhbHVlICsgXCInIG9uIGdpdmVuICdcIiArIG5hbWUgKyBcIicgaW5zdGFuY2VzLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZmlsdGVyZWRJbnN0YW5jZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBmaXJzdCBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBpbnN0YW5jZXMgd2hlcmUgdGhlIFBLIGF0dHJpYnV0ZSBoYXMgdGhlIGdpdmVuIHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdHx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0SW5zdGFuY2VCeVBrID0gZnVuY3Rpb24gKGluc3RhbmNlcywgcGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UuZ2V0SW5zdGFuY2VCeUF0dHIoaW5zdGFuY2VzLCBvcHRpb25zLnBrQXR0ciwgcGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRSZXNvdXJjZU5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IHN0b3JlIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtSZXNvdXJjZVN0b3JlfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmNyZWF0ZVN0b3JlID0gZnVuY3Rpb24gKGluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc291cmNlU3RvcmUocmVzb3VyY2UsIGluc3RhbmNlcywgbnVsbCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNhdmVzIHRoZSBnaXZlbiByZXNvdXJjZSBpbnN0YW5jZSB0byB0aGUgUkVTVCBBUEkuIFVzZXMgdGhlIGAkc2F2ZWAgbWV0aG9kIGlmIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogaXMgcGhhbnRvbSwgZWxzZSB0aGUgYCR1cGRhdGVgIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW3BhcmFtc11cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLnBlcnNpc3QgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgYGluc3RhbmNlYCBoYXMgYSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGluc3RhbmNlIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZUZuID0gcmVzb3VyY2UuaXNQaGFudG9tKGluc3RhbmNlKSA/IHJlc291cmNlLnNhdmUgOiByZXNvdXJjZS51cGRhdGU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNhdmVGbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNhdmVGbih7fSwgaW5zdGFuY2UsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogT2JqZWN0IHRvIHBlcnNpc3QgaXMgbm90IGEgdmFsaWQgcmVzb3VyY2UgaW5zdGFuY2UuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QgPSAkcS5yZWplY3QoaW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QuJHByb21pc2UgPSByZWplY3Q7IC8vIGZha2UgcHJvbWlzZSBBUEkgb2YgcmVzb3VyY2VcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEFkZCBzb21lIG9mIHRoZSByZXNvdXJjZSBtZXRob2RzIGFzIGluc3RhbmNlIG1ldGhvZHMgb24gdGhlXG4gICAgICAgICAgICAgICAgICogcHJvdG90eXBlIG9mIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmV4dGVuZChyZXNvdXJjZS5wcm90b3R5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFNhdmVzIG9yIHVwZGF0ZXMgdGhlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICRwZXJzaXN0OiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXNvdXJjZS5wZXJzaXN0KHRoaXMsIHBhcmFtcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuJHByb21pc2UgfHwgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDaGVja3MgaWYgaW5zdGFuY2UgaXMgYSBwaGFudG9tIHJlY29yZCAobm90IHNhdmVkIHZpYSB0aGUgUkVTVCBBUEkgeWV0KVxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgJGlzUGhhbnRvbTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlLmlzUGhhbnRvbSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBBZGQgZXh0cmEgZnVuY3Rpb25zIGFzIGluc3RhbmNlIG1ldGhvZHMgb24gdGhlIHByb3RvdHlwZSBvZlxuICAgICAgICAgICAgICAgICAqIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmV4dGVuZChyZXNvdXJjZS5wcm90b3R5cGUsIG9wdGlvbnMuZXh0cmFGdW5jdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgYSByZXNvdXJjZSBzdG9yZS4gQSByZXNvdXJjZSBzdG9yZSBtYW5hZ2VzIGluc2VydHMsIHVwZGF0ZXMgYW5kXG4gICAgICAgICAgICAgKiBkZWxldGVzIG9mIGluc3RhbmNlcywgY2FuIGNyZWF0ZSBzdWItc3RvcmVzIHRoYXQgY29tbWl0IGNoYW5nZXMgdG8gdGhlIHBhcmVudCBzdG9yZSwgYW5kXG4gICAgICAgICAgICAgKiBzZXRzIHVwIHJlbGF0aW9ucyBiZXR3ZWVuIHJlc291cmNlIHR5cGVzIChlLmcuIHRvIHVwZGF0ZSByZWZlcmVuY2Uga2V5cykuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICogQG5nZG9jIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKiBAcGFyYW0gcmVzb3VyY2VcbiAgICAgICAgICAgICAqIEBwYXJhbSBtYW5hZ2VkSW5zdGFuY2VzXG4gICAgICAgICAgICAgKiBAcGFyYW0gcGFyZW50U3RvcmVcbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBSZXNvdXJjZVN0b3JlIChyZXNvdXJjZSwgbWFuYWdlZEluc3RhbmNlcywgcGFyZW50U3RvcmUpIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgc2VsZiA9IHRoaXMsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE5hbWUgb2YgdGhlIHJlc291cmNlIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlTmFtZSA9IHJlc291cmNlLmdldFJlc291cmNlTmFtZSgpLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBJbmRpY2F0b3IgZm9yIHJ1bm5pbmcgZXhlY3V0aW9uIChzdG9wcyBhbm90aGVyIGV4ZWN1dGlvbiBmcm9tIGJlaW5nIGlzc3VlZClcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBleGVjdXRpb25SdW5uaW5nID0gZmFsc2UsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENvbnRhaW5zIHJlbGF0aW9ucyB0byBvdGhlciBzdG9yZXMgKGZvciB1cGRhdGluZyByZWZlcmVuY2VzKVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXk8UmVzb3VyY2VTdG9yZVJlbGF0aW9uPn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aW9ucyA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTdG9yZXMgcmVzb3VyY2UgaXRlbXMgdGhhdCBhcmUgdmlzaWJsZSBmb3IgdGhlIHVzZXIgKG5vdCBxdWV1ZWQgZm9yIHJlbW92ZSlcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZVF1ZXVlID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFN0b3JlcyByZXNvdXJjZSBpdGVtcyBxdWV1ZWQgZm9yIHBlcnNpc3RpbmcgKHNhdmUgb3IgdXBkYXRlKVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwZXJzaXN0UXVldWUgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU3RvcmVzIHJlc291cmNlIGl0ZW1zIHF1ZXVlZCBmb3IgZGVsZXRpbmdcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUXVldWUgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbGJhY2tzIGV4ZWN1dGVkIGJlZm9yZSBlYWNoIGl0ZW0gcGVyc2lzdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgYmVmb3JlUGVyc2lzdExpc3RlbmVycyA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxsYmFja3MgZXhlY3V0ZWQgYWZ0ZXIgZWFjaCBpdGVtIHBlcnNpc3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGFmdGVyUGVyc2lzdExpc3RlbmVycyA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxsYmFja3MgZXhlY3V0ZWQgYmVmb3JlIGVhY2ggaXRlbSByZW1vdmVzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGJlZm9yZVJlbW92ZUxpc3RlbmVycyA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxsYmFja3MgZXhlY3V0ZWQgYWZ0ZXIgZWFjaCBpdGVtIHJlbW92ZXNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIE1hbmFnZSBnaXZlbiBpbnN0YW5jZXMuIFRoZSBuZXcgaW5zdGFuY2VzIG9iamVjdCBtYXkgYmUgYSBuZy1yZXNvdXJjZSByZXN1bHQsXG4gICAgICAgICAgICAgICAgICogYSBwcm9taXNlLCBhIGxpc3Qgb2YgaW5zdGFuY2VzIG9yIGEgc2luZ2xlIGluc3RhbmNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbmV3SW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5tYW5hZ2UgPSBmdW5jdGlvbiAobmV3SW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9NYW5hZ2UgPSBmdW5jdGlvbiAobmV3SW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBNYW5hZ2UgZ2l2ZW4gJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IGZvciBzaW5nbGUgaW5zdGFuY2VzIGJ5IGNvbnZlcnRpbmcgaXQgdG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShuZXdJbnN0YW5jZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbmNlcyA9IFtuZXdJbnN0YW5jZXNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmV3SW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFuY2UgPSBuZXdJbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkIHlldCwgbWFuYWdlIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmV3SW5zdGFuY2UuJHN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWtlIHRoZSBzdG9yZSBhdmFpbGFibGUgb24gdGhlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZS4kc3RvcmUgPSBzZWxmO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGluc3RhbmNlIHRvIHRoZSBsaXN0IG9mIG1hbmFnZWQgaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKG1hbmFnZWRJbnN0YW5jZXMsIG5ld0luc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UodmlzaWJsZVF1ZXVlLCBuZXdJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlcyBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgYW5vdGhlciBzdG9yZSwgcHJpbnQgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobmV3SW5zdGFuY2UuJHN0b3JlICE9PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGFscmVhZHkgbWFuYWdlZCBieSBhbm90aGVyIHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2UgaXMgYWxyZWFkeSBtYW5hZ2VkIGJ5IHRoaXMgc3RvcmUsIGRvIG5vdGhpbmcgYnV0IGxvZ2dpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBhbHJlYWR5IG1hbmFnZWQgYnkgdGhlIHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBuZy1yZXNvdXJjZSBvYmplY3RzIGFuZCBwcm9taXNlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNQcm9taXNlTGlrZShuZXdJbnN0YW5jZXMpIHx8IGlzUHJvbWlzZUxpa2UobmV3SW5zdGFuY2VzLiRwcm9taXNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IGlzUHJvbWlzZUxpa2UobmV3SW5zdGFuY2VzKSA/IG5ld0luc3RhbmNlcyA6IG5ld0luc3RhbmNlcy4kcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihkb01hbmFnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUobmV3SW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gU3luY2hyb25vdXMgaWYgd2UgaGF2ZSBubyBwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9NYW5hZ2UobmV3SW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKG5ld0luc3RhbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRm9yZ2V0ICh1bi1tYW5hZ2UpIGdpdmVuIGluc3RhbmNlcy4gVGhlIGluc3RhbmNlcyBvYmplY3QgbWF5IGJlIGEgbmctcmVzb3VyY2UgcmVzdWx0LFxuICAgICAgICAgICAgICAgICAqIGEgcHJvbWlzZSwgYSBsaXN0IG9mIGluc3RhbmNlcyBvciBhIHNpbmdsZSBpbnN0YW5jZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG9sZEluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZm9yZ2V0ID0gZnVuY3Rpb24gKG9sZEluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvRm9yZ2V0ID0gZnVuY3Rpb24gKG9sZEluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogRm9yZ2V0IGdpdmVuICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZXMuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBmb3Igc2luZ2xlIGluc3RhbmNlcyBieSBjb252ZXJ0aW5nIGl0IHRvIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzQXJyYXkob2xkSW5zdGFuY2VzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRJbnN0YW5jZXMgPSBbb2xkSW5zdGFuY2VzXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9sZEluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEluc3RhbmNlID0gb2xkSW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZSBpcyBub3QgbWFuYWdlZCB5ZXQsIG1hbmFnZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkSW5zdGFuY2UuJHN0b3JlID09PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHN0b3JlIGF0dHJpYnV0ZSBmcm9tIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9sZEluc3RhbmNlLiRzdG9yZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBpbnN0YW5jZSBmcm9tIHRoZSBsaXN0IG9mIG1hbmFnZWQgaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKG1hbmFnZWRJbnN0YW5jZXMsIG9sZEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UodmlzaWJsZVF1ZXVlLCBvbGRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHBlcnNpc3RRdWV1ZSwgb2xkSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZShyZW1vdmVRdWV1ZSwgb2xkSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZXMgaXMgYWxyZWFkeSBtYW5hZ2VkIGJ5IGFub3RoZXIgc3RvcmUsIHByaW50IGFuIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9sZEluc3RhbmNlLiRzdG9yZSAhPT0gc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBtYW5hZ2VkIGJ5IGFub3RoZXIgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZSBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgdGhpcyBzdG9yZSwgZG8gbm90aGluZyBidXQgbG9nZ2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBuZy1yZXNvdXJjZSBvYmplY3RzIGFuZCBwcm9taXNlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNQcm9taXNlTGlrZShvbGRJbnN0YW5jZXMpIHx8IGlzUHJvbWlzZUxpa2Uob2xkSW5zdGFuY2VzLiRwcm9taXNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IGlzUHJvbWlzZUxpa2Uob2xkSW5zdGFuY2VzKSA/IG9sZEluc3RhbmNlcyA6IG9sZEluc3RhbmNlcy4kcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihkb0ZvcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUob2xkSW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gU3luY2hyb25vdXMgaWYgd2UgaGF2ZSBubyBwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9Gb3JnZXQob2xkSW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKG9sZEluc3RhbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBtYW5hZ2VkIGJ5IHRoZSBzdG9yZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5uZXcgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFuY2UgPSByZXNvdXJjZS5uZXcocGFyYW1zKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLm1hbmFnZShuZXdJbnN0YW5jZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld0luc3RhbmNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBRdWV1ZXMgZ2l2ZW4gaW5zdGFuY2UgZm9yIHBlcnNpc3RlbmNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5wZXJzaXN0ID0gZnVuY3Rpb24gKGluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IFF1ZXVlICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZXMgZm9yIHBlcnNpc3QuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KGluc3RhbmNlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcyA9IFtpbnN0YW5jZXNdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlID0gaW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5zdGFuY2UuJHN0b3JlID09PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkUmVzb3VyY2VJbnN0YW5jZShwZXJzaXN0UXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKHZpc2libGVRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UocmVtb3ZlUXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQgYnkgdGhpcyBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUXVldWVzIGdpdmVuIGluc3RhbmNlIGZvciBkZWxldGlvbi5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlID0gZnVuY3Rpb24gKGluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IFF1ZXVlICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZXMgZm9yIHJlbW92ZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzQXJyYXkoaW5zdGFuY2VzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzID0gW2luc3RhbmNlc107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZS4kc3RvcmUgPT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHBlcnNpc3RRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UodmlzaWJsZVF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkUmVzb3VyY2VJbnN0YW5jZShyZW1vdmVRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBpcyBub3QgbWFuYWdlZCBieSB0aGlzIHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDb21taXRzIGNoYW5nZXMgdG8gdGhlIHBhcmVudCBzdG9yZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmNvbW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYSBwYXJlbnQgc3RvcmUgZmlyc3QuIFdlIGNhbm5vdCBjb21taXQgdG8gYSBwYXJlbnQgc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gcGFyZW50IHN0b3JlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogQ2Fubm90IGNvbW1pdCAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2VzIGFzIHRoZXJlIGlzIG5vIHBhcmVudCBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IENvbW1pdCAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgY2hhbmdlcyB0byBwYXJlbnQgc3RvcmUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbW1pdCB0aGUgcGVyc2lzdCBxdWV1ZSB0byB0aGUgcGFyZW50IHN0b3JlXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGVyc2lzdFF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFBlcnNpc3RJbnN0YW5jZSA9IGNvcHkocGVyc2lzdFF1ZXVlW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRQZXJzaXN0SW5zdGFuY2UgPSBwYXJlbnRTdG9yZS5nZXRCeUluc3RhbmNlKGNoaWxkUGVyc2lzdEluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNoaWxkUGVyc2lzdEluc3RhbmNlLiRzdG9yZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRQZXJzaXN0SW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRQZXJzaXN0SW5zdGFuY2UgPSBjb3B5KGNoaWxkUGVyc2lzdEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRTdG9yZS5tYW5hZ2UocGFyZW50UGVyc2lzdEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHBhcmVudFBlcnNpc3RJbnN0YW5jZSwgY2hpbGRQZXJzaXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRTdG9yZS5wZXJzaXN0KHBhcmVudFBlcnNpc3RJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBDb21taXQgdGhlIHJlbW92ZSBxdWV1ZSB0byB0aGUgcGFyZW50IHN0b3JlXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVtb3ZlUXVldWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkUmVtb3ZlSW5zdGFuY2UgPSBjb3B5KHJlbW92ZVF1ZXVlW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRSZW1vdmVJbnN0YW5jZSA9IHBhcmVudFN0b3JlLmdldEJ5SW5zdGFuY2UoY2hpbGRSZW1vdmVJbnN0YW5jZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjaGlsZFJlbW92ZUluc3RhbmNlLiRzdG9yZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRSZW1vdmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFJlbW92ZUluc3RhbmNlID0gY29weShjaGlsZFJlbW92ZUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRTdG9yZS5tYW5hZ2UocGFyZW50UmVtb3ZlSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2UocGFyZW50UmVtb3ZlSW5zdGFuY2UsIGNoaWxkUmVtb3ZlSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRTdG9yZS5yZW1vdmUocGFyZW50UmVtb3ZlSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSBjaGFuZ2UgcXVldWUgb24gdGhpcyBhbiBhbGwgcmVsYXRlZCBzdG9yZXMgYW5kIGNsZWFycyB0aGUgY2hhbmdlIHF1ZXVlIGlmIGNsZWFyQWZ0ZXIgaXNcbiAgICAgICAgICAgICAgICAgKiBzZXQgdG8gdHJ1ZSAoZGVmYXVsdCkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbY2xlYXJBZnRlcl1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZXhlY3V0ZUFsbCA9IGZ1bmN0aW9uIChjbGVhckFmdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGBjbGVhckFmdGVyYCBzaG91bGQgZGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyQWZ0ZXIgPSBhbmd1bGFyLmlzVW5kZWZpbmVkKGNsZWFyQWZ0ZXIpIHx8ICEhY2xlYXJBZnRlcjtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgcmVsYXRlZCBzdG9yZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVSZWxhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbiA9IHJlbGF0aW9uc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0ZWRTdG9yZSA9IHJlbGF0aW9uLmdldFJlbGF0ZWRTdG9yZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgZXhlY3V0aW9uIG9mIHRoZSByZWxhdGVkIHN0b3JlIHRvIHRoZSBsaXN0IG9mXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByb21pc2VzIHRvIHJlc29sdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChyZWxhdGVkU3RvcmUuZXhlY3V0ZUFsbChjbGVhckFmdGVyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIHN0b3JlIGl0c2VsZiwgdGhlbiBleGVjdXRlIHRoZSByZWxhdGVkIHN0b3Jlcy4gSWYgZXZlcnl0aGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZW50IHdlbGwsIHJlc29sdmUgdGhlIHJldHVybmVkIHByb21pc2UsIGVsc2UgcmVqZWN0IGl0LlxuICAgICAgICAgICAgICAgICAgICBzZWxmLmV4ZWN1dGUoY2xlYXJBZnRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGV4ZWN1dGVSZWxhdGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZGVmZXIucmVzb2x2ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChkZWZlci5yZWplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBFeGVjdXRlIHRoZSBjaGFuZ2UgcXVldWUgYW5kIGNsZWFycyB0aGUgY2hhbmdlIHF1ZXVlIGlmIGNsZWFyQWZ0ZXIgaXMgc2V0IHRvIHRydWUgKGRlZmF1bHQpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2NsZWFyQWZ0ZXJdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmV4ZWN1dGUgPSBmdW5jdGlvbiAoY2xlYXJBZnRlcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBgY2xlYXJBZnRlcmAgc2hvdWxkIGRlZmF1bHQgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjbGVhckFmdGVyID0gYW5ndWxhci5pc1VuZGVmaW5lZChjbGVhckFmdGVyKSB8fCAhIWNsZWFyQWZ0ZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2Fubm90IGV4ZWN1dGUgd2hlbiBhbHJlYWR5IGV4ZWN1dGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhlY3V0aW9uUnVubmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChcIkFub3RoZXIgZXhlY3V0aW9uIGlzIGFscmVhZHkgcnVubmluZy5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIHBhcmVudCBzdG9yZSByYWlzZSBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50U3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IFwiRXhlY3V0aW5nIHRoZSBzdG9yZSBpcyBvbmx5IHBvc3NpYmxlIG9uIHRoZSB0b3Btb3N0IHN0b3JlXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRpb24gc3RhcnRlZFxuICAgICAgICAgICAgICAgICAgICBleGVjdXRpb25SdW5uaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBTZXRzIHRoZSBydW5uaW5nIGZsYWcgdG8gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZWFzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvblJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QocmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQ2FsbHMgYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB3aXRoIGdpdmVuIGl0ZW0gYXMgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gKGl0ZW0sIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXShpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNSZW1vdmUgPSBmdW5jdGlvbiAocGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1tpXS5oYW5kbGVSZW1vdmUocGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zVXBkYXRlID0gZnVuY3Rpb24gKG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNbaV0uaGFuZGxlVXBkYXRlKG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgYSBzaW5nbGUgUkVTVCBBUEkgY2FsbCBvbiB0aGUgZ2l2ZW4gaXRlbSB3aXRoIHRoZSBnaXZlbiBmdW5jdGlvbi4gQ2FsbHMgdGhlIGdpdmVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBiZWZvcmUgYW5kIGFmdGVyIGxpc3RlbmVycyBhbmQgcmVzb2x2ZXMgdGhlIGdpdmVuIGRlZmVyIGFmdGVyIGFsbCB0aGlzIGlzIGRvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGV4ZWNGblxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGRlZmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYmVmb3JlTGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYWZ0ZXJMaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpc1JlbW92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2luZ2xlID0gZnVuY3Rpb24gKGl0ZW0sIGV4ZWNGbiwgYmVmb3JlTGlzdGVuZXJzLCBhZnRlckxpc3RlbmVycywgZGVmZXIsIGlzUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgYmVmb3JlIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxMaXN0ZW5lcnMoaXRlbSwgYmVmb3JlTGlzdGVuZXJzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIFJFU1QgQVBJIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjRm4oe30sIGl0ZW0pLiRwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yZ2V0IHJlZmVyZW5jaW5nIGluc3RhbmNlcyBvbiByZWxhdGVkIHN0b3JlcyBpZiB0aGlzIHdhcyBhIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBvbiB0aGUgUkVTVCBBUElcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1JlbW92ZSAmJiBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zUmVtb3ZlKGl0ZW1bcmVzb3VyY2UuZ2V0UGtBdHRyKCldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJlc3BvbnNlIGNvbnRhaW5zIHRoZSBzYXZlZCBvYmplY3QgKHdpdGggdGhlIFBLIGZyb20gdGhlIFJFU1QgQVBJKSB0aGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIG5ldyBQSyBvbiB0aGUgaXRlbS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGFbcmVzb3VyY2UuZ2V0UGtBdHRyKCldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFBrVmFsdWUgPSBpdGVtID8gaXRlbVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQa1ZhbHVlID0gcmVzcG9uc2UuZGF0YSA/IHJlc3BvbnNlLmRhdGFbcmVzb3VyY2UuZ2V0UGtBdHRyKCldIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgRksgdmFsdWVzIG9uIHJlZmVyZW5jaW5nIGluc3RhbmNlcyBvbiByZWxhdGVkIHN0b3JlcyBpZiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FzIGEgc3VjY2Vzc2Z1bCBpbnNlcnQgb3IgdXBkYXRlIG9uIHRoZSBSRVNUIEFQSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNSZW1vdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zVXBkYXRlKG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1bcmVzb3VyY2UuZ2V0UGtBdHRyKCldID0gbmV3UGtWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlbiBjYWxsIHRoZSBhZnRlciBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxMaXN0ZW5lcnMoaXRlbSwgYWZ0ZXJMaXN0ZW5lcnMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbmQgcmVzb2x2ZSB0aGUgcHJvbWlzZSB3aXRoIHRoZSBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZGVmZXIucmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgdGhlIHJlbW92ZSBxdWV1ZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBhcyBzb29uIGFzIGFsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICogUkVTVCBBUEkgY2FsbHMgYXJlIGRvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlUmVtb3ZlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUgPSBzZWxmLmdldFJlbW92ZVF1ZXVlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIG92ZXIgdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBxdWV1ZVtpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IG5vbi1waGFudG9tIGVudHJpZXMgc2hvdWxkIGJlIHJlbW92ZWQgKHBoYW50b21zIGRvbid0IGV4aXN0IGFueXdheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLiRpc1BoYW50b20oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGRlZmVyLnByb21pc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBzaW5nbGUgUkVTVCBBUEkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVNpbmdsZShpdGVtLCByZXNvdXJjZS5yZW1vdmUsIGJlZm9yZVJlbW92ZUxpc3RlbmVycywgYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMsIGRlZmVyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgdXBkYXRlIHF1ZXVlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIGFzIHNvb24gYXMgYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBSRVNUIEFQSSBjYWxscyBhcmUgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVVcGRhdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZSA9IHNlbGYuZ2V0VXBkYXRlUXVldWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHF1ZXVlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goZGVmZXIucHJvbWlzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgc2luZ2xlIFJFU1QgQVBJIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVNpbmdsZShpdGVtLCByZXNvdXJjZS51cGRhdGUsIGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMsIGFmdGVyUGVyc2lzdExpc3RlbmVycywgZGVmZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgdGhlIHNhdmUgKGluc2VydCkgcXVldWUuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgYXMgc29vbiBhcyBhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFJFU1QgQVBJIGNhbGxzIGFyZSBkb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVNhdmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZSA9IHNlbGYuZ2V0U2F2ZVF1ZXVlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIG92ZXIgdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBxdWV1ZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGRlZmVyLnByb21pc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIHNpbmdsZSBSRVNUIEFQSSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVTaW5nbGUoaXRlbSwgcmVzb3VyY2Uuc2F2ZSwgYmVmb3JlUGVyc2lzdExpc3RlbmVycywgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLCBkZWZlciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBDbGVhcnMgdGhlIGNoYW5nZSBxdWV1ZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbGVhckFmdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNpc3RRdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVRdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGlvbiBmaW5pc2hlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvblJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgUkVTVCBBUEkgY2FsbCBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAkcS53aGVuKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGV4ZWN1dGVSZW1vdmVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXhlY3V0ZVVwZGF0ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihleGVjdXRlU2F2ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjbGVhcilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGRlZmVyLnJlc29sdmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goaGFuZGxlRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGNoaWxkIHN0b3JlIGZyb20gdGhlIGN1cnJlbnQgc3RvcmUuIFRoaXMgc3RvcmUgY2FuIG1ha2UgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAqIHRvIGl0J3MgbWFuYWdlZCBpbnN0YW5jZXMgYW5kIGl0IHdpbGwgbm90IGFmZmVjdCB0aGUgY3VycmVudCBzdG9yZXNcbiAgICAgICAgICAgICAgICAgKiBpbnN0YW5jZXMgdW50aWwgdGhlIGNoaWxkIHN0b3JlIGNvbW1pdHMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbaW5zdGFuY2VzXVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Jlc291cmNlU3RvcmV9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5jcmVhdGVDaGlsZFN0b3JlID0gZnVuY3Rpb24gKGluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMgPSBpbnN0YW5jZXMgfHwgbWFuYWdlZEluc3RhbmNlcztcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkU3RvcmVNYW5hZ2VkSW5zdGFuY2VzID0gY29weShpbnN0YW5jZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzb3VyY2VTdG9yZShyZXNvdXJjZSwgY2hpbGRTdG9yZU1hbmFnZWRJbnN0YW5jZXMsIHNlbGYpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBZGRzIGEgcmVsYXRpb24gdG8gYW5vdGhlciBzdG9yZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGNvbmZpZ1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Jlc291cmNlU3RvcmVSZWxhdGlvbn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmNyZWF0ZVJlbGF0aW9uID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBhbmd1bGFyLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGVkU3RvcmU6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBma0F0dHI6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZTogJ2ZvcmdldCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZTogJ3VwZGF0ZSdcbiAgICAgICAgICAgICAgICAgICAgfSwgY29uZmlnKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uID0gbmV3IFJlc291cmNlU3RvcmVSZWxhdGlvbihzZWxmLCBjb25maWcucmVsYXRlZFN0b3JlLCBjb25maWcuZmtBdHRyLCBjb25maWcub25VcGRhdGUsIGNvbmZpZy5vbkRlbGV0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zLnB1c2gocmVsYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWxhdGlvbjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhIHJlbGF0aW9uIGZyb20gdGhlIHN0b3JlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZVJlbGF0aW9uID0gZnVuY3Rpb24gKHJlbGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25JbmRleCA9IHJlbGF0aW9ucy5pbmRleE9mKHJlbGF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uRm91bmQgPSByZWxhdGlvbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRpb25Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zLnNwbGljZShyZWxhdGlvbkluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBtYW5hZ2VkIGluc3RhbmNlIGZyb20gdGhlIHN0b3JlIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAgICAgKiBQSyBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa1ZhbHVlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldEJ5UGsgPSBmdW5jdGlvbiAocGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UuZ2V0SW5zdGFuY2VCeVBrKG1hbmFnZWRJbnN0YW5jZXMsIHBrVmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBtYW5hZ2VkIGluc3RhbmNlIGZyb20gdGhlIHN0b3JlIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAgICAgKiBpbnN0YW5jZSAod2hpY2ggbWlnaHQgYnkgYW4gY29weSB0aGF0IGlzIG5vdCBtYW5hZ2VkIG9yIG1hbmFnZWQgYnlcbiAgICAgICAgICAgICAgICAgKiBhbm90aGVyIHN0b3JlKS4gVGhlIGluc3RhbmNlcyBhcmUgbWF0Y2hlZCBieSB0aGVpciBQSyBhdHRyaWJ1dGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdHx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRCeUluc3RhbmNlID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcGtWYWx1ZSA9IGluc3RhbmNlID8gaW5zdGFuY2VbcmVzb3VyY2UuZ2V0UGtBdHRyKCldIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldEJ5UGsocGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyB2aXNpYmxlIGZvciB0aGUgdXNlci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRNYW5hZ2VkSW5zdGFuY2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFuYWdlZEluc3RhbmNlcy5zbGljZSgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgdmlzaWJsZSBmb3IgdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0VmlzaWJsZVF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmlzaWJsZVF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyBtYXJrZWQgZm9yIHBlcnNpc3QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0UGVyc2lzdFF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGVyc2lzdFF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyBtYXJrZWQgZm9yIHJlbW92ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRSZW1vdmVRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZVF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyBtYXJrZWQgZm9yIHNhdmUgKGluc2VydCkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0U2F2ZVF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclBoYW50b20gPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2UuJGlzUGhhbnRvbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGVyc2lzdFF1ZXVlLmZpbHRlcihmaWx0ZXJQaGFudG9tKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3IgdXBkYXRlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFVwZGF0ZVF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlck5vblBoYW50b20gPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWluc3RhbmNlLiRpc1BoYW50b20oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBlcnNpc3RRdWV1ZS5maWx0ZXIoZmlsdGVyTm9uUGhhbnRvbSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIG1hbmFnZWQgcmVzb3VyY2Ugc2VydmljZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFJlc291cmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgYSBiZWZvcmUtcGVyc2lzdCBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRCZWZvcmVQZXJzaXN0TGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgYmVmb3JlUGVyc2lzdExpc3RlbmVycy5wdXNoKGZuKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhIGJlZm9yZS1wZXJzaXN0IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUJlZm9yZVBlcnNpc3RMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5kZXggPSBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLmluZGV4T2YoZm4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm5Gb3VuZCA9IGZuSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLnNwbGljZShmbkluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBZGRzIGEgYWZ0ZXItcGVyc2lzdCBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRBZnRlclBlcnNpc3RMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICBhZnRlclBlcnNpc3RMaXN0ZW5lcnMucHVzaChmbik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSBhZnRlci1wZXJzaXN0IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFmdGVyUGVyc2lzdExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5JbmRleCA9IGFmdGVyUGVyc2lzdExpc3RlbmVycy5pbmRleE9mKGZuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuRm91bmQgPSBmbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZm5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLnNwbGljZShmbkluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgYmVmb3JlLXJlbW92ZSBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVCZWZvcmVSZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5kZXggPSBiZWZvcmVSZW1vdmVMaXN0ZW5lcnMuaW5kZXhPZihmbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkZvdW5kID0gZm5JbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZVJlbW92ZUxpc3RlbmVycy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQWRkcyBhIGFmdGVyLXJlbW92ZSBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRBZnRlclJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGFmdGVyUmVtb3ZlTGlzdGVuZXJzLnB1c2goZm4pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgYWZ0ZXItcmVtb3ZlIGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFmdGVyUmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluZGV4ID0gYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMuaW5kZXhPZihmbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkZvdW5kID0gZm5JbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyUmVtb3ZlTGlzdGVuZXJzLnNwbGljZShmbkluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBZGRzIHRoZSBnaXZlbiBpbnN0YW5jZSB0byB0aGUgZ2l2ZW4gbGlzdCBvZiBpbnN0YW5jZXMuIERvZXMgbm90aGluZyBpZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBpcyBhbHJlYWR5IGluIHRoZSBsaXN0IG9mIGluc3RhbmNlcy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGFkZFJlc291cmNlSW5zdGFuY2UgKGluc3RhbmNlcywgaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlcyA9IHJlc291cmNlLmZpbHRlckluc3RhbmNlc0J5QXR0cihpbnN0YW5jZXMsIHJlc291cmNlLmdldFBrQXR0cigpLCBpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghIW1hdGNoaW5nSW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXRjaGluZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlSW5kZXggPSBpbnN0YW5jZXMuaW5kZXhPZihtYXRjaGluZ0luc3RhbmNlc1tpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VGb3VuZCA9IG1hdGNoaW5nSW5zdGFuY2VJbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdJbnN0YW5jZUZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcy5zcGxpY2UobWF0Y2hpbmdJbnN0YW5jZUluZGV4LCAxLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyB0aGUgZ2l2ZW4gaW5zdGFuY2UgZnJvbSB0aGUgZ2l2ZW4gbGlzdCBvZiBpbnN0YW5jZXMuIERvZXMgbm90aGluZyBpZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBpcyBub3QgaW4gdGhlIGxpc3Qgb2YgaW5zdGFuY2VzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiByZW1vdmVSZXNvdXJjZUluc3RhbmNlIChpbnN0YW5jZXMsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZXMgPSByZXNvdXJjZS5maWx0ZXJJbnN0YW5jZXNCeUF0dHIoaW5zdGFuY2VzLCByZXNvdXJjZS5nZXRQa0F0dHIoKSwgaW5zdGFuY2VbcmVzb3VyY2UuZ2V0UGtBdHRyKCldKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoISFtYXRjaGluZ0luc3RhbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0Y2hpbmdJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZUluZGV4ID0gaW5zdGFuY2VzLmluZGV4T2YobWF0Y2hpbmdJbnN0YW5jZXNbaV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlRm91bmQgPSBtYXRjaGluZ0luc3RhbmNlSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nSW5zdGFuY2VGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMuc3BsaWNlKG1hdGNoaW5nSW5zdGFuY2VJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBjYW4gYmUgdHJlYXRlZCBhcyBhbiBwcm9taXNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBvYmpcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfGJvb2xlYW59XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaXNQcm9taXNlTGlrZSAob2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmogJiYgYW5ndWxhci5pc0Z1bmN0aW9uKG9iai50aGVuKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBQb3B1bGF0ZXMgdGhlIGRlc3RpbmF0aW9uIG9iamVjdCBgZHN0YCBieSBjb3B5aW5nIHRoZSBub24tcHJpdmF0ZSBkYXRhIGZyb20gYHNyY2Agb2JqZWN0LiBUaGUgZGF0YVxuICAgICAgICAgICAgICAgICAqIG9uIHRoZSBgZHN0YCBvYmplY3Qgd2lsbCBiZSBhIGRlZXAgY29weSBvZiB0aGUgZGF0YSBvbiB0aGUgYHNyY2AuIFRoaXMgZnVuY3Rpb24gd2lsbCBub3QgY29weVxuICAgICAgICAgICAgICAgICAqIGF0dHJpYnV0ZXMgb2YgdGhlIGBzcmNgIHdob3NlIG5hbWVzIHN0YXJ0IHdpdGggXCIkXCIuIFRoZXNlIGF0dHJpYnV0ZXMgYXJlIGNvbnNpZGVyZWQgcHJpdmF0ZS4gVGhlXG4gICAgICAgICAgICAgICAgICogbWV0aG9kIHdpbGwgYWxzbyBrZWVwIHRoZSBwcml2YXRlIGF0dHJpYnV0ZXMgb2YgdGhlIGBkc3RgLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBkc3Qge1VuZGVmaW5lZHxPYmplY3R8QXJyYXl9IERlc3RpbmF0aW9uIG9iamVjdFxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzcmMge09iamVjdHxBcnJheX0gU291cmNlIG9iamVjdFxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBba2VlcE1pc3NpbmddIGJvb2xlYW4gS2VlcCBhdHRyaWJ1dGVzIG9uIGRzdCB0aGF0IGFyZSBub3QgcHJlc2VudCBvbiBzcmNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHBvcHVsYXRlIChkc3QsIHNyYywga2VlcE1pc3NpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8ga2VlcE1pc3NpbmcgZGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBrZWVwTWlzc2luZyA9IGFuZ3VsYXIuaXNVbmRlZmluZWQoa2VlcE1pc3NpbmcpID8gdHJ1ZSA6ICEha2VlcE1pc3Npbmc7XG4gICAgICAgICAgICAgICAgICAgIGRzdCA9IGRzdCB8fCB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZSA9ICEhZHN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVkT2JqZWN0cyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAqIEFzIHdlIGRvIHJlbW92ZSBhbGwgXCJwcml2YXRlXCIgcHJvcGVydGllcyBmcm9tIHRoZSBzb3VyY2UsIHNvIHRoZXkgYXJlIG5vdCBjb3BpZWRcbiAgICAgICAgICAgICAgICAgICAgICogdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdCwgd2UgbWFrZSBhIGNvcHkgb2YgdGhlIHNvdXJjZSBmaXJzdC4gV2UgZG8gbm90IHdhbnQgdG9cbiAgICAgICAgICAgICAgICAgICAgICogbW9kaWZ5IHRoZSBhY3R1YWwgc291cmNlIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IGFuZ3VsYXIuY29weShzcmMpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBrZXlbMF0gPT09ICckJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzcmNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAqIE9ubHkgcHJlc2VydmUgaWYgd2UgZ290IGEgZGVzdGluYXRpb24gb2JqZWN0LiBTYXZlIFwicHJpdmF0ZVwiIG9iamVjdCBrZXlzIG9mIGRlc3RpbmF0aW9uIGJlZm9yZVxuICAgICAgICAgICAgICAgICAgICAgKiBjb3B5aW5nIHRoZSBzb3VyY2Ugb2JqZWN0IG92ZXIgdGhlIGRlc3RpbmF0aW9uIG9iamVjdC4gV2UgcmVzdG9yZSB0aGVzZSBwcm9wZXJ0aWVzIGFmdGVyd2FyZHMuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJlc2VydmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGRzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkc3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIHByaXZhdGUgYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5WzBdID09PSAnJCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXNlcnZlZE9iamVjdHNba2V5XSA9IGRzdFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGtlZXAgYXR0cmlidXRlIGlmIG5vdCBwcmVzZW50IG9uIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChrZWVwTWlzc2luZyAmJiAhc3JjLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXNlcnZlZE9iamVjdHNba2V5XSA9IGRzdFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZG8gdGhlIGFjdHVhbCBjb3B5XG4gICAgICAgICAgICAgICAgICAgIGRzdCA9IGFuZ3VsYXIuY29weShzcmMsIGRzdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICogTm93IHdlIGNhbiByZXN0b3JlIHRoZSBwcmVzZXJ2ZWQgZGF0YSBvbiB0aGUgZGVzdGluYXRpb24gb2JqZWN0IGFnYWluLlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXNlcnZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBwcmVzZXJ2ZWRPYmplY3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXNlcnZlZE9iamVjdHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkc3Rba2V5XSA9IHByZXNlcnZlZE9iamVjdHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHN0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENvcGllcyB0aGUgc291cmNlIG9iamVjdCB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0IChvciBhcnJheSkuIEtlZXBzIHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBhdHRyaWJ1dGVzIG9uIHRoZSBgZHN0YCBvYmplY3QgKGF0dHJpYnV0ZXMgc3RhcnRpbmcgd2l0aCAkIGFyZSBwcml2YXRlKS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3JjXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtkc3RdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb3B5IChzcmMsIGRzdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBhcmUgd29ya2luZyBvbiBhbiBhcnJheSwgY29weSBlYWNoIGluc3RhbmNlIG9mIHRoZSBhcnJheSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZHN0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KHNyYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdCA9IGFuZ3VsYXIuaXNBcnJheShkc3QpID8gZHN0IDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QubGVuZ3RoID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkc3QucHVzaChwb3B1bGF0ZShudWxsLCBzcmNbaV0sIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSB3ZSBjYW4ganVzdCBjb3B5IHRoZSBzcmMgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdCA9IHBvcHVsYXRlKGRzdCwgc3JjLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHN0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIE1lcmdlcyB0aGUgc291cmNlIG9iamVjdCB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0IChvciBhcnJheSkuIEtlZXBzIHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBhdHRyaWJ1dGVzIG9uIHRoZSBgZHN0YCBvYmplY3QgKGF0dHJpYnV0ZXMgc3RhcnRpbmcgd2l0aCAkIGFyZSBwcml2YXRlKS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3JjXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtkc3RdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtZXJnZSAoc3JjLCBkc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgYXJlIHdvcmtpbmcgb24gYW4gYXJyYXksIGNvcHkgZWFjaCBpbnN0YW5jZSBvZiB0aGUgYXJyYXkgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGRzdC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShzcmMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QgPSBhbmd1bGFyLmlzQXJyYXkoZHN0KSA/IGRzdCA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0Lmxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHN0LnB1c2gocG9wdWxhdGUobnVsbCwgc3JjW2ldLCB0cnVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSB3ZSBjYW4ganVzdCBjb3B5IHRoZSBzcmMgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdCA9IHBvcHVsYXRlKGRzdCwgc3JjLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogSW5pdGlhbGl6ZXMgdGhlIHN0b3JlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hbmFnZWRJbnN0YW5jZXMgPSBtYW5hZ2VkSW5zdGFuY2VzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRTdG9yZSA9IHBhcmVudFN0b3JlIHx8IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkID0gc2VsZi5tYW5hZ2UobWFuYWdlZEluc3RhbmNlcyksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogTWFwcyBpbnN0YW5jZXMgdG8gYSBsaXN0IG9mIFBLc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwUGsgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2UgPyBTdHJpbmcoaW5zdGFuY2VbcmVzb3VyY2UuZ2V0UGtBdHRyKCldKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogRmlsdGVycyBpbnN0YW5jZXMgdG8gZ2l2ZW4gbGlzdCBvZiBQS3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJQa3MgPSBmdW5jdGlvbiAocGtzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2UgPyBwa3MuaW5kZXhPZihTdHJpbmcoaW5zdGFuY2VbcmVzb3VyY2UuZ2V0UGtBdHRyKCldKSkgIT09IC0xIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHF1ZXVlcyB3aXRoIHRoZSBzdGF0ZSBvZiB0aGUgcGFyZW50IHN0b3JlLCBpZiB0aGVyZSBpcyBhIHBhcmVudCBzdG9yZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IENvcHkgc3RhdGUgZnJvbSBwYXJlbnQgc3RvcmUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VmlzaWJsZVF1ZXVlUGtzID0gcGFyZW50U3RvcmUuZ2V0VmlzaWJsZVF1ZXVlKCkubWFwKG1hcFBrKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFBlcnNpc3RRdWV1ZVBrcyA9IHBhcmVudFN0b3JlLmdldFBlcnNpc3RRdWV1ZSgpLm1hcChtYXBQayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRSZW1vdmVRdWV1ZVBrcyA9IHBhcmVudFN0b3JlLmdldFJlbW92ZVF1ZXVlKCkubWFwKG1hcFBrKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSB2aXNpYmxlLCBwZXJzaXN0IGFuZCByZW1vdmUgcXVldWUgd2l0aCB0aGUgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZnJvbSB0aGUgcGFyZW50IHN0b3JlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlUXVldWUgPSBtYW5hZ2VkSW5zdGFuY2VzLmZpbHRlcihmaWx0ZXJQa3MocGFyZW50VmlzaWJsZVF1ZXVlUGtzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNpc3RRdWV1ZSA9IG1hbmFnZWRJbnN0YW5jZXMuZmlsdGVyKGZpbHRlclBrcyhwYXJlbnRQZXJzaXN0UXVldWVQa3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUXVldWUgPSBtYW5hZ2VkSW5zdGFuY2VzLmZpbHRlcihmaWx0ZXJQa3MocGFyZW50UmVtb3ZlUXVldWVQa3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgc3RvcmVcbiAgICAgICAgICAgICAgICBpbml0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgY2xhc3MgZm9yIGEgcmVsYXRpb24gYmV0d2VlbiB0d28gc3RvcmVzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBuYW1lIFJlc291cmNlU3RvcmVSZWxhdGlvblxuICAgICAgICAgICAgICogQG5nZG9jIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKiBAcGFyYW0gc3RvcmVcbiAgICAgICAgICAgICAqIEBwYXJhbSByZWxhdGVkU3RvcmVcbiAgICAgICAgICAgICAqIEBwYXJhbSBma0F0dHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBvblVwZGF0ZVxuICAgICAgICAgICAgICogQHBhcmFtIG9uUmVtb3ZlXG4gICAgICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gUmVzb3VyY2VTdG9yZVJlbGF0aW9uIChzdG9yZSwgcmVsYXRlZFN0b3JlLCBma0F0dHIsIG9uVXBkYXRlLCBvblJlbW92ZSkge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogSW1wbGVtZW50YXRpb24gb2YgcHJlLWRlZmluZWQgdXBkYXRlIGJlaGF2aW91cnNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG9uVXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgbmV3UmVmZXJlbmNlZEluc3RhbmNlUGssIGZrQXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBTZXQgcmVmZXJlbmNlIHRvICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIGluc3RhbmNlIGZyb20gJ1wiICsgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGsgKyBcIicgdG8gJ1wiICsgbmV3UmVmZXJlbmNlZEluc3RhbmNlUGsgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZVtma0F0dHJdID0gbmV3UmVmZXJlbmNlZEluc3RhbmNlUGs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgICAgICAgICAgICAgICAgICAgb25VcGRhdGUgPSBmdW5jdGlvbiAocmVmZXJlbmNpbmdTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGssIG5ld1JlZmVyZW5jZWRJbnN0YW5jZVBrLCBma0F0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmVSZWxhdGlvbjogU2V0IHJlZmVyZW5jZSB0byAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBpbnN0YW5jZSBmcm9tICdcIiArIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrICsgXCInIHRvIG51bGwuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZVtma0F0dHJdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEltcGxlbWVudGF0aW9uIG9mIHByZS1kZWZpbmVkIHJlbW92ZSBiZWhhdmlvdXJzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvblJlbW92ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmb3JnZXQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgb25SZW1vdmUgPSBmdW5jdGlvbiAocmVmZXJlbmNpbmdTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGssIGZrQXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBGb3JnZXQgJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgaW5zdGFuY2UgJ1wiICsgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGsgKyBcIicgcmVmZXJlbmNpbmcgaW5zdGFuY2UuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdTdG9yZS5mb3JnZXQocmVmZXJlbmNpbmdJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgICAgICAgICAgICAgICAgICAgb25SZW1vdmUgPSBmdW5jdGlvbiAocmVmZXJlbmNpbmdTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGssIGZrQXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBTZXQgcmVmZXJlbmNlIHRvICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIGluc3RhbmNlIGZyb20gJ1wiICsgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGsgKyBcIicgdG8gbnVsbC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIHN0b3JlIHRoZSByZWxhdGlvbiBpcyBjb25maWd1cmVkIG9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVSZWxhdGlvblxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRTdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBzdG9yZSB0aGUgY29uZmlndXJlZCBzdG9yZSBpcyByZWxhdGVkIG9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVSZWxhdGlvblxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRSZWxhdGVkU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWxhdGVkU3RvcmU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIEZLIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVSZWxhdGlvblxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldEZrQXR0ciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZrQXR0cjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVXBkYXRlcyB0aGUgcmVmZXJlbmNpbmcgaW5zdGFuY2VzIHdoZXJlIHRoZSBma0F0dHIgaGFzIHRoZSBnaXZlbiBvbGRcbiAgICAgICAgICAgICAgICAgKiB2YWx1ZSB0byB0aGUgZ2l2ZW4gbmV3IHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVSZWxhdGlvblxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBvbGRQa1ZhbHVlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG5ld1BrVmFsdWVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmhhbmRsZVVwZGF0ZSA9IGZ1bmN0aW9uIChvbGRQa1ZhbHVlLCBuZXdQa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBIYW5kbGUgdXBkYXRlIG9mIHJlZmVyZW5jZWQgaW5zdGFuY2Ugb24gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgc3RvcmUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZXMgPSByZWxhdGVkU3RvcmUuZ2V0TWFuYWdlZEluc3RhbmNlcygpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVmZXJlbmNpbmdJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2UgPSByZWZlcmVuY2luZ0luc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZmVyZW5jaW5nSW5zdGFuY2UgJiYgcmVmZXJlbmNpbmdJbnN0YW5jZVtma0F0dHJdID09IG9sZFBrVmFsdWUgJiYgb2xkUGtWYWx1ZSAhPSBuZXdQa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25VcGRhdGUocmVsYXRlZFN0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRQa1ZhbHVlLCBuZXdQa1ZhbHVlLCBma0F0dHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIExldHMgdGhlIHJlbGF0ZWQgc3RvcmUgZm9yZ2V0IHN0YWxlIHJlZmVyZW5jaW5nIGluc3RhbmNlcywgZS5nLiBiZWNhdXNlIHRoZVxuICAgICAgICAgICAgICAgICAqIHJlZmVyZW5jZWQgaW5zdGFuY2Ugd2FzIGRlbGV0ZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmhhbmRsZVJlbW92ZSA9IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBIYW5kbGUgcmVtb3ZlIG9mIHJlZmVyZW5jZWQgaW5zdGFuY2Ugb24gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgc3RvcmUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZXMgPSByZWxhdGVkU3RvcmUuZ2V0TWFuYWdlZEluc3RhbmNlcygpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVmZXJlbmNpbmdJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2UgPSByZWZlcmVuY2luZ0luc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZmVyZW5jaW5nSW5zdGFuY2UgJiYgcmVmZXJlbmNpbmdJbnN0YW5jZVtma0F0dHJdID09IHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblJlbW92ZShyZWxhdGVkU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIHBrVmFsdWUsIGZrQXR0cik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xufSkoKTtcbiIsIi8qKlxuICogQW5ndWxhciBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlXG4gKiBDb3B5cmlnaHQgMjAxNiBBbmRyZWFzIFN0b2NrZXJcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkXG4gKiBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbiAqIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZVxuICogU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRVxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4gKiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhclxuICAgICAgICBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnbmdSZXNvdXJjZUZhY3RvcnknKTtcblxuICAgIC8qKlxuICAgICAqIEZhY3Rvcnkgc2VydmljZSB0byBnZW5lcmF0ZSBuZXcgcmVzb3VyY2UgcGhhbnRvbSBpZCBnZW5lcmF0b3JzLlxuICAgICAqXG4gICAgICogQG5hbWUgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZVxuICAgICAqIEBuZ2RvYyBzZXJ2aWNlXG4gICAgICovXG4gICAgbW9kdWxlLnNlcnZpY2UoJ1Jlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UnLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IHBoYW50b20gaWQgZ2VuZXJhdG9yIHdpdGggdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2VcbiAgICAgICAgICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1Jlc291cmNlUGhhbnRvbUlkRmFjdG9yeX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2VsZi5jcmVhdGVQaGFudG9tSWRGYWN0b3J5ID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIGNvbmZpZyA9IGFuZ3VsYXIuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICAgICAgaXM6IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgICAgICAgICAgIH0sIGNvbmZpZyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeShjb25maWcuZ2VuZXJhdGUsIGNvbmZpZy5pcyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBhIHBoYW50b20gaWQgZ2VuZXJhdGUuIFRha2VzIGEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgdGhlIFBLLCBhbmQgYVxuICAgICAgICAgICAgICogZnVuY3Rpb25zIHRoYXQgY2hlY2tzIGlmIHRoZSBnaXZlbiBQSyBpcyBhIHBoYW50b20gUEsuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5XG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSBnZW5lcmF0ZUZuXG4gICAgICAgICAgICAgKiBAcGFyYW0gaXNQaGFudG9tRm5cbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnkgKGdlbmVyYXRlRm4sIGlzUGhhbnRvbUZuKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2VuZXJhdGVzIGEgbmV3IHBoYW50b20gUEsgdmFsdWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJvZiBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2VuZXJhdGUgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlRm4oaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDaGVja3MgaWYgdGhlIGdpdmVuIFBLIHZhbHVlIG9uIHRoZSBnaXZlbiBpbnN0YW5jZSBpcyBhIHBoYW50b20gUEsgdmFsdWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJvZiBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5pc1BoYW50b20gPSBmdW5jdGlvbiAocGtWYWx1ZSwgaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzUGhhbnRvbUZuKHBrVmFsdWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8qKlxuICAgICAqIFJlc291cmNlIHBoYW50b20gaWQgZ2VuZXJhdG9yIHRoYXQgZ2VuZXJhdGVzIG5lZ2F0aXZlIGludGVnZXIgSURzXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50XG4gICAgICogQG5nZG9jIGZhY3RvcnlcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2V9IFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UgUGhhbnRvbSBJRCBmYWN0b3J5IHNlcnZpY2VcbiAgICAgKi9cbiAgICBtb2R1bGUuZmFjdG9yeSgnUmVzb3VyY2VQaGFudG9tSWROZWdhdGl2ZUludCcsXG4gICAgICAgIGZ1bmN0aW9uIChSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlKSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICBsYXN0UGtWYWx1ZSA9IDA7XG5cbiAgICAgICAgICAgIHJldHVybiBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlLmNyZWF0ZVBoYW50b21JZEZhY3Rvcnkoe1xuICAgICAgICAgICAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtLWxhc3RQa1ZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaXM6IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwa1ZhbHVlIDwgMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvKipcbiAgICAgKiBSZXNvdXJjZSBwaGFudG9tIGlkIGdlbmVyYXRvciB0aGF0IGdlbmVyYXRlcyBuZWdhdGl2ZSBpbnRlZ2VyIElEc1xuICAgICAqXG4gICAgICogQG5hbWUgUmVzb3VyY2VQaGFudG9tSWRVdWlkNFxuICAgICAqIEBuZ2RvYyBmYWN0b3J5XG4gICAgICogQHBhcmFtIHtSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlfSBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlIFBoYW50b20gSUQgZmFjdG9yeSBzZXJ2aWNlXG4gICAgICovXG4gICAgbW9kdWxlLmZhY3RvcnkoJ1Jlc291cmNlUGhhbnRvbUlkVXVpZDQnLFxuICAgICAgICBmdW5jdGlvbiAoUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZSkge1xuICAgICAgICAgICAgJ25nSW5qZWN0JztcblxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVkSWRzID0gW107XG5cbiAgICAgICAgICAgIHJldHVybiBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlLmNyZWF0ZVBoYW50b21JZEZhY3Rvcnkoe1xuICAgICAgICAgICAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcGtWYWx1ZSA9IHV1aWQ0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVkSWRzLnB1c2gocGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwa1ZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaXM6IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZWRJZHMuaW5kZXhPZihwa1ZhbHVlKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHV1aWQ0ICgpIHtcbiAgICAgICAgICAgICAgICAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByID0gTWF0aC5yYW5kb20oKSAqIDE2fDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gYyA9PT0gJ3gnID8gciA6IChyJjB4M3wweDgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59KSgpO1xuIl19
