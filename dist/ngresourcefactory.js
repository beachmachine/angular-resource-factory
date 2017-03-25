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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiY2FjaGUvY2FjaGVTZXJ2aWNlLmpzIiwiZmFjdG9yeS9mYWN0b3J5U2VydmljZS5qcyIsInBoYW50b21JZEZhY3RvcnkvcGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksTUFBTSxRQUFRLE9BQU8scUJBQXFCO1lBQ3RDOzs7O0FBSVo7QUM3QkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksU0FBUyxRQUFRLE9BQU87Ozs7Ozs7O0lBUTVCLE9BQU8sUUFBUTtRQUNYLFlBQVk7WUFDUjs7WUFFQTtnQkFDSSxTQUFTOzs7Ozs7Ozs7WUFTYixTQUFTLGFBQWEsTUFBTSxRQUFRLFNBQVM7Z0JBQ3pDO29CQUNJLE9BQU87Ozs7OztvQkFNUCxRQUFROzs7Ozs7b0JBTVIsbUJBQW1COzs7Ozs7b0JBTW5CLGlCQUFpQjs7Ozs7O29CQU1qQixrQkFBa0I7O2dCQUV0QixVQUFVLFFBQVEsT0FBTzs7Ozs7b0JBS3JCLFFBQVE7Ozs7OztvQkFNUixTQUFTOzs7Ozs7b0JBTVQsVUFBVTs7Ozs7O29CQU1WLFdBQVc7Ozs7OztvQkFNWCxLQUFLLEtBQUs7bUJBQ1gsV0FBVzs7O2dCQUdkOzs7Ozs7Ozs7Z0JBU0EsS0FBSyxVQUFVLFVBQVUsT0FBTzs7b0JBRTVCLElBQUksUUFBUSxRQUFRLFFBQVE7d0JBQ3hCLFFBQVEsSUFBSSwyRkFBMkYsT0FBTzs7d0JBRTlHLFlBQVk7Ozt5QkFHWCxJQUFJLFFBQVEsU0FBUyxRQUFRO3dCQUM5QixRQUFRLElBQUksaUZBQWlGLE9BQU87O3dCQUVwRyxjQUFjOzt5QkFFYjt3QkFDRCxRQUFRLElBQUksNEVBQTRFLE9BQU87Ozs7Ozs7Ozs7Ozs7Z0JBYXZHLEtBQUssU0FBUyxVQUFVLEtBQUssT0FBTyxhQUFhLFNBQVM7b0JBQ3RE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b0JBQ2hFO3dCQUNJLElBQUksS0FBSyxXQUFXLEdBQUc7d0JBQ3ZCLElBQUksTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJOztvQkFFL0IsT0FBTyxFQUFFLFNBQVM7Ozs7OztBQU10QyIsImZpbGUiOiJuZ3Jlc291cmNlZmFjdG9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQW5ndWxhciBSZXNvdXJjZUZhY3RvcnlcbiAqIENvcHlyaWdodCAyMDE2IEFuZHJlYXMgU3RvY2tlclxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbiAqIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuICogcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlXG4gKiBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcbiAqIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyXG4gICAgICAgIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCduZ1Jlc291cmNlRmFjdG9yeScsIFtcbiAgICAgICAgICAgICduZ1Jlc291cmNlJ1xuICAgICAgICBdKTtcblxufSkoKTtcbiIsIi8qKlxuICogQW5ndWxhciBSZXNvdXJjZUNhY2hlU2VydmljZVxuICogQ29weXJpZ2h0IDIwMTYgQW5kcmVhcyBTdG9ja2VyXG4gKiBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZFxuICogZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4gKiByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGVcbiAqIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEVcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuICogT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXJcbiAgICAgICAgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ25nUmVzb3VyY2VGYWN0b3J5Jyk7XG5cbiAgICAvKipcbiAgICAgKiBGYWN0b3J5IHNlcnZpY2UgdG8gY3JlYXRlIG5ldyBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBuYW1lIFJlc291cmNlQ2FjaGVTZXJ2aWNlXG4gICAgICogQG5nZG9jIGZhY3RvcnlcbiAgICAgKi9cbiAgICBtb2R1bGUuZmFjdG9yeSgnUmVzb3VyY2VDYWNoZVNlcnZpY2UnLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICBjYWNoZXMgPSB7fTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIGNhY2hlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBuYW1lIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAqIEBuZ2RvYyBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNvbnN0cnVjdG9yIChuYW1lLCBwa0F0dHIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgc2VsZiA9IHRoaXMsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBjYWNoZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY2FjaGUgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTWFwcGluZyBvZiBjYWNoZSBrZXlzIHRvIGJvb2xlYW4gdGhhdCBpbmRpY2F0ZXMgd2hldGhlciB0byB1c2UgdGhlIGBkYXRhQXR0cmAgb3Igbm90XG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlVXNlRGF0YUF0dHIgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTWFwcGluZyBvZiBjYWNoZSBrZXlzIHRvIGJvb2xlYW4gdGhhdCBpbmRpY2F0ZXMgd2hldGhlciB0aGUgdmFsdWUgaXMgbWFuYWdlZCBvciBub3RcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVJc01hbmFnZWQgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTWFwcGluZyBvZiBjYWNoZSBrZXlzIHRvIHRpbWVzdGFtcHMgZm9yIGF1dG9tYXRpYyBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVUaW1lc3RhbXBzID0ge307XG5cbiAgICAgICAgICAgICAgICBvcHRpb25zID0gYW5ndWxhci5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGdldCB0aGUgSUQgb2YgdGhlIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcGtBdHRyOiBudWxsLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZ2V0IHRoZSBVUkwgb2YgdGhlIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdXJsQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGdldCB0aGUgYWN0dWFsIGRhdGEgZnJvbVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBkYXRhQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRGVwZW5kZW50IGNhY2hlc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXk8U3RyaW5nPn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGRlcGVuZGVudDogW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRpbWUgdG8gbGl2ZSBmb3IgY2FjaGUgZW50cmllcyBpbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtpbnR9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB0dGw6IDYwICogNjBcbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zIHx8IHt9KTtcblxuICAgICAgICAgICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgaW5pdCgpO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVmcmVzaGVzIHRoZSBjYWNoZSBlbnRyaWVzIHdpdGggdGhlIG5ldyB2YWx1ZSBvciB2YWx1ZXMuIFRoZSBleGlzdGluZyBvYmplY3RzIGluIHRoZSBjYWNoZVxuICAgICAgICAgICAgICAgICAqIGFyZSBtYXRjaGVkIGJ5IHRoZSBgcGtBdHRyYCB2YWx1ZSwgYW5kIGFkZGl0aW9uYWxseSBieSB0aGUgYHVybEF0dHJgLCBpZiBhdmFpbGFibGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5PE9iamVjdD59IHZhbHVlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZWZyZXNoID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIGV4aXN0aW5nIHZhbHVlcyBpbiB0aGUgY2FjaGUgd2l0aCB0aGUgbmV3IGVudHJpZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlZnJlc2ggZXhpc3RpbmcgZW50cmllcyB3aXRoIGxpc3Qgb2YgbmV3IGVudHJpZXMgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoRWFjaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVmcmVzaCB0aGUgZXhpc3RpbmcgdmFsdWVzIGluIHRoZSBjYWNoZSB3aXRoIHRoZSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlZnJlc2ggZXhpc3RpbmcgZW50cmllcyB3aXRoIG5ldyBlbnRyeSBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTaW5nbGUodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogVW5hYmxlIHRvIHJlZnJlc2ggZXhpc3RpbmcgZW50cmllcyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJyBhcyBnaXZlbiB2YWx1ZSBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhbiBvYmplY3QuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBjYWNoZSBlbnRyeSBmb3IgdGhlIGdpdmVuIHZhbHVlIGFuZCBwdXRzIGl0IG9uIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB1c2VEYXRhQXR0clxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbcmVmcmVzaF1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmluc2VydCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCB1c2VEYXRhQXR0ciwgcmVmcmVzaCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBJbnNlcnQgdmFsdWUgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTWFuYWdlZCA9IGFuZ3VsYXIuaXNPYmplY3QodmFsdWUpIHx8IGFuZ3VsYXIuaXNBcnJheSh2YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAyMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzID0gaXNNYW5hZ2VkID8geydjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9IDoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0ID0gJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5ID0gW3N0YXR1cywgdmFsdWUsIGhlYWRlcnMsIHN0YXR1c1RleHRdO1xuXG4gICAgICAgICAgICAgICAgICAgIHVzZURhdGFBdHRyID0gISF1c2VEYXRhQXR0cjtcbiAgICAgICAgICAgICAgICAgICAgcmVmcmVzaCA9IGFuZ3VsYXIuaXNVbmRlZmluZWQocmVmcmVzaCkgPyB0cnVlIDogISFyZWZyZXNoO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlW2tleV0gPSBlbnRyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlVXNlRGF0YUF0dHJba2V5XSA9IHVzZURhdGFBdHRyICYmIGlzTWFuYWdlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlSXNNYW5hZ2VkW2tleV0gPSBpc01hbmFnZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVPclVwZGF0ZVRpbWVzdGFtcChrZXkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlZnJlc2ggZXhpc3RpbmcgZGF0YSBpZiBgcmVmcmVzaGAgcGFyYW1ldGVyIHdhcyBub3Qgc2V0IHRvIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVmcmVzaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVmcmVzaChnZXREYXRhRm9yRW50cnkoZW50cnksIHVzZURhdGFBdHRyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUHV0cyB0aGUgZ2l2ZW4gZW50cnkgd2l0aCB0aGUgZ2l2ZW4ga2V5IG9uIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB1c2VEYXRhQXR0clxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucHV0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUsIHVzZURhdGFBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFB1dCBlbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHVzZURhdGFBdHRyID0gISF1c2VEYXRhQXR0cjtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogSW5kaWNhdGVzIGlmIHZhbHVlIGlzIG1hbmFnZWQgYnkgdGhlIGNhY2hlLCB3aGljaCBtZWFucyBpdCBpcyByZWZyZXNoZWQgaWYgbmV3IGNhbGxzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiByZXR1cm4gdGhlIHNhbWUgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTWFuYWdlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0b3JlIHRoZSBhY3R1YWwgZGF0YSBvYmplY3QsIG5vdCB0aGUgc2VyaWFsaXplZCBzdHJpbmcsIGZvciBKU09OXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWVbMl0gJiYgdmFsdWVbMl1bJ2NvbnRlbnQtdHlwZSddID09PSAnYXBwbGljYXRpb24vanNvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBVc2UgZGVzZXJpYWxpemVkIGRhdGEgZm9yIGtleSAnXCIgKyBrZXkgKyBcIicgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbMV0gPSB2YWx1ZVsxXSA/IGFuZ3VsYXIuZnJvbUpzb24odmFsdWVbMV0pIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogVXNlIHJhdyBkYXRhIGZvciBrZXkgJ1wiICsga2V5ICsgXCInIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZURhdGFBdHRyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYW5hZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlVXNlRGF0YUF0dHJba2V5XSA9IHVzZURhdGFBdHRyO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVJc01hbmFnZWRba2V5XSA9IGlzTWFuYWdlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU9yVXBkYXRlVGltZXN0YW1wKGtleSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgcmVmcmVzaCB0aGUgY2FjaGUgZW50cmllcyBpZiB0aGUgdmFsdWUgaXMgYWxyZWFkeSBhIGNhY2hlIGVudHJ5ICh3aGljaCBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWx3YXlzIGFuIGFycmF5KSwgbm90IGEgcHJvbWlzZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc01hbmFnZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlZnJlc2goZ2V0RGF0YUZvckVudHJ5KHZhbHVlLCB1c2VEYXRhQXR0cikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGVudHJ5IHdpdGggdGhlIGdpdmVuIGtleSBmcm9tIHRoZSBjYWNoZSwgb3IgdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHVzZUNhY2hlVHRsXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0ID0gZnVuY3Rpb24gKGtleSwgdXNlQ2FjaGVUdGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBgdXNlQ2FjaGVUdGxgIHNob3VsZCBkZWZhdWx0IHRvIHRydWVcbiAgICAgICAgICAgICAgICAgICAgdXNlQ2FjaGVUdGwgPSBhbmd1bGFyLmlzVW5kZWZpbmVkKHVzZUNhY2hlVHRsKSB8fCAhIXVzZUNhY2hlVHRsID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXVzZUNhY2hlVHRsIHx8IGlzRW50cnlBbGl2ZShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogR2V0IGVudHJ5IHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FjaGVba2V5XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSB0byBzdHJpbmcgZm9yIG1hbmFnZWQgb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZUlzTWFuYWdlZFtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYW5ndWxhci5jb3B5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbMV0gPSBhbmd1bGFyLnRvSnNvbih2YWx1ZVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogRW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIGV4Y2VlZGVkIFRUTCBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogVW5hYmxlIHRvIGdldCBlbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgdGhlIGVudHJ5IHdpdGggdGhlIGdpdmVuIGtleSBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVtb3ZlIGVudHJ5IHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVUaW1lc3RhbXBzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlSXNNYW5hZ2VkW2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhbGwgZW50cmllcyBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlbW92ZSBhbGwgZW50cmllcyBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVVzZURhdGFBdHRyW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlSXNNYW5hZ2VkW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhbGwgbGlzdCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFsbExpc3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZW1vdmUgYWxsIGxpc3QgZW50cmllcyBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFuZ3VsYXIuaXNBcnJheShnZXREYXRhRm9yS2V5KGtleSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVVzZURhdGFBdHRyW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlSXNNYW5hZ2VkW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhbGwgbGlzdCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFsbE9iamVjdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlbW92ZSBhbGwgb2JqZWN0IGVudHJpZXMgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhbmd1bGFyLmlzT2JqZWN0KGdldERhdGFGb3JLZXkoa2V5KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVUaW1lc3RhbXBzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVJc01hbmFnZWRba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGFsbCBlbnRyaWVzIG9mIHRoZSBkZXBlbmRlbnQgY2FjaGVzLCBpbmNsdWRpbmcgdGhlIGRlcGVuZGVudCBjYWNoZXMgb2YgdGhlXG4gICAgICAgICAgICAgICAgICogZGVwZW5kZW50IGNhY2hlcyAoYW5kIHNvIG9uIC4uLikuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWxsRGVwZW5kZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVudENhY2hlTmFtZXMgPSBjb2xsZWN0RGVwZW5kZW50Q2FjaGVOYW1lcyhzZWxmLCBbXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXBlbmRlbnRDYWNoZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZXNbZGVwZW5kZW50Q2FjaGVOYW1lc1tpXV0ucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRGVzdHJveXMgdGhlIGNhY2hlIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlSW5kZXggPSBjYWNoZXMuaW5kZXhPZihzZWxmKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTWFuYWdlZCA9IGNhY2hlSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc01hbmFnZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IERlc3Ryb3kgdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVzLnNwbGljZShjYWNoZUluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZXRyaWV2ZSBpbmZvcm1hdGlvbiByZWdhcmRpbmcgdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7e2lkOiAqLCBzaXplOiBudW1iZXJ9fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaW5mbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogR2V0IGNhY2hlIGluZm9ybWF0aW9uIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHRoZSBjYWNoZSBzaXplXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzaXplJzogc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdvcHRpb25zJzogb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENhY2hlIGludGVyZmFjZSB0byBwdXQgZW50cmllcyB1c2luZyBgZGF0YUF0dHJgIG9uIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHR5cGUge3twdXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLnB1dCwgZ2V0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5nZXQsIHJlbW92ZTogKCopLCByZW1vdmVBbGw6ICgqKSwgaW5mbzogKCopfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLndpdGhEYXRhQXR0ciA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHV0KGtleSwgdmFsdWUsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldChrZXksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZW1vdmU6IHNlbGYucmVtb3ZlLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGw6IHNlbGYucmVtb3ZlQWxsLFxuICAgICAgICAgICAgICAgICAgICBpbmZvOiBzZWxmLmluZm9cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2FjaGUgaW50ZXJmYWNlIHRvIHB1dCBlbnRyaWVzIHdpdGhvdXQgdXNpbmcgYGRhdGFBdHRyYCBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRob3V0RGF0YUF0dHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnB1dChrZXksIHZhbHVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0KGtleSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZTogc2VsZi5yZW1vdmUsXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbDogc2VsZi5yZW1vdmVBbGwsXG4gICAgICAgICAgICAgICAgICAgIGluZm86IHNlbGYuaW5mb1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDYWNoZSBpbnRlcmZhY2UgdG8gcHV0IGVudHJpZXMgdXNpbmcgYGRhdGFBdHRyYCBvbiB0aGUgY2FjaGUgYW5kIGlnbm9yaW5nIFRUTC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHR5cGUge3twdXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLnB1dCwgZ2V0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5nZXQsIHJlbW92ZTogKCopLCByZW1vdmVBbGw6ICgqKSwgaW5mbzogKCopfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLndpdGhEYXRhQXR0ck5vVHRsID0ge1xuICAgICAgICAgICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wdXQoa2V5LCB2YWx1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0KGtleSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZW1vdmU6IHNlbGYucmVtb3ZlLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGw6IHNlbGYucmVtb3ZlQWxsLFxuICAgICAgICAgICAgICAgICAgICBpbmZvOiBzZWxmLmluZm9cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2FjaGUgaW50ZXJmYWNlIHRvIHB1dCBlbnRyaWVzIHdpdGhvdXQgdXNpbmcgYGRhdGFBdHRyYCBvbiB0aGUgY2FjaGUgYW5kIGlnbm9yaW5nIFRUTC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHR5cGUge3twdXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLnB1dCwgZ2V0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5nZXQsIHJlbW92ZTogKCopLCByZW1vdmVBbGw6ICgqKSwgaW5mbzogKCopfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLndpdGhvdXREYXRhQXR0ck5vVHRsID0ge1xuICAgICAgICAgICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wdXQoa2V5LCB2YWx1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldChrZXksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiBzZWxmLnJlbW92ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsOiBzZWxmLnJlbW92ZUFsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbzogc2VsZi5pbmZvXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGNhY2hlIGRhdGEgZm9yIHRoZSBnaXZlbiBrZXkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldERhdGFGb3JLZXkgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkgPSBjYWNoZVtrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZURhdGFBdHRyID0gY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RGF0YUZvckVudHJ5KGVudHJ5LCB1c2VEYXRhQXR0cik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBjYWNoZSBkYXRhIGZvciB0aGUgZ2l2ZW4gY2FjaGUgZW50cnkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHVzZURhdGFBdHRyXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0RGF0YUZvckVudHJ5ICh2YWx1ZSwgdXNlRGF0YUF0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gdmFsdWVbMV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZURhdGFBdHRyICYmIG9wdGlvbnMuZGF0YUF0dHIgJiYgZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFbb3B0aW9ucy5kYXRhQXR0cl1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2V0cyB0aGUgY2FjaGUgZGF0YSBmb3IgdGhlIGdpdmVuIGtleS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG5ld0RhdGFcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBzZXREYXRhRm9yS2V5IChrZXksIG5ld0RhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5ID0gY2FjaGVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeVVzZURhdGFBdHRyID0gY2FjaGVVc2VEYXRhQXR0cltrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5RGF0YSA9IGVudHJ5WzFdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlVc2VEYXRhQXR0ciAmJiBvcHRpb25zLmRhdGFBdHRyICYmIGVudHJ5RGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5RGF0YVtvcHRpb25zLmRhdGFBdHRyXSA9IG5ld0RhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGEgPSBuZXdEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRyeVsxXSA9IGVudHJ5RGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdW5peCBlcG9jaCBpbiBzZWNvbmRzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHtpbnR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0Q3VycmVudFRpbWVzdGFtcCAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTZXRzIHRoZSB0aW1lc3RhbXAgZm9yIHRoZSBnaXZlbiBrZXkgdG8gdGhlIGN1cnJlbnQgdW5peCBlcG9jaCBpbiBzZWNvbmRzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7aW50fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU9yVXBkYXRlVGltZXN0YW1wIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVUaW1lc3RhbXBzW2tleV0gPSBnZXRDdXJyZW50VGltZXN0YW1wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDaGVja3MgaWYgdGhlIGNhY2hlIGVudHJ5IGZvciB0aGUgZ2l2ZW4ga2V5IGlzIHN0aWxsIGFsaXZlLiBBbHNvIHJldHVybnNcbiAgICAgICAgICAgICAgICAgKiBgZmFsc2VgIGlmIHRoZXJlIGlzIG5vIGNhY2hlIGVudHJ5IGZvciB0aGUgZ2l2ZW4ga2V5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpc0VudHJ5QWxpdmUgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlBZ2UgPSBnZXRDdXJyZW50VGltZXN0YW1wKCkgLSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVudHJ5QWdlIDw9IG9wdGlvbnMudHRsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRha2VzIGEgbmV3IGNhY2hlIGVudHJ5IGFuZCByZWZyZXNoZXMgdGhlIGV4aXN0aW5nIGluc3RhbmNlcyBvZiB0aGUgZW50cnksIG1hdGNoaW5nIGJ5IHRoZVxuICAgICAgICAgICAgICAgICAqIGBwa0F0dHJgIHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBuZXdEYXRhXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVmcmVzaFNpbmdsZSAobmV3RGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybEF0dHIgPSBvcHRpb25zLnVybEF0dHI7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zZXJ0cyB0aGUgZGF0YSBvbiB0aGUgY2FjaGUgYXMgaW5kaXZpZHVhbCBlbnRyeSwgaWYgd2UgaGF2ZSB0aGUgVVJMIGluZm9ybWF0aW9uIG9uIHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmxBdHRyICYmIG5ld0RhdGEgJiYgbmV3RGF0YVt1cmxBdHRyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pbnNlcnQobmV3RGF0YVt1cmxBdHRyXSwgbmV3RGF0YSwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkgJiYgY2FjaGVJc01hbmFnZWRba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSA9IGNhY2hlW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5VXNlRGF0YUF0dHIgPSBjYWNoZVVzZURhdGFBdHRyW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5RGF0YSA9IGdldERhdGFGb3JFbnRyeShlbnRyeSwgZW50cnlVc2VEYXRhQXR0ciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTGlzdCA9IGFuZ3VsYXIuaXNBcnJheShlbnRyeURhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVmcmVzaCB0aGUgb2JqZWN0cyBtYXRjaGluZyB0aGUgbmV3IG9iamVjdCB3aXRoaW4gdGhlIGxpc3QgZW50cmllcyBpbiB0aGUgY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50cnlEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlEYXRhW2ldW3BrQXR0cl0gPT09IG5ld0RhdGFbcGtBdHRyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZGl0aW9uYWxseSBjb21wYXJlIHRoZSBgdXJsQXR0cmAsIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdXJsQXR0ciB8fCAodXJsQXR0ciAmJiBlbnRyeURhdGFbaV1bdXJsQXR0cl0gPT09IG5ld0RhdGFbdXJsQXR0cl0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5RGF0YVtpXSA9IG5ld0RhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBjYWNoZSBlbnRyeSB3aXRoIHRoZSBuZXcgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREYXRhRm9yS2V5KGtleSwgZW50cnlEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVmcmVzaCB0aGUgb2JqZWN0cyBtYXRjaGluZyB0aGUgbmV3IG9iamVjdCBpbiB0aGUgY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJ5RGF0YVtwa0F0dHJdID09PSBuZXdEYXRhW3BrQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZGl0aW9uYWxseSBjb21wYXJlIHRoZSBgdXJsQXR0cmAsIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1cmxBdHRyIHx8ICh1cmxBdHRyICYmIGVudHJ5RGF0YVt1cmxBdHRyXSA9PT0gbmV3RGF0YVt1cmxBdHRyXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREYXRhRm9yS2V5KGtleSwgbmV3RGF0YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3Igb2JqZWN0IGVudHJpZXMgd2UgY2FuIHVwZGF0ZSB0aGUgZW50cmllcyB0aW1lc3RhbXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVPclVwZGF0ZVRpbWVzdGFtcChrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVmcmVzaGVzIGVhY2ggZW50cnkgaW4gdGhlIGdpdmVuIGxpc3QgdXNpbmcgdGhlIGByZWZyZXNoU2luZ2xlYCBtZXRob2QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBuZXdFbnRyaWVzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVmcmVzaEVhY2ggKG5ld0VudHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdFbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2luZ2xlKG5ld0VudHJpZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogSW5pdGlhbGl6ZXMgdGhlIGNhY2hlIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBnaXZlbiBuYW1lIGlzIG5vdCB1c2VkIHlldFxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5hbWUgJ1wiICsgbmFtZSArIFwiJyBpcyBhbHJlYWR5IHVzZWQgYnkgYW5vdGhlciBjYWNoZS5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjYWNoZXNbbmFtZV0gPSBzZWxmO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxscyB0aGUgcmVtb3ZlQWxsIG1ldGhvZCBvbiBhbGwgbWFuYWdlZCBjYWNoZXMuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29uc3RydWN0b3IucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZXNba2V5XS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgd2l0aCB0aGUgZ2l2ZW4gbmFtZSwgb3IgbnVsbC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICogQHJldHVybnMgeyp8bnVsbH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29uc3RydWN0b3IuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIGlmIChjYWNoZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogQ2FjaGUgJ1wiICsga2V5ICsgXCInIGRvZXMgbm90IGV4aXN0LlwiKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXRzIHRoZSBjYWNoZSBpbmZvcm1hdGlvbiBmb3IgYWxsIG1hbmFnZWQgY2FjaGVzIGFzIG1hcHBpbmcgb2YgY2FjaGVJZCB0byB0aGUgcmVzdWx0XG4gICAgICAgICAgICAgKiBvZiB0aGUgaW5mbyBtZXRob2Qgb24gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7e319XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLmluZm8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIGluZm9zID0ge307XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGNhY2hlc1trZXldLmluZm8oKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3NbaW5mby5pZF0gPSBpbmZvO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZm9zO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb2xsZWN0cyBhbGwgZGVwZW5kZW50IGNhY2hlcyBvZiB0aGUgZ2l2ZW4gY2FjaGUsIGluY2x1ZGluZyB0aGUgZGVwZW5kZW50IGNhY2hlcyBvZiB0aGUgZGVwZW5kZW50XG4gICAgICAgICAgICAgKiBjYWNoZXMgKGFuZCBzbyBvbiAuLi4pLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlU2VydmljZVxuICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjYWNoZVxuICAgICAgICAgICAgICogQHBhcmFtIHtBcnJheTxTdHJpbmc+fHVuZGVmaW5lZH0gY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lc1xuICAgICAgICAgICAgICogQHJldHVybnMge0FycmF5PFN0cmluZz59XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNvbGxlY3REZXBlbmRlbnRDYWNoZU5hbWVzIChjYWNoZSwgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcykge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBjYWNoZURlcGVuZGVudENhY2hlTmFtZXMgPSBjYWNoZS5pbmZvKClbJ29wdGlvbnMnXVsnZGVwZW5kZW50J107XG5cbiAgICAgICAgICAgICAgICAvLyBkZWZhdWx0IGBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzYCB0byBlbXB0eSBsaXN0XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcyA9IGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMgfHwgW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lID0gY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWVzW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVEZXBlbmRlbnRDYWNoZSA9IGNhY2hlc1tjYWNoZURlcGVuZGVudENhY2hlTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlRGVwZW5kZW50Q2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHB1c2ggY2FjaGUgbmFtZSB0byB0aGUgY29sbGVjdGVkIGRlcGVuZGVudCBjYWNoZXMsIGlmIGV4aXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzLnB1c2goY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IGNvbGxlY3QgY2FjaGUgZGVwZW5kZW5jaWVzIGlmIG5vdCBhbHJlYWR5IGNvbGxlY3RlZCwgdG8gcHJldmVudCBjaXJjbGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcy5pbmRleE9mKGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0RGVwZW5kZW50Q2FjaGVOYW1lcyhjYWNoZURlcGVuZGVudENhY2hlLCBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcbiAgICAgICAgfVxuICAgICk7XG59KSgpO1xuIiwiLyoqXG4gKiBBbmd1bGFyIFJlc291cmNlRmFjdG9yeVNlcnZpY2VcbiAqIENvcHlyaWdodCAyMDE2IEFuZHJlYXMgU3RvY2tlclxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbiAqIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuICogcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlXG4gKiBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcbiAqIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyXG4gICAgICAgIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCduZ1Jlc291cmNlRmFjdG9yeScpO1xuXG4gICAgLyoqXG4gICAgICogRmFjdG9yeSBzZXJ2aWNlIHRvIGNyZWF0ZSBuZXcgcmVzb3VyY2UgY2xhc3Nlcy5cbiAgICAgKlxuICAgICAqIEBuYW1lIFJlc291cmNlRmFjdG9yeVNlcnZpY2VcbiAgICAgKiBAbmdkb2MgZmFjdG9yeVxuICAgICAqIEBwYXJhbSB7c2VydmljZX0gJHFcbiAgICAgKiBAcGFyYW0ge3NlcnZpY2V9ICRyZXNvdXJjZVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2VDYWNoZVNlcnZpY2V9IFJlc291cmNlQ2FjaGVTZXJ2aWNlIERlZmF1bHQgY2FjaGUgc2VydmljZVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2VQaGFudG9tSWROZWdhdGl2ZUludH0gUmVzb3VyY2VQaGFudG9tSWROZWdhdGl2ZUludCBEZWZhdWx0IHBoYW50b20gSUQgZ2VuZXJhdG9yXG4gICAgICovXG4gICAgbW9kdWxlLmZhY3RvcnkoJ1Jlc291cmNlRmFjdG9yeVNlcnZpY2UnLFxuICAgICAgICBmdW5jdGlvbiAoJHEsXG4gICAgICAgICAgICAgICAgICAkcmVzb3VyY2UsXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZUNhY2hlU2VydmljZSxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnQpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAqIEBuZ2RvYyBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgcmVzb3VyY2Ugc2VydmljZVxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCBVUkwgdG8gdGhlIHJlc291cmNlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG5hbWUsIHVybCwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIE9wdGlvbnMgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGFuZ3VsYXIuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE9wdGlvbiB0byBzdHJpcCB0cmFpbGluZyBzbGFzaGVzIGZyb20gcmVxdWVzdCBVUkxzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc3RyaXBUcmFpbGluZ1NsYXNoZXM6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBPcHRpb24gdG8gaWdub3JlIHRoZSByZXNvdXJjZSBmb3IgYXV0b21hdGljIGxvYWRpbmcgYmFyc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBHZW5lcmF0ZSBJRHMgZm9yIHBoYW50b20gcmVjb3JkcyBjcmVhdGVkIHZpYSB0aGUgYG5ld2BcbiAgICAgICAgICAgICAgICAgICAgICogbWV0aG9kIG9uIHRoZSByZXNvdXJjZSBzZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVQaGFudG9tSWRzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBQaGFudG9tIElEIGdlbmVyYXRvciBpbnN0YW5jZSB0byB1c2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1Jlc291cmNlUGhhbnRvbUlkRmFjdG9yeX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBoYW50b21JZEdlbmVyYXRvcjogUmVzb3VyY2VQaGFudG9tSWROZWdhdGl2ZUludCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTGlzdCBvZiByZXNvdXJjZSBzZXJ2aWNlcyB0byBjbGVhbiB0aGUgY2FjaGUgZm9yLCBvbiBtb2RpZnlpbmcgcmVxdWVzdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5PFN0cmluZz59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbnQ6IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBFeHRyYSBtZXRob2RzIHRvIHB1dCBvbiB0aGUgcmVzb3VyY2Ugc2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZXh0cmFNZXRob2RzOiB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRXh0cmEgZnVuY3Rpb25zIHRvIHB1dCBvbiB0aGUgcmVzb3VyY2UgaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBleHRyYUZ1bmN0aW9uczoge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRvIGZpbmQgdGhlIElEIG9mIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBrQXR0cjogJ3BrJyxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQXR0cmlidXRlIG5hbWUgd2hlcmUgdG8gZmluZCB0aGUgVVJMIG9mIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHVybEF0dHI6ICd1cmwnLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBBdHRyaWJ1dGUgbmFtZSB3aGVyZSB0byBmaW5kIHRoZSBkYXRhIG9uIHRoZSBxdWVyeSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5RGF0YUF0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRvIGZpbmQgdGhlIHRvdGFsIGFtb3VudCBvZiBkYXRhIG9uIHRoZSBxdWVyeSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VG90YWxBdHRyOiBudWxsLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTdG9yYWdlIGZvciB0aGUgcXVlcnkgZmlsdGVyc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5RmlsdGVyOiB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRnVuY3Rpb24gdG8gcG9zdC1wcm9jZXNzIGRhdGEgY29taW5nIGZyb20gcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB0b0ludGVybmFsOiBmdW5jdGlvbiAob2JqLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEZ1bmN0aW9uIHRvIHBvc3QtcHJvY2VzcyBkYXRhIHRoYXQgaXMgZ29pbmcgdG8gYmUgc2VudFxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gb2JqXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBmcm9tSW50ZXJuYWw6IGZ1bmN0aW9uIChvYmosIGhlYWRlcnNHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zIHx8IHt9KTtcblxuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRGVmYXVsdCBwYXJhbWV0ZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNEZWZhdWx0cyA9IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBQYXJhbWV0ZXIgY29uZmlndXJhdGlvbiBmb3Igc2F2ZSAoaW5zZXJ0KS4gVXNlZCB0b1xuICAgICAgICAgICAgICAgICAgICAgKiBkaXNhYmxlIHRoZSBQSyB1cmwgdGVtcGxhdGUgZm9yIHNhdmVcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc2F2ZVBhcmFtcyA9IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgY2FjaGUgaW5zdGFuY2UgZm9yIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1Jlc291cmNlQ2FjaGVTZXJ2aWNlfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY2FjaGUgPSBuZXcgUmVzb3VyY2VDYWNoZVNlcnZpY2UobmFtZSwgb3B0aW9ucy5wa0F0dHIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFBdHRyOiBvcHRpb25zLnF1ZXJ5RGF0YUF0dHIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwa0F0dHI6IG9wdGlvbnMucGtBdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsQXR0cjogb3B0aW9ucy51cmxBdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW50OiBvcHRpb25zLmRlcGVuZGVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR0bDogMTUgKiA2MFxuICAgICAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogSW50ZXJjZXB0b3IgdGhhdCBwdXRzIHRoZSByZXR1cm5lZCBvYmplY3Qgb24gdGhlIGNhY2hlIGFuIGludmFsaWRhdGVzIHRoZVxuICAgICAgICAgICAgICAgICAgICAgKiBkZXBlbmRlbnQgcmVzb3VyY2Ugc2VydmljZXMgY2FjaGVzLlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0aW5nSW50ZXJjZXB0b3IgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsTGlzdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxEZXBlbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbnNlcnQoZGF0YVtvcHRpb25zLnVybEF0dHJdLCBkYXRhLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEludGVyY2VwdG9yIHRoYXQgcHV0cyB0aGUgcmV0dXJuZWQgb2JqZWN0IG9uIHRoZSBjYWNoZSBhbiBpbnZhbGlkYXRlcyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICogZGVwZW5kZW50IHJlc291cmNlIHNlcnZpY2VzIGNhY2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIG1vZGlmeWluZ0ludGVyY2VwdG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gcmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gZGF0YVtvcHRpb25zLnVybEF0dHJdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsTGlzdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxEZXBlbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbnNlcnQodXJsLCBkYXRhLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEludGVyY2VwdG9yIHRoYXQgcmVtb3ZlcyB0aGUgY2FjaGUgZm9yIHRoZSBkZWxldGVkIG9iamVjdCwgcmVtb3ZlcyBhbGwgbGlzdCBjYWNoZXMsIGFuZFxuICAgICAgICAgICAgICAgICAgICAgKiBpbnZhbGlkYXRlcyB0aGUgZGVwZW5kZW50IHJlc291cmNlIHNlcnZpY2VzIGNhY2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0aW5nSW50ZXJjZXB0b3IgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsTGlzdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxEZXBlbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUocmVzcG9uc2UuY29uZmlnLnVybCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFBhcnNlcyB0aGUgcmVzcG9uc2UgdGV4dCBhcyBKU09OIGFuZCByZXR1cm5zIGl0IGFzIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlc3BvbnNlVGV4dFxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdHxBcnJheXxzdHJpbmd8bnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbiA9IGZ1bmN0aW9uIChyZXNwb25zZVRleHQsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBEZXNlcmlhbGl6ZSBkYXRhLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlVGV4dCA/IGFuZ3VsYXIuZnJvbUpzb24ocmVzcG9uc2VUZXh0KSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxzIHRoZSBgdG9JbnRlcm5hbGAgZnVuY3Rpb24gb24gZWFjaCBvYmplY3Qgb2YgdGhlIHJlc3BvbnNlIGFycmF5LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVzcG9uc2VEYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsID0gZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IFBvc3QtcHJvY2VzcyBxdWVyeSBkYXRhIGZvciBpbnRlcm5hbCB1c2UuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpdGVyYXRlIG92ZXIgdGhlIHJlc3BvbnNlIGRhdGEsIGlmIGl0IHdhcyBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShyZXNwb25zZURhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZURhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VEYXRhW2ldID0gb3B0aW9ucy50b0ludGVybmFsKHJlc3BvbnNlRGF0YVtpXSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIGp1c3QgY2FsbCB0aGUgYHRvSW50ZXJuYWxgIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlRGF0YSA9IG9wdGlvbnMudG9JbnRlcm5hbChyZXNwb25zZURhdGEsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZURhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxzIHRoZSBgdG9JbnRlcm5hbGAgZnVuY3Rpb24gb24gdGhlIHJlc3BvbnNlIGRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVzcG9uc2VEYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbCA9IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBQb3N0LXByb2Nlc3MgZGF0YSBmb3IgaW50ZXJuYWwgdXNlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMudG9JbnRlcm5hbChyZXNwb25zZURhdGEsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRyYW5zZm9ybXMgcXVlcnkgcmVzcG9uc2VzIHRvIGdldCB0aGUgYWN0dWFsIGRhdGEgZnJvbSB0aGUgYHF1ZXJ5RGF0YUF0dHJgIG9wdGlvbiwgaWZcbiAgICAgICAgICAgICAgICAgICAgICogY29uZmlndXJlZC4gQWxzbyBzZXRzIHRoZSBgdG90YWxgIGF0dHJpYnV0ZSBvbiB0aGUgbGlzdCBpZiBgcXVlcnlUb3RhbEF0dHJgIGlzIGNvbmZpZ3VyZWQuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXNwb25zZURhdGFcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZURhdGEgPSBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCBkYXRhIG9uIHN1Y2Nlc3Mgc3RhdHVzIGZyb20gYHF1ZXJ5RGF0YUF0dHJgLCBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGRhdGEgZnJvbSB0aGUgYHF1ZXJ5RGF0YUF0dHJgLCBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucXVlcnlEYXRhQXR0ciAmJiByZXNwb25zZURhdGEgJiYgcmVzcG9uc2VEYXRhW29wdGlvbnMucXVlcnlEYXRhQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBHZXQgZGF0YSBmcm9tICdcIiArIG9wdGlvbnMucXVlcnlEYXRhQXR0ciArIFwiJyBhdHRyaWJ1dGUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3BvbnNlRGF0YVtvcHRpb25zLnF1ZXJ5RGF0YUF0dHJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgdG90YWwgZnJvbSB0aGUgYHF1ZXJ5VG90YWxBdHRyYCwgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnF1ZXJ5VG90YWxBdHRyICYmIHJlc3BvbnNlRGF0YSAmJiByZXNwb25zZURhdGFbb3B0aW9ucy5xdWVyeVRvdGFsQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBHZXQgdG90YWwgZnJvbSAnXCIgKyBvcHRpb25zLnF1ZXJ5VG90YWxBdHRyICsgXCInIGF0dHJpYnV0ZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsID0gcmVzcG9uc2VEYXRhW29wdGlvbnMucXVlcnlUb3RhbEF0dHJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9uIGFueSBvdGhlciBzdGF0dXMganVzdCByZXR1cm4gdGhlIHJlc3BvbmRlZCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3BvbnNlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU2VyaWFsaXplcyB0aGUgcmVxdWVzdCBkYXRhIGFzIEpTT04gYW5kIHJldHVybnMgaXQgYXMgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVxdWVzdERhdGFcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvbiA9IGZ1bmN0aW9uIChyZXF1ZXN0RGF0YSwgaGVhZGVyc0dldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBTZXJpYWxpemUgZGF0YS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclByaXZhdGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoa2V5KVswXSA9PT0gJyQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5cyA9IGFuZ3VsYXIuaXNPYmplY3QocmVxdWVzdERhdGEpID8gT2JqZWN0LmtleXMocmVxdWVzdERhdGEpIDogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZUtleXMgPSBrZXlzLmZpbHRlcihmaWx0ZXJQcml2YXRlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcml2YXRlS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXF1ZXN0RGF0YVtwcml2YXRlS2V5c1tpXV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLnRvSnNvbihyZXF1ZXN0RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxzIHRoZSBgZnJvbUludGVybmFsYCBmdW5jdGlvbiBvbiB0aGUgcmVxdWVzdCBkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlcXVlc3REYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsID0gZnVuY3Rpb24gKHJlcXVlc3REYXRhLCBoZWFkZXJzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IFBvc3QtcHJvY2VzcyBkYXRhIGZvciBleHRlcm5hbCB1c2UuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mcm9tSW50ZXJuYWwoYW5ndWxhci5jb3B5KHJlcXVlc3REYXRhKSwgaGVhZGVyc0dldHRlcik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1ldGhvZCBjb25maWd1cmF0aW9uIGZvciB0aGUgbmctcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBjYWNoZS53aXRob3V0RGF0YUF0dHJOb1R0bCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlLndpdGhvdXREYXRhQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXROb0NhY2hlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlLndpdGhEYXRhQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeU5vQ2FjaGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3I6IGluc2VydGluZ0ludGVyY2VwdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvcjogbW9kaWZ5aW5nSW50ZXJjZXB0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvcjogZGVsZXRpbmdJbnRlcmNlcHRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIGV4dGVuZCB0aGUgbWV0aG9kcyB3aXRoIHRoZSBnaXZlbiBleHRyYSBtZXRob2RzXG4gICAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQobWV0aG9kcywgb3B0aW9ucy5leHRyYU1ldGhvZHMpO1xuXG4gICAgICAgICAgICAgICAgLy8gb2ZmZXIgbWV0aG9kcyBmb3IgcXVlcnlpbmcgd2l0aG91dCBhIGxvYWRpbmcgYmFyICh1c2luZyBhICdCZycgc3VmZml4KVxuICAgICAgICAgICAgICAgIGZvciAodmFyIG1ldGhvZE5hbWUgaW4gbWV0aG9kcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kcy5oYXNPd25Qcm9wZXJ0eShtZXRob2ROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmdNZXRob2ROYW1lID0gbWV0aG9kTmFtZSArICdCZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmdNZXRob2RDb25maWcgPSBhbmd1bGFyLmNvcHkobWV0aG9kc1ttZXRob2ROYW1lXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJnTWV0aG9kQ29uZmlnLmlnbm9yZUxvYWRpbmdCYXIgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2RzW2JnTWV0aG9kTmFtZV0gPSBiZ01ldGhvZENvbmZpZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGJ1aWxkIHRoZSBkZWZhdWx0IHBhcmFtcyBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgcGFyYW1zRGVmYXVsdHNbb3B0aW9ucy5wa0F0dHJdID0gJ0AnICsgb3B0aW9ucy5wa0F0dHI7XG4gICAgICAgICAgICAgICAgc2F2ZVBhcmFtc1tvcHRpb25zLnBrQXR0cl0gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgbWV0aG9kcy5zYXZlLnBhcmFtcyA9IHNhdmVQYXJhbXM7XG5cbiAgICAgICAgICAgICAgICAvLyBidWlsZCB0aGUgcmVzb3VyY2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSAkcmVzb3VyY2UodXJsLCBwYXJhbXNEZWZhdWx0cywgbWV0aG9kcywge1xuICAgICAgICAgICAgICAgICAgICBzdHJpcFRyYWlsaW5nU2xhc2hlczogb3B0aW9ucy5zdHJpcFRyYWlsaW5nU2xhc2hlc1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgUEsgYXR0cmlidXRlIG5hbWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRQa0F0dHIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnBrQXR0cjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgZGF0YSBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldERhdGFBdHRyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5kYXRhQXR0cjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmV0dXJucyBhbiBvYmplY3QgaG9sZGluZyB0aGUgZmlsdGVyIGRhdGEgZm9yIHF1ZXJ5IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRRdWVyeUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnF1ZXJ5RmlsdGVyO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTZXRzIHRoZSBvYmplY3QgaG9sZGluZyB0aGUgZmlsdGVyIGRhdGEgZm9yIHF1ZXJ5IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZmlsdGVyc1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLnNldFF1ZXJ5RmlsdGVycyA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoZmlsdGVycywgb3B0aW9ucy5xdWVyeUZpbHRlcik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIGdpdmVuIGZpbHRlciBvcHRpb25zIGlmIHRoZSBhcmVuJ3QgYWxyZWFkeSBzZXQgb24gdGhlIGZpbHRlciBvYmplY3RcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZGVmYXVsdEZpbHRlcnNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5zZXREZWZhdWx0UXVlcnlGaWx0ZXJzID0gZnVuY3Rpb24gKGRlZmF1bHRGaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVycyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBkZWZhdWx0RmlsdGVycywgb3B0aW9ucy5xdWVyeUZpbHRlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShmaWx0ZXJzLCBvcHRpb25zLnF1ZXJ5RmlsdGVyKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUXVlcmllcyB0aGUgcmVzb3VyY2Ugd2l0aCB0aGUgY29uZmlndXJlZCBmaWx0ZXJzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnMgPSBhbmd1bGFyLmV4dGVuZCh7fSwgcmVzb3VyY2UuZ2V0UXVlcnlGaWx0ZXJzKCksIGZpbHRlcnMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UucXVlcnkoZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFF1ZXJpZXMgdGhlIHJlc291cmNlIHdpdGggdGhlIGNvbmZpZ3VyZWQgZmlsdGVycyB3aXRob3V0IHVzaW5nIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5maWx0ZXJOb0NhY2hlID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVycyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCByZXNvdXJjZS5nZXRRdWVyeUZpbHRlcnMoKSwgZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5xdWVyeU5vQ2FjaGUoZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLm5ldyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFudG9tSW5zdGFuY2UgPSBuZXcgcmVzb3VyY2UocGFyYW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBwaGFudG9tIElEIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucGtBdHRyICYmIG9wdGlvbnMuZ2VuZXJhdGVQaGFudG9tSWRzICYmIG9wdGlvbnMucGhhbnRvbUlkR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFudG9tSW5zdGFuY2Vbb3B0aW9ucy5wa0F0dHJdID0gb3B0aW9ucy5waGFudG9tSWRHZW5lcmF0b3IuZ2VuZXJhdGUocGhhbnRvbUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwaGFudG9tSW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gaW5zdGFuY2UgaXMgYSBwaGFudG9tIGluc3RhbmNlIChpbnN0YW5jZSBub3QgcGVyc2lzdGVkIHRvIHRoZSBSRVNUIEFQSSB5ZXQpXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbnx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaXNQaGFudG9tID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcGtWYWx1ZSA9IGluc3RhbmNlID8gaW5zdGFuY2Vbb3B0aW9ucy5wa0F0dHJdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHBoYW50b20gSUQgaWYgYWxsIGNvbmZpZ3VyZWQgY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnBrQXR0ciAmJiBvcHRpb25zLmdlbmVyYXRlUGhhbnRvbUlkcyAmJiBvcHRpb25zLnBoYW50b21JZEdlbmVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMucGhhbnRvbUlkR2VuZXJhdG9yLmlzUGhhbnRvbShwa1ZhbHVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgZnJvbSB0aGUgZ2l2ZW4gaW5zdGFuY2VzIHdoZXJlIHRoZSBnaXZlbiBhdHRyaWJ1dGUgbmFtZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICogdGhlIGdpdmVuIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGF0dHJOYW1lXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGF0dHJWYWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmZpbHRlckluc3RhbmNlc0J5QXR0ciA9IGZ1bmN0aW9uIChpbnN0YW5jZXMsIGF0dHJOYW1lLCBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJBdHRyVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtID8gaXRlbVthdHRyTmFtZV0gPT0gYXR0clZhbHVlIDogZmFsc2U7IC8vIHVzZSA9PSBoZXJlIHRvIG1hdGNoICcxMjMnIHRvIDEyM1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VzLmZpbHRlcihmaWx0ZXJBdHRyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBmaXJzdCBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBpbnN0YW5jZXMgd2hlcmUgdGhlIGdpdmVuIGF0dHJpYnV0ZSBuYW1lIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgKiB0aGUgZ2l2ZW4gYXR0cmlidXRlIHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXR0ck5hbWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXR0clZhbHVlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5QXR0ciA9IGZ1bmN0aW9uIChpbnN0YW5jZXMsIGF0dHJOYW1lLCBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRJbnN0YW5jZXMgPSByZXNvdXJjZS5maWx0ZXJJbnN0YW5jZXNCeUF0dHIoaW5zdGFuY2VzLCBhdHRyTmFtZSwgYXR0clZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyZWRJbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyZWRJbnN0YW5jZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IEZvdW5kIG1vcmUgdGhhbiAxIGluc3RhbmNlcyB3aGVyZSAnXCIgKyBhdHRyTmFtZSArIFwiJyBpcyAnXCIgKyBhdHRyVmFsdWUgKyBcIicgb24gZ2l2ZW4gJ1wiICsgbmFtZSArIFwiJyBpbnN0YW5jZXMuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBmaWx0ZXJlZEluc3RhbmNlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGZpcnN0IGluc3RhbmNlIGZyb20gdGhlIGdpdmVuIGluc3RhbmNlcyB3aGVyZSB0aGUgUEsgYXR0cmlidXRlIGhhcyB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa1ZhbHVlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5UGsgPSBmdW5jdGlvbiAoaW5zdGFuY2VzLCBwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5QXR0cihpbnN0YW5jZXMsIG9wdGlvbnMucGtBdHRyLCBwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldFJlc291cmNlTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgc3RvcmUgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Jlc291cmNlU3RvcmV9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuY3JlYXRlU3RvcmUgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzb3VyY2VTdG9yZShyZXNvdXJjZSwgaW5zdGFuY2VzLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2F2ZXMgdGhlIGdpdmVuIHJlc291cmNlIGluc3RhbmNlIHRvIHRoZSBSRVNUIEFQSS4gVXNlcyB0aGUgYCRzYXZlYCBtZXRob2QgaWYgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBpcyBwaGFudG9tLCBlbHNlIHRoZSBgJHVwZGF0ZWAgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbcGFyYW1zXVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UucGVyc2lzdCA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBgaW5zdGFuY2VgIGhhcyBhIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlID0gaW5zdGFuY2UgfHwge307XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlRm4gPSByZXNvdXJjZS5pc1BoYW50b20oaW5zdGFuY2UpID8gcmVzb3VyY2Uuc2F2ZSA6IHJlc291cmNlLnVwZGF0ZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2F2ZUZuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2F2ZUZuKHt9LCBpbnN0YW5jZSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBPYmplY3QgdG8gcGVyc2lzdCBpcyBub3QgYSB2YWxpZCByZXNvdXJjZSBpbnN0YW5jZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCA9ICRxLnJlamVjdChpbnN0YW5jZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdC4kcHJvbWlzZSA9IHJlamVjdDsgLy8gZmFrZSBwcm9taXNlIEFQSSBvZiByZXNvdXJjZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogQWRkIHNvbWUgb2YgdGhlIHJlc291cmNlIG1ldGhvZHMgYXMgaW5zdGFuY2UgbWV0aG9kcyBvbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBwcm90b3R5cGUgb2YgdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHJlc291cmNlLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU2F2ZXMgb3IgdXBkYXRlcyB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgJHBlcnNpc3Q6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc291cmNlLnBlcnNpc3QodGhpcywgcGFyYW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC4kcHJvbWlzZSB8fCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiBpbnN0YW5jZSBpcyBhIHBoYW50b20gcmVjb3JkIChub3Qgc2F2ZWQgdmlhIHRoZSBSRVNUIEFQSSB5ZXQpXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAkaXNQaGFudG9tOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2UuaXNQaGFudG9tKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEFkZCBleHRyYSBmdW5jdGlvbnMgYXMgaW5zdGFuY2UgbWV0aG9kcyBvbiB0aGUgcHJvdG90eXBlIG9mXG4gICAgICAgICAgICAgICAgICogdGhlIHJlc291cmNlLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHJlc291cmNlLnByb3RvdHlwZSwgb3B0aW9ucy5leHRyYUZ1bmN0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBhIHJlc291cmNlIHN0b3JlLiBBIHJlc291cmNlIHN0b3JlIG1hbmFnZXMgaW5zZXJ0cywgdXBkYXRlcyBhbmRcbiAgICAgICAgICAgICAqIGRlbGV0ZXMgb2YgaW5zdGFuY2VzLCBjYW4gY3JlYXRlIHN1Yi1zdG9yZXMgdGhhdCBjb21taXQgY2hhbmdlcyB0byB0aGUgcGFyZW50IHN0b3JlLCBhbmRcbiAgICAgICAgICAgICAqIHNldHMgdXAgcmVsYXRpb25zIGJldHdlZW4gcmVzb3VyY2UgdHlwZXMgKGUuZy4gdG8gdXBkYXRlIHJlZmVyZW5jZSBrZXlzKS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSByZXNvdXJjZVxuICAgICAgICAgICAgICogQHBhcmFtIG1hbmFnZWRJbnN0YW5jZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSBwYXJlbnRTdG9yZVxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIFJlc291cmNlU3RvcmUgKHJlc291cmNlLCBtYW5hZ2VkSW5zdGFuY2VzLCBwYXJlbnRTdG9yZSkge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBzZWxmID0gdGhpcyxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTmFtZSBvZiB0aGUgcmVzb3VyY2Ugc2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VOYW1lID0gcmVzb3VyY2UuZ2V0UmVzb3VyY2VOYW1lKCksXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEluZGljYXRvciBmb3IgcnVubmluZyBleGVjdXRpb24gKHN0b3BzIGFub3RoZXIgZXhlY3V0aW9uIGZyb20gYmVpbmcgaXNzdWVkKVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvblJ1bm5pbmcgPSBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ29udGFpbnMgcmVsYXRpb25zIHRvIG90aGVyIHN0b3JlcyAoZm9yIHVwZGF0aW5nIHJlZmVyZW5jZXMpXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheTxSZXNvdXJjZVN0b3JlUmVsYXRpb24+fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFN0b3JlcyByZXNvdXJjZSBpdGVtcyB0aGF0IGFyZSB2aXNpYmxlIGZvciB0aGUgdXNlciAobm90IHF1ZXVlZCBmb3IgcmVtb3ZlKVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlUXVldWUgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU3RvcmVzIHJlc291cmNlIGl0ZW1zIHF1ZXVlZCBmb3IgcGVyc2lzdGluZyAoc2F2ZSBvciB1cGRhdGUpXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBlcnNpc3RRdWV1ZSA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTdG9yZXMgcmVzb3VyY2UgaXRlbXMgcXVldWVkIGZvciBkZWxldGluZ1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVRdWV1ZSA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxsYmFja3MgZXhlY3V0ZWQgYmVmb3JlIGVhY2ggaXRlbSBwZXJzaXN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBhZnRlciBlYWNoIGl0ZW0gcGVyc2lzdHNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBiZWZvcmUgZWFjaCBpdGVtIHJlbW92ZXNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgYmVmb3JlUmVtb3ZlTGlzdGVuZXJzID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBhZnRlciBlYWNoIGl0ZW0gcmVtb3Zlc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBhZnRlclJlbW92ZUxpc3RlbmVycyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogTWFuYWdlIGdpdmVuIGluc3RhbmNlcy4gVGhlIG5ldyBpbnN0YW5jZXMgb2JqZWN0IG1heSBiZSBhIG5nLXJlc291cmNlIHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgKiBhIHByb21pc2UsIGEgbGlzdCBvZiBpbnN0YW5jZXMgb3IgYSBzaW5nbGUgaW5zdGFuY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBuZXdJbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLm1hbmFnZSA9IGZ1bmN0aW9uIChuZXdJbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb01hbmFnZSA9IGZ1bmN0aW9uIChuZXdJbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IE1hbmFnZSBnaXZlbiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2VzLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgZm9yIHNpbmdsZSBpbnN0YW5jZXMgYnkgY29udmVydGluZyBpdCB0byBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KG5ld0luc3RhbmNlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFuY2VzID0gW25ld0luc3RhbmNlc107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZSA9IG5ld0luc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQgeWV0LCBtYW5hZ2UgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdJbnN0YW5jZS4kc3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1ha2UgdGhlIHN0b3JlIGF2YWlsYWJsZSBvbiB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbmNlLiRzdG9yZSA9IHNlbGY7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgaW5zdGFuY2UgdG8gdGhlIGxpc3Qgb2YgbWFuYWdlZCBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UobWFuYWdlZEluc3RhbmNlcywgbmV3SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIG5ld0luc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2VzIGlzIGFscmVhZHkgbWFuYWdlZCBieSBhbm90aGVyIHN0b3JlLCBwcmludCBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChuZXdJbnN0YW5jZS4kc3RvcmUgIT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgYWxyZWFkeSBtYW5hZ2VkIGJ5IGFub3RoZXIgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZSBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgdGhpcyBzdG9yZSwgZG8gbm90aGluZyBidXQgbG9nZ2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGFscmVhZHkgbWFuYWdlZCBieSB0aGUgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IG5nLXJlc291cmNlIG9iamVjdHMgYW5kIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Byb21pc2VMaWtlKG5ld0luc3RhbmNlcykgfHwgaXNQcm9taXNlTGlrZShuZXdJbnN0YW5jZXMuJHByb21pc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gaXNQcm9taXNlTGlrZShuZXdJbnN0YW5jZXMpID8gbmV3SW5zdGFuY2VzIDogbmV3SW5zdGFuY2VzLiRwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGRvTWFuYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShuZXdJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBTeW5jaHJvbm91cyBpZiB3ZSBoYXZlIG5vIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb01hbmFnZShuZXdJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUobmV3SW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBGb3JnZXQgKHVuLW1hbmFnZSkgZ2l2ZW4gaW5zdGFuY2VzLiBUaGUgaW5zdGFuY2VzIG9iamVjdCBtYXkgYmUgYSBuZy1yZXNvdXJjZSByZXN1bHQsXG4gICAgICAgICAgICAgICAgICogYSBwcm9taXNlLCBhIGxpc3Qgb2YgaW5zdGFuY2VzIG9yIGEgc2luZ2xlIGluc3RhbmNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gb2xkSW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5mb3JnZXQgPSBmdW5jdGlvbiAob2xkSW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9Gb3JnZXQgPSBmdW5jdGlvbiAob2xkSW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBGb3JnZXQgZ2l2ZW4gJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IGZvciBzaW5nbGUgaW5zdGFuY2VzIGJ5IGNvbnZlcnRpbmcgaXQgdG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShvbGRJbnN0YW5jZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEluc3RhbmNlcyA9IFtvbGRJbnN0YW5jZXNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2xkSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkSW5zdGFuY2UgPSBvbGRJbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkIHlldCwgbWFuYWdlIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRJbnN0YW5jZS4kc3RvcmUgPT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc3RvcmUgYXR0cmlidXRlIGZyb20gdGhlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2xkSW5zdGFuY2UuJHN0b3JlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGluc3RhbmNlIGZyb20gdGhlIGxpc3Qgb2YgbWFuYWdlZCBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UobWFuYWdlZEluc3RhbmNlcywgb2xkSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIG9sZEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UocGVyc2lzdFF1ZXVlLCBvbGRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHJlbW92ZVF1ZXVlLCBvbGRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlcyBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgYW5vdGhlciBzdG9yZSwgcHJpbnQgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob2xkSW5zdGFuY2UuJHN0b3JlICE9PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIG1hbmFnZWQgYnkgYW5vdGhlciBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlIGlzIGFscmVhZHkgbWFuYWdlZCBieSB0aGlzIHN0b3JlLCBkbyBub3RoaW5nIGJ1dCBsb2dnaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IG5nLXJlc291cmNlIG9iamVjdHMgYW5kIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Byb21pc2VMaWtlKG9sZEluc3RhbmNlcykgfHwgaXNQcm9taXNlTGlrZShvbGRJbnN0YW5jZXMuJHByb21pc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gaXNQcm9taXNlTGlrZShvbGRJbnN0YW5jZXMpID8gb2xkSW5zdGFuY2VzIDogb2xkSW5zdGFuY2VzLiRwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGRvRm9yZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShvbGRJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBTeW5jaHJvbm91cyBpZiB3ZSBoYXZlIG5vIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb0ZvcmdldChvbGRJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUob2xkSW5zdGFuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZXR1cm5zIGEgbmV3IGluc3RhbmNlIG1hbmFnZWQgYnkgdGhlIHN0b3JlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGFyYW1zXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLm5ldyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZSA9IHJlc291cmNlLm5ldyhwYXJhbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubWFuYWdlKG5ld0luc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3SW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFF1ZXVlcyBnaXZlbiBpbnN0YW5jZSBmb3IgcGVyc2lzdGVuY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnBlcnNpc3QgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogUXVldWUgJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcyBmb3IgcGVyc2lzdC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzQXJyYXkoaW5zdGFuY2VzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzID0gW2luc3RhbmNlc107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZS4kc3RvcmUgPT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKHBlcnNpc3RRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UodmlzaWJsZVF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZShyZW1vdmVRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBpcyBub3QgbWFuYWdlZCBieSB0aGlzIHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBRdWV1ZXMgZ2l2ZW4gaW5zdGFuY2UgZm9yIGRlbGV0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmUgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogUXVldWUgJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcyBmb3IgcmVtb3ZlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShpbnN0YW5jZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMgPSBbaW5zdGFuY2VzXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGluc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluc3RhbmNlLiRzdG9yZSA9PT0gc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UocGVyc2lzdFF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKHJlbW92ZVF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkIGJ5IHRoaXMgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENvbW1pdHMgY2hhbmdlcyB0byB0aGUgcGFyZW50IHN0b3JlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuY29tbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHBhcmVudCBzdG9yZSBmaXJzdC4gV2UgY2Fubm90IGNvbW1pdCB0byBhIHBhcmVudCBzdG9yZVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBwYXJlbnQgc3RvcmUuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50U3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiBDYW5ub3QgY29tbWl0ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZXMgYXMgdGhlcmUgaXMgbm8gcGFyZW50IHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogQ29tbWl0ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBjaGFuZ2VzIHRvIHBhcmVudCBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tbWl0IHRoZSBwZXJzaXN0IHF1ZXVlIHRvIHRoZSBwYXJlbnQgc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwZXJzaXN0UXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkUGVyc2lzdEluc3RhbmNlID0gY29weShwZXJzaXN0UXVldWVbaV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFBlcnNpc3RJbnN0YW5jZSA9IHBhcmVudFN0b3JlLmdldEJ5SW5zdGFuY2UoY2hpbGRQZXJzaXN0SW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2hpbGRQZXJzaXN0SW5zdGFuY2UuJHN0b3JlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFBlcnNpc3RJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFBlcnNpc3RJbnN0YW5jZSA9IGNvcHkoY2hpbGRQZXJzaXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLm1hbmFnZShwYXJlbnRQZXJzaXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2UocGFyZW50UGVyc2lzdEluc3RhbmNlLCBjaGlsZFBlcnNpc3RJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLnBlcnNpc3QocGFyZW50UGVyc2lzdEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbW1pdCB0aGUgcmVtb3ZlIHF1ZXVlIHRvIHRoZSBwYXJlbnQgc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZW1vdmVRdWV1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRSZW1vdmVJbnN0YW5jZSA9IGNvcHkocmVtb3ZlUXVldWVbaV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFJlbW92ZUluc3RhbmNlID0gcGFyZW50U3RvcmUuZ2V0QnlJbnN0YW5jZShjaGlsZFJlbW92ZUluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNoaWxkUmVtb3ZlSW5zdGFuY2UuJHN0b3JlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFJlbW92ZUluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UmVtb3ZlSW5zdGFuY2UgPSBjb3B5KGNoaWxkUmVtb3ZlSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLm1hbmFnZShwYXJlbnRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShwYXJlbnRSZW1vdmVJbnN0YW5jZSwgY2hpbGRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlLnJlbW92ZShwYXJlbnRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgdGhlIGNoYW5nZSBxdWV1ZSBvbiB0aGlzIGFuIGFsbCByZWxhdGVkIHN0b3JlcyBhbmQgY2xlYXJzIHRoZSBjaGFuZ2UgcXVldWUgaWYgY2xlYXJBZnRlciBpc1xuICAgICAgICAgICAgICAgICAqIHNldCB0byB0cnVlIChkZWZhdWx0KS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtjbGVhckFmdGVyXVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5leGVjdXRlQWxsID0gZnVuY3Rpb24gKGNsZWFyQWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYGNsZWFyQWZ0ZXJgIHNob3VsZCBkZWZhdWx0IHRvIHRydWVcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJBZnRlciA9IGFuZ3VsYXIuaXNVbmRlZmluZWQoY2xlYXJBZnRlcikgfHwgISFjbGVhckFmdGVyO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSByZWxhdGVkIHN0b3Jlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVJlbGF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uID0gcmVsYXRpb25zW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRlZFN0b3JlID0gcmVsYXRpb24uZ2V0UmVsYXRlZFN0b3JlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBleGVjdXRpb24gb2YgdGhlIHJlbGF0ZWQgc3RvcmUgdG8gdGhlIGxpc3Qgb2ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvbWlzZXMgdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHJlbGF0ZWRTdG9yZS5leGVjdXRlQWxsKGNsZWFyQWZ0ZXIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgc3RvcmUgaXRzZWxmLCB0aGVuIGV4ZWN1dGUgdGhlIHJlbGF0ZWQgc3RvcmVzLiBJZiBldmVyeXRoaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlbnQgd2VsbCwgcmVzb2x2ZSB0aGUgcmV0dXJuZWQgcHJvbWlzZSwgZWxzZSByZWplY3QgaXQuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZXhlY3V0ZShjbGVhckFmdGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXhlY3V0ZVJlbGF0ZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihkZWZlci5yZXNvbHZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGRlZmVyLnJlamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV4ZWN1dGUgdGhlIGNoYW5nZSBxdWV1ZSBhbmQgY2xlYXJzIHRoZSBjaGFuZ2UgcXVldWUgaWYgY2xlYXJBZnRlciBpcyBzZXQgdG8gdHJ1ZSAoZGVmYXVsdCkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbY2xlYXJBZnRlcl1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZXhlY3V0ZSA9IGZ1bmN0aW9uIChjbGVhckFmdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGBjbGVhckFmdGVyYCBzaG91bGQgZGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyQWZ0ZXIgPSBhbmd1bGFyLmlzVW5kZWZpbmVkKGNsZWFyQWZ0ZXIpIHx8ICEhY2xlYXJBZnRlcjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDYW5ub3QgZXhlY3V0ZSB3aGVuIGFscmVhZHkgZXhlY3V0aW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChleGVjdXRpb25SdW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KFwiQW5vdGhlciBleGVjdXRpb24gaXMgYWxyZWFkeSBydW5uaW5nLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgcGFyZW50IHN0b3JlIHJhaXNlIGFuIGVycm9yXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRTdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJFeGVjdXRpbmcgdGhlIHN0b3JlIGlzIG9ubHkgcG9zc2libGUgb24gdGhlIHRvcG1vc3Qgc3RvcmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGlvbiBzdGFydGVkXG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvblJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIHJ1bm5pbmcgZmxhZyB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlYXNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRXJyb3IgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uUnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHdpdGggZ2l2ZW4gaXRlbSBhcyBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoaXRlbSwgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1JlbW92ZSA9IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zW2ldLmhhbmRsZVJlbW92ZShwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNVcGRhdGUgPSBmdW5jdGlvbiAob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1tpXS5oYW5kbGVVcGRhdGUob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyBhIHNpbmdsZSBSRVNUIEFQSSBjYWxsIG9uIHRoZSBnaXZlbiBpdGVtIHdpdGggdGhlIGdpdmVuIGZ1bmN0aW9uLiBDYWxscyB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGJlZm9yZSBhbmQgYWZ0ZXIgbGlzdGVuZXJzIGFuZCByZXNvbHZlcyB0aGUgZ2l2ZW4gZGVmZXIgYWZ0ZXIgYWxsIHRoaXMgaXMgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZXhlY0ZuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZGVmZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBiZWZvcmVMaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBhZnRlckxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGlzUmVtb3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVTaW5nbGUgPSBmdW5jdGlvbiAoaXRlbSwgZXhlY0ZuLCBiZWZvcmVMaXN0ZW5lcnMsIGFmdGVyTGlzdGVuZXJzLCBkZWZlciwgaXNSZW1vdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSBiZWZvcmUgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbExpc3RlbmVycyhpdGVtLCBiZWZvcmVMaXN0ZW5lcnMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgUkVTVCBBUEkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWNGbih7fSwgaXRlbSkuJHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JnZXQgcmVmZXJlbmNpbmcgaW5zdGFuY2VzIG9uIHJlbGF0ZWQgc3RvcmVzIGlmIHRoaXMgd2FzIGEgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIG9uIHRoZSBSRVNUIEFQSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVtb3ZlICYmIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNSZW1vdmUoaXRlbVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVzcG9uc2UgY29udGFpbnMgdGhlIHNhdmVkIG9iamVjdCAod2l0aCB0aGUgUEsgZnJvbSB0aGUgUkVTVCBBUEkpIHRoZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCB0aGUgbmV3IFBLIG9uIHRoZSBpdGVtLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkUGtWYWx1ZSA9IGl0ZW0gPyBpdGVtW3Jlc291cmNlLmdldFBrQXR0cigpXSA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1BrVmFsdWUgPSByZXNwb25zZS5kYXRhID8gcmVzcG9uc2UuZGF0YVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBGSyB2YWx1ZXMgb24gcmVmZXJlbmNpbmcgaW5zdGFuY2VzIG9uIHJlbGF0ZWQgc3RvcmVzIGlmIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3YXMgYSBzdWNjZXNzZnVsIGluc2VydCBvciB1cGRhdGUgb24gdGhlIFJFU1QgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1JlbW92ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNVcGRhdGUob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gPSBuZXdQa1ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVuIGNhbGwgdGhlIGFmdGVyIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbExpc3RlbmVycyhpdGVtLCBhZnRlckxpc3RlbmVycyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFuZCByZXNvbHZlIHRoZSBwcm9taXNlIHdpdGggdGhlIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChkZWZlci5yZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgcmVtb3ZlIHF1ZXVlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIGFzIHNvb24gYXMgYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBSRVNUIEFQSSBjYWxscyBhcmUgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVSZW1vdmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZSA9IHNlbGYuZ2V0UmVtb3ZlUXVldWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHF1ZXVlW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgbm9uLXBoYW50b20gZW50cmllcyBzaG91bGQgYmUgcmVtb3ZlZCAocGhhbnRvbXMgZG9uJ3QgZXhpc3QgYW55d2F5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uJGlzUGhhbnRvbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goZGVmZXIucHJvbWlzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIHNpbmdsZSBSRVNUIEFQSSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2luZ2xlKGl0ZW0sIHJlc291cmNlLnJlbW92ZSwgYmVmb3JlUmVtb3ZlTGlzdGVuZXJzLCBhZnRlclJlbW92ZUxpc3RlbmVycywgZGVmZXIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSB1cGRhdGUgcXVldWUuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgYXMgc29vbiBhcyBhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFJFU1QgQVBJIGNhbGxzIGFyZSBkb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVVwZGF0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlID0gc2VsZi5nZXRVcGRhdGVRdWV1ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gcXVldWVbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChkZWZlci5wcm9taXNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBzaW5nbGUgUkVTVCBBUEkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2luZ2xlKGl0ZW0sIHJlc291cmNlLnVwZGF0ZSwgYmVmb3JlUGVyc2lzdExpc3RlbmVycywgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLCBkZWZlciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgc2F2ZSAoaW5zZXJ0KSBxdWV1ZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBhcyBzb29uIGFzIGFsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICogUkVTVCBBUEkgY2FsbHMgYXJlIGRvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2F2ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlID0gc2VsZi5nZXRTYXZlUXVldWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHF1ZXVlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goZGVmZXIucHJvbWlzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgc2luZ2xlIFJFU1QgQVBJIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVNpbmdsZShpdGVtLCByZXNvdXJjZS5zYXZlLCBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLCBhZnRlclBlcnNpc3RMaXN0ZW5lcnMsIGRlZmVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIENsZWFycyB0aGUgY2hhbmdlIHF1ZXVlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWFyQWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0aW9uIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uUnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBSRVNUIEFQSSBjYWxsIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICRxLndoZW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXhlY3V0ZVJlbW92ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihleGVjdXRlVXBkYXRlcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGV4ZWN1dGVTYXZlcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNsZWFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZGVmZXIucmVzb2x2ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChoYW5kbGVFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgY2hpbGQgc3RvcmUgZnJvbSB0aGUgY3VycmVudCBzdG9yZS4gVGhpcyBzdG9yZSBjYW4gbWFrZSBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICogdG8gaXQncyBtYW5hZ2VkIGluc3RhbmNlcyBhbmQgaXQgd2lsbCBub3QgYWZmZWN0IHRoZSBjdXJyZW50IHN0b3Jlc1xuICAgICAgICAgICAgICAgICAqIGluc3RhbmNlcyB1bnRpbCB0aGUgY2hpbGQgc3RvcmUgY29tbWl0cy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtpbnN0YW5jZXNdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VTdG9yZX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmNyZWF0ZUNoaWxkU3RvcmUgPSBmdW5jdGlvbiAoaW5zdGFuY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcyA9IGluc3RhbmNlcyB8fCBtYW5hZ2VkSW5zdGFuY2VzO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRTdG9yZU1hbmFnZWRJbnN0YW5jZXMgPSBjb3B5KGluc3RhbmNlcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNvdXJjZVN0b3JlKHJlc291cmNlLCBjaGlsZFN0b3JlTWFuYWdlZEluc3RhbmNlcywgc2VsZik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgYSByZWxhdGlvbiB0byBhbm90aGVyIHN0b3JlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gY29uZmlnXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VTdG9yZVJlbGF0aW9ufVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuY3JlYXRlUmVsYXRpb24gPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGFuZ3VsYXIuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0ZWRTdG9yZTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZrQXR0cjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRGVsZXRlOiAnZm9yZ2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlOiAndXBkYXRlJ1xuICAgICAgICAgICAgICAgICAgICB9LCBjb25maWcpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb24gPSBuZXcgUmVzb3VyY2VTdG9yZVJlbGF0aW9uKHNlbGYsIGNvbmZpZy5yZWxhdGVkU3RvcmUsIGNvbmZpZy5ma0F0dHIsIGNvbmZpZy5vblVwZGF0ZSwgY29uZmlnLm9uRGVsZXRlKTtcblxuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMucHVzaChyZWxhdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbGF0aW9uO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgcmVsYXRpb24gZnJvbSB0aGUgc3RvcmUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZWxhdGlvblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlUmVsYXRpb24gPSBmdW5jdGlvbiAocmVsYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbkluZGV4ID0gcmVsYXRpb25zLmluZGV4T2YocmVsYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25Gb3VuZCA9IHJlbGF0aW9uSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMuc3BsaWNlKHJlbGF0aW9uSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIG1hbmFnZWQgaW5zdGFuY2UgZnJvbSB0aGUgc3RvcmUgdGhhdCBtYXRjaGVzIHRoZSBnaXZlblxuICAgICAgICAgICAgICAgICAqIFBLIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0QnlQayA9IGZ1bmN0aW9uIChwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5nZXRJbnN0YW5jZUJ5UGsobWFuYWdlZEluc3RhbmNlcywgcGtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIG1hbmFnZWQgaW5zdGFuY2UgZnJvbSB0aGUgc3RvcmUgdGhhdCBtYXRjaGVzIHRoZSBnaXZlblxuICAgICAgICAgICAgICAgICAqIGluc3RhbmNlICh3aGljaCBtaWdodCBieSBhbiBjb3B5IHRoYXQgaXMgbm90IG1hbmFnZWQgb3IgbWFuYWdlZCBieVxuICAgICAgICAgICAgICAgICAqIGFub3RoZXIgc3RvcmUpLiBUaGUgaW5zdGFuY2VzIGFyZSBtYXRjaGVkIGJ5IHRoZWlyIFBLIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldEJ5SW5zdGFuY2UgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwa1ZhbHVlID0gaW5zdGFuY2UgPyBpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0QnlQayhwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIHZpc2libGUgZm9yIHRoZSB1c2VyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldE1hbmFnZWRJbnN0YW5jZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYW5hZ2VkSW5zdGFuY2VzLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyB2aXNpYmxlIGZvciB0aGUgdXNlci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRWaXNpYmxlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2aXNpYmxlUXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3IgcGVyc2lzdC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRQZXJzaXN0UXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwZXJzaXN0UXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3IgcmVtb3ZlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFJlbW92ZVF1ZXVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlUXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIG1hcmtlZCBmb3Igc2F2ZSAoaW5zZXJ0KS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRTYXZlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyUGhhbnRvbSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS4kaXNQaGFudG9tKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwZXJzaXN0UXVldWUuZmlsdGVyKGZpbHRlclBoYW50b20pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgbWFya2VkIGZvciB1cGRhdGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0VXBkYXRlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyTm9uUGhhbnRvbSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhaW5zdGFuY2UuJGlzUGhhbnRvbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGVyc2lzdFF1ZXVlLmZpbHRlcihmaWx0ZXJOb25QaGFudG9tKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgbWFuYWdlZCByZXNvdXJjZSBzZXJ2aWNlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0UmVzb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQWRkcyBhIGJlZm9yZS1wZXJzaXN0IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmFkZEJlZm9yZVBlcnNpc3RMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLnB1c2goZm4pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgYmVmb3JlLXBlcnNpc3QgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQmVmb3JlUGVyc2lzdExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5JbmRleCA9IGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMuaW5kZXhPZihmbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkZvdW5kID0gZm5JbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgYSBhZnRlci1wZXJzaXN0IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmFkZEFmdGVyUGVyc2lzdExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGFmdGVyUGVyc2lzdExpc3RlbmVycy5wdXNoKGZuKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhIGFmdGVyLXBlcnNpc3QgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWZ0ZXJQZXJzaXN0TGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluZGV4ID0gYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLmluZGV4T2YoZm4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm5Gb3VuZCA9IGZuSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZnRlclBlcnNpc3RMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSBiZWZvcmUtcmVtb3ZlIGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUJlZm9yZVJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5JbmRleCA9IGJlZm9yZVJlbW92ZUxpc3RlbmVycy5pbmRleE9mKGZuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuRm91bmQgPSBmbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZm5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVmb3JlUmVtb3ZlTGlzdGVuZXJzLnNwbGljZShmbkluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBZGRzIGEgYWZ0ZXItcmVtb3ZlIGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZm5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmFkZEFmdGVyUmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMucHVzaChmbik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSBhZnRlci1yZW1vdmUgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWZ0ZXJSZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5kZXggPSBhZnRlclJlbW92ZUxpc3RlbmVycy5pbmRleE9mKGZuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuRm91bmQgPSBmbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZm5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXJSZW1vdmVMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgdGhlIGdpdmVuIGluc3RhbmNlIHRvIHRoZSBnaXZlbiBsaXN0IG9mIGluc3RhbmNlcy4gRG9lcyBub3RoaW5nIGlmIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIGlzIGFscmVhZHkgaW4gdGhlIGxpc3Qgb2YgaW5zdGFuY2VzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRkUmVzb3VyY2VJbnN0YW5jZSAoaW5zdGFuY2VzLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VzID0gcmVzb3VyY2UuZmlsdGVySW5zdGFuY2VzQnlBdHRyKGluc3RhbmNlcywgcmVzb3VyY2UuZ2V0UGtBdHRyKCksIGluc3RhbmNlW3Jlc291cmNlLmdldFBrQXR0cigpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhbWF0Y2hpbmdJbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoaW5nSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VJbmRleCA9IGluc3RhbmNlcy5pbmRleE9mKG1hdGNoaW5nSW5zdGFuY2VzW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZUZvdW5kID0gbWF0Y2hpbmdJbnN0YW5jZUluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZ0luc3RhbmNlRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzLnNwbGljZShtYXRjaGluZ0luc3RhbmNlSW5kZXgsIDEsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIHRoZSBnaXZlbiBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBsaXN0IG9mIGluc3RhbmNlcy4gRG9lcyBub3RoaW5nIGlmIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIGlzIG5vdCBpbiB0aGUgbGlzdCBvZiBpbnN0YW5jZXMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZVJlc291cmNlSW5zdGFuY2UgKGluc3RhbmNlcywgaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlcyA9IHJlc291cmNlLmZpbHRlckluc3RhbmNlc0J5QXR0cihpbnN0YW5jZXMsIHJlc291cmNlLmdldFBrQXR0cigpLCBpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghIW1hdGNoaW5nSW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXRjaGluZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlSW5kZXggPSBpbnN0YW5jZXMuaW5kZXhPZihtYXRjaGluZ0luc3RhbmNlc1tpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VGb3VuZCA9IG1hdGNoaW5nSW5zdGFuY2VJbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdJbnN0YW5jZUZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcy5zcGxpY2UobWF0Y2hpbmdJbnN0YW5jZUluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGNhbiBiZSB0cmVhdGVkIGFzIGFuIHByb21pc2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp8Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpc1Byb21pc2VMaWtlIChvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iaiAmJiBhbmd1bGFyLmlzRnVuY3Rpb24ob2JqLnRoZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFBvcHVsYXRlcyB0aGUgZGVzdGluYXRpb24gb2JqZWN0IGBkc3RgIGJ5IGNvcHlpbmcgdGhlIG5vbi1wcml2YXRlIGRhdGEgZnJvbSBgc3JjYCBvYmplY3QuIFRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICogb24gdGhlIGBkc3RgIG9iamVjdCB3aWxsIGJlIGEgZGVlcCBjb3B5IG9mIHRoZSBkYXRhIG9uIHRoZSBgc3JjYC4gVGhpcyBmdW5jdGlvbiB3aWxsIG5vdCBjb3B5XG4gICAgICAgICAgICAgICAgICogYXR0cmlidXRlcyBvZiB0aGUgYHNyY2Agd2hvc2UgbmFtZXMgc3RhcnQgd2l0aCBcIiRcIi4gVGhlc2UgYXR0cmlidXRlcyBhcmUgY29uc2lkZXJlZCBwcml2YXRlLiBUaGVcbiAgICAgICAgICAgICAgICAgKiBtZXRob2Qgd2lsbCBhbHNvIGtlZXAgdGhlIHByaXZhdGUgYXR0cmlidXRlcyBvZiB0aGUgYGRzdGAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRzdCB7VW5kZWZpbmVkfE9iamVjdHxBcnJheX0gRGVzdGluYXRpb24gb2JqZWN0XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHNyYyB7T2JqZWN0fEFycmF5fSBTb3VyY2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtrZWVwTWlzc2luZ10gYm9vbGVhbiBLZWVwIGF0dHJpYnV0ZXMgb24gZHN0IHRoYXQgYXJlIG5vdCBwcmVzZW50IG9uIHNyY1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcG9wdWxhdGUgKGRzdCwgc3JjLCBrZWVwTWlzc2luZykge1xuICAgICAgICAgICAgICAgICAgICAvLyBrZWVwTWlzc2luZyBkZWZhdWx0cyB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGtlZXBNaXNzaW5nID0gYW5ndWxhci5pc1VuZGVmaW5lZChrZWVwTWlzc2luZykgPyB0cnVlIDogISFrZWVwTWlzc2luZztcbiAgICAgICAgICAgICAgICAgICAgZHN0ID0gZHN0IHx8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXNlcnZlID0gISFkc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZWRPYmplY3RzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICogQXMgd2UgZG8gcmVtb3ZlIGFsbCBcInByaXZhdGVcIiBwcm9wZXJ0aWVzIGZyb20gdGhlIHNvdXJjZSwgc28gdGhleSBhcmUgbm90IGNvcGllZFxuICAgICAgICAgICAgICAgICAgICAgKiB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LCB3ZSBtYWtlIGEgY29weSBvZiB0aGUgc291cmNlIGZpcnN0LiBXZSBkbyBub3Qgd2FudCB0b1xuICAgICAgICAgICAgICAgICAgICAgKiBtb2RpZnkgdGhlIGFjdHVhbCBzb3VyY2Ugb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc3JjID0gYW5ndWxhci5jb3B5KHNyYyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGtleVswXSA9PT0gJyQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNyY1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICogT25seSBwcmVzZXJ2ZSBpZiB3ZSBnb3QgYSBkZXN0aW5hdGlvbiBvYmplY3QuIFNhdmUgXCJwcml2YXRlXCIgb2JqZWN0IGtleXMgb2YgZGVzdGluYXRpb24gYmVmb3JlXG4gICAgICAgICAgICAgICAgICAgICAqIGNvcHlpbmcgdGhlIHNvdXJjZSBvYmplY3Qgb3ZlciB0aGUgZGVzdGluYXRpb24gb2JqZWN0LiBXZSByZXN0b3JlIHRoZXNlIHByb3BlcnRpZXMgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmVzZXJ2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZHN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRzdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGtlZXAgcHJpdmF0ZSBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlbMF0gPT09ICckJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVkT2JqZWN0c1trZXldID0gZHN0W2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8ga2VlcCBhdHRyaWJ1dGUgaWYgbm90IHByZXNlbnQgb24gc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtlZXBNaXNzaW5nICYmICFzcmMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVkT2JqZWN0c1trZXldID0gZHN0W2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBkbyB0aGUgYWN0dWFsIGNvcHlcbiAgICAgICAgICAgICAgICAgICAgZHN0ID0gYW5ndWxhci5jb3B5KHNyYywgZHN0KTtcblxuICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgKiBOb3cgd2UgY2FuIHJlc3RvcmUgdGhlIHByZXNlcnZlZCBkYXRhIG9uIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJlc2VydmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHByZXNlcnZlZE9iamVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlc2VydmVkT2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdFtrZXldID0gcHJlc2VydmVkT2JqZWN0c1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ29waWVzIHRoZSBzb3VyY2Ugb2JqZWN0IHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgKG9yIGFycmF5KS4gS2VlcHMgcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIGF0dHJpYnV0ZXMgb24gdGhlIGBkc3RgIG9iamVjdCAoYXR0cmlidXRlcyBzdGFydGluZyB3aXRoICQgYXJlIHByaXZhdGUpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzcmNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2RzdF1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvcHkgKHNyYywgZHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGFyZSB3b3JraW5nIG9uIGFuIGFycmF5LCBjb3B5IGVhY2ggaW5zdGFuY2Ugb2YgdGhlIGFycmF5IHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBkc3QuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoc3JjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gYW5ndWxhci5pc0FycmF5KGRzdCkgPyBkc3QgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdC5sZW5ndGggPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNyYy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdC5wdXNoKHBvcHVsYXRlKG51bGwsIHNyY1tpXSwgZmFsc2UpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIHdlIGNhbiBqdXN0IGNvcHkgdGhlIHNyYyBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gcG9wdWxhdGUoZHN0LCBzcmMsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogTWVyZ2VzIHRoZSBzb3VyY2Ugb2JqZWN0IHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgKG9yIGFycmF5KS4gS2VlcHMgcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIGF0dHJpYnV0ZXMgb24gdGhlIGBkc3RgIG9iamVjdCAoYXR0cmlidXRlcyBzdGFydGluZyB3aXRoICQgYXJlIHByaXZhdGUpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzcmNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2RzdF1cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1lcmdlIChzcmMsIGRzdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBhcmUgd29ya2luZyBvbiBhbiBhcnJheSwgY29weSBlYWNoIGluc3RhbmNlIG9mIHRoZSBhcnJheSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZHN0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KHNyYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdCA9IGFuZ3VsYXIuaXNBcnJheShkc3QpID8gZHN0IDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QubGVuZ3RoID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkc3QucHVzaChwb3B1bGF0ZShudWxsLCBzcmNbaV0sIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIHdlIGNhbiBqdXN0IGNvcHkgdGhlIHNyYyBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gcG9wdWxhdGUoZHN0LCBzcmMsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJbml0aWFsaXplcyB0aGUgc3RvcmUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEluc3RhbmNlcyA9IG1hbmFnZWRJbnN0YW5jZXMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFN0b3JlID0gcGFyZW50U3RvcmUgfHwgbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWQgPSBzZWxmLm1hbmFnZShtYW5hZ2VkSW5zdGFuY2VzKSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBNYXBzIGluc3RhbmNlcyB0byBhIGxpc3Qgb2YgUEtzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBQayA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZSA/IFN0cmluZyhpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBGaWx0ZXJzIGluc3RhbmNlcyB0byBnaXZlbiBsaXN0IG9mIFBLc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHBrc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclBrcyA9IGZ1bmN0aW9uIChwa3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZSA/IHBrcy5pbmRleE9mKFN0cmluZyhpbnN0YW5jZVtyZXNvdXJjZS5nZXRQa0F0dHIoKV0pKSAhPT0gLTEgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgcXVldWVzIHdpdGggdGhlIHN0YXRlIG9mIHRoZSBwYXJlbnQgc3RvcmUsIGlmIHRoZXJlIGlzIGEgcGFyZW50IHN0b3JlLlxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50U3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWQudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogQ29weSBzdGF0ZSBmcm9tIHBhcmVudCBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRWaXNpYmxlUXVldWVQa3MgPSBwYXJlbnRTdG9yZS5nZXRWaXNpYmxlUXVldWUoKS5tYXAobWFwUGspLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UGVyc2lzdFF1ZXVlUGtzID0gcGFyZW50U3RvcmUuZ2V0UGVyc2lzdFF1ZXVlKCkubWFwKG1hcFBrKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFJlbW92ZVF1ZXVlUGtzID0gcGFyZW50U3RvcmUuZ2V0UmVtb3ZlUXVldWUoKS5tYXAobWFwUGspO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHZpc2libGUsIHBlcnNpc3QgYW5kIHJlbW92ZSBxdWV1ZSB3aXRoIHRoZSBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHRoZSBwYXJlbnQgc3RvcmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGVRdWV1ZSA9IG1hbmFnZWRJbnN0YW5jZXMuZmlsdGVyKGZpbHRlclBrcyhwYXJlbnRWaXNpYmxlUXVldWVQa3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFF1ZXVlID0gbWFuYWdlZEluc3RhbmNlcy5maWx0ZXIoZmlsdGVyUGtzKHBhcmVudFBlcnNpc3RRdWV1ZVBrcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVRdWV1ZSA9IG1hbmFnZWRJbnN0YW5jZXMuZmlsdGVyKGZpbHRlclBrcyhwYXJlbnRSZW1vdmVRdWV1ZVBrcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBzdG9yZVxuICAgICAgICAgICAgICAgIGluaXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgYSByZWxhdGlvbiBiZXR3ZWVuIHR3byBzdG9yZXMuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSBzdG9yZVxuICAgICAgICAgICAgICogQHBhcmFtIHJlbGF0ZWRTdG9yZVxuICAgICAgICAgICAgICogQHBhcmFtIGZrQXR0clxuICAgICAgICAgICAgICogQHBhcmFtIG9uVXBkYXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0gb25SZW1vdmVcbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBSZXNvdXJjZVN0b3JlUmVsYXRpb24gKHN0b3JlLCByZWxhdGVkU3RvcmUsIGZrQXR0ciwgb25VcGRhdGUsIG9uUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiBwcmUtZGVmaW5lZCB1cGRhdGUgYmVoYXZpb3Vyc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHN3aXRjaCAob25VcGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlID0gZnVuY3Rpb24gKHJlZmVyZW5jaW5nU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrLCBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IFNldCByZWZlcmVuY2UgdG8gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgaW5zdGFuY2UgZnJvbSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyB0byAnXCIgKyBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPSBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVsbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgbmV3UmVmZXJlbmNlZEluc3RhbmNlUGssIGZrQXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZVJlbGF0aW9uOiBTZXQgcmVmZXJlbmNlIHRvICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIGluc3RhbmNlIGZyb20gJ1wiICsgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGsgKyBcIicgdG8gbnVsbC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogSW1wbGVtZW50YXRpb24gb2YgcHJlLWRlZmluZWQgcmVtb3ZlIGJlaGF2aW91cnNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG9uUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZvcmdldCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlbW92ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IEZvcmdldCAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBpbnN0YW5jZSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyByZWZlcmVuY2luZyBpbnN0YW5jZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ1N0b3JlLmZvcmdldChyZWZlcmVuY2luZ0luc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVsbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlbW92ZSA9IGZ1bmN0aW9uIChyZWZlcmVuY2luZ1N0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IFNldCByZWZlcmVuY2UgdG8gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgaW5zdGFuY2UgZnJvbSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyB0byBudWxsLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2VbZmtBdHRyXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgc3RvcmUgdGhlIHJlbGF0aW9uIGlzIGNvbmZpZ3VyZWQgb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFN0b3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIHN0b3JlIHRoZSBjb25maWd1cmVkIHN0b3JlIGlzIHJlbGF0ZWQgb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFJlbGF0ZWRTdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbGF0ZWRTdG9yZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgRksgYXR0cmlidXRlIG5hbWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0RmtBdHRyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmtBdHRyO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBVcGRhdGVzIHRoZSByZWZlcmVuY2luZyBpbnN0YW5jZXMgd2hlcmUgdGhlIGZrQXR0ciBoYXMgdGhlIGdpdmVuIG9sZFxuICAgICAgICAgICAgICAgICAqIHZhbHVlIHRvIHRoZSBnaXZlbiBuZXcgdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG9sZFBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbmV3UGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaGFuZGxlVXBkYXRlID0gZnVuY3Rpb24gKG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IEhhbmRsZSB1cGRhdGUgb2YgcmVmZXJlbmNlZCBpbnN0YW5jZSBvbiAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlcyA9IHJlbGF0ZWRTdG9yZS5nZXRNYW5hZ2VkSW5zdGFuY2VzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZlcmVuY2luZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZSA9IHJlZmVyZW5jaW5nSW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVmZXJlbmNpbmdJbnN0YW5jZSAmJiByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPT0gb2xkUGtWYWx1ZSAmJiBvbGRQa1ZhbHVlICE9IG5ld1BrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZShyZWxhdGVkU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFBrVmFsdWUsIG5ld1BrVmFsdWUsIGZrQXR0cik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogTGV0cyB0aGUgcmVsYXRlZCBzdG9yZSBmb3JnZXQgc3RhbGUgcmVmZXJlbmNpbmcgaW5zdGFuY2VzLCBlLmcuIGJlY2F1c2UgdGhlXG4gICAgICAgICAgICAgICAgICogcmVmZXJlbmNlZCBpbnN0YW5jZSB3YXMgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaGFuZGxlUmVtb3ZlID0gZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IEhhbmRsZSByZW1vdmUgb2YgcmVmZXJlbmNlZCBpbnN0YW5jZSBvbiAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBzdG9yZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlcyA9IHJlbGF0ZWRTdG9yZS5nZXRNYW5hZ2VkSW5zdGFuY2VzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZlcmVuY2luZ0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZSA9IHJlZmVyZW5jaW5nSW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVmZXJlbmNpbmdJbnN0YW5jZSAmJiByZWZlcmVuY2luZ0luc3RhbmNlW2ZrQXR0cl0gPT0gcGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVtb3ZlKHJlbGF0ZWRTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgcGtWYWx1ZSwgZmtBdHRyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59KSgpO1xuIiwiLyoqXG4gKiBBbmd1bGFyIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2VcbiAqIENvcHlyaWdodCAyMDE2IEFuZHJlYXMgU3RvY2tlclxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbiAqIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuICogcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlXG4gKiBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcbiAqIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyXG4gICAgICAgIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCduZ1Jlc291cmNlRmFjdG9yeScpO1xuXG4gICAgLyoqXG4gICAgICogRmFjdG9yeSBzZXJ2aWNlIHRvIGdlbmVyYXRlIG5ldyByZXNvdXJjZSBwaGFudG9tIGlkIGdlbmVyYXRvcnMuXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlXG4gICAgICogQG5nZG9jIHNlcnZpY2VcbiAgICAgKi9cbiAgICBtb2R1bGUuc2VydmljZSgnUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZScsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENyZWF0ZXMgYSBuZXcgcGhhbnRvbSBpZCBnZW5lcmF0b3Igd2l0aCB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZVxuICAgICAgICAgICAgICogQHBhcmFtIGNvbmZpZ1xuICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLmNyZWF0ZVBoYW50b21JZEZhY3RvcnkgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gYW5ndWxhci5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgICAgICBpczogZnVuY3Rpb24gKCkgeyB9XG4gICAgICAgICAgICAgICAgfSwgY29uZmlnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5KGNvbmZpZy5nZW5lcmF0ZSwgY29uZmlnLmlzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIGEgcGhhbnRvbSBpZCBnZW5lcmF0ZS4gVGFrZXMgYSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyB0aGUgUEssIGFuZCBhXG4gICAgICAgICAgICAgKiBmdW5jdGlvbnMgdGhhdCBjaGVja3MgaWYgdGhlIGdpdmVuIFBLIGlzIGEgcGhhbnRvbSBQSy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlcbiAgICAgICAgICAgICAqIEBuZ2RvYyBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICogQHBhcmFtIGdlbmVyYXRlRm5cbiAgICAgICAgICAgICAqIEBwYXJhbSBpc1BoYW50b21GblxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeSAoZ2VuZXJhdGVGbiwgaXNQaGFudG9tRm4pIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZW5lcmF0ZXMgYSBuZXcgcGhhbnRvbSBQSyB2YWx1ZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZW5lcmF0ZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVGbihpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gUEsgdmFsdWUgb24gdGhlIGdpdmVuIGluc3RhbmNlIGlzIGEgcGhhbnRvbSBQSyB2YWx1ZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa1ZhbHVlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmlzUGhhbnRvbSA9IGZ1bmN0aW9uIChwa1ZhbHVlLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNQaGFudG9tRm4ocGtWYWx1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLyoqXG4gICAgICogUmVzb3VyY2UgcGhhbnRvbSBpZCBnZW5lcmF0b3IgdGhhdCBnZW5lcmF0ZXMgbmVnYXRpdmUgaW50ZWdlciBJRHNcbiAgICAgKlxuICAgICAqIEBuYW1lIFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnRcbiAgICAgKiBAbmdkb2MgZmFjdG9yeVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZX0gUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZSBQaGFudG9tIElEIGZhY3Rvcnkgc2VydmljZVxuICAgICAqL1xuICAgIG1vZHVsZS5mYWN0b3J5KCdSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50JyxcbiAgICAgICAgZnVuY3Rpb24gKFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIGxhc3RQa1ZhbHVlID0gMDtcblxuICAgICAgICAgICAgcmV0dXJuIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuY3JlYXRlUGhhbnRvbUlkRmFjdG9yeSh7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0tbGFzdFBrVmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpczogZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBrVmFsdWUgPCAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8qKlxuICAgICAqIFJlc291cmNlIHBoYW50b20gaWQgZ2VuZXJhdG9yIHRoYXQgZ2VuZXJhdGVzIG5lZ2F0aXZlIGludGVnZXIgSURzXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZVBoYW50b21JZFV1aWQ0XG4gICAgICogQG5nZG9jIGZhY3RvcnlcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2V9IFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UgUGhhbnRvbSBJRCBmYWN0b3J5IHNlcnZpY2VcbiAgICAgKi9cbiAgICBtb2R1bGUuZmFjdG9yeSgnUmVzb3VyY2VQaGFudG9tSWRVdWlkNCcsXG4gICAgICAgIGZ1bmN0aW9uIChSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlKSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZWRJZHMgPSBbXTtcblxuICAgICAgICAgICAgcmV0dXJuIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuY3JlYXRlUGhhbnRvbUlkRmFjdG9yeSh7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwa1ZhbHVlID0gdXVpZDQoKTtcblxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZWRJZHMucHVzaChwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBrVmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpczogZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlZElkcy5pbmRleE9mKHBrVmFsdWUpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gdXVpZDQgKCkge1xuICAgICAgICAgICAgICAgICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBNYXRoLnJhbmRvbSgpICogMTZ8MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBjID09PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn0pKCk7XG4iXX0=
