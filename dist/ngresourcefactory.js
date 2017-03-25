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
                                data = response.data,
                                url = options.urlAttr ? data[options.urlAttr] : response.config.url;

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
                                url = options.urlAttr ? data[options.urlAttr] : response.config.url;

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
                            var
                                data = response.data,
                                url = options.urlAttr ? data[options.urlAttr] : response.config.url;

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiY2FjaGUvY2FjaGVTZXJ2aWNlLmpzIiwiZmFjdG9yeS9mYWN0b3J5U2VydmljZS5qcyIsInBoYW50b21JZEZhY3RvcnkvcGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksTUFBTSxRQUFRLE9BQU8scUJBQXFCO1lBQ3RDOzs7O0FBSVo7QUM3QkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksU0FBUyxRQUFRLE9BQU87Ozs7Ozs7O0lBUTVCLE9BQU8sUUFBUTtRQUNYLFlBQVk7WUFDUjs7WUFFQTtnQkFDSSxTQUFTOzs7Ozs7Ozs7WUFTYixTQUFTLGFBQWEsTUFBTSxRQUFRLFNBQVM7Z0JBQ3pDO29CQUNJLE9BQU87Ozs7OztvQkFNUCxRQUFROzs7Ozs7b0JBTVIsbUJBQW1COzs7Ozs7b0JBTW5CLGlCQUFpQjs7Ozs7O29CQU1qQixrQkFBa0I7O2dCQUV0QixVQUFVLFFBQVEsT0FBTzs7Ozs7b0JBS3JCLFFBQVE7Ozs7OztvQkFNUixTQUFTOzs7Ozs7b0JBTVQsVUFBVTs7Ozs7O29CQU1WLFdBQVc7Ozs7OztvQkFNWCxLQUFLLEtBQUs7bUJBQ1gsV0FBVzs7O2dCQUdkOzs7Ozs7Ozs7Z0JBU0EsS0FBSyxVQUFVLFVBQVUsT0FBTzs7b0JBRTVCLElBQUksUUFBUSxRQUFRLFFBQVE7d0JBQ3hCLFFBQVEsSUFBSSwyRkFBMkYsT0FBTzs7d0JBRTlHLFlBQVk7Ozt5QkFHWCxJQUFJLFFBQVEsU0FBUyxRQUFRO3dCQUM5QixRQUFRLElBQUksaUZBQWlGLE9BQU87O3dCQUVwRyxjQUFjOzt5QkFFYjt3QkFDRCxRQUFRLElBQUksNEVBQTRFLE9BQU87Ozs7Ozs7Ozs7Ozs7Z0JBYXZHLEtBQUssU0FBUyxVQUFVLEtBQUssT0FBTyxhQUFhLFNBQVM7b0JBQ3RE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TyxVQUFVOzs7Ozs7Ozs7Ozs7O0lBYWpDLE9BQU8sUUFBUTs0Q0FDWCxVQUFVLGlDQUFpQztZQUN2Qzs7WUFFQTtnQkFDSSxlQUFlOztZQUVuQixPQUFPLGdDQUFnQyx1QkFBdUI7Z0JBQzFELFVBQVUsWUFBWTtvQkFDbEI7d0JBQ0ksVUFBVTs7b0JBRWQsYUFBYSxLQUFLO29CQUNsQixPQUFPOztnQkFFWCxJQUFJLFVBQVUsU0FBUztvQkFDbkIsT0FBTyxhQUFhLFFBQVEsYUFBYSxDQUFDOzs7O1lBSWxELFNBQVMsU0FBUztnQkFDZCx1Q0FBdUMsUUFBUSxTQUFTLFNBQVMsR0FBRztvQkFDaEU7d0JBQ0ksSUFBSSxLQUFLLFdBQVcsR0FBRzt3QkFDdkIsSUFBSSxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7O29CQUUvQixPQUFPLEVBQUUsU0FBUzs7Ozs7O0FBTXRDIiwiZmlsZSI6Im5ncmVzb3VyY2VmYWN0b3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBbmd1bGFyIFJlc291cmNlRmFjdG9yeVxuICogQ29weXJpZ2h0IDIwMTYgQW5kcmVhcyBTdG9ja2VyXG4gKiBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZFxuICogZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4gKiByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGVcbiAqIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEVcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuICogT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXJcbiAgICAgICAgYXBwID0gYW5ndWxhci5tb2R1bGUoJ25nUmVzb3VyY2VGYWN0b3J5JywgW1xuICAgICAgICAgICAgJ25nUmVzb3VyY2UnXG4gICAgICAgIF0pO1xuXG59KSgpO1xuIiwiLyoqXG4gKiBBbmd1bGFyIFJlc291cmNlQ2FjaGVTZXJ2aWNlXG4gKiBDb3B5cmlnaHQgMjAxNiBBbmRyZWFzIFN0b2NrZXJcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkXG4gKiBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbiAqIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZVxuICogU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRVxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4gKiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhclxuICAgICAgICBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnbmdSZXNvdXJjZUZhY3RvcnknKTtcblxuICAgIC8qKlxuICAgICAqIEZhY3Rvcnkgc2VydmljZSB0byBjcmVhdGUgbmV3IGNhY2hlLlxuICAgICAqXG4gICAgICogQG5hbWUgUmVzb3VyY2VDYWNoZVNlcnZpY2VcbiAgICAgKiBAbmdkb2MgZmFjdG9yeVxuICAgICAqL1xuICAgIG1vZHVsZS5mYWN0b3J5KCdSZXNvdXJjZUNhY2hlU2VydmljZScsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIGNhY2hlcyA9IHt9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICogQG5nZG9jIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gY29uc3RydWN0b3IgKG5hbWUsIHBrQXR0ciwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBzZWxmID0gdGhpcyxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGNhY2hlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjYWNoZSA9IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBNYXBwaW5nIG9mIGNhY2hlIGtleXMgdG8gYm9vbGVhbiB0aGF0IGluZGljYXRlcyB3aGV0aGVyIHRvIHVzZSB0aGUgYGRhdGFBdHRyYCBvciBub3RcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVVc2VEYXRhQXR0ciA9IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBNYXBwaW5nIG9mIGNhY2hlIGtleXMgdG8gYm9vbGVhbiB0aGF0IGluZGljYXRlcyB3aGV0aGVyIHRoZSB2YWx1ZSBpcyBtYW5hZ2VkIG9yIG5vdFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjYWNoZUlzTWFuYWdlZCA9IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBNYXBwaW5nIG9mIGNhY2hlIGtleXMgdG8gdGltZXN0YW1wcyBmb3IgYXV0b21hdGljIGludmFsaWRhdGlvblxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjYWNoZVRpbWVzdGFtcHMgPSB7fTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZ2V0IHRoZSBJRCBvZiB0aGUgb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwa0F0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBnZXQgdGhlIFVSTCBvZiB0aGUgb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB1cmxBdHRyOiBudWxsLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZ2V0IHRoZSBhY3R1YWwgZGF0YSBmcm9tXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGRhdGFBdHRyOiBudWxsLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBEZXBlbmRlbnQgY2FjaGVzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheTxTdHJpbmc+fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW50OiBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGltZSB0byBsaXZlIGZvciBjYWNoZSBlbnRyaWVzIGluIHNlY29uZHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge2ludH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHR0bDogNjAgKiA2MFxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xuXG4gICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgY2FjaGVcbiAgICAgICAgICAgICAgICBpbml0KCk7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZWZyZXNoZXMgdGhlIGNhY2hlIGVudHJpZXMgd2l0aCB0aGUgbmV3IHZhbHVlIG9yIHZhbHVlcy4gVGhlIGV4aXN0aW5nIG9iamVjdHMgaW4gdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgICogYXJlIG1hdGNoZWQgYnkgdGhlIGBwa0F0dHJgIHZhbHVlLCBhbmQgYWRkaXRpb25hbGx5IGJ5IHRoZSBgdXJsQXR0cmAsIGlmIGF2YWlsYWJsZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXk8T2JqZWN0Pn0gdmFsdWVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlZnJlc2ggPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVmcmVzaCB0aGUgZXhpc3RpbmcgdmFsdWVzIGluIHRoZSBjYWNoZSB3aXRoIHRoZSBuZXcgZW50cmllc1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVmcmVzaCBleGlzdGluZyBlbnRyaWVzIHdpdGggbGlzdCBvZiBuZXcgZW50cmllcyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hFYWNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyByZWZyZXNoIHRoZSBleGlzdGluZyB2YWx1ZXMgaW4gdGhlIGNhY2hlIHdpdGggdGhlIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVmcmVzaCBleGlzdGluZyBlbnRyaWVzIHdpdGggbmV3IGVudHJ5IG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFNpbmdsZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBVbmFibGUgdG8gcmVmcmVzaCBleGlzdGluZyBlbnRyaWVzIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInIGFzIGdpdmVuIHZhbHVlIGlzIG5laXRoZXIgYW4gYXJyYXkgbm9yIGFuIG9iamVjdC5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ3JlYXRlcyBhIGNhY2hlIGVudHJ5IGZvciB0aGUgZ2l2ZW4gdmFsdWUgYW5kIHB1dHMgaXQgb24gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHVzZURhdGFBdHRyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtyZWZyZXNoXVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaW5zZXJ0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUsIHVzZURhdGFBdHRyLCByZWZyZXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEluc2VydCB2YWx1ZSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNYW5hZ2VkID0gYW5ndWxhci5pc09iamVjdCh2YWx1ZSkgfHwgYW5ndWxhci5pc0FycmF5KHZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9IDIwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnMgPSBpc01hbmFnZWQgPyB7J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ30gOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c1RleHQgPSAnT0snLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkgPSBbc3RhdHVzLCB2YWx1ZSwgaGVhZGVycywgc3RhdHVzVGV4dF07XG5cbiAgICAgICAgICAgICAgICAgICAgdXNlRGF0YUF0dHIgPSAhIXVzZURhdGFBdHRyO1xuICAgICAgICAgICAgICAgICAgICByZWZyZXNoID0gYW5ndWxhci5pc1VuZGVmaW5lZChyZWZyZXNoKSA/IHRydWUgOiAhIXJlZnJlc2g7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVba2V5XSA9IGVudHJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVVc2VEYXRhQXR0cltrZXldID0gdXNlRGF0YUF0dHIgJiYgaXNNYW5hZ2VkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVJc01hbmFnZWRba2V5XSA9IGlzTWFuYWdlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU9yVXBkYXRlVGltZXN0YW1wKGtleSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgcmVmcmVzaCBleGlzdGluZyBkYXRhIGlmIGByZWZyZXNoYCBwYXJhbWV0ZXIgd2FzIG5vdCBzZXQgdG8gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWZyZXNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWZyZXNoKGdldERhdGFGb3JFbnRyeShlbnRyeSwgdXNlRGF0YUF0dHIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBQdXRzIHRoZSBnaXZlbiBlbnRyeSB3aXRoIHRoZSBnaXZlbiBrZXkgb24gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHVzZURhdGFBdHRyXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5wdXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgdXNlRGF0YUF0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUHV0IGVudHJ5IHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdXNlRGF0YUF0dHIgPSAhIXVzZURhdGFBdHRyO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBJbmRpY2F0ZXMgaWYgdmFsdWUgaXMgbWFuYWdlZCBieSB0aGUgY2FjaGUsIHdoaWNoIG1lYW5zIGl0IGlzIHJlZnJlc2hlZCBpZiBuZXcgY2FsbHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIHJldHVybiB0aGUgc2FtZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNNYW5hZ2VkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RvcmUgdGhlIGFjdHVhbCBkYXRhIG9iamVjdCwgbm90IHRoZSBzZXJpYWxpemVkIHN0cmluZywgZm9yIEpTT05cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZVsyXSAmJiB2YWx1ZVsyXVsnY29udGVudC10eXBlJ10gPT09ICdhcHBsaWNhdGlvbi9qc29uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVzZSBkZXNlcmlhbGl6ZWQgZGF0YSBmb3Iga2V5ICdcIiArIGtleSArIFwiJyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVsxXSA9IHZhbHVlWzFdID8gYW5ndWxhci5mcm9tSnNvbih2YWx1ZVsxXSkgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWFuYWdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBVc2UgcmF3IGRhdGEgZm9yIGtleSAnXCIgKyBrZXkgKyBcIicgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlRGF0YUF0dHIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVVc2VEYXRhQXR0cltrZXldID0gdXNlRGF0YUF0dHI7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUlzTWFuYWdlZFtrZXldID0gaXNNYW5hZ2VkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlT3JVcGRhdGVUaW1lc3RhbXAoa2V5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZWZyZXNoIHRoZSBjYWNoZSBlbnRyaWVzIGlmIHRoZSB2YWx1ZSBpcyBhbHJlYWR5IGEgY2FjaGUgZW50cnkgKHdoaWNoIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbHdheXMgYW4gYXJyYXkpLCBub3QgYSBwcm9taXNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFuYWdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVmcmVzaChnZXREYXRhRm9yRW50cnkodmFsdWUsIHVzZURhdGFBdHRyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgZW50cnkgd2l0aCB0aGUgZ2l2ZW4ga2V5IGZyb20gdGhlIGNhY2hlLCBvciB1bmRlZmluZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXNlQ2FjaGVUdGxcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Knx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXQgPSBmdW5jdGlvbiAoa2V5LCB1c2VDYWNoZVR0bCkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGB1c2VDYWNoZVR0bGAgc2hvdWxkIGRlZmF1bHQgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB1c2VDYWNoZVR0bCA9IGFuZ3VsYXIuaXNVbmRlZmluZWQodXNlQ2FjaGVUdGwpIHx8ICEhdXNlQ2FjaGVUdGwgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdXNlQ2FjaGVUdGwgfHwgaXNFbnRyeUFsaXZlKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBHZXQgZW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWNoZVtrZXldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VyaWFsaXplIHRvIHN0cmluZyBmb3IgbWFuYWdlZCBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlSXNNYW5hZ2VkW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhbmd1bGFyLmNvcHkodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVsxXSA9IGFuZ3VsYXIudG9Kc29uKHZhbHVlWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBFbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgZXhjZWVkZWQgVFRMIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBVbmFibGUgdG8gZ2V0IGVudHJ5IHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyB0aGUgZW50cnkgd2l0aCB0aGUgZ2l2ZW4ga2V5IGZyb20gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZW1vdmUgZW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVVzZURhdGFBdHRyW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVJc01hbmFnZWRba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGFsbCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVtb3ZlIGFsbCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVUaW1lc3RhbXBzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVJc01hbmFnZWRba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGFsbCBsaXN0IGVudHJpZXMgZnJvbSB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWxsTGlzdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlbW92ZSBhbGwgbGlzdCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkgJiYgYW5ndWxhci5pc0FycmF5KGdldERhdGFGb3JLZXkoa2V5KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVUaW1lc3RhbXBzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVJc01hbmFnZWRba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGFsbCBsaXN0IGVudHJpZXMgZnJvbSB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWxsT2JqZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVtb3ZlIGFsbCBvYmplY3QgZW50cmllcyBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFuZ3VsYXIuaXNPYmplY3QoZ2V0RGF0YUZvcktleShrZXkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGVudHJpZXMgb2YgdGhlIGRlcGVuZGVudCBjYWNoZXMsIGluY2x1ZGluZyB0aGUgZGVwZW5kZW50IGNhY2hlcyBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiBkZXBlbmRlbnQgY2FjaGVzIChhbmQgc28gb24gLi4uKS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGxEZXBlbmRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW50Q2FjaGVOYW1lcyA9IGNvbGxlY3REZXBlbmRlbnRDYWNoZU5hbWVzKHNlbGYsIFtdKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlcGVuZGVudENhY2hlTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlc1tkZXBlbmRlbnRDYWNoZU5hbWVzW2ldXS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBEZXN0cm95cyB0aGUgY2FjaGUgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVJbmRleCA9IGNhY2hlcy5pbmRleE9mKHNlbGYpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNYW5hZ2VkID0gY2FjaGVJbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFuYWdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogRGVzdHJveSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZXMuc3BsaWNlKGNhY2hlSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJldHJpZXZlIGluZm9ybWF0aW9uIHJlZ2FyZGluZyB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHt7aWQ6ICosIHNpemU6IG51bWJlcn19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5pbmZvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBHZXQgY2FjaGUgaW5mb3JtYXRpb24gZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIGNhY2hlIHNpemVcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemUnOiBzaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ29wdGlvbnMnOiBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2FjaGUgaW50ZXJmYWNlIHRvIHB1dCBlbnRyaWVzIHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e3B1dDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwucHV0LCBnZXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLmdldCwgcmVtb3ZlOiAoKiksIHJlbW92ZUFsbDogKCopLCBpbmZvOiAoKil9fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYud2l0aERhdGFBdHRyID0ge1xuICAgICAgICAgICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wdXQoa2V5LCB2YWx1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0KGtleSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZTogc2VsZi5yZW1vdmUsXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbDogc2VsZi5yZW1vdmVBbGwsXG4gICAgICAgICAgICAgICAgICAgIGluZm86IHNlbGYuaW5mb1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDYWNoZSBpbnRlcmZhY2UgdG8gcHV0IGVudHJpZXMgd2l0aG91dCB1c2luZyBgZGF0YUF0dHJgIG9uIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHR5cGUge3twdXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLnB1dCwgZ2V0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5nZXQsIHJlbW92ZTogKCopLCByZW1vdmVBbGw6ICgqKSwgaW5mbzogKCopfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLndpdGhvdXREYXRhQXR0ciA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHV0KGtleSwgdmFsdWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXQoa2V5LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiBzZWxmLnJlbW92ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsOiBzZWxmLnJlbW92ZUFsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbzogc2VsZi5pbmZvXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENhY2hlIGludGVyZmFjZSB0byBwdXQgZW50cmllcyB1c2luZyBgZGF0YUF0dHJgIG9uIHRoZSBjYWNoZSBhbmQgaWdub3JpbmcgVFRMLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e3B1dDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwucHV0LCBnZXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLmdldCwgcmVtb3ZlOiAoKiksIHJlbW92ZUFsbDogKCopLCBpbmZvOiAoKil9fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYud2l0aERhdGFBdHRyTm9UdGwgPSB7XG4gICAgICAgICAgICAgICAgICAgIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnB1dChrZXksIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXQoa2V5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZTogc2VsZi5yZW1vdmUsXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbDogc2VsZi5yZW1vdmVBbGwsXG4gICAgICAgICAgICAgICAgICAgIGluZm86IHNlbGYuaW5mb1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDYWNoZSBpbnRlcmZhY2UgdG8gcHV0IGVudHJpZXMgd2l0aG91dCB1c2luZyBgZGF0YUF0dHJgIG9uIHRoZSBjYWNoZSBhbmQgaWdub3JpbmcgVFRMLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e3B1dDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwucHV0LCBnZXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLmdldCwgcmVtb3ZlOiAoKiksIHJlbW92ZUFsbDogKCopLCBpbmZvOiAoKil9fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYud2l0aG91dERhdGFBdHRyTm9UdGwgPSB7XG4gICAgICAgICAgICAgICAgICAgIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnB1dChrZXksIHZhbHVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0KGtleSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZW1vdmU6IHNlbGYucmVtb3ZlLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGw6IHNlbGYucmVtb3ZlQWxsLFxuICAgICAgICAgICAgICAgICAgICBpbmZvOiBzZWxmLmluZm9cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgZGF0YSBmb3IgdGhlIGdpdmVuIGtleS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0RGF0YUZvcktleSAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSA9IGNhY2hlW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlRGF0YUF0dHIgPSBjYWNoZVVzZURhdGFBdHRyW2tleV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhRm9yRW50cnkoZW50cnksIHVzZURhdGFBdHRyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGNhY2hlIGRhdGEgZm9yIHRoZSBnaXZlbiBjYWNoZSBlbnRyeS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXNlRGF0YUF0dHJcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXREYXRhRm9yRW50cnkgKHZhbHVlLCB1c2VEYXRhQXR0cikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgPSB2YWx1ZVsxXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlRGF0YUF0dHIgJiYgb3B0aW9ucy5kYXRhQXR0ciAmJiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVtvcHRpb25zLmRhdGFBdHRyXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTZXRzIHRoZSBjYWNoZSBkYXRhIGZvciB0aGUgZ2l2ZW4ga2V5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbmV3RGF0YVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHNldERhdGFGb3JLZXkgKGtleSwgbmV3RGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkgPSBjYWNoZVtrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5VXNlRGF0YUF0dHIgPSBjYWNoZVVzZURhdGFBdHRyW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlEYXRhID0gZW50cnlbMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeVVzZURhdGFBdHRyICYmIG9wdGlvbnMuZGF0YUF0dHIgJiYgZW50cnlEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlEYXRhW29wdGlvbnMuZGF0YUF0dHJdID0gbmV3RGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5RGF0YSA9IG5ld0RhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5WzFdID0gZW50cnlEYXRhO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCB1bml4IGVwb2NoIGluIHNlY29uZHMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2ludH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRDdXJyZW50VGltZXN0YW1wICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIHRpbWVzdGFtcCBmb3IgdGhlIGdpdmVuIGtleSB0byB0aGUgY3VycmVudCB1bml4IGVwb2NoIGluIHNlY29uZHMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHtpbnR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gY3JlYXRlT3JVcGRhdGVUaW1lc3RhbXAgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYWNoZVRpbWVzdGFtcHNba2V5XSA9IGdldEN1cnJlbnRUaW1lc3RhbXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiB0aGUgY2FjaGUgZW50cnkgZm9yIHRoZSBnaXZlbiBrZXkgaXMgc3RpbGwgYWxpdmUuIEFsc28gcmV0dXJuc1xuICAgICAgICAgICAgICAgICAqIGBmYWxzZWAgaWYgdGhlcmUgaXMgbm8gY2FjaGUgZW50cnkgZm9yIHRoZSBnaXZlbiBrZXkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzRW50cnlBbGl2ZSAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeUFnZSA9IGdldEN1cnJlbnRUaW1lc3RhbXAoKSAtIGNhY2hlVGltZXN0YW1wc1trZXldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW50cnlBZ2UgPD0gb3B0aW9ucy50dGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGFrZXMgYSBuZXcgY2FjaGUgZW50cnkgYW5kIHJlZnJlc2hlcyB0aGUgZXhpc3RpbmcgaW5zdGFuY2VzIG9mIHRoZSBlbnRyeSwgbWF0Y2hpbmcgYnkgdGhlXG4gICAgICAgICAgICAgICAgICogYHBrQXR0cmAgdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG5ld0RhdGFcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiByZWZyZXNoU2luZ2xlIChuZXdEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsQXR0ciA9IG9wdGlvbnMudXJsQXR0cjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpbnNlcnRzIHRoZSBkYXRhIG9uIHRoZSBjYWNoZSBhcyBpbmRpdmlkdWFsIGVudHJ5LCBpZiB3ZSBoYXZlIHRoZSBVUkwgaW5mb3JtYXRpb24gb24gdGhlIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVybEF0dHIgJiYgbmV3RGF0YSAmJiBuZXdEYXRhW3VybEF0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmluc2VydChuZXdEYXRhW3VybEF0dHJdLCBuZXdEYXRhLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBjYWNoZUlzTWFuYWdlZFtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5ID0gY2FjaGVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlVc2VEYXRhQXR0ciA9IGNhY2hlVXNlRGF0YUF0dHJba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlEYXRhID0gZ2V0RGF0YUZvckVudHJ5KGVudHJ5LCBlbnRyeVVzZURhdGFBdHRyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNMaXN0ID0gYW5ndWxhci5pc0FycmF5KGVudHJ5RGF0YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZWZyZXNoIHRoZSBvYmplY3RzIG1hdGNoaW5nIHRoZSBuZXcgb2JqZWN0IHdpdGhpbiB0aGUgbGlzdCBlbnRyaWVzIGluIHRoZSBjYWNoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyeURhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeURhdGFbaV1bcGtBdHRyXSA9PT0gbmV3RGF0YVtwa0F0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkaXRpb25hbGx5IGNvbXBhcmUgdGhlIGB1cmxBdHRyYCwgaWYgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1cmxBdHRyIHx8ICh1cmxBdHRyICYmIGVudHJ5RGF0YVtpXVt1cmxBdHRyXSA9PT0gbmV3RGF0YVt1cmxBdHRyXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlEYXRhW2ldID0gbmV3RGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGNhY2hlIGVudHJ5IHdpdGggdGhlIG5ldyBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERhdGFGb3JLZXkoa2V5LCBlbnRyeURhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZWZyZXNoIHRoZSBvYmplY3RzIG1hdGNoaW5nIHRoZSBuZXcgb2JqZWN0IGluIHRoZSBjYWNoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlEYXRhW3BrQXR0cl0gPT09IG5ld0RhdGFbcGtBdHRyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkaXRpb25hbGx5IGNvbXBhcmUgdGhlIGB1cmxBdHRyYCwgaWYgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXVybEF0dHIgfHwgKHVybEF0dHIgJiYgZW50cnlEYXRhW3VybEF0dHJdID09PSBuZXdEYXRhW3VybEF0dHJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERhdGFGb3JLZXkoa2V5LCBuZXdEYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBvYmplY3QgZW50cmllcyB3ZSBjYW4gdXBkYXRlIHRoZSBlbnRyaWVzIHRpbWVzdGFtcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU9yVXBkYXRlVGltZXN0YW1wKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZWZyZXNoZXMgZWFjaCBlbnRyeSBpbiB0aGUgZ2l2ZW4gbGlzdCB1c2luZyB0aGUgYHJlZnJlc2hTaW5nbGVgIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IG5ld0VudHJpZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiByZWZyZXNoRWFjaCAobmV3RW50cmllcykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5ld0VudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTaW5nbGUobmV3RW50cmllc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJbml0aWFsaXplcyB0aGUgY2FjaGUgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIGdpdmVuIG5hbWUgaXMgbm90IHVzZWQgeWV0XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZXMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiTmFtZSAnXCIgKyBuYW1lICsgXCInIGlzIGFscmVhZHkgdXNlZCBieSBhbm90aGVyIGNhY2hlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlc1tuYW1lXSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGxzIHRoZSByZW1vdmVBbGwgbWV0aG9kIG9uIGFsbCBtYW5hZ2VkIGNhY2hlcy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlc1trZXldLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXRzIHRoZSBjYWNoZSB3aXRoIHRoZSBnaXZlbiBuYW1lLCBvciBudWxsLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7KnxudWxsfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhY2hlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZXNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBDYWNoZSAnXCIgKyBrZXkgKyBcIicgZG9lcyBub3QgZXhpc3QuXCIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldHMgdGhlIGNhY2hlIGluZm9ybWF0aW9uIGZvciBhbGwgbWFuYWdlZCBjYWNoZXMgYXMgbWFwcGluZyBvZiBjYWNoZUlkIHRvIHRoZSByZXN1bHRcbiAgICAgICAgICAgICAqIG9mIHRoZSBpbmZvIG1ldGhvZCBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHt7fX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29uc3RydWN0b3IuaW5mbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgaW5mb3MgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvID0gY2FjaGVzW2tleV0uaW5mbygpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvc1tpbmZvLmlkXSA9IGluZm87XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaW5mb3M7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbGxlY3RzIGFsbCBkZXBlbmRlbnQgY2FjaGVzIG9mIHRoZSBnaXZlbiBjYWNoZSwgaW5jbHVkaW5nIHRoZSBkZXBlbmRlbnQgY2FjaGVzIG9mIHRoZSBkZXBlbmRlbnRcbiAgICAgICAgICAgICAqIGNhY2hlcyAoYW5kIHNvIG9uIC4uLikuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVTZXJ2aWNlXG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGNhY2hlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFN0cmluZz58dW5kZWZpbmVkfSBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXk8U3RyaW5nPn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gY29sbGVjdERlcGVuZGVudENhY2hlTmFtZXMgKGNhY2hlLCBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lcyA9IGNhY2hlLmluZm8oKVsnb3B0aW9ucyddWydkZXBlbmRlbnQnXTtcblxuICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgYGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXNgIHRvIGVtcHR5IGxpc3RcbiAgICAgICAgICAgICAgICBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzID0gY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcyB8fCBbXTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWUgPSBjYWNoZURlcGVuZGVudENhY2hlTmFtZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZURlcGVuZGVudENhY2hlID0gY2FjaGVzW2NhY2hlRGVwZW5kZW50Q2FjaGVOYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVEZXBlbmRlbnRDYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHVzaCBjYWNoZSBuYW1lIHRvIHRoZSBjb2xsZWN0ZWQgZGVwZW5kZW50IGNhY2hlcywgaWYgZXhpc3RpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMucHVzaChjYWNoZURlcGVuZGVudENhY2hlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgY29sbGVjdCBjYWNoZSBkZXBlbmRlbmNpZXMgaWYgbm90IGFscmVhZHkgY29sbGVjdGVkLCB0byBwcmV2ZW50IGNpcmNsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzLmluZGV4T2YoY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3REZXBlbmRlbnRDYWNoZU5hbWVzKGNhY2hlRGVwZW5kZW50Q2FjaGUsIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xuICAgICAgICB9XG4gICAgKTtcbn0pKCk7XG4iLCIvKipcbiAqIEFuZ3VsYXIgUmVzb3VyY2VGYWN0b3J5U2VydmljZVxuICogQ29weXJpZ2h0IDIwMTYgQW5kcmVhcyBTdG9ja2VyXG4gKiBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZFxuICogZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4gKiByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGVcbiAqIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEVcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuICogT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXJcbiAgICAgICAgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ25nUmVzb3VyY2VGYWN0b3J5Jyk7XG5cbiAgICAvKipcbiAgICAgKiBGYWN0b3J5IHNlcnZpY2UgdG8gY3JlYXRlIG5ldyByZXNvdXJjZSBjbGFzc2VzLlxuICAgICAqXG4gICAgICogQG5hbWUgUmVzb3VyY2VGYWN0b3J5U2VydmljZVxuICAgICAqIEBuZ2RvYyBmYWN0b3J5XG4gICAgICogQHBhcmFtIHtzZXJ2aWNlfSAkcVxuICAgICAqIEBwYXJhbSB7c2VydmljZX0gJHJlc291cmNlXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZUNhY2hlU2VydmljZX0gUmVzb3VyY2VDYWNoZVNlcnZpY2UgRGVmYXVsdCBjYWNoZSBzZXJ2aWNlXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50fSBSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50IERlZmF1bHQgcGhhbnRvbSBJRCBnZW5lcmF0b3JcbiAgICAgKi9cbiAgICBtb2R1bGUuZmFjdG9yeSgnUmVzb3VyY2VGYWN0b3J5U2VydmljZScsXG4gICAgICAgIGZ1bmN0aW9uICgkcSxcbiAgICAgICAgICAgICAgICAgICRyZXNvdXJjZSxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlQ2FjaGVTZXJ2aWNlLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2VQaGFudG9tSWROZWdhdGl2ZUludCkge1xuICAgICAgICAgICAgJ25nSW5qZWN0JztcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBuYW1lIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICogQG5nZG9jIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSByZXNvdXJjZSBzZXJ2aWNlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIFVSTCB0byB0aGUgcmVzb3VyY2VcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobmFtZSwgdXJsLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogT3B0aW9ucyBmb3IgdGhlIHJlc291cmNlXG4gICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBvcHRpb25zID0gYW5ndWxhci5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogT3B0aW9uIHRvIHN0cmlwIHRyYWlsaW5nIHNsYXNoZXMgZnJvbSByZXF1ZXN0IFVSTHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzdHJpcFRyYWlsaW5nU2xhc2hlczogZmFsc2UsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE9wdGlvbiB0byBpZ25vcmUgdGhlIHJlc291cmNlIGZvciBhdXRvbWF0aWMgbG9hZGluZyBiYXJzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0JhcjogZmFsc2UsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEdlbmVyYXRlIElEcyBmb3IgcGhhbnRvbSByZWNvcmRzIGNyZWF0ZWQgdmlhIHRoZSBgbmV3YFxuICAgICAgICAgICAgICAgICAgICAgKiBtZXRob2Qgb24gdGhlIHJlc291cmNlIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZVBoYW50b21JZHM6IHRydWUsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFBoYW50b20gSUQgZ2VuZXJhdG9yIGluc3RhbmNlIHRvIHVzZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7UmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcGhhbnRvbUlkR2VuZXJhdG9yOiBSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBMaXN0IG9mIHJlc291cmNlIHNlcnZpY2VzIHRvIGNsZWFuIHRoZSBjYWNoZSBmb3IsIG9uIG1vZGlmeWluZyByZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXk8U3RyaW5nPn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGRlcGVuZGVudDogW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEV4dHJhIG1ldGhvZHMgdG8gcHV0IG9uIHRoZSByZXNvdXJjZSBzZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBleHRyYU1ldGhvZHM6IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBFeHRyYSBmdW5jdGlvbnMgdG8gcHV0IG9uIHRoZSByZXNvdXJjZSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGV4dHJhRnVuY3Rpb25zOiB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQXR0cmlidXRlIG5hbWUgd2hlcmUgdG8gZmluZCB0aGUgSUQgb2Ygb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcGtBdHRyOiAncGsnLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBBdHRyaWJ1dGUgbmFtZSB3aGVyZSB0byBmaW5kIHRoZSBVUkwgb2Ygb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdXJsQXR0cjogJ3VybCcsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRvIGZpbmQgdGhlIGRhdGEgb24gdGhlIHF1ZXJ5IGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcXVlcnlEYXRhQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQXR0cmlidXRlIG5hbWUgd2hlcmUgdG8gZmluZCB0aGUgdG90YWwgYW1vdW50IG9mIGRhdGEgb24gdGhlIHF1ZXJ5IGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcXVlcnlUb3RhbEF0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFN0b3JhZ2UgZm9yIHRoZSBxdWVyeSBmaWx0ZXJzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcXVlcnlGaWx0ZXI6IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBGdW5jdGlvbiB0byBwb3N0LXByb2Nlc3MgZGF0YSBjb21pbmcgZnJvbSByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gb2JqXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHRvSW50ZXJuYWw6IGZ1bmN0aW9uIChvYmosIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRnVuY3Rpb24gdG8gcG9zdC1wcm9jZXNzIGRhdGEgdGhhdCBpcyBnb2luZyB0byBiZSBzZW50XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBvYmpcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGZyb21JbnRlcm5hbDogZnVuY3Rpb24gKG9iaiwgaGVhZGVyc0dldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xuXG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBEZWZhdWx0IHBhcmFtZXRlciBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtc0RlZmF1bHRzID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFBhcmFtZXRlciBjb25maWd1cmF0aW9uIGZvciBzYXZlIChpbnNlcnQpLiBVc2VkIHRvXG4gICAgICAgICAgICAgICAgICAgICAqIGRpc2FibGUgdGhlIFBLIHVybCB0ZW1wbGF0ZSBmb3Igc2F2ZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzYXZlUGFyYW1zID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBjYWNoZSBpbnN0YW5jZSBmb3IgdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7UmVzb3VyY2VDYWNoZVNlcnZpY2V9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjYWNoZSA9IG5ldyBSZXNvdXJjZUNhY2hlU2VydmljZShuYW1lLCBvcHRpb25zLnBrQXR0ciwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUF0dHI6IG9wdGlvbnMucXVlcnlEYXRhQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBrQXR0cjogb3B0aW9ucy5wa0F0dHIsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmxBdHRyOiBvcHRpb25zLnVybEF0dHIsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbnQ6IG9wdGlvbnMuZGVwZW5kZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgdHRsOiAxNSAqIDYwXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBJbnRlcmNlcHRvciB0aGF0IHB1dHMgdGhlIHJldHVybmVkIG9iamVjdCBvbiB0aGUgY2FjaGUgYW4gaW52YWxpZGF0ZXMgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGRlcGVuZGVudCByZXNvdXJjZSBzZXJ2aWNlcyBjYWNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRpbmdJbnRlcmNlcHRvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IG9wdGlvbnMudXJsQXR0ciA/IGRhdGFbb3B0aW9ucy51cmxBdHRyXSA6IHJlc3BvbnNlLmNvbmZpZy51cmw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxMaXN0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbERlcGVuZGVudCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBJbnNlcnQgdGhlIGNhY2hlZCBvYmplY3QgaWYgd2UgaGF2ZSBhbiBVUkwgb24gdGhlIHJldHVybmVkIGluc3RhbmNlLiBFbHNlIHdlIGhhdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0byBpbnZhbGlkYXRlIHRoZSB3aG9sZSBvYmplY3QgY2FjaGUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbnNlcnQodXJsLCBkYXRhLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxPYmplY3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBJbnRlcmNlcHRvciB0aGF0IHB1dHMgdGhlIHJldHVybmVkIG9iamVjdCBvbiB0aGUgY2FjaGUgYW4gaW52YWxpZGF0ZXMgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGRlcGVuZGVudCByZXNvdXJjZSBzZXJ2aWNlcyBjYWNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnlpbmdJbnRlcmNlcHRvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IG9wdGlvbnMudXJsQXR0ciA/IGRhdGFbb3B0aW9ucy51cmxBdHRyXSA6IHJlc3BvbnNlLmNvbmZpZy51cmw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxMaXN0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbERlcGVuZGVudCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBVcGRhdGUgdGhlIGNhY2hlZCBvYmplY3QgaWYgd2UgaGF2ZSBhbiBVUkwgb24gdGhlIHJldHVybmVkIGluc3RhbmNlLiBFbHNlIHdlIGhhdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0byBpbnZhbGlkYXRlIHRoZSB3aG9sZSBvYmplY3QgY2FjaGUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbnNlcnQodXJsLCBkYXRhLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxPYmplY3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBJbnRlcmNlcHRvciB0aGF0IHJlbW92ZXMgdGhlIGNhY2hlIGZvciB0aGUgZGVsZXRlZCBvYmplY3QsIHJlbW92ZXMgYWxsIGxpc3QgY2FjaGVzLCBhbmRcbiAgICAgICAgICAgICAgICAgICAgICogaW52YWxpZGF0ZXMgdGhlIGRlcGVuZGVudCByZXNvdXJjZSBzZXJ2aWNlcyBjYWNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBkZWxldGluZ0ludGVyY2VwdG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gcmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gb3B0aW9ucy51cmxBdHRyID8gZGF0YVtvcHRpb25zLnVybEF0dHJdIDogcmVzcG9uc2UuY29uZmlnLnVybDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbExpc3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsRGVwZW5kZW50KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFJlbW92ZSB0aGUgY2FjaGVkIG9iamVjdCBpZiB3ZSBoYXZlIGFuIFVSTCBvbiB0aGUgcmV0dXJuZWQgaW5zdGFuY2UuIEVsc2Ugd2UgaGF2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHRvIGludmFsaWRhdGUgdGhlIHdob2xlIG9iamVjdCBjYWNoZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZSh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsT2JqZWN0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogUGFyc2VzIHRoZSByZXNwb25zZSB0ZXh0IGFzIEpTT04gYW5kIHJldHVybnMgaXQgYXMgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVzcG9uc2VUZXh0XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fEFycmF5fHN0cmluZ3xudW1iZXJ9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uID0gZnVuY3Rpb24gKHJlc3BvbnNlVGV4dCwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IERlc2VyaWFsaXplIGRhdGEuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VUZXh0ID8gYW5ndWxhci5mcm9tSnNvbihyZXNwb25zZVRleHQpIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbHMgdGhlIGB0b0ludGVybmFsYCBmdW5jdGlvbiBvbiBlYWNoIG9iamVjdCBvZiB0aGUgcmVzcG9uc2UgYXJyYXkuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXNwb25zZURhdGFcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWwgPSBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogUG9zdC1wcm9jZXNzIHF1ZXJ5IGRhdGEgZm9yIGludGVybmFsIHVzZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGUgb3ZlciB0aGUgcmVzcG9uc2UgZGF0YSwgaWYgaXQgd2FzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KHJlc3BvbnNlRGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3BvbnNlRGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZURhdGFbaV0gPSBvcHRpb25zLnRvSW50ZXJuYWwocmVzcG9uc2VEYXRhW2ldLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsc2UganVzdCBjYWxsIHRoZSBgdG9JbnRlcm5hbGAgZnVuY3Rpb24gb24gdGhlIHJlc3BvbnNlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VEYXRhID0gb3B0aW9ucy50b0ludGVybmFsKHJlc3BvbnNlRGF0YSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbHMgdGhlIGB0b0ludGVybmFsYCBmdW5jdGlvbiBvbiB0aGUgcmVzcG9uc2UgZGF0YSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXNwb25zZURhdGFcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsID0gZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IFBvc3QtcHJvY2VzcyBkYXRhIGZvciBpbnRlcm5hbCB1c2UuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy50b0ludGVybmFsKHJlc3BvbnNlRGF0YSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVHJhbnNmb3JtcyBxdWVyeSByZXNwb25zZXMgdG8gZ2V0IHRoZSBhY3R1YWwgZGF0YSBmcm9tIHRoZSBgcXVlcnlEYXRhQXR0cmAgb3B0aW9uLCBpZlxuICAgICAgICAgICAgICAgICAgICAgKiBjb25maWd1cmVkLiBBbHNvIHNldHMgdGhlIGB0b3RhbGAgYXR0cmlidXRlIG9uIHRoZSBsaXN0IGlmIGBxdWVyeVRvdGFsQXR0cmAgaXMgY29uZmlndXJlZC5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlc3BvbnNlRGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlRGF0YSA9IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IGRhdGEgb24gc3VjY2VzcyBzdGF0dXMgZnJvbSBgcXVlcnlEYXRhQXR0cmAsIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgZGF0YSBmcm9tIHRoZSBgcXVlcnlEYXRhQXR0cmAsIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5xdWVyeURhdGFBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogR2V0IGRhdGEgZnJvbSAnXCIgKyBvcHRpb25zLnF1ZXJ5RGF0YUF0dHIgKyBcIicgYXR0cmlidXRlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGRhdGEgZnJvbSB0aGUgY29uZmlndXJlZCBgcXVlcnlEYXRhQXR0cmAgb25seSBpZiB3ZSBoYXZlIGEgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIHdlIGp1c3Qgd2FudCB0aGUgcmVzdWx0IHRvIGJlIHRoZSByZXNwb25zZSBkYXRhLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXNwb25zZURhdGFbb3B0aW9ucy5xdWVyeURhdGFBdHRyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3BvbnNlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBubyBkYXRhIGBxdWVyeURhdGFBdHRyYCBpcyBkZWZpbmVkLCB1c2UgdGhlIHJlc3BvbnNlIGRhdGEgZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzcG9uc2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgdG90YWwgZnJvbSB0aGUgYHF1ZXJ5VG90YWxBdHRyYCwgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnF1ZXJ5VG90YWxBdHRyICYmIHJlc3BvbnNlRGF0YSAmJiByZXNwb25zZURhdGFbb3B0aW9ucy5xdWVyeVRvdGFsQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBHZXQgdG90YWwgZnJvbSAnXCIgKyBvcHRpb25zLnF1ZXJ5VG90YWxBdHRyICsgXCInIGF0dHJpYnV0ZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsID0gcmVzcG9uc2VEYXRhW29wdGlvbnMucXVlcnlUb3RhbEF0dHJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9uIGFueSBvdGhlciBzdGF0dXMganVzdCByZXR1cm4gdGhlIHJlc3BvbmRlZCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3BvbnNlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU2VyaWFsaXplcyB0aGUgcmVxdWVzdCBkYXRhIGFzIEpTT04gYW5kIHJldHVybnMgaXQgYXMgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVxdWVzdERhdGFcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvbiA9IGZ1bmN0aW9uIChyZXF1ZXN0RGF0YSwgaGVhZGVyc0dldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBTZXJpYWxpemUgZGF0YS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclByaXZhdGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoa2V5KVswXSA9PT0gJyQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5cyA9IGFuZ3VsYXIuaXNPYmplY3QocmVxdWVzdERhdGEpID8gT2JqZWN0LmtleXMocmVxdWVzdERhdGEpIDogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZUtleXMgPSBrZXlzLmZpbHRlcihmaWx0ZXJQcml2YXRlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcml2YXRlS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXF1ZXN0RGF0YVtwcml2YXRlS2V5c1tpXV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLnRvSnNvbihyZXF1ZXN0RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxzIHRoZSBgZnJvbUludGVybmFsYCBmdW5jdGlvbiBvbiB0aGUgcmVxdWVzdCBkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlcXVlc3REYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsID0gZnVuY3Rpb24gKHJlcXVlc3REYXRhLCBoZWFkZXJzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IFBvc3QtcHJvY2VzcyBkYXRhIGZvciBleHRlcm5hbCB1c2UuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mcm9tSW50ZXJuYWwoYW5ndWxhci5jb3B5KHJlcXVlc3REYXRhKSwgaGVhZGVyc0dldHRlcik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1ldGhvZCBjb25maWd1cmF0aW9uIGZvciB0aGUgbmctcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBjYWNoZS53aXRob3V0RGF0YUF0dHJOb1R0bCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlLndpdGhvdXREYXRhQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXROb0NhY2hlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlLndpdGhEYXRhQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeU5vQ2FjaGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3I6IGluc2VydGluZ0ludGVyY2VwdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvcjogbW9kaWZ5aW5nSW50ZXJjZXB0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvcjogZGVsZXRpbmdJbnRlcmNlcHRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIGV4dGVuZCB0aGUgbWV0aG9kcyB3aXRoIHRoZSBnaXZlbiBleHRyYSBtZXRob2RzXG4gICAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQobWV0aG9kcywgb3B0aW9ucy5leHRyYU1ldGhvZHMpO1xuXG4gICAgICAgICAgICAgICAgLy8gb2ZmZXIgbWV0aG9kcyBmb3IgcXVlcnlpbmcgd2l0aG91dCBhIGxvYWRpbmcgYmFyICh1c2luZyBhICdCZycgc3VmZml4KVxuICAgICAgICAgICAgICAgIGZvciAodmFyIG1ldGhvZE5hbWUgaW4gbWV0aG9kcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kcy5oYXNPd25Qcm9wZXJ0eShtZXRob2ROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmdNZXRob2ROYW1lID0gbWV0aG9kTmFtZSArICdCZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmdNZXRob2RDb25maWcgPSBhbmd1bGFyLmNvcHkobWV0aG9kc1ttZXRob2ROYW1lXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJnTWV0aG9kQ29uZmlnLmlnbm9yZUxvYWRpbmdCYXIgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2RzW2JnTWV0aG9kTmFtZV0gPSBiZ01ldGhvZENvbmZpZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGJ1aWxkIHRoZSBkZWZhdWx0IHBhcmFtcyBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgcGFyYW1zRGVmYXVsdHNbb3B0aW9ucy5wa0F0dHJdID0gJ0AnICsgb3B0aW9ucy5wa0F0dHI7XG4gICAgICAgICAgICAgICAgc2F2ZVBhcmFtc1tvcHRpb25zLnBrQXR0cl0gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgbWV0aG9kcy5zYXZlLnBhcmFtcyA9IHNhdmVQYXJhbXM7XG5cbiAgICAgICAgICAgICAgICAvLyBidWlsZCB0aGUgcmVzb3VyY2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSAkcmVzb3VyY2UodXJsLCBwYXJhbXNEZWZhdWx0cywgbWV0aG9kcywge1xuICAgICAgICAgICAgICAgICAgICBzdHJpcFRyYWlsaW5nU2xhc2hlczogb3B0aW9ucy5zdHJpcFRyYWlsaW5nU2xhc2hlc1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgUEsgYXR0cmlidXRlIG5hbWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRQa0F0dHIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnBrQXR0cjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgZGF0YSBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldERhdGFBdHRyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5kYXRhQXR0cjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmV0dXJucyBhbiBvYmplY3QgaG9sZGluZyB0aGUgZmlsdGVyIGRhdGEgZm9yIHF1ZXJ5IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRRdWVyeUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnF1ZXJ5RmlsdGVyO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTZXRzIHRoZSBvYmplY3QgaG9sZGluZyB0aGUgZmlsdGVyIGRhdGEgZm9yIHF1ZXJ5IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZmlsdGVyc1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLnNldFF1ZXJ5RmlsdGVycyA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoZmlsdGVycywgb3B0aW9ucy5xdWVyeUZpbHRlcik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIGdpdmVuIGZpbHRlciBvcHRpb25zIGlmIHRoZSBhcmVuJ3QgYWxyZWFkeSBzZXQgb24gdGhlIGZpbHRlciBvYmplY3RcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZGVmYXVsdEZpbHRlcnNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5zZXREZWZhdWx0UXVlcnlGaWx0ZXJzID0gZnVuY3Rpb24gKGRlZmF1bHRGaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVycyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBkZWZhdWx0RmlsdGVycywgb3B0aW9ucy5xdWVyeUZpbHRlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShmaWx0ZXJzLCBvcHRpb25zLnF1ZXJ5RmlsdGVyKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUXVlcmllcyB0aGUgcmVzb3VyY2Ugd2l0aCB0aGUgY29uZmlndXJlZCBmaWx0ZXJzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnMgPSBhbmd1bGFyLmV4dGVuZCh7fSwgcmVzb3VyY2UuZ2V0UXVlcnlGaWx0ZXJzKCksIGZpbHRlcnMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UucXVlcnkoZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFF1ZXJpZXMgdGhlIHJlc291cmNlIHdpdGggdGhlIGNvbmZpZ3VyZWQgZmlsdGVycyB3aXRob3V0IHVzaW5nIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5maWx0ZXJOb0NhY2hlID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVycyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCByZXNvdXJjZS5nZXRRdWVyeUZpbHRlcnMoKSwgZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5xdWVyeU5vQ2FjaGUoZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLm5ldyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFudG9tSW5zdGFuY2UgPSBuZXcgcmVzb3VyY2UocGFyYW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBwaGFudG9tIElEIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucGtBdHRyICYmIG9wdGlvbnMuZ2VuZXJhdGVQaGFudG9tSWRzICYmIG9wdGlvbnMucGhhbnRvbUlkR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFudG9tSW5zdGFuY2Vbb3B0aW9ucy5wa0F0dHJdID0gb3B0aW9ucy5waGFudG9tSWRHZW5lcmF0b3IuZ2VuZXJhdGUocGhhbnRvbUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwaGFudG9tSW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gaW5zdGFuY2UgaXMgYSBwaGFudG9tIGluc3RhbmNlIChpbnN0YW5jZSBub3QgcGVyc2lzdGVkIHRvIHRoZSBSRVNUIEFQSSB5ZXQpXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbnx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaXNQaGFudG9tID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcGtWYWx1ZSA9IGluc3RhbmNlID8gaW5zdGFuY2Vbb3B0aW9ucy5wa0F0dHJdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHBoYW50b20gSUQgaWYgYWxsIGNvbmZpZ3VyZWQgY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnBrQXR0ciAmJiBvcHRpb25zLmdlbmVyYXRlUGhhbnRvbUlkcyAmJiBvcHRpb25zLnBoYW50b21JZEdlbmVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMucGhhbnRvbUlkR2VuZXJhdG9yLmlzUGhhbnRvbShwa1ZhbHVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgZnJvbSB0aGUgZ2l2ZW4gaW5zdGFuY2VzIHdoZXJlIHRoZSBnaXZlbiBhdHRyaWJ1dGUgbmFtZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICogdGhlIGdpdmVuIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGF0dHJOYW1lXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGF0dHJWYWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmZpbHRlckluc3RhbmNlc0J5QXR0ciA9IGZ1bmN0aW9uIChpbnN0YW5jZXMsIGF0dHJOYW1lLCBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJBdHRyVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtID8gaXRlbVthdHRyTmFtZV0gPT0gYXR0clZhbHVlIDogZmFsc2U7IC8vIHVzZSA9PSBoZXJlIHRvIG1hdGNoICcxMjMnIHRvIDEyM1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VzLmZpbHRlcihmaWx0ZXJBdHRyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBmaXJzdCBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBpbnN0YW5jZXMgd2hlcmUgdGhlIGdpdmVuIGF0dHJpYnV0ZSBuYW1lIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgKiB0aGUgZ2l2ZW4gYXR0cmlidXRlIHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXR0ck5hbWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXR0clZhbHVlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5QXR0ciA9IGZ1bmN0aW9uIChpbnN0YW5jZXMsIGF0dHJOYW1lLCBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRJbnN0YW5jZXMgPSByZXNvdXJjZS5maWx0ZXJJbnN0YW5jZXNCeUF0dHIoaW5zdGFuY2VzLCBhdHRyTmFtZSwgYXR0clZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyZWRJbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyZWRJbnN0YW5jZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IEZvdW5kIG1vcmUgdGhhbiAxIGluc3RhbmNlcyB3aGVyZSAnXCIgKyBhdHRyTmFtZSArIFwiJyBpcyAnXCIgKyBhdHRyVmFsdWUgKyBcIicgb24gZ2l2ZW4gJ1wiICsgbmFtZSArIFwiJyBpbnN0YW5jZXMuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBmaWx0ZXJlZEluc3RhbmNlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGZpcnN0IGluc3RhbmNlIGZyb20gdGhlIGdpdmVuIGluc3RhbmNlcyB3aGVyZSB0aGUgUEsgYXR0cmlidXRlIGhhcyB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa1ZhbHVlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5UGsgPSBmdW5jdGlvbiAoaW5zdGFuY2VzLCBwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5QXR0cihpbnN0YW5jZXMsIG9wdGlvbnMucGtBdHRyLCBwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldFJlc291cmNlTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgc3RvcmUgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Jlc291cmNlU3RvcmV9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuY3JlYXRlU3RvcmUgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzb3VyY2VTdG9yZShyZXNvdXJjZSwgaW5zdGFuY2VzLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2F2ZXMgdGhlIGdpdmVuIHJlc291cmNlIGluc3RhbmNlIHRvIHRoZSBSRVNUIEFQSS4gVXNlcyB0aGUgYCRzYXZlYCBtZXRob2QgaWYgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBpcyBwaGFudG9tLCBlbHNlIHRoZSBgJHVwZGF0ZWAgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbcGFyYW1zXVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UucGVyc2lzdCA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBgaW5zdGFuY2VgIGhhcyBhIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlID0gaW5zdGFuY2UgfHwge307XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlRm4gPSByZXNvdXJjZS5pc1BoYW50b20oaW5zdGFuY2UpID8gcmVzb3VyY2Uuc2F2ZSA6IHJlc291cmNlLnVwZGF0ZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2F2ZUZuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2F2ZUZuKHt9LCBpbnN0YW5jZSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBPYmplY3QgdG8gcGVyc2lzdCBpcyBub3QgYSB2YWxpZCByZXNvdXJjZSBpbnN0YW5jZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCA9ICRxLnJlamVjdChpbnN0YW5jZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdC4kcHJvbWlzZSA9IHJlamVjdDsgLy8gZmFrZSBwcm9taXNlIEFQSSBvZiByZXNvdXJjZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogQWRkIHNvbWUgb2YgdGhlIHJlc291cmNlIG1ldGhvZHMgYXMgaW5zdGFuY2UgbWV0aG9kcyBvbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBwcm90b3R5cGUgb2YgdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHJlc291cmNlLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU2F2ZXMgb3IgdXBkYXRlcyB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgJHBlcnNpc3Q6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc291cmNlLnBlcnNpc3QodGhpcywgcGFyYW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC4kcHJvbWlzZSB8fCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiBpbnN0YW5jZSBpcyBhIHBoYW50b20gcmVjb3JkIChub3Qgc2F2ZWQgdmlhIHRoZSBSRVNUIEFQSSB5ZXQpXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAkaXNQaGFudG9tOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UuaXNQaGFudG9tKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEFkZCBleHRyYSBmdW5jdGlvbnMgYXMgaW5zdGFuY2UgbWV0aG9kcyBvbiB0aGUgcHJvdG90eXBlIG9mXG4gICAgICAgICAgICAgICAgICogdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHJlc291cmNlLnByb3RvdHlwZSwgb3B0aW9ucy5leHRyYUZ1bmN0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBhIHJlc291cmNlIHN0b3JlLiBBIHJlc291cmNlIHN0b3JlIG1hbmFnZXMgaW5zZXJ0cywgdXBkYXRlcyBhbmRcbiAgICAgICAgICAgICAqIGRlbGV0ZXMgb2YgaW5zdGFuY2VzLCBjYW4gY3JlYXRlIHN1Yi1zdG9yZXMgdGhhdCBjb21taXQgY2hhbmdlcyB0byB0aGUgcGFyZW50IHN0b3JlLCBhbmRcbiAgICAgICAgICAgICAqIHNldHMgdXAgcmVsYXRpb25zIGJldHdlZW4gcmVzb3VyY2UgdHlwZXMgKGUuZy4gdG8gdXBkYXRlIHJlZmVyZW5jZSBrZXlzKS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSByZXNvdXJjZVxuICAgICAgICAgICAgICogQHBhcmFtIG1hbmFnZWRJbnN0YW5jZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSBwYXJlbnRTdG9yZVxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIFJlc291cmNlU3RvcmUgKHJlc291cmNlLCBtYW5hZ2VkSW5zdGFuY2VzLCBwYXJlbnRTdG9yZSkge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBzZWxmID0gdGhpcyxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTmFtZSBvZiB0aGUgcmVzb3VyY2Ugc2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VOYW1lID0gcmVzb3VyY2UuZ2V0UmVzb3VyY2VOYW1lKCksXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEluZGljYXRvciBmb3IgcnVubmluZyBleGVjdXRpb24gKHN0b3BzIGFub3RoZXIgZXhlY3V0aW9uIGZyb20gYmVpbmcgaXNzdWVkKVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvblJ1bm5pbmcgPSBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ29udGFpbnMgcmVsYXRpb25zIHRvIG90aGVyIHN0b3JlcyAoZm9yIHVwZGF0aW5nIHJlZmVyZW5jZXMpXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheTxSZXNvdXJjZVN0b3JlUmVsYXRpb24+fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFN0b3JlcyByZXNvdXJjZSBpdGVtcyB0aGF0IGFyZSB2aXNpYmxlIGZvciB0aGUgdXNlciAobm90IHF1ZXVlZCBmb3IgcmVtb3ZlKVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlUXVldWUgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU3RvcmVzIHJlc291cmNlIGl0ZW1zIHF1ZXVlZCBmb3IgcGVyc2lzdGluZyAoc2F2ZSBvciB1cGRhdGUpXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBlcnNpc3RRdWV1ZSA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTdG9yZXMgcmVzb3VyY2UgaXRlbXMgcXVldWVkIGZvciBkZWxldGluZ1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVRdWV1ZSA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxsYmFja3MgZXhlY3V0ZWQgYmVmb3JlIGVhY2ggaXRlbSBwZXJzaXN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBhZnRlciBlYWNoIGl0ZW0gcGVyc2lzdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBiZWZvcmUgZWFjaCBpdGVtIHJlbW92ZXNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgYmVmb3JlUmVtb3ZlTGlzdGVuZXJzID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBhZnRlciBlYWNoIGl0ZW0gcmVtb3Zlc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBhZnRlclJlbW92ZUxpc3RlbmVycyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogTWFuYWdlIGdpdmVuIGluc3RhbmNlcy4gVGhlIG5ldyBpbnN0YW5jZXMgb2JqZWN0IG1heSBiZSBhIG5nLXJlc291cmNlIHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgKiBhIHByb21pc2UsIGEgbGlzdCBvZiBpbnN0YW5jZXMgb3IgYSBzaW5nbGUgaW5zdGFuY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBuZXdJbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLm1hbmFnZSA9IGZ1bmN0aW9uIChuZXdJbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb01hbmFnZSA9IGZ1bmN0aW9uIChuZXdJbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IE1hbmFnZSBnaXZlbiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2VzLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgZm9yIHNpbmdsZSBpbnN0YW5jZXMgYnkgY29udmVydGluZyBpdCB0byBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KG5ld0luc3RhbmNlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFuY2VzID0gW25ld0luc3RhbmNlc107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZSA9IG5ld0luc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQgeWV0LCBtYW5hZ2UgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdJbnN0YW5jZS4kc3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1ha2UgdGhlIHN0b3JlIGF2YWlsYWJsZSBvbiB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbmNlLiRzdG9yZSA9IHNlbGY7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgaW5zdGFuY2UgdG8gdGhlIGxpc3Qgb2YgbWFuYWdlZCBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UobWFuYWdlZEluc3RhbmNlcywgbmV3SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIG5ld0luc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2VzIGlzIGFscmVhZHkgbWFuYWdlZCBieSBhbm90aGVyIHN0b3JlLCBwcmludCBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChuZXdJbnN0YW5jZS4kc3RvcmUgIT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgYWxyZWFkeSBtYW5hZ2VkIGJ5IGFub3RoZXIgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZSBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgdGhpcyBzdG9yZSwgZG8gbm90aGluZyBidXQgbG9nZ2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGFscmVhZHkgbWFuYWdlZCBieSB0aGUgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IG5nLXJlc291cmNlIG9iamVjdHMgYW5kIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Byb21pc2VMaWtlKG5ld0luc3RhbmNlcykgfHwgaXNQcm9taXNlTGlrZShuZXdJbnN0YW5jZXMuJHByb21pc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gaXNQcm9taXNlTGlrZShuZXdJbnN0YW5jZXMpID8gbmV3SW5zdGFuY2VzIDogbmV3SW5zdGFuY2VzLiRwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGRvTWFuYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShuZXdJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBTeW5jaHJvbm91cyBpZiB3ZSBoYXZlIG5vIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb01hbmFnZShuZXdJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUobmV3SW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBGb3JnZXQgKHVuLW1hbmFnZSkgZ2l2ZW4gaW5zdGFuY2VzLiBUaGUgaW5zdGFuY2VzIG9iamVjdCBtYXkgYmUgYSBuZy1yZXNvdXJjZSByZXN1bHQsXG4gICAgICAgICAgICAgICAgICogYSBwcm9taXNlLCBhIGxpc3Qgb2YgaW5zdGFuY2VzIG9yIGEgc2luZ2xlIGluc3RhbmNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gb2xkSW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5mb3JnZXQgPSBmdW5jdGlvbiAob2xkSW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9Gb3JnZXQgPSBmdW5jdGlvbiAob2xkSW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBGb3JnZXQgZ2l2ZW4gJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IGZvciBzaW5nbGUgaW5zdGFuY2VzIGJ5IGNvbnZlcnRpbmcgaXQgdG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShvbGRJbnN0YW5jZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEluc3RhbmNlcyA9IFtvbGRJbnN0YW5jZXNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2xkSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkSW5zdGFuY2UgPSBvbGRJbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkIHlldCwgbWFuYWdlIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRJbnN0YW5jZS4kc3RvcmUgPT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc3RvcmUgYXR0cmlidXRlIGZyb20gdGhlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2xkSW5zdGFuY2UuJHN0b3JlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGluc3RhbmNlIGZyb20gdGhlIGxpc3Qgb2YgbWFuYWdlZCBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UobWFuYWdlZEluc3RhbmNlcywgb2xkSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIG9sZEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UocGVyc2lzdFF1ZXVlLCBvbGRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHJlbW92ZVF1ZXVlLCBvbGRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlcyBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgYW5vdGhlciBzdG9yZSwgcHJpbnQgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob2xkSW5zdGFuY2UuJHN0b3JlICE9PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIG1hbmFnZWQgYnkgYW5vdGhlciBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlIGlzIGFscmVhZHkgbWFuYWdlZCBieSB0aGlzIHN0b3JlLCBkbyBub3RoaW5nIGJ1dCBsb2dnaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IG5nLXJlc291cmNlIG9iamVjdHMgYW5kIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Byb21pc2VMaWtlKG9sZEluc3RhbmNlcykgfHwgaXNQcm9taXNlTGlrZShvbGRJbnN0YW5jZXMuJHByb21pc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gaXNQcm9taXNlTGlrZShvbGRJbnN0YW5jZXMpID8gb2xkSW5zdGFuY2VzIDogb2xkSW5zdGFuY2VzLiRwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGRvRm9yZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShvbGRJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBTeW5jaHJvbm91cyBpZiB3ZSBoYXZlIG5vIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb0ZvcmdldChvbGRJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUob2xkSW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZXR1cm5zIGEgbmV3IGluc3RhbmNlIG1hbmFnZWQgYnkgdGhlIHN0b3JlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGFyYW1zXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLm5ldyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZSA9IHJlc291cmNlLm5ldyhwYXJhbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubWFuYWdlKG5ld0luc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3SW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFF1ZXVlcyBnaXZlbiBpbnN0YW5jZSBmb3IgcGVyc2lzdGVuY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnBlcnNpc3QgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogUXVldWUgJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcyBmb3IgcGVyc2lzdC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzQXJyYXkoaW5zdGFuY2VzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzID0gW2luc3RhbmNlc107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZS4kc3RvcmUgPT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKHBlcnNpc3RRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UodmlzaWJsZVF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZShyZW1vdmVRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBpcyBub3QgbWFuYWdlZCBieSB0aGlzIHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBRdWV1ZXMgZ2l2ZW4gaW5zdGFuY2UgZm9yIGRlbGV0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmUgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogUXVldWUgJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcyBmb3IgcmVtb3ZlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShpbnN0YW5jZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMgPSBbaW5zdGFuY2VzXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGluc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluc3RhbmNlLiRzdG9yZSA9PT0gc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UocGVyc2lzdFF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKHJlbW92ZVF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkIGJ5IHRoaXMgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENvbW1pdHMgY2hhbmdlcyB0byB0aGUgcGFyZW50IHN0b3JlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuY29tbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHBhcmVudCBzdG9yZSBmaXJzdC4gV2UgY2Fubm90IGNvbW1pdCB0byBhIHBhcmVudCBzdG9yZVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBwYXJlbnQgc3RvcmUuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50U3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiBDYW5ub3QgY29tbWl0ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZXMgYXMgdGhlcmUgaXMgbm8gcGFyZW50IHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogQ29tbWl0ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBjaGFuZ2VzIHRvIHBhcmVudCBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tbWl0IHRoZSBwZXJzaXN0IHF1ZXVlIHRvIHRoZSBwYXJlbnQgc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwZXJzaXN0UXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkUGVyc2lzdEluc3RhbmNlID0gY29weShwZXJzaXN0UXVldWVbaV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFBlcnNpc3RJbnN0YW5jZSA9IHBhcmVudFN0b3JlLmdldEJ5SW5zdGFuY2UoY2hpbGRQZXJzaXN0SW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2hpbGRQZXJzaXN0SW5zdGFuY2UuJHN0b3JlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFBlcnNpc3RJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFBlcnNpc3RJbnN0YW5jZSA9IGNvcHkoY2hpbGRQZXJzaXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLm1hbmFnZShwYXJlbnRQZXJzaXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2UocGFyZW50UGVyc2lzdEluc3RhbmNlLCBjaGlsZFBlcnNpc3RJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLnBlcnNpc3QocGFyZW50UGVyc2lzdEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbW1pdCB0aGUgcmVtb3ZlIHF1ZXVlIHRvIHRoZSBwYXJlbnQgc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZW1vdmVRdWV1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRSZW1vdmVJbnN0YW5jZSA9IGNvcHkocmVtb3ZlUXVldWVbaV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFJlbW92ZUluc3RhbmNlID0gcGFyZW50U3RvcmUuZ2V0QnlJbnN0YW5jZShjaGlsZFJlbW92ZUluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNoaWxkUmVtb3ZlSW5zdGFuY2UuJHN0b3JlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFJlbW92ZUluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UmVtb3ZlSW5zdGFuY2UgPSBjb3B5KGNoaWxkUmVtb3ZlSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLm1hbmFnZShwYXJlbnRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShwYXJlbnRSZW1vdmVJbnN0YW5jZSwgY2hpbGRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLnJlbW92ZShwYXJlbnRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgdGhlIGNoYW5nZSBxdWV1ZSBvbiB0aGlzIGFuIGFsbCByZWxhdGVkIHN0b3JlcyBhbmQgY2xlYXJzIHRoZSBjaGFuZ2UgcXVldWUgaWYgY2xlYXJBZnRlciBpc1xuICAgICAgICAgICAgICAgICAqIHNldCB0byB0cnVlIChkZWZhdWx0KS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtjbGVhckFmdGVyXVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5leGVjdXRlQWxsID0gZnVuY3Rpb24gKGNsZWFyQWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYGNsZWFyQWZ0ZXJgIHNob3VsZCBkZWZhdWx0IHRvIHRydWVcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJBZnRlciA9IGFuZ3VsYXIuaXNVbmRlZmluZWQoY2xlYXJBZnRlcikgfHwgISFjbGVhckFmdGVyO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSByZWxhdGVkIHN0b3Jlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVJlbGF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uID0gcmVsYXRpb25zW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRlZFN0b3JlID0gcmVsYXRpb24uZ2V0UmVsYXRlZFN0b3JlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBleGVjdXRpb24gb2YgdGhlIHJlbGF0ZWQgc3RvcmUgdG8gdGhlIGxpc3Qgb2ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvbWlzZXMgdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHJlbGF0ZWRTdG9yZS5leGVjdXRlQWxsKGNsZWFyQWZ0ZXIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgc3RvcmUgaXRzZWxmLCB0aGVuIGV4ZWN1dGUgdGhlIHJlbGF0ZWQgc3RvcmVzLiBJZiBldmVyeXRoaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlbnQgd2VsbCwgcmVzb2x2ZSB0aGUgcmV0dXJuZWQgcHJvbWlzZSwgZWxzZSByZWplY3QgaXQuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZXhlY3V0ZShjbGVhckFmdGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXhlY3V0ZVJlbGF0ZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihkZWZlci5yZXNvbHZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGRlZmVyLnJlamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV4ZWN1dGUgdGhlIGNoYW5nZSBxdWV1ZSBhbmQgY2xlYXJzIHRoZSBjaGFuZ2UgcXVldWUgaWYgY2xlYXJBZnRlciBpcyBzZXQgdG8gdHJ1ZSAoZGVmYXVsdCkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbY2xlYXJBZnRlcl1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZXhlY3V0ZSA9IGZ1bmN0aW9uIChjbGVhckFmdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGBjbGVhckFmdGVyYCBzaG91bGQgZGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyQWZ0ZXIgPSBhbmd1bGFyLmlzVW5kZWZpbmVkKGNsZWFyQWZ0ZXIpIHx8ICEhY2xlYXJBZnRlcjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDYW5ub3QgZXhlY3V0ZSB3aGVuIGFscmVhZHkgZXhlY3V0aW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChleGVjdXRpb25SdW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KFwiQW5vdGhlciBleGVjdXRpb24gaXMgYWxyZWFkeSBydW5uaW5nLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgcGFyZW50IHN0b3JlIHJhaXNlIGFuIGVycm9yXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRTdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJFeGVjdXRpbmcgdGhlIHN0b3JlIGlzIG9ubHkgcG9zc2libGUgb24gdGhlIHRvcG1vc3Qgc3RvcmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGlvbiBzdGFydGVkXG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvblJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIHJ1bm5pbmcgZmxhZyB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlYXNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRXJyb3IgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uUnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHdpdGggZ2l2ZW4gaXRlbSBhcyBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoaXRlbSwgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1JlbW92ZSA9IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zW2ldLmhhbmRsZVJlbW92ZShwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNVcGRhdGUgPSBmdW5jdGlvbiAob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1tpXS5oYW5kbGVVcGRhdGUob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyBhIHNpbmdsZSBSRVNUIEFQSSBjYWxsIG9uIHRoZSBnaXZlbiBpdGVtIHdpdGggdGhlIGdpdmVuIGZ1bmN0aW9uLiBDYWxscyB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGJlZm9yZSBhbmQgYWZ0ZXIgbGlzdGVuZXJzIGFuZCByZXNvbHZlcyB0aGUgZ2l2ZW4gZGVmZXIgYWZ0ZXIgYWxsIHRoaXMgaXMgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZXhlY0ZuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZGVmZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBiZWZvcmVMaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBhZnRlckxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGlzUmVtb3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVTaW5nbGUgPSBmdW5jdGlvbiAoaXRlbSwgZXhlY0ZuLCBiZWZvcmVMaXN0ZW5lcnMsIGFmdGVyTGlzdGVuZXJzLCBkZWZlciwgaXNSZW1vdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSBiZWZvcmUgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbExpc3RlbmVycyhpdGVtLCBiZWZvcmVMaXN0ZW5lcnMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgUkVTVCBBUEkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWNGbih7fSwgaXRlbSkuJHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JnZXQgcmVmZXJlbmNpbmcgaW5zdGFuY2VzIG9uIHJlbGF0ZWQgc3RvcmVzIGlmIHRoaXMgd2FzIGEgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIG9uIHRoZSBSRVNUIEFQSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVtb3ZlICYmIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNSZW1vdmUoaXRlbVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVzcG9uc2UgY29udGFpbnMgdGhlIHNhdmVkIG9iamVjdCAod2l0aCB0aGUgUEsgZnJvbSB0aGUgUkVTVCBBUEkpIHRoZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCB0aGUgbmV3IFBLIG9uIHRoZSBpdGVtLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkUGtWYWx1ZSA9IGl0ZW0gPyBpdGVtW3Jlc291cmNlLmdldFBrQXR0cigpXSA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1BrVmFsdWUgPSByZXNwb25zZS5kYXRhID8gcmVzcG9uc2UuZGF0YVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBGSyB2YWx1ZXMgb24gcmVmZXJlbmNpbmcgaW5zdGFuY2VzIG9uIHJlbGF0ZWQgc3RvcmVzIGlmIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3YXMgYSBzdWNjZXNzZnVsIGluc2VydCBvciB1cGRhdGUgb24gdGhlIFJFU1QgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1JlbW92ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNVcGRhdGUob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gPSBuZXdQa1ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVuIGNhbGwgdGhlIGFmdGVyIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbExpc3RlbmVycyhpdGVtLCBhZnRlckxpc3RlbmVycyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFuZCByZXNvbHZlIHRoZSBwcm9taXNlIHdpdGggdGhlIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChkZWZlci5yZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgcmVtb3ZlIHF1ZXVlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIGFzIHNvb24gYXMgYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBSRVNUIEFQSSBjYWxscyBhcmUgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVSZW1vdmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZSA9IHNlbGYuZ2V0UmVtb3ZlUXVldWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHF1ZXVlW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgbm9uLXBoYW50b20gZW50cmllcyBzaG91bGQgYmUgcmVtb3ZlZCAocGhhbnRvbXMgZG9uJ3QgZXhpc3QgYW55d2F5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uJGlzUGhhbnRvbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goZGVmZXIucHJvbWlzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIHNpbmdsZSBSRVNUIEFQSSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2luZ2xlKGl0ZW0sIHJlc291cmNlLnJlbW92ZSwgYmVmb3JlUmVtb3ZlTGlzdGVuZXJzLCBhZnRlclJlbW92ZUxpc3RlbmVycywgZGVmZXIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSB1cGRhdGUgcXVldWUuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgYXMgc29vbiBhcyBhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFJFU1QgQVBJIGNhbGxzIGFyZSBkb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVVwZGF0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlID0gc2VsZi5nZXRVcGRhdGVRdWV1ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gcXVldWVbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChkZWZlci5wcm9taXNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBzaW5nbGUgUkVTVCBBUEkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2luZ2xlKGl0ZW0sIHJlc291cmNlLnVwZGF0ZSwgYmVmb3JlUGVyc2lzdExpc3RlbmVycywgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLCBkZWZlciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgc2F2ZSAoaW5zZXJ0KSBxdWV1ZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBhcyBzb29uIGFzIGFsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICogUkVTVCBBUEkgY2FsbHMgYXJlIGRvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2F2ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlID0gc2VsZi5nZXRTYXZlUXVldWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHF1ZXVlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goZGVmZXIucHJvbWlzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgc2luZ2xlIFJFU1QgQVBJIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVNpbmdsZShpdGVtLCByZXNvdXJjZS5zYXZlLCBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLCBhZnRlclBlcnNpc3RMaXN0ZW5lcnMsIGRlZmVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIENsZWFycyB0aGUgY2hhbmdlIHF1ZXVlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWFyQWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0aW9uIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uUnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBSRVNUIEFQSSBjYWxsIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICRxLndoZW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXhlY3V0ZVJlbW92ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihleGVjdXRlVXBkYXRlcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGV4ZWN1dGVTYXZlcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNsZWFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZGVmZXIucmVzb2x2ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChoYW5kbGVFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc3RvcmUgZnJvbSB0aGUgY3VycmVudCBzdG9yZS4gVGhpcyBzdG9yZSBjYW4gbWFrZSBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICogdG8gaXQncyBtYW5hZ2VkIGluc3RhbmNlcyBhbmQgaXQgd2lsbCBub3QgYWZmZWN0IHRoZSBjdXJyZW50IHN0b3Jlc1xuICAgICAgICAgICAgICAgICAqIGluc3RhbmNlcyB1bnRpbCB0aGUgY2hpbGQgc3RvcmUgY29tbWl0cy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtpbnN0YW5jZXNdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VTdG9yZX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmNyZWF0ZUNoaWxkU3RvcmUgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcyA9IGluc3RhbmNlcyB8fCBtYW5hZ2VkSW5zdGFuY2VzO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRTdG9yZU1hbmFnZWRJbnN0YW5jZXMgPSBjb3B5KGluc3RhbmNlcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNvdXJjZVN0b3JlKHJlc291cmNlLCBjaGlsZFN0b3JlTWFuYWdlZEluc3RhbmNlcywgc2VsZik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgYSByZWxhdGlvbiB0byBhbm90aGVyIHN0b3JlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gY29uZmlnXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VTdG9yZVJlbGF0aW9ufVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuY3JlYXRlUmVsYXRpb24gPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGFuZ3VsYXIuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0ZWRTdG9yZTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZrQXR0cjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRGVsZXRlOiAnZm9yZ2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlOiAndXBkYXRlJ1xuICAgICAgICAgICAgICAgICAgICB9LCBjb25maWcpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb24gPSBuZXcgUmVzb3VyY2VTdG9yZVJlbGF0aW9uKHNlbGYsIGNvbmZpZy5yZWxhdGVkU3RvcmUsIGNvbmZpZy5ma0F0dHIsIGNvbmZpZy5vblVwZGF0ZSwgY29uZmlnLm9uRGVsZXRlKTtcblxuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMucHVzaChyZWxhdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbGF0aW9uO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgcmVsYXRpb24gZnJvbSB0aGUgc3RvcmUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZWxhdGlvblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlUmVsYXRpb24gPSBmdW5jdGlvbiAocmVsYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbkluZGV4ID0gcmVsYXRpb25zLmluZGV4T2YocmVsYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25Gb3VuZCA9IHJlbGF0aW9uSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMuc3BsaWNlKHJlbGF0aW9uSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIG1hbmFnZWQgaW5zdGFuY2UgZnJvbSB0aGUgc3RvcmUgdGhhdCBtYXRjaGVzIHRoZSBnaXZlblxuICAgICAgICAgICAgICAgICAqIFBLIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0QnlQayA9IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5UGsobWFuYWdlZEluc3RhbmNlcywgcGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIG1hbmFnZWQgaW5zdGFuY2UgZnJvbSB0aGUgc3RvcmUgdGhhdCBtYXRjaGVzIHRoZSBnaXZlblxuICAgICAgICAgICAgICAgICAqIGluc3RhbmNlICh3aGljaCBtaWdodCBieSBhbiBjb3B5IHRoYXQgaXMgbm90IG1hbmFnZWQgb3IgbWFuYWdlZCBieVxuICAgICAgICAgICAgICAgICAqIGFub3RoZXIgc3RvcmUpLiBUaGUgaW5zdGFuY2VzIGFyZSBtYXRjaGVkIGJ5IHRoZWlyIFBLIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldEJ5SW5zdGFuY2UgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwa1ZhbHVlID0gaW5zdGFuY2UgPyBpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0QnlQayhwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIHZpc2libGUgZm9yIHRoZSB1c2VyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldE1hbmFnZWRJbnN0YW5jZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYW5hZ2VkSW5zdGFuY2VzLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyB2aXNpYmxlIGZvciB0aGUgdXNlci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRWaXNpYmxlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2aXNpYmxlUXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3IgcGVyc2lzdC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRQZXJzaXN0UXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwZXJzaXN0UXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3IgcmVtb3ZlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFJlbW92ZVF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlUXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3Igc2F2ZSAoaW5zZXJ0KS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRTYXZlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyUGhhbnRvbSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS4kaXNQaGFudG9tKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwZXJzaXN0UXVldWUuZmlsdGVyKGZpbHRlclBoYW50b20pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgbWFya2VkIGZvciB1cGRhdGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0VXBkYXRlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyTm9uUGhhbnRvbSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhaW5zdGFuY2UuJGlzUGhhbnRvbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGVyc2lzdFF1ZXVlLmZpbHRlcihmaWx0ZXJOb25QaGFudG9tKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgbWFuYWdlZCByZXNvdXJjZSBzZXJ2aWNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0UmVzb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQWRkcyBhIGJlZm9yZS1wZXJzaXN0IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmFkZEJlZm9yZVBlcnNpc3RMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLnB1c2goZm4pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgYmVmb3JlLXBlcnNpc3QgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQmVmb3JlUGVyc2lzdExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5JbmRleCA9IGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMuaW5kZXhPZihmbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkZvdW5kID0gZm5JbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgYSBhZnRlci1wZXJzaXN0IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmFkZEFmdGVyUGVyc2lzdExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGFmdGVyUGVyc2lzdExpc3RlbmVycy5wdXNoKGZuKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhIGFmdGVyLXBlcnNpc3QgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWZ0ZXJQZXJzaXN0TGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluZGV4ID0gYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLmluZGV4T2YoZm4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm5Gb3VuZCA9IGZuSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZnRlclBlcnNpc3RMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSBiZWZvcmUtcmVtb3ZlIGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUJlZm9yZVJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5JbmRleCA9IGJlZm9yZVJlbW92ZUxpc3RlbmVycy5pbmRleE9mKGZuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuRm91bmQgPSBmbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZm5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVmb3JlUmVtb3ZlTGlzdGVuZXJzLnNwbGljZShmbkluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBZGRzIGEgYWZ0ZXItcmVtb3ZlIGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmFkZEFmdGVyUmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMucHVzaChmbik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSBhZnRlci1yZW1vdmUgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWZ0ZXJSZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5kZXggPSBhZnRlclJlbW92ZUxpc3RlbmVycy5pbmRleE9mKGZuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuRm91bmQgPSBmbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZm5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgdGhlIGdpdmVuIGluc3RhbmNlIHRvIHRoZSBnaXZlbiBsaXN0IG9mIGluc3RhbmNlcy4gRG9lcyBub3RoaW5nIGlmIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIGlzIGFscmVhZHkgaW4gdGhlIGxpc3Qgb2YgaW5zdGFuY2VzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRkUmVzb3VyY2VJbnN0YW5jZSAoaW5zdGFuY2VzLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VzID0gcmVzb3VyY2UuZmlsdGVySW5zdGFuY2VzQnlBdHRyKGluc3RhbmNlcywgcmVzb3VyY2UuZ2V0UGtBdHRyKCksIGluc3RhbmNlW3Jlc291cmNlLmdldFBrQXR0cigpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhbWF0Y2hpbmdJbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoaW5nSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VJbmRleCA9IGluc3RhbmNlcy5pbmRleE9mKG1hdGNoaW5nSW5zdGFuY2VzW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZUZvdW5kID0gbWF0Y2hpbmdJbnN0YW5jZUluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZ0luc3RhbmNlRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzLnNwbGljZShtYXRjaGluZ0luc3RhbmNlSW5kZXgsIDEsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIHRoZSBnaXZlbiBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBsaXN0IG9mIGluc3RhbmNlcy4gRG9lcyBub3RoaW5nIGlmIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIGlzIG5vdCBpbiB0aGUgbGlzdCBvZiBpbnN0YW5jZXMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZVJlc291cmNlSW5zdGFuY2UgKGluc3RhbmNlcywgaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlcyA9IHJlc291cmNlLmZpbHRlckluc3RhbmNlc0J5QXR0cihpbnN0YW5jZXMsIHJlc291cmNlLmdldFBrQXR0cigpLCBpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghIW1hdGNoaW5nSW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXRjaGluZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlSW5kZXggPSBpbnN0YW5jZXMuaW5kZXhPZihtYXRjaGluZ0luc3RhbmNlc1tpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VGb3VuZCA9IG1hdGNoaW5nSW5zdGFuY2VJbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdJbnN0YW5jZUZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcy5zcGxpY2UobWF0Y2hpbmdJbnN0YW5jZUluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGNhbiBiZSB0cmVhdGVkIGFzIGFuIHByb21pc2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp8Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpc1Byb21pc2VMaWtlIChvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iaiAmJiBhbmd1bGFyLmlzRnVuY3Rpb24ob2JqLnRoZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFBvcHVsYXRlcyB0aGUgZGVzdGluYXRpb24gb2JqZWN0IGBkc3RgIGJ5IGNvcHlpbmcgdGhlIG5vbi1wcml2YXRlIGRhdGEgZnJvbSBgc3JjYCBvYmplY3QuIFRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICogb24gdGhlIGBkc3RgIG9iamVjdCB3aWxsIGJlIGEgZGVlcCBjb3B5IG9mIHRoZSBkYXRhIG9uIHRoZSBgc3JjYC4gVGhpcyBmdW5jdGlvbiB3aWxsIG5vdCBjb3B5XG4gICAgICAgICAgICAgICAgICogYXR0cmlidXRlcyBvZiB0aGUgYHNyY2Agd2hvc2UgbmFtZXMgc3RhcnQgd2l0aCBcIiRcIi4gVGhlc2UgYXR0cmlidXRlcyBhcmUgY29uc2lkZXJlZCBwcml2YXRlLiBUaGVcbiAgICAgICAgICAgICAgICAgKiBtZXRob2Qgd2lsbCBhbHNvIGtlZXAgdGhlIHByaXZhdGUgYXR0cmlidXRlcyBvZiB0aGUgYGRzdGAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRzdCB7VW5kZWZpbmVkfE9iamVjdHxBcnJheX0gRGVzdGluYXRpb24gb2JqZWN0XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHNyYyB7T2JqZWN0fEFycmF5fSBTb3VyY2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtrZWVwTWlzc2luZ10gYm9vbGVhbiBLZWVwIGF0dHJpYnV0ZXMgb24gZHN0IHRoYXQgYXJlIG5vdCBwcmVzZW50IG9uIHNyY1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcG9wdWxhdGUgKGRzdCwgc3JjLCBrZWVwTWlzc2luZykge1xuICAgICAgICAgICAgICAgICAgICAvLyBrZWVwTWlzc2luZyBkZWZhdWx0cyB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGtlZXBNaXNzaW5nID0gYW5ndWxhci5pc1VuZGVmaW5lZChrZWVwTWlzc2luZykgPyB0cnVlIDogISFrZWVwTWlzc2luZztcbiAgICAgICAgICAgICAgICAgICAgZHN0ID0gZHN0IHx8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXNlcnZlID0gISFkc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZWRPYmplY3RzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICogQXMgd2UgZG8gcmVtb3ZlIGFsbCBcInByaXZhdGVcIiBwcm9wZXJ0aWVzIGZyb20gdGhlIHNvdXJjZSwgc28gdGhleSBhcmUgbm90IGNvcGllZFxuICAgICAgICAgICAgICAgICAgICAgKiB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LCB3ZSBtYWtlIGEgY29weSBvZiB0aGUgc291cmNlIGZpcnN0LiBXZSBkbyBub3Qgd2FudCB0b1xuICAgICAgICAgICAgICAgICAgICAgKiBtb2RpZnkgdGhlIGFjdHVhbCBzb3VyY2Ugb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc3JjID0gYW5ndWxhci5jb3B5KHNyYyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGtleVswXSA9PT0gJyQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNyY1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICogT25seSBwcmVzZXJ2ZSBpZiB3ZSBnb3QgYSBkZXN0aW5hdGlvbiBvYmplY3QuIFNhdmUgXCJwcml2YXRlXCIgb2JqZWN0IGtleXMgb2YgZGVzdGluYXRpb24gYmVmb3JlXG4gICAgICAgICAgICAgICAgICAgICAqIGNvcHlpbmcgdGhlIHNvdXJjZSBvYmplY3Qgb3ZlciB0aGUgZGVzdGluYXRpb24gb2JqZWN0LiBXZSByZXN0b3JlIHRoZXNlIHByb3BlcnRpZXMgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmVzZXJ2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZHN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRzdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGtlZXAgcHJpdmF0ZSBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlbMF0gPT09ICckJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVkT2JqZWN0c1trZXldID0gZHN0W2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8ga2VlcCBhdHRyaWJ1dGUgaWYgbm90IHByZXNlbnQgb24gc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtlZXBNaXNzaW5nICYmICFzcmMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVkT2JqZWN0c1trZXldID0gZHN0W2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBkbyB0aGUgYWN0dWFsIGNvcHlcbiAgICAgICAgICAgICAgICAgICAgZHN0ID0gYW5ndWxhci5jb3B5KHNyYywgZHN0KTtcblxuICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgKiBOb3cgd2UgY2FuIHJlc3RvcmUgdGhlIHByZXNlcnZlZCBkYXRhIG9uIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJlc2VydmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHByZXNlcnZlZE9iamVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlc2VydmVkT2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdFtrZXldID0gcHJlc2VydmVkT2JqZWN0c1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ29waWVzIHRoZSBzb3VyY2Ugb2JqZWN0IHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgKG9yIGFycmF5KS4gS2VlcHMgcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIGF0dHJpYnV0ZXMgb24gdGhlIGBkc3RgIG9iamVjdCAoYXR0cmlidXRlcyBzdGFydGluZyB3aXRoICQgYXJlIHByaXZhdGUpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzcmNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2RzdF1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvcHkgKHNyYywgZHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGFyZSB3b3JraW5nIG9uIGFuIGFycmF5LCBjb3B5IGVhY2ggaW5zdGFuY2Ugb2YgdGhlIGFycmF5IHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBkc3QuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoc3JjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gYW5ndWxhci5pc0FycmF5KGRzdCkgPyBkc3QgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdC5sZW5ndGggPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNyYy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdC5wdXNoKHBvcHVsYXRlKG51bGwsIHNyY1tpXSwgZmFsc2UpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIHdlIGNhbiBqdXN0IGNvcHkgdGhlIHNyYyBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gcG9wdWxhdGUoZHN0LCBzcmMsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogTWVyZ2VzIHRoZSBzb3VyY2Ugb2JqZWN0IHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgKG9yIGFycmF5KS4gS2VlcHMgcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIGF0dHJpYnV0ZXMgb24gdGhlIGBkc3RgIG9iamVjdCAoYXR0cmlidXRlcyBzdGFydGluZyB3aXRoICQgYXJlIHByaXZhdGUpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzcmNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2RzdF1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1lcmdlIChzcmMsIGRzdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBhcmUgd29ya2luZyBvbiBhbiBhcnJheSwgY29weSBlYWNoIGluc3RhbmNlIG9mIHRoZSBhcnJheSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZHN0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KHNyYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdCA9IGFuZ3VsYXIuaXNBcnJheShkc3QpID8gZHN0IDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QubGVuZ3RoID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkc3QucHVzaChwb3B1bGF0ZShudWxsLCBzcmNbaV0sIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIHdlIGNhbiBqdXN0IGNvcHkgdGhlIHNyYyBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gcG9wdWxhdGUoZHN0LCBzcmMsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJbml0aWFsaXplcyB0aGUgc3RvcmUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEluc3RhbmNlcyA9IG1hbmFnZWRJbnN0YW5jZXMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlID0gcGFyZW50U3RvcmUgfHwgbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWQgPSBzZWxmLm1hbmFnZShtYW5hZ2VkSW5zdGFuY2VzKSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBNYXBzIGluc3RhbmNlcyB0byBhIGxpc3Qgb2YgUEtzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBQayA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZSA/IFN0cmluZyhpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBGaWx0ZXJzIGluc3RhbmNlcyB0byBnaXZlbiBsaXN0IG9mIFBLc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHBrc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclBrcyA9IGZ1bmN0aW9uIChwa3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZSA/IHBrcy5pbmRleE9mKFN0cmluZyhpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pKSAhPT0gLTEgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgcXVldWVzIHdpdGggdGhlIHN0YXRlIG9mIHRoZSBwYXJlbnQgc3RvcmUsIGlmIHRoZXJlIGlzIGEgcGFyZW50IHN0b3JlLlxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50U3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWQudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogQ29weSBzdGF0ZSBmcm9tIHBhcmVudCBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRWaXNpYmxlUXVldWVQa3MgPSBwYXJlbnRTdG9yZS5nZXRWaXNpYmxlUXVldWUoKS5tYXAobWFwUGspLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UGVyc2lzdFF1ZXVlUGtzID0gcGFyZW50U3RvcmUuZ2V0UGVyc2lzdFF1ZXVlKCkubWFwKG1hcFBrKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFJlbW92ZVF1ZXVlUGtzID0gcGFyZW50U3RvcmUuZ2V0UmVtb3ZlUXVldWUoKS5tYXAobWFwUGspO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHZpc2libGUsIHBlcnNpc3QgYW5kIHJlbW92ZSBxdWV1ZSB3aXRoIHRoZSBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHRoZSBwYXJlbnQgc3RvcmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGVRdWV1ZSA9IG1hbmFnZWRJbnN0YW5jZXMuZmlsdGVyKGZpbHRlclBrcyhwYXJlbnRWaXNpYmxlUXVldWVQa3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFF1ZXVlID0gbWFuYWdlZEluc3RhbmNlcy5maWx0ZXIoZmlsdGVyUGtzKHBhcmVudFBlcnNpc3RRdWV1ZVBrcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVRdWV1ZSA9IG1hbmFnZWRJbnN0YW5jZXMuZmlsdGVyKGZpbHRlclBrcyhwYXJlbnRSZW1vdmVRdWV1ZVBrcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBzdG9yZVxuICAgICAgICAgICAgICAgIGluaXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgYSByZWxhdGlvbiBiZXR3ZWVuIHR3byBzdG9yZXMuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSBzdG9yZVxuICAgICAgICAgICAgICogQHBhcmFtIHJlbGF0ZWRTdG9yZVxuICAgICAgICAgICAgICogQHBhcmFtIGZrQXR0clxuICAgICAgICAgICAgICogQHBhcmFtIG9uVXBkYXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0gb25SZW1vdmVcbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBSZXNvdXJjZVN0b3JlUmVsYXRpb24gKHN0b3JlLCByZWxhdGVkU3RvcmUsIGZrQXR0ciwgb25VcGRhdGUsIG9uUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiBwcmUtZGVmaW5lZCB1cGRhdGUgYmVoYXZpb3Vyc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHN3aXRjaCAob25VcGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlID0gZnVuY3Rpb24gKHJlZmVyZW5jaW5nU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrLCBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IFNldCByZWZlcmVuY2UgdG8gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgaW5zdGFuY2UgZnJvbSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyB0byAnXCIgKyBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPSBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVsbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgbmV3UmVmZXJlbmNlZEluc3RhbmNlUGssIGZrQXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBTZXQgcmVmZXJlbmNlIHRvICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIGluc3RhbmNlIGZyb20gJ1wiICsgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGsgKyBcIicgdG8gbnVsbC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogSW1wbGVtZW50YXRpb24gb2YgcHJlLWRlZmluZWQgcmVtb3ZlIGJlaGF2aW91cnNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG9uUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZvcmdldCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlbW92ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IEZvcmdldCAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBpbnN0YW5jZSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyByZWZlcmVuY2luZyBpbnN0YW5jZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ1N0b3JlLmZvcmdldChyZWZlcmVuY2luZ0luc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVsbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlbW92ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IFNldCByZWZlcmVuY2UgdG8gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgaW5zdGFuY2UgZnJvbSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyB0byBudWxsLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2VbZmtBdHRyXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgc3RvcmUgdGhlIHJlbGF0aW9uIGlzIGNvbmZpZ3VyZWQgb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFN0b3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIHN0b3JlIHRoZSBjb25maWd1cmVkIHN0b3JlIGlzIHJlbGF0ZWQgb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFJlbGF0ZWRTdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbGF0ZWRTdG9yZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgRksgYXR0cmlidXRlIG5hbWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0RmtBdHRyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmtBdHRyO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBVcGRhdGVzIHRoZSByZWZlcmVuY2luZyBpbnN0YW5jZXMgd2hlcmUgdGhlIGZrQXR0ciBoYXMgdGhlIGdpdmVuIG9sZFxuICAgICAgICAgICAgICAgICAqIHZhbHVlIHRvIHRoZSBnaXZlbiBuZXcgdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG9sZFBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbmV3UGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaGFuZGxlVXBkYXRlID0gZnVuY3Rpb24gKG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IEhhbmRsZSB1cGRhdGUgb2YgcmVmZXJlbmNlZCBpbnN0YW5jZSBvbiAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlcyA9IHJlbGF0ZWRTdG9yZS5nZXRNYW5hZ2VkSW5zdGFuY2VzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZlcmVuY2luZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZSA9IHJlZmVyZW5jaW5nSW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVmZXJlbmNpbmdJbnN0YW5jZSAmJiByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPT0gb2xkUGtWYWx1ZSAmJiBvbGRQa1ZhbHVlICE9IG5ld1BrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZShyZWxhdGVkU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUsIGZrQXR0cik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogTGV0cyB0aGUgcmVsYXRlZCBzdG9yZSBmb3JnZXQgc3RhbGUgcmVmZXJlbmNpbmcgaW5zdGFuY2VzLCBlLmcuIGJlY2F1c2UgdGhlXG4gICAgICAgICAgICAgICAgICogcmVmZXJlbmNlZCBpbnN0YW5jZSB3YXMgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaGFuZGxlUmVtb3ZlID0gZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IEhhbmRsZSByZW1vdmUgb2YgcmVmZXJlbmNlZCBpbnN0YW5jZSBvbiAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlcyA9IHJlbGF0ZWRTdG9yZS5nZXRNYW5hZ2VkSW5zdGFuY2VzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZlcmVuY2luZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZSA9IHJlZmVyZW5jaW5nSW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVmZXJlbmNpbmdJbnN0YW5jZSAmJiByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPT0gcGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVtb3ZlKHJlbGF0ZWRTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgcGtWYWx1ZSwgZmtBdHRyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59KSgpO1xuIiwiLyoqXG4gKiBBbmd1bGFyIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2VcbiAqIENvcHlyaWdodCAyMDE2IEFuZHJlYXMgU3RvY2tlclxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbiAqIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuICogcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlXG4gKiBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcbiAqIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyXG4gICAgICAgIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCduZ1Jlc291cmNlRmFjdG9yeScpO1xuXG4gICAgLyoqXG4gICAgICogRmFjdG9yeSBzZXJ2aWNlIHRvIGdlbmVyYXRlIG5ldyByZXNvdXJjZSBwaGFudG9tIGlkIGdlbmVyYXRvcnMuXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlXG4gICAgICogQG5nZG9jIHNlcnZpY2VcbiAgICAgKi9cbiAgICBtb2R1bGUuc2VydmljZSgnUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZScsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgcGhhbnRvbSBpZCBnZW5lcmF0b3Igd2l0aCB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZVxuICAgICAgICAgICAgICogQHBhcmFtIGNvbmZpZ1xuICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLmNyZWF0ZVBoYW50b21JZEZhY3RvcnkgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gYW5ndWxhci5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgICAgICBpczogZnVuY3Rpb24gKCkgeyB9XG4gICAgICAgICAgICAgICAgfSwgY29uZmlnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5KGNvbmZpZy5nZW5lcmF0ZSwgY29uZmlnLmlzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIGEgcGhhbnRvbSBpZCBnZW5lcmF0ZS4gVGFrZXMgYSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyB0aGUgUEssIGFuZCBhXG4gICAgICAgICAgICAgKiBmdW5jdGlvbnMgdGhhdCBjaGVja3MgaWYgdGhlIGdpdmVuIFBLIGlzIGEgcGhhbnRvbSBQSy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlcbiAgICAgICAgICAgICAqIEBuZ2RvYyBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICogQHBhcmFtIGdlbmVyYXRlRm5cbiAgICAgICAgICAgICAqIEBwYXJhbSBpc1BoYW50b21GblxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeSAoZ2VuZXJhdGVGbiwgaXNQaGFudG9tRm4pIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZW5lcmF0ZXMgYSBuZXcgcGhhbnRvbSBQSyB2YWx1ZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZW5lcmF0ZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVGbihpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gUEsgdmFsdWUgb24gdGhlIGdpdmVuIGluc3RhbmNlIGlzIGEgcGhhbnRvbSBQSyB2YWx1ZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa1ZhbHVlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmlzUGhhbnRvbSA9IGZ1bmN0aW9uIChwa1ZhbHVlLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNQaGFudG9tRm4ocGtWYWx1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLyoqXG4gICAgICogUmVzb3VyY2UgcGhhbnRvbSBpZCBnZW5lcmF0b3IgdGhhdCBnZW5lcmF0ZXMgbmVnYXRpdmUgaW50ZWdlciBJRHNcbiAgICAgKlxuICAgICAqIEBuYW1lIFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnRcbiAgICAgKiBAbmdkb2MgZmFjdG9yeVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZX0gUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZSBQaGFudG9tIElEIGZhY3Rvcnkgc2VydmljZVxuICAgICAqL1xuICAgIG1vZHVsZS5mYWN0b3J5KCdSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50JyxcbiAgICAgICAgZnVuY3Rpb24gKFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIGxhc3RQa1ZhbHVlID0gMDtcblxuICAgICAgICAgICAgcmV0dXJuIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuY3JlYXRlUGhhbnRvbUlkRmFjdG9yeSh7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0tbGFzdFBrVmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpczogZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBrVmFsdWUgPCAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8qKlxuICAgICAqIFJlc291cmNlIHBoYW50b20gaWQgZ2VuZXJhdG9yIHRoYXQgZ2VuZXJhdGVzIG5lZ2F0aXZlIGludGVnZXIgSURzXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZFV1aWQ0XG4gICAgICogQG5nZG9jIGZhY3RvcnlcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2V9IFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UgUGhhbnRvbSBJRCBmYWN0b3J5IHNlcnZpY2VcbiAgICAgKi9cbiAgICBtb2R1bGUuZmFjdG9yeSgnUmVzb3VyY2VQaGFudG9tSWRVdWlkNCcsXG4gICAgICAgIGZ1bmN0aW9uIChSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlKSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZWRJZHMgPSBbXTtcblxuICAgICAgICAgICAgcmV0dXJuIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuY3JlYXRlUGhhbnRvbUlkRmFjdG9yeSh7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwa1ZhbHVlID0gdXVpZDQoKTtcblxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZWRJZHMucHVzaChwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBrVmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpczogZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlZElkcy5pbmRleE9mKHBrVmFsdWUpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gdXVpZDQgKCkge1xuICAgICAgICAgICAgICAgICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBNYXRoLnJhbmRvbSgpICogMTZ8MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBjID09PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn0pKCk7XG4iXX0=
