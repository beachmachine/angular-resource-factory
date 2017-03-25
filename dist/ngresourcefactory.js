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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiY2FjaGUvY2FjaGVTZXJ2aWNlLmpzIiwiZmFjdG9yeS9mYWN0b3J5U2VydmljZS5qcyIsInBoYW50b21JZEZhY3RvcnkvcGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksTUFBTSxRQUFRLE9BQU8scUJBQXFCO1lBQ3RDOzs7O0FBSVo7QUM3QkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLENBQUMsWUFBWTtJQUNUOztJQUVBO1FBQ0ksU0FBUyxRQUFRLE9BQU87Ozs7Ozs7O0lBUTVCLE9BQU8sUUFBUTtRQUNYLFlBQVk7WUFDUjs7WUFFQTtnQkFDSSxTQUFTOzs7Ozs7Ozs7WUFTYixTQUFTLGFBQWEsTUFBTSxRQUFRLFNBQVM7Z0JBQ3pDO29CQUNJLE9BQU87Ozs7OztvQkFNUCxRQUFROzs7Ozs7b0JBTVIsbUJBQW1COzs7Ozs7b0JBTW5CLGlCQUFpQjs7Ozs7O29CQU1qQixrQkFBa0I7O2dCQUV0QixVQUFVLFFBQVEsT0FBTzs7Ozs7b0JBS3JCLFFBQVE7Ozs7OztvQkFNUixTQUFTOzs7Ozs7b0JBTVQsVUFBVTs7Ozs7O29CQU1WLFdBQVc7Ozs7OztvQkFNWCxLQUFLLEtBQUs7bUJBQ1gsV0FBVzs7O2dCQUdkOzs7Ozs7Ozs7Z0JBU0EsS0FBSyxVQUFVLFVBQVUsT0FBTzs7b0JBRTVCLElBQUksUUFBUSxRQUFRLFFBQVE7d0JBQ3hCLFFBQVEsSUFBSSwyRkFBMkYsT0FBTzs7d0JBRTlHLFlBQVk7Ozt5QkFHWCxJQUFJLFFBQVEsU0FBUyxRQUFRO3dCQUM5QixRQUFRLElBQUksaUZBQWlGLE9BQU87O3dCQUVwRyxjQUFjOzt5QkFFYjt3QkFDRCxRQUFRLElBQUksNEVBQTRFLE9BQU87Ozs7Ozs7Ozs7Ozs7Z0JBYXZHLEtBQUssU0FBUyxVQUFVLEtBQUssT0FBTyxhQUFhLFNBQVM7b0JBQ3RE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QUFPLEVBQUU7O2dCQUViLElBQUksVUFBVSxTQUFTO29CQUNuQixPQUFPLFVBQVU7Ozs7Ozs7Ozs7Ozs7SUFhakMsT0FBTyxRQUFROzRDQUNYLFVBQVUsaUNBQWlDO1lBQ3ZDOztZQUVBO2dCQUNJLGVBQWU7O1lBRW5CLE9BQU8sZ0NBQWdDLHVCQUF1QjtnQkFDMUQsVUFBVSxZQUFZO29CQUNsQjt3QkFDSSxVQUFVOztvQkFFZCxhQUFhLEtBQUs7b0JBQ2xCLE9BQU87O2dCQUVYLElBQUksVUFBVSxTQUFTO29CQUNuQixPQUFPLGFBQWEsUUFBUSxhQUFhLENBQUM7Ozs7WUFJbEQsU0FBUyxTQUFTO2dCQUNkLHVDQUF1QyxRQUFRLFNBQVMsU0FBUyxHQUFHO29CQUNoRTt3QkFDSSxJQUFJLEtBQUssV0FBVyxHQUFHO3dCQUN2QixJQUFJLE1BQU0sTUFBTSxLQUFLLEVBQUUsSUFBSTs7b0JBRS9CLE9BQU8sRUFBRSxTQUFTOzs7Ozs7QUFNdEMiLCJmaWxlIjoibmdyZXNvdXJjZWZhY3RvcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFuZ3VsYXIgUmVzb3VyY2VGYWN0b3J5XG4gKiBDb3B5cmlnaHQgMjAxNiBBbmRyZWFzIFN0b2NrZXJcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkXG4gKiBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbiAqIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZVxuICogU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRVxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4gKiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhclxuICAgICAgICBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnbmdSZXNvdXJjZUZhY3RvcnknLCBbXG4gICAgICAgICAgICAnbmdSZXNvdXJjZSdcbiAgICAgICAgXSk7XG5cbn0pKCk7XG4iLCIvKipcbiAqIEFuZ3VsYXIgUmVzb3VyY2VDYWNoZVNlcnZpY2VcbiAqIENvcHlyaWdodCAyMDE2IEFuZHJlYXMgU3RvY2tlclxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWRcbiAqIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuICogcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlXG4gKiBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcbiAqIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyXG4gICAgICAgIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCduZ1Jlc291cmNlRmFjdG9yeScpO1xuXG4gICAgLyoqXG4gICAgICogRmFjdG9yeSBzZXJ2aWNlIHRvIGNyZWF0ZSBuZXcgY2FjaGUuXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZUNhY2hlU2VydmljZVxuICAgICAqIEBuZ2RvYyBmYWN0b3J5XG4gICAgICovXG4gICAgbW9kdWxlLmZhY3RvcnkoJ1Jlc291cmNlQ2FjaGVTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJ25nSW5qZWN0JztcblxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgY2FjaGVzID0ge307XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBjb25zdHJ1Y3RvciAobmFtZSwgcGtBdHRyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgY2FjaGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1hcHBpbmcgb2YgY2FjaGUga2V5cyB0byBib29sZWFuIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgdG8gdXNlIHRoZSBgZGF0YUF0dHJgIG9yIG5vdFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e319XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjYWNoZVVzZURhdGFBdHRyID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1hcHBpbmcgb2YgY2FjaGUga2V5cyB0byBib29sZWFuIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgdGhlIHZhbHVlIGlzIG1hbmFnZWQgb3Igbm90XG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlSXNNYW5hZ2VkID0ge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE1hcHBpbmcgb2YgY2FjaGUga2V5cyB0byB0aW1lc3RhbXBzIGZvciBhdXRvbWF0aWMgaW52YWxpZGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlVGltZXN0YW1wcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGFuZ3VsYXIuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBnZXQgdGhlIElEIG9mIHRoZSBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHBrQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGdldCB0aGUgVVJMIG9mIHRoZSBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd8bnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHVybEF0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBnZXQgdGhlIGFjdHVhbCBkYXRhIGZyb21cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZGF0YUF0dHI6IG51bGwsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIERlcGVuZGVudCBjYWNoZXNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5PFN0cmluZz59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbnQ6IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaW1lIHRvIGxpdmUgZm9yIGNhY2hlIGVudHJpZXMgaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7aW50fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdHRsOiA2MCAqIDYwXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBjYWNoZVxuICAgICAgICAgICAgICAgIGluaXQoKTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlZnJlc2hlcyB0aGUgY2FjaGUgZW50cmllcyB3aXRoIHRoZSBuZXcgdmFsdWUgb3IgdmFsdWVzLiBUaGUgZXhpc3Rpbmcgb2JqZWN0cyBpbiB0aGUgY2FjaGVcbiAgICAgICAgICAgICAgICAgKiBhcmUgbWF0Y2hlZCBieSB0aGUgYHBrQXR0cmAgdmFsdWUsIGFuZCBhZGRpdGlvbmFsbHkgYnkgdGhlIGB1cmxBdHRyYCwgaWYgYXZhaWxhYmxlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdHxBcnJheTxPYmplY3Q+fSB2YWx1ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVmcmVzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZWZyZXNoIHRoZSBleGlzdGluZyB2YWx1ZXMgaW4gdGhlIGNhY2hlIHdpdGggdGhlIG5ldyBlbnRyaWVzXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZWZyZXNoIGV4aXN0aW5nIGVudHJpZXMgd2l0aCBsaXN0IG9mIG5ldyBlbnRyaWVzIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaEVhY2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIGV4aXN0aW5nIHZhbHVlcyBpbiB0aGUgY2FjaGUgd2l0aCB0aGUgbmV3IGVudHJ5XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZWZyZXNoIGV4aXN0aW5nIGVudHJpZXMgd2l0aCBuZXcgZW50cnkgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoU2luZ2xlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVuYWJsZSB0byByZWZyZXNoIGV4aXN0aW5nIGVudHJpZXMgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicgYXMgZ2l2ZW4gdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDcmVhdGVzIGEgY2FjaGUgZW50cnkgZm9yIHRoZSBnaXZlbiB2YWx1ZSBhbmQgcHV0cyBpdCBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXNlRGF0YUF0dHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW3JlZnJlc2hdXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5pbnNlcnQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgdXNlRGF0YUF0dHIsIHJlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogSW5zZXJ0IHZhbHVlIHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBhbmd1bGFyLmlzT2JqZWN0KHZhbHVlKSB8fCBhbmd1bGFyLmlzQXJyYXkodmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gMjAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVycyA9IGlzTWFuYWdlZCA/IHsnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSA6IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dCA9ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSA9IFtzdGF0dXMsIHZhbHVlLCBoZWFkZXJzLCBzdGF0dXNUZXh0XTtcblxuICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9ICEhdXNlRGF0YUF0dHI7XG4gICAgICAgICAgICAgICAgICAgIHJlZnJlc2ggPSBhbmd1bGFyLmlzVW5kZWZpbmVkKHJlZnJlc2gpID8gdHJ1ZSA6ICEhcmVmcmVzaDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVtrZXldID0gZW50cnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVVzZURhdGFBdHRyW2tleV0gPSB1c2VEYXRhQXR0ciAmJiBpc01hbmFnZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUlzTWFuYWdlZFtrZXldID0gaXNNYW5hZ2VkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlT3JVcGRhdGVUaW1lc3RhbXAoa2V5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZWZyZXNoIGV4aXN0aW5nIGRhdGEgaWYgYHJlZnJlc2hgIHBhcmFtZXRlciB3YXMgbm90IHNldCB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlZnJlc2goZ2V0RGF0YUZvckVudHJ5KGVudHJ5LCB1c2VEYXRhQXR0cikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFB1dHMgdGhlIGdpdmVuIGVudHJ5IHdpdGggdGhlIGdpdmVuIGtleSBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXNlRGF0YUF0dHJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnB1dCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCB1c2VEYXRhQXR0cikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBQdXQgZW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9ICEhdXNlRGF0YUF0dHI7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEluZGljYXRlcyBpZiB2YWx1ZSBpcyBtYW5hZ2VkIGJ5IHRoZSBjYWNoZSwgd2hpY2ggbWVhbnMgaXQgaXMgcmVmcmVzaGVkIGlmIG5ldyBjYWxsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogcmV0dXJuIHRoZSBzYW1lIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdG9yZSB0aGUgYWN0dWFsIGRhdGEgb2JqZWN0LCBub3QgdGhlIHNlcmlhbGl6ZWQgc3RyaW5nLCBmb3IgSlNPTlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlWzJdICYmIHZhbHVlWzJdWydjb250ZW50LXR5cGUnXSA9PT0gJ2FwcGxpY2F0aW9uL2pzb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogVXNlIGRlc2VyaWFsaXplZCBkYXRhIGZvciBrZXkgJ1wiICsga2V5ICsgXCInIG9uIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlWzFdID0gdmFsdWVbMV0gPyBhbmd1bGFyLmZyb21Kc29uKHZhbHVlWzFdKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYW5hZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVzZSByYXcgZGF0YSBmb3Iga2V5ICdcIiArIGtleSArIFwiJyBvbiB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWFuYWdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVVzZURhdGFBdHRyW2tleV0gPSB1c2VEYXRhQXR0cjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlSXNNYW5hZ2VkW2tleV0gPSBpc01hbmFnZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVPclVwZGF0ZVRpbWVzdGFtcChrZXkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlZnJlc2ggdGhlIGNhY2hlIGVudHJpZXMgaWYgdGhlIHZhbHVlIGlzIGFscmVhZHkgYSBjYWNoZSBlbnRyeSAod2hpY2ggaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsd2F5cyBhbiBhcnJheSksIG5vdCBhIHByb21pc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYW5hZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWZyZXNoKGdldERhdGFGb3JFbnRyeSh2YWx1ZSwgdXNlRGF0YUF0dHIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBlbnRyeSB3aXRoIHRoZSBnaXZlbiBrZXkgZnJvbSB0aGUgY2FjaGUsIG9yIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB1c2VDYWNoZVR0bFxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChrZXksIHVzZUNhY2hlVHRsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gYHVzZUNhY2hlVHRsYCBzaG91bGQgZGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHVzZUNhY2hlVHRsID0gYW5ndWxhci5pc1VuZGVmaW5lZCh1c2VDYWNoZVR0bCkgfHwgISF1c2VDYWNoZVR0bCA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1c2VDYWNoZVR0bCB8fCBpc0VudHJ5QWxpdmUoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEdldCBlbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhY2hlW2tleV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXJpYWxpemUgdG8gc3RyaW5nIGZvciBtYW5hZ2VkIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVJc01hbmFnZWRba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlWzFdID0gYW5ndWxhci50b0pzb24odmFsdWVbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEVudHJ5IHdpdGgga2V5ICdcIiArIGtleSArIFwiJyBleGNlZWRlZCBUVEwgb24gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFVuYWJsZSB0byBnZXQgZW50cnkgd2l0aCBrZXkgJ1wiICsga2V5ICsgXCInIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIHRoZSBlbnRyeSB3aXRoIHRoZSBnaXZlbiBrZXkgZnJvbSB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IFJlbW92ZSBlbnRyeSB3aXRoIGtleSAnXCIgKyBrZXkgKyBcIicgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGVudHJpZXMgZnJvbSB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZW1vdmUgYWxsIGVudHJpZXMgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3QgZW50cmllcyBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGxMaXN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUNhY2hlU2VydmljZTogUmVtb3ZlIGFsbCBsaXN0IGVudHJpZXMgZnJvbSB0aGUgY2FjaGUgJ1wiICsgbmFtZSArIFwiJy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhbmd1bGFyLmlzQXJyYXkoZ2V0RGF0YUZvcktleShrZXkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVRpbWVzdGFtcHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FjaGVVc2VEYXRhQXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZUlzTWFuYWdlZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3QgZW50cmllcyBmcm9tIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGxPYmplY3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBSZW1vdmUgYWxsIG9iamVjdCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlICdcIiArIG5hbWUgKyBcIicuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkgJiYgYW5ndWxhci5pc09iamVjdChnZXREYXRhRm9yS2V5KGtleSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlVGltZXN0YW1wc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVVzZURhdGFBdHRyW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlSXNNYW5hZ2VkW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhbGwgZW50cmllcyBvZiB0aGUgZGVwZW5kZW50IGNhY2hlcywgaW5jbHVkaW5nIHRoZSBkZXBlbmRlbnQgY2FjaGVzIG9mIHRoZVxuICAgICAgICAgICAgICAgICAqIGRlcGVuZGVudCBjYWNoZXMgKGFuZCBzbyBvbiAuLi4pLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUFsbERlcGVuZGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbnRDYWNoZU5hbWVzID0gY29sbGVjdERlcGVuZGVudENhY2hlTmFtZXMoc2VsZiwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVwZW5kZW50Q2FjaGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVzW2RlcGVuZGVudENhY2hlTmFtZXNbaV1dLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIERlc3Ryb3lzIHRoZSBjYWNoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUluZGV4ID0gY2FjaGVzLmluZGV4T2Yoc2VsZiksXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hbmFnZWQgPSBjYWNoZUluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYW5hZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlQ2FjaGVTZXJ2aWNlOiBEZXN0cm95IHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlcy5zcGxpY2UoY2FjaGVJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmV0cmlldmUgaW5mb3JtYXRpb24gcmVnYXJkaW5nIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge3tpZDogKiwgc2l6ZTogbnVtYmVyfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmluZm8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IEdldCBjYWNoZSBpbmZvcm1hdGlvbiBmcm9tIHRoZSBjYWNoZSAnXCIgKyBuYW1lICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemUgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgY2FjaGUgc2l6ZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZSc6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnb3B0aW9ucyc6IG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDYWNoZSBpbnRlcmZhY2UgdG8gcHV0IGVudHJpZXMgdXNpbmcgYGRhdGFBdHRyYCBvbiB0aGUgY2FjaGUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRoRGF0YUF0dHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnB1dChrZXksIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXQoa2V5LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiBzZWxmLnJlbW92ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsOiBzZWxmLnJlbW92ZUFsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbzogc2VsZi5pbmZvXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENhY2hlIGludGVyZmFjZSB0byBwdXQgZW50cmllcyB3aXRob3V0IHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7e3B1dDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwucHV0LCBnZXQ6IGNvbnN0cnVjdG9yLndpdGhEYXRhQXR0ck5vVHRsLmdldCwgcmVtb3ZlOiAoKiksIHJlbW92ZUFsbDogKCopLCBpbmZvOiAoKil9fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYud2l0aG91dERhdGFBdHRyID0ge1xuICAgICAgICAgICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wdXQoa2V5LCB2YWx1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldChrZXksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZW1vdmU6IHNlbGYucmVtb3ZlLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGw6IHNlbGYucmVtb3ZlQWxsLFxuICAgICAgICAgICAgICAgICAgICBpbmZvOiBzZWxmLmluZm9cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2FjaGUgaW50ZXJmYWNlIHRvIHB1dCBlbnRyaWVzIHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlIGFuZCBpZ25vcmluZyBUVEwuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRoRGF0YUF0dHJOb1R0bCA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHV0KGtleSwgdmFsdWUsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldChrZXksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlOiBzZWxmLnJlbW92ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsOiBzZWxmLnJlbW92ZUFsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbzogc2VsZi5pbmZvXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENhY2hlIGludGVyZmFjZSB0byBwdXQgZW50cmllcyB3aXRob3V0IHVzaW5nIGBkYXRhQXR0cmAgb24gdGhlIGNhY2hlIGFuZCBpZ25vcmluZyBUVEwuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7cHV0OiBjb25zdHJ1Y3Rvci53aXRoRGF0YUF0dHJOb1R0bC5wdXQsIGdldDogY29uc3RydWN0b3Iud2l0aERhdGFBdHRyTm9UdGwuZ2V0LCByZW1vdmU6ICgqKSwgcmVtb3ZlQWxsOiAoKiksIGluZm86ICgqKX19XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi53aXRob3V0RGF0YUF0dHJOb1R0bCA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHV0KGtleSwgdmFsdWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXQoa2V5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZTogc2VsZi5yZW1vdmUsXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbDogc2VsZi5yZW1vdmVBbGwsXG4gICAgICAgICAgICAgICAgICAgIGluZm86IHNlbGYuaW5mb1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBjYWNoZSBkYXRhIGZvciB0aGUgZ2l2ZW4ga2V5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXREYXRhRm9yS2V5IChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5ID0gY2FjaGVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VEYXRhQXR0ciA9IGNhY2hlVXNlRGF0YUF0dHJba2V5XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldERhdGFGb3JFbnRyeShlbnRyeSwgdXNlRGF0YUF0dHIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgZGF0YSBmb3IgdGhlIGdpdmVuIGNhY2hlIGVudHJ5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB1c2VEYXRhQXR0clxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldERhdGFGb3JFbnRyeSAodmFsdWUsIHVzZURhdGFBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHZhbHVlWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VEYXRhQXR0ciAmJiBvcHRpb25zLmRhdGFBdHRyICYmIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhW29wdGlvbnMuZGF0YUF0dHJdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIGNhY2hlIGRhdGEgZm9yIHRoZSBnaXZlbiBrZXkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBuZXdEYXRhXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gc2V0RGF0YUZvcktleSAoa2V5LCBuZXdEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSA9IGNhY2hlW2tleV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlVc2VEYXRhQXR0ciA9IGNhY2hlVXNlRGF0YUF0dHJba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGEgPSBlbnRyeVsxXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJ5VXNlRGF0YUF0dHIgJiYgb3B0aW9ucy5kYXRhQXR0ciAmJiBlbnRyeURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGFbb3B0aW9ucy5kYXRhQXR0cl0gPSBuZXdEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlEYXRhID0gbmV3RGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlbMV0gPSBlbnRyeURhdGE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHVuaXggZXBvY2ggaW4gc2Vjb25kcy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7aW50fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lc3RhbXAgKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2V0cyB0aGUgdGltZXN0YW1wIGZvciB0aGUgZ2l2ZW4ga2V5IHRvIHRoZSBjdXJyZW50IHVuaXggZXBvY2ggaW4gc2Vjb25kcy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2ludH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVPclVwZGF0ZVRpbWVzdGFtcCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlVGltZXN0YW1wc1trZXldID0gZ2V0Q3VycmVudFRpbWVzdGFtcCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVUaW1lc3RhbXBzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIHRoZSBjYWNoZSBlbnRyeSBmb3IgdGhlIGdpdmVuIGtleSBpcyBzdGlsbCBhbGl2ZS4gQWxzbyByZXR1cm5zXG4gICAgICAgICAgICAgICAgICogYGZhbHNlYCBpZiB0aGVyZSBpcyBubyBjYWNoZSBlbnRyeSBmb3IgdGhlIGdpdmVuIGtleS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ga2V5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaXNFbnRyeUFsaXZlIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5QWdlID0gZ2V0Q3VycmVudFRpbWVzdGFtcCgpIC0gY2FjaGVUaW1lc3RhbXBzW2tleV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeUFnZSA8PSBvcHRpb25zLnR0bDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUYWtlcyBhIG5ldyBjYWNoZSBlbnRyeSBhbmQgcmVmcmVzaGVzIHRoZSBleGlzdGluZyBpbnN0YW5jZXMgb2YgdGhlIGVudHJ5LCBtYXRjaGluZyBieSB0aGVcbiAgICAgICAgICAgICAgICAgKiBgcGtBdHRyYCB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gbmV3RGF0YVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlZnJlc2hTaW5nbGUgKG5ld0RhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmxBdHRyID0gb3B0aW9ucy51cmxBdHRyO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGluc2VydHMgdGhlIGRhdGEgb24gdGhlIGNhY2hlIGFzIGluZGl2aWR1YWwgZW50cnksIGlmIHdlIGhhdmUgdGhlIFVSTCBpbmZvcm1hdGlvbiBvbiB0aGUgZGF0YVxuICAgICAgICAgICAgICAgICAgICBpZiAodXJsQXR0ciAmJiBuZXdEYXRhICYmIG5ld0RhdGFbdXJsQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaW5zZXJ0KG5ld0RhdGFbdXJsQXR0cl0sIG5ld0RhdGEsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGNhY2hlSXNNYW5hZ2VkW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkgPSBjYWNoZVtrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeVVzZURhdGFBdHRyID0gY2FjaGVVc2VEYXRhQXR0cltrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGEgPSBnZXREYXRhRm9yRW50cnkoZW50cnksIGVudHJ5VXNlRGF0YUF0dHIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0xpc3QgPSBhbmd1bGFyLmlzQXJyYXkoZW50cnlEYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIG9iamVjdHMgbWF0Y2hpbmcgdGhlIG5ldyBvYmplY3Qgd2l0aGluIHRoZSBsaXN0IGVudHJpZXMgaW4gdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudHJ5RGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJ5RGF0YVtpXVtwa0F0dHJdID09PSBuZXdEYXRhW3BrQXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGRpdGlvbmFsbHkgY29tcGFyZSB0aGUgYHVybEF0dHJgLCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXVybEF0dHIgfHwgKHVybEF0dHIgJiYgZW50cnlEYXRhW2ldW3VybEF0dHJdID09PSBuZXdEYXRhW3VybEF0dHJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeURhdGFbaV0gPSBuZXdEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgY2FjaGUgZW50cnkgd2l0aCB0aGUgbmV3IGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RGF0YUZvcktleShrZXksIGVudHJ5RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlZnJlc2ggdGhlIG9iamVjdHMgbWF0Y2hpbmcgdGhlIG5ldyBvYmplY3QgaW4gdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeURhdGFbcGtBdHRyXSA9PT0gbmV3RGF0YVtwa0F0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGRpdGlvbmFsbHkgY29tcGFyZSB0aGUgYHVybEF0dHJgLCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdXJsQXR0ciB8fCAodXJsQXR0ciAmJiBlbnRyeURhdGFbdXJsQXR0cl0gPT09IG5ld0RhdGFbdXJsQXR0cl0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RGF0YUZvcktleShrZXksIG5ld0RhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIG9iamVjdCBlbnRyaWVzIHdlIGNhbiB1cGRhdGUgdGhlIGVudHJpZXMgdGltZXN0YW1wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlT3JVcGRhdGVUaW1lc3RhbXAoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlZnJlc2hlcyBlYWNoIGVudHJ5IGluIHRoZSBnaXZlbiBsaXN0IHVzaW5nIHRoZSBgcmVmcmVzaFNpbmdsZWAgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gbmV3RW50cmllc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlZnJlc2hFYWNoIChuZXdFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmV3RW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFNpbmdsZShuZXdFbnRyaWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEluaXRpYWxpemVzIHRoZSBjYWNoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgZ2l2ZW4gbmFtZSBpcyBub3QgdXNlZCB5ZXRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOYW1lICdcIiArIG5hbWUgKyBcIicgaXMgYWxyZWFkeSB1c2VkIGJ5IGFub3RoZXIgY2FjaGUuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVzW25hbWVdID0gc2VsZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsbHMgdGhlIHJlbW92ZUFsbCBtZXRob2Qgb24gYWxsIG1hbmFnZWQgY2FjaGVzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUNhY2hlXG4gICAgICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVzW2tleV0ucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldHMgdGhlIGNhY2hlIHdpdGggdGhlIGdpdmVuIG5hbWUsIG9yIG51bGwuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlQ2FjaGVcbiAgICAgICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfG51bGx9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlc1trZXldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VDYWNoZVNlcnZpY2U6IENhY2hlICdcIiArIGtleSArIFwiJyBkb2VzIG5vdCBleGlzdC5cIik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgaW5mb3JtYXRpb24gZm9yIGFsbCBtYW5hZ2VkIGNhY2hlcyBhcyBtYXBwaW5nIG9mIGNhY2hlSWQgdG8gdGhlIHJlc3VsdFxuICAgICAgICAgICAgICogb2YgdGhlIGluZm8gbWV0aG9kIG9uIHRoZSBjYWNoZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVxuICAgICAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgICAgICogQHJldHVybnMge3t9fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5pbmZvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBpbmZvcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGNhY2hlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8gPSBjYWNoZXNba2V5XS5pbmZvKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm9zW2luZm8uaWRdID0gaW5mbztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBpbmZvcztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29sbGVjdHMgYWxsIGRlcGVuZGVudCBjYWNoZXMgb2YgdGhlIGdpdmVuIGNhY2hlLCBpbmNsdWRpbmcgdGhlIGRlcGVuZGVudCBjYWNoZXMgb2YgdGhlIGRlcGVuZGVudFxuICAgICAgICAgICAgICogY2FjaGVzIChhbmQgc28gb24gLi4uKS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VDYWNoZVNlcnZpY2VcbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FjaGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPnx1bmRlZmluZWR9IGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXNcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtBcnJheTxTdHJpbmc+fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBjb2xsZWN0RGVwZW5kZW50Q2FjaGVOYW1lcyAoY2FjaGUsIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWVzID0gY2FjaGUuaW5mbygpWydvcHRpb25zJ11bJ2RlcGVuZGVudCddO1xuXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCBgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lc2AgdG8gZW1wdHkgbGlzdFxuICAgICAgICAgICAgICAgIGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMgPSBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzIHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWNoZURlcGVuZGVudENhY2hlTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZURlcGVuZGVudENhY2hlTmFtZSA9IGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlRGVwZW5kZW50Q2FjaGUgPSBjYWNoZXNbY2FjaGVEZXBlbmRlbnRDYWNoZU5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZURlcGVuZGVudENhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwdXNoIGNhY2hlIG5hbWUgdG8gdGhlIGNvbGxlY3RlZCBkZXBlbmRlbnQgY2FjaGVzLCBpZiBleGlzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcy5wdXNoKGNhY2hlRGVwZW5kZW50Q2FjaGVOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSBjb2xsZWN0IGNhY2hlIGRlcGVuZGVuY2llcyBpZiBub3QgYWxyZWFkeSBjb2xsZWN0ZWQsIHRvIHByZXZlbnQgY2lyY2xlc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3RlZERlcGVuZGVudENhY2hlTmFtZXMuaW5kZXhPZihjYWNoZURlcGVuZGVudENhY2hlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdERlcGVuZGVudENhY2hlTmFtZXMoY2FjaGVEZXBlbmRlbnRDYWNoZSwgY29sbGVjdGVkRGVwZW5kZW50Q2FjaGVOYW1lcylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0ZWREZXBlbmRlbnRDYWNoZU5hbWVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgICAgIH1cbiAgICApO1xufSkoKTtcbiIsIi8qKlxuICogQW5ndWxhciBSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlXG4gKiBDb3B5cmlnaHQgMjAxNiBBbmRyZWFzIFN0b2NrZXJcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkXG4gKiBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbiAqIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZVxuICogU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRVxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4gKiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhclxuICAgICAgICBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnbmdSZXNvdXJjZUZhY3RvcnknKTtcblxuICAgIC8qKlxuICAgICAqIEZhY3Rvcnkgc2VydmljZSB0byBjcmVhdGUgbmV3IHJlc291cmNlIGNsYXNzZXMuXG4gICAgICpcbiAgICAgKiBAbmFtZSBSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlXG4gICAgICogQG5nZG9jIGZhY3RvcnlcbiAgICAgKiBAcGFyYW0ge3NlcnZpY2V9ICRxXG4gICAgICogQHBhcmFtIHtzZXJ2aWNlfSAkcmVzb3VyY2VcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlQ2FjaGVTZXJ2aWNlfSBSZXNvdXJjZUNhY2hlU2VydmljZSBEZWZhdWx0IGNhY2hlIHNlcnZpY2VcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnR9IFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnQgRGVmYXVsdCBwaGFudG9tIElEIGdlbmVyYXRvclxuICAgICAqL1xuICAgIG1vZHVsZS5mYWN0b3J5KCdSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCRxLFxuICAgICAgICAgICAgICAgICAgJHJlc291cmNlLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2VDYWNoZVNlcnZpY2UsXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZVBoYW50b21JZE5lZ2F0aXZlSW50KSB7XG4gICAgICAgICAgICAnbmdJbmplY3QnO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG5hbWUgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgKiBAbmdkb2MgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIHJlc291cmNlIHNlcnZpY2VcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVVJMIHRvIHRoZSByZXNvdXJjZVxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIHJlc291cmNlXG4gICAgICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lLCB1cmwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBPcHRpb25zIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBPcHRpb24gdG8gc3RyaXAgdHJhaWxpbmcgc2xhc2hlcyBmcm9tIHJlcXVlc3QgVVJMc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHN0cmlwVHJhaWxpbmdTbGFzaGVzOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogT3B0aW9uIHRvIGlnbm9yZSB0aGUgcmVzb3VyY2UgZm9yIGF1dG9tYXRpYyBsb2FkaW5nIGJhcnNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogR2VuZXJhdGUgSURzIGZvciBwaGFudG9tIHJlY29yZHMgY3JlYXRlZCB2aWEgdGhlIGBuZXdgXG4gICAgICAgICAgICAgICAgICAgICAqIG1ldGhvZCBvbiB0aGUgcmVzb3VyY2Ugc2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlUGhhbnRvbUlkczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogUGhhbnRvbSBJRCBnZW5lcmF0b3IgaW5zdGFuY2UgdG8gdXNlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtSZXNvdXJjZVBoYW50b21JZEZhY3Rvcnl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwaGFudG9tSWRHZW5lcmF0b3I6IFJlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnQsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIExpc3Qgb2YgcmVzb3VyY2Ugc2VydmljZXMgdG8gY2xlYW4gdGhlIGNhY2hlIGZvciwgb24gbW9kaWZ5aW5nIHJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheTxTdHJpbmc+fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW50OiBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogRXh0cmEgbWV0aG9kcyB0byBwdXQgb24gdGhlIHJlc291cmNlIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGV4dHJhTWV0aG9kczoge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEV4dHJhIGZ1bmN0aW9ucyB0byBwdXQgb24gdGhlIHJlc291cmNlIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZXh0cmFGdW5jdGlvbnM6IHt9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBBdHRyaWJ1dGUgbmFtZSB3aGVyZSB0byBmaW5kIHRoZSBJRCBvZiBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBwa0F0dHI6ICdwaycsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRvIGZpbmQgdGhlIFVSTCBvZiBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB1cmxBdHRyOiAndXJsJyxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQXR0cmlidXRlIG5hbWUgd2hlcmUgdG8gZmluZCB0aGUgZGF0YSBvbiB0aGUgcXVlcnkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeURhdGFBdHRyOiBudWxsLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBBdHRyaWJ1dGUgbmFtZSB3aGVyZSB0byBmaW5kIHRoZSB0b3RhbCBhbW91bnQgb2YgZGF0YSBvbiB0aGUgcXVlcnkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVRvdGFsQXR0cjogbnVsbCxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU3RvcmFnZSBmb3IgdGhlIHF1ZXJ5IGZpbHRlcnNcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUgeyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeUZpbHRlcjoge30sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEZ1bmN0aW9uIHRvIHBvc3QtcHJvY2VzcyBkYXRhIGNvbWluZyBmcm9tIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBvYmpcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdG9JbnRlcm5hbDogZnVuY3Rpb24gKG9iaiwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBGdW5jdGlvbiB0byBwb3N0LXByb2Nlc3MgZGF0YSB0aGF0IGlzIGdvaW5nIHRvIGJlIHNlbnRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZnJvbUludGVybmFsOiBmdW5jdGlvbiAob2JqLCBoZWFkZXJzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2UsXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIERlZmF1bHQgcGFyYW1ldGVyIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zRGVmYXVsdHMgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogUGFyYW1ldGVyIGNvbmZpZ3VyYXRpb24gZm9yIHNhdmUgKGluc2VydCkuIFVzZWQgdG9cbiAgICAgICAgICAgICAgICAgICAgICogZGlzYWJsZSB0aGUgUEsgdXJsIHRlbXBsYXRlIGZvciBzYXZlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHNhdmVQYXJhbXMgPSB7fSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGNhY2hlIGluc3RhbmNlIGZvciB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtSZXNvdXJjZUNhY2hlU2VydmljZX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlID0gbmV3IFJlc291cmNlQ2FjaGVTZXJ2aWNlKG5hbWUsIG9wdGlvbnMucGtBdHRyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhQXR0cjogb3B0aW9ucy5xdWVyeURhdGFBdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGtBdHRyOiBvcHRpb25zLnBrQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybEF0dHI6IG9wdGlvbnMudXJsQXR0cixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVudDogb3B0aW9ucy5kZXBlbmRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0dGw6IDE1ICogNjBcbiAgICAgICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEludGVyY2VwdG9yIHRoYXQgcHV0cyB0aGUgcmV0dXJuZWQgb2JqZWN0IG9uIHRoZSBjYWNoZSBhbiBpbnZhbGlkYXRlcyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICogZGVwZW5kZW50IHJlc291cmNlIHNlcnZpY2VzIGNhY2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGluc2VydGluZ0ludGVyY2VwdG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gcmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gb3B0aW9ucy51cmxBdHRyID8gZGF0YVtvcHRpb25zLnVybEF0dHJdIDogcmVzcG9uc2UuY29uZmlnLnVybDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbExpc3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsRGVwZW5kZW50KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIEluc2VydCB0aGUgY2FjaGVkIG9iamVjdCBpZiB3ZSBoYXZlIGFuIFVSTCBvbiB0aGUgcmV0dXJuZWQgaW5zdGFuY2UuIEVsc2Ugd2UgaGF2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHRvIGludmFsaWRhdGUgdGhlIHdob2xlIG9iamVjdCBjYWNoZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLmluc2VydCh1cmwsIGRhdGEsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbE9iamVjdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEludGVyY2VwdG9yIHRoYXQgcHV0cyB0aGUgcmV0dXJuZWQgb2JqZWN0IG9uIHRoZSBjYWNoZSBhbiBpbnZhbGlkYXRlcyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICogZGVwZW5kZW50IHJlc291cmNlIHNlcnZpY2VzIGNhY2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIG1vZGlmeWluZ0ludGVyY2VwdG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gcmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gb3B0aW9ucy51cmxBdHRyID8gZGF0YVtvcHRpb25zLnVybEF0dHJdIDogcmVzcG9uc2UuY29uZmlnLnVybDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbExpc3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsRGVwZW5kZW50KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFVwZGF0ZSB0aGUgY2FjaGVkIG9iamVjdCBpZiB3ZSBoYXZlIGFuIFVSTCBvbiB0aGUgcmV0dXJuZWQgaW5zdGFuY2UuIEVsc2Ugd2UgaGF2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHRvIGludmFsaWRhdGUgdGhlIHdob2xlIG9iamVjdCBjYWNoZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLmluc2VydCh1cmwsIGRhdGEsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZUFsbE9iamVjdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEludGVyY2VwdG9yIHRoYXQgcmVtb3ZlcyB0aGUgY2FjaGUgZm9yIHRoZSBkZWxldGVkIG9iamVjdCwgcmVtb3ZlcyBhbGwgbGlzdCBjYWNoZXMsIGFuZFxuICAgICAgICAgICAgICAgICAgICAgKiBpbnZhbGlkYXRlcyB0aGUgZGVwZW5kZW50IHJlc291cmNlIHNlcnZpY2VzIGNhY2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0aW5nSW50ZXJjZXB0b3IgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgPSByZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSBvcHRpb25zLnVybEF0dHIgPyBkYXRhW29wdGlvbnMudXJsQXR0cl0gOiByZXNwb25zZS5jb25maWcudXJsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlQWxsTGlzdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxEZXBlbmRlbnQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICogUmVtb3ZlIHRoZSBjYWNoZWQgb2JqZWN0IGlmIHdlIGhhdmUgYW4gVVJMIG9uIHRoZSByZXR1cm5lZCBpbnN0YW5jZS4gRWxzZSB3ZSBoYXZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICogdG8gaW52YWxpZGF0ZSB0aGUgd2hvbGUgb2JqZWN0IGNhY2hlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGxPYmplY3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBQYXJzZXMgdGhlIHJlc3BvbnNlIHRleHQgYXMgSlNPTiBhbmQgcmV0dXJucyBpdCBhcyBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXNwb25zZVRleHRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R8QXJyYXl8c3RyaW5nfG51bWJlcn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24gPSBmdW5jdGlvbiAocmVzcG9uc2VUZXh0LCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogRGVzZXJpYWxpemUgZGF0YS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZVRleHQgPyBhbmd1bGFyLmZyb21Kc29uKHJlc3BvbnNlVGV4dCkgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyB0aGUgYHRvSW50ZXJuYWxgIGZ1bmN0aW9uIG9uIGVhY2ggb2JqZWN0IG9mIHRoZSByZXNwb25zZSBhcnJheS5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlc3BvbnNlRGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbCA9IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBQb3N0LXByb2Nlc3MgcXVlcnkgZGF0YSBmb3IgaW50ZXJuYWwgdXNlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIHRoZSByZXNwb25zZSBkYXRhLCBpZiBpdCB3YXMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkocmVzcG9uc2VEYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2VEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlRGF0YVtpXSA9IG9wdGlvbnMudG9JbnRlcm5hbChyZXNwb25zZURhdGFbaV0sIGhlYWRlcnNHZXR0ZXIsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSBqdXN0IGNhbGwgdGhlIGB0b0ludGVybmFsYCBmdW5jdGlvbiBvbiB0aGUgcmVzcG9uc2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZURhdGEgPSBvcHRpb25zLnRvSW50ZXJuYWwocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDYWxscyB0aGUgYHRvSW50ZXJuYWxgIGZ1bmN0aW9uIG9uIHRoZSByZXNwb25zZSBkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHJlc3BvbnNlRGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWwgPSBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogUG9zdC1wcm9jZXNzIGRhdGEgZm9yIGludGVybmFsIHVzZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnRvSW50ZXJuYWwocmVzcG9uc2VEYXRhLCBoZWFkZXJzR2V0dGVyLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUcmFuc2Zvcm1zIHF1ZXJ5IHJlc3BvbnNlcyB0byBnZXQgdGhlIGFjdHVhbCBkYXRhIGZyb20gdGhlIGBxdWVyeURhdGFBdHRyYCBvcHRpb24sIGlmXG4gICAgICAgICAgICAgICAgICAgICAqIGNvbmZpZ3VyZWQuIEFsc28gc2V0cyB0aGUgYHRvdGFsYCBhdHRyaWJ1dGUgb24gdGhlIGxpc3QgaWYgYHF1ZXJ5VG90YWxBdHRyYCBpcyBjb25maWd1cmVkLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVzcG9uc2VEYXRhXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBoZWFkZXJzR2V0dGVyXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybnMge0FycmF5fE9iamVjdH1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VEYXRhID0gZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgaGVhZGVyc0dldHRlciwgc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgZGF0YSBvbiBzdWNjZXNzIHN0YXR1cyBmcm9tIGBxdWVyeURhdGFBdHRyYCwgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBkYXRhIGZyb20gdGhlIGBxdWVyeURhdGFBdHRyYCwgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnF1ZXJ5RGF0YUF0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZUZhY3RvcnlTZXJ2aWNlOiBHZXQgZGF0YSBmcm9tICdcIiArIG9wdGlvbnMucXVlcnlEYXRhQXR0ciArIFwiJyBhdHRyaWJ1dGUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgZGF0YSBmcm9tIHRoZSBjb25maWd1cmVkIGBxdWVyeURhdGFBdHRyYCBvbmx5IGlmIHdlIGhhdmUgYSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsc2Ugd2UganVzdCB3YW50IHRoZSByZXN1bHQgdG8gYmUgdGhlIHJlc3BvbnNlIGRhdGEuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3BvbnNlRGF0YVtvcHRpb25zLnF1ZXJ5RGF0YUF0dHJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzcG9uc2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIG5vIGRhdGEgYHF1ZXJ5RGF0YUF0dHJgIGlzIGRlZmluZWQsIHVzZSB0aGUgcmVzcG9uc2UgZGF0YSBkaXJlY3RseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXNwb25zZURhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSB0b3RhbCBmcm9tIHRoZSBgcXVlcnlUb3RhbEF0dHJgLCBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucXVlcnlUb3RhbEF0dHIgJiYgcmVzcG9uc2VEYXRhICYmIHJlc3BvbnNlRGF0YVtvcHRpb25zLnF1ZXJ5VG90YWxBdHRyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IEdldCB0b3RhbCBmcm9tICdcIiArIG9wdGlvbnMucXVlcnlUb3RhbEF0dHIgKyBcIicgYXR0cmlidXRlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQudG90YWwgPSByZXNwb25zZURhdGFbb3B0aW9ucy5xdWVyeVRvdGFsQXR0cl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb24gYW55IG90aGVyIHN0YXR1cyBqdXN0IHJldHVybiB0aGUgcmVzcG9uZGVkIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzcG9uc2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTZXJpYWxpemVzIHRoZSByZXF1ZXN0IGRhdGEgYXMgSlNPTiBhbmQgcmV0dXJucyBpdCBhcyBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSByZXF1ZXN0RGF0YVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaGVhZGVyc0dldHRlclxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uID0gZnVuY3Rpb24gKHJlcXVlc3REYXRhLCBoZWFkZXJzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IFNlcmlhbGl6ZSBkYXRhLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyUHJpdmF0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhrZXkpWzBdID09PSAnJCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzID0gYW5ndWxhci5pc09iamVjdChyZXF1ZXN0RGF0YSkgPyBPYmplY3Qua2V5cyhyZXF1ZXN0RGF0YSkgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlS2V5cyA9IGtleXMuZmlsdGVyKGZpbHRlclByaXZhdGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByaXZhdGVLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlcXVlc3REYXRhW3ByaXZhdGVLZXlzW2ldXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIudG9Kc29uKHJlcXVlc3REYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbHMgdGhlIGBmcm9tSW50ZXJuYWxgIGZ1bmN0aW9uIG9uIHRoZSByZXF1ZXN0IGRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVxdWVzdERhdGFcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGhlYWRlcnNHZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwgPSBmdW5jdGlvbiAocmVxdWVzdERhdGEsIGhlYWRlcnNHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogUG9zdC1wcm9jZXNzIGRhdGEgZm9yIGV4dGVybmFsIHVzZS5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmZyb21JbnRlcm5hbChhbmd1bGFyLmNvcHkocmVxdWVzdERhdGEpLCBoZWFkZXJzR2V0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogTWV0aG9kIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBuZy1yZXNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlLndpdGhvdXREYXRhQXR0ck5vVHRsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogY2FjaGUud2l0aG91dERhdGFBdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE5vQ2FjaGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmVMb2FkaW5nQmFyOiBvcHRpb25zLmlnbm9yZUxvYWRpbmdCYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogY2FjaGUud2l0aERhdGFBdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5Tm9DYWNoZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5VHJhbnNmb3JtUmVzcG9uc2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZUxvYWRpbmdCYXI6IG9wdGlvbnMuaWdub3JlTG9hZGluZ0JhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvcjogaW5zZXJ0aW5nSW50ZXJjZXB0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2VGcm9tSnNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVzcG9uc2VUb0ludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlcXVlc3RGcm9tSW50ZXJuYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3RUb0pzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyY2VwdG9yOiBtb2RpZnlpbmdJbnRlcmNlcHRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZUZyb21Kc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXNwb25zZVRvSW50ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlVHJhbnNmb3JtUmVxdWVzdEZyb21JbnRlcm5hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdFRvSnNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxsYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlTG9hZGluZ0Jhcjogb3B0aW9ucy5pZ25vcmVMb2FkaW5nQmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyY2VwdG9yOiBkZWxldGluZ0ludGVyY2VwdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlRnJvbUpzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVRyYW5zZm9ybVJlc3BvbnNlVG9JbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVUcmFuc2Zvcm1SZXF1ZXN0RnJvbUludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0VG9Kc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gZXh0ZW5kIHRoZSBtZXRob2RzIHdpdGggdGhlIGdpdmVuIGV4dHJhIG1ldGhvZHNcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmV4dGVuZChtZXRob2RzLCBvcHRpb25zLmV4dHJhTWV0aG9kcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBvZmZlciBtZXRob2RzIGZvciBxdWVyeWluZyB3aXRob3V0IGEgbG9hZGluZyBiYXIgKHVzaW5nIGEgJ0JnJyBzdWZmaXgpXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbWV0aG9kTmFtZSBpbiBtZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRob2RzLmhhc093blByb3BlcnR5KG1ldGhvZE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZ01ldGhvZE5hbWUgPSBtZXRob2ROYW1lICsgJ0JnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZ01ldGhvZENvbmZpZyA9IGFuZ3VsYXIuY29weShtZXRob2RzW21ldGhvZE5hbWVdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYmdNZXRob2RDb25maWcuaWdub3JlTG9hZGluZ0JhciA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbYmdNZXRob2ROYW1lXSA9IGJnTWV0aG9kQ29uZmlnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYnVpbGQgdGhlIGRlZmF1bHQgcGFyYW1zIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICBwYXJhbXNEZWZhdWx0c1tvcHRpb25zLnBrQXR0cl0gPSAnQCcgKyBvcHRpb25zLnBrQXR0cjtcbiAgICAgICAgICAgICAgICBzYXZlUGFyYW1zW29wdGlvbnMucGtBdHRyXSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBtZXRob2RzLnNhdmUucGFyYW1zID0gc2F2ZVBhcmFtcztcblxuICAgICAgICAgICAgICAgIC8vIGJ1aWxkIHRoZSByZXNvdXJjZSBvYmplY3RcbiAgICAgICAgICAgICAgICByZXNvdXJjZSA9ICRyZXNvdXJjZSh1cmwsIHBhcmFtc0RlZmF1bHRzLCBtZXRob2RzLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmlwVHJhaWxpbmdTbGFzaGVzOiBvcHRpb25zLnN0cmlwVHJhaWxpbmdTbGFzaGVzXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBQSyBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1N0cmluZ3xudWxsfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldFBrQXR0ciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMucGtBdHRyO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBkYXRhIGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7U3RyaW5nfG51bGx9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0RGF0YUF0dHIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmRhdGFBdHRyO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCBob2xkaW5nIHRoZSBmaWx0ZXIgZGF0YSBmb3IgcXVlcnkgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldFF1ZXJ5RmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMucXVlcnlGaWx0ZXI7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFNldHMgdGhlIG9iamVjdCBob2xkaW5nIHRoZSBmaWx0ZXIgZGF0YSBmb3IgcXVlcnkgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmaWx0ZXJzXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2Uuc2V0UXVlcnlGaWx0ZXJzID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShmaWx0ZXJzLCBvcHRpb25zLnF1ZXJ5RmlsdGVyKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogU2V0cyB0aGUgZ2l2ZW4gZmlsdGVyIG9wdGlvbnMgaWYgdGhlIGFyZW4ndCBhbHJlYWR5IHNldCBvbiB0aGUgZmlsdGVyIG9iamVjdFxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBkZWZhdWx0RmlsdGVyc1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLnNldERlZmF1bHRRdWVyeUZpbHRlcnMgPSBmdW5jdGlvbiAoZGVmYXVsdEZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzID0gYW5ndWxhci5leHRlbmQoe30sIGRlZmF1bHRGaWx0ZXJzLCBvcHRpb25zLnF1ZXJ5RmlsdGVyKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KGZpbHRlcnMsIG9wdGlvbnMucXVlcnlGaWx0ZXIpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBRdWVyaWVzIHRoZSByZXNvdXJjZSB3aXRoIHRoZSBjb25maWd1cmVkIGZpbHRlcnMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVycyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCByZXNvdXJjZS5nZXRRdWVyeUZpbHRlcnMoKSwgZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5xdWVyeShmaWx0ZXJzKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUXVlcmllcyB0aGUgcmVzb3VyY2Ugd2l0aCB0aGUgY29uZmlndXJlZCBmaWx0ZXJzIHdpdGhvdXQgdXNpbmcgdGhlIGNhY2hlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmZpbHRlck5vQ2FjaGUgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzID0gYW5ndWxhci5leHRlbmQoe30sIHJlc291cmNlLmdldFF1ZXJ5RmlsdGVycygpLCBmaWx0ZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlLnF1ZXJ5Tm9DYWNoZShmaWx0ZXJzKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBmb3IgdGhlIHJlc291cmNlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UubmV3ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYW50b21JbnN0YW5jZSA9IG5ldyByZXNvdXJjZShwYXJhbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIHBoYW50b20gSUQgaWYgZGVzaXJlZFxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5wa0F0dHIgJiYgb3B0aW9ucy5nZW5lcmF0ZVBoYW50b21JZHMgJiYgb3B0aW9ucy5waGFudG9tSWRHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBoYW50b21JbnN0YW5jZVtvcHRpb25zLnBrQXR0cl0gPSBvcHRpb25zLnBoYW50b21JZEdlbmVyYXRvci5nZW5lcmF0ZShwaGFudG9tSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBoYW50b21JbnN0YW5jZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBpbnN0YW5jZSBpcyBhIHBoYW50b20gaW5zdGFuY2UgKGluc3RhbmNlIG5vdCBwZXJzaXN0ZWQgdG8gdGhlIFJFU1QgQVBJIHlldClcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5pc1BoYW50b20gPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBwa1ZhbHVlID0gaW5zdGFuY2UgPyBpbnN0YW5jZVtvcHRpb25zLnBrQXR0cl0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcGhhbnRvbSBJRCBpZiBhbGwgY29uZmlndXJlZCBjb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucGtBdHRyICYmIG9wdGlvbnMuZ2VuZXJhdGVQaGFudG9tSWRzICYmIG9wdGlvbnMucGhhbnRvbUlkR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5waGFudG9tSWRHZW5lcmF0b3IuaXNQaGFudG9tKHBrVmFsdWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyBmcm9tIHRoZSBnaXZlbiBpbnN0YW5jZXMgd2hlcmUgdGhlIGdpdmVuIGF0dHJpYnV0ZSBuYW1lIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgKiB0aGUgZ2l2ZW4gYXR0cmlidXRlIHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlRmFjdG9yeVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXR0ck5hbWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXR0clZhbHVlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZmlsdGVySW5zdGFuY2VzQnlBdHRyID0gZnVuY3Rpb24gKGluc3RhbmNlcywgYXR0ck5hbWUsIGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlckF0dHJWYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0gPyBpdGVtW2F0dHJOYW1lXSA9PSBhdHRyVmFsdWUgOiBmYWxzZTsgLy8gdXNlID09IGhlcmUgdG8gbWF0Y2ggJzEyMycgdG8gMTIzXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZXMuZmlsdGVyKGZpbHRlckF0dHJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgdGhlIGZpcnN0IGluc3RhbmNlIGZyb20gdGhlIGdpdmVuIGluc3RhbmNlcyB3aGVyZSB0aGUgZ2l2ZW4gYXR0cmlidXRlIG5hbWUgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAqIHRoZSBnaXZlbiBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBhdHRyTmFtZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBhdHRyVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldEluc3RhbmNlQnlBdHRyID0gZnVuY3Rpb24gKGluc3RhbmNlcywgYXR0ck5hbWUsIGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZEluc3RhbmNlcyA9IHJlc291cmNlLmZpbHRlckluc3RhbmNlc0J5QXR0cihpbnN0YW5jZXMsIGF0dHJOYW1lLCBhdHRyVmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJlZEluc3RhbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJlZEluc3RhbmNlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiUmVzb3VyY2VGYWN0b3J5U2VydmljZTogRm91bmQgbW9yZSB0aGFuIDEgaW5zdGFuY2VzIHdoZXJlICdcIiArIGF0dHJOYW1lICsgXCInIGlzICdcIiArIGF0dHJWYWx1ZSArIFwiJyBvbiBnaXZlbiAnXCIgKyBuYW1lICsgXCInIGluc3RhbmNlcy5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZpbHRlcmVkSW5zdGFuY2VzWzBdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgZmlyc3QgaW5zdGFuY2UgZnJvbSB0aGUgZ2l2ZW4gaW5zdGFuY2VzIHdoZXJlIHRoZSBQSyBhdHRyaWJ1dGUgaGFzIHRoZSBnaXZlbiB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmdldEluc3RhbmNlQnlQayA9IGZ1bmN0aW9uIChpbnN0YW5jZXMsIHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlLmdldEluc3RhbmNlQnlBdHRyKGluc3RhbmNlcywgb3B0aW9ucy5wa0F0dHIsIHBrVmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZUZhY3RvcnlcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0UmVzb3VyY2VOYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmFtZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgY2FjaGUgaW5zdGFuY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VDYWNoZVNlcnZpY2V9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuZ2V0Q2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBzdG9yZSBmb3IgdGhlIHJlc291cmNlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UmVzb3VyY2VTdG9yZX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5jcmVhdGVTdG9yZSA9IGZ1bmN0aW9uIChpbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNvdXJjZVN0b3JlKHJlc291cmNlLCBpbnN0YW5jZXMsIG51bGwpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTYXZlcyB0aGUgZ2l2ZW4gcmVzb3VyY2UgaW5zdGFuY2UgdG8gdGhlIFJFU1QgQVBJLiBVc2VzIHRoZSBgJHNhdmVgIG1ldGhvZCBpZiBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqIGlzIHBoYW50b20sIGVsc2UgdGhlIGAkdXBkYXRlYCBtZXRob2QuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtwYXJhbXNdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5wZXJzaXN0ID0gZnVuY3Rpb24gKGluc3RhbmNlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIGBpbnN0YW5jZWAgaGFzIGEgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZSB8fCB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVGbiA9IHJlc291cmNlLmlzUGhhbnRvbShpbnN0YW5jZSkgPyByZXNvdXJjZS5zYXZlIDogcmVzb3VyY2UudXBkYXRlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzYXZlRm4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzYXZlRm4oe30sIGluc3RhbmNlLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlRmFjdG9yeVNlcnZpY2U6IE9iamVjdCB0byBwZXJzaXN0IGlzIG5vdCBhIHZhbGlkIHJlc291cmNlIGluc3RhbmNlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0ID0gJHEucmVqZWN0KGluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0LiRwcm9taXNlID0gcmVqZWN0OyAvLyBmYWtlIHByb21pc2UgQVBJIG9mIHJlc291cmNlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3Q7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBBZGQgc29tZSBvZiB0aGUgcmVzb3VyY2UgbWV0aG9kcyBhcyBpbnN0YW5jZSBtZXRob2RzIG9uIHRoZVxuICAgICAgICAgICAgICAgICAqIHByb3RvdHlwZSBvZiB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQocmVzb3VyY2UucHJvdG90eXBlLCB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTYXZlcyBvciB1cGRhdGVzIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGFyYW1zXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAkcGVyc2lzdDogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzb3VyY2UucGVyc2lzdCh0aGlzLCBwYXJhbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LiRwcm9taXNlIHx8IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIGluc3RhbmNlIGlzIGEgcGhhbnRvbSByZWNvcmQgKG5vdCBzYXZlZCB2aWEgdGhlIFJFU1QgQVBJIHlldClcbiAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICRpc1BoYW50b206IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZS5pc1BoYW50b20odGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogQWRkIGV4dHJhIGZ1bmN0aW9ucyBhcyBpbnN0YW5jZSBtZXRob2RzIG9uIHRoZSBwcm90b3R5cGUgb2ZcbiAgICAgICAgICAgICAgICAgKiB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQocmVzb3VyY2UucHJvdG90eXBlLCBvcHRpb25zLmV4dHJhRnVuY3Rpb25zKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIGEgcmVzb3VyY2Ugc3RvcmUuIEEgcmVzb3VyY2Ugc3RvcmUgbWFuYWdlcyBpbnNlcnRzLCB1cGRhdGVzIGFuZFxuICAgICAgICAgICAgICogZGVsZXRlcyBvZiBpbnN0YW5jZXMsIGNhbiBjcmVhdGUgc3ViLXN0b3JlcyB0aGF0IGNvbW1pdCBjaGFuZ2VzIHRvIHRoZSBwYXJlbnQgc3RvcmUsIGFuZFxuICAgICAgICAgICAgICogc2V0cyB1cCByZWxhdGlvbnMgYmV0d2VlbiByZXNvdXJjZSB0eXBlcyAoZS5nLiB0byB1cGRhdGUgcmVmZXJlbmNlIGtleXMpLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBuYW1lIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAqIEBuZ2RvYyBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICogQHBhcmFtIHJlc291cmNlXG4gICAgICAgICAgICAgKiBAcGFyYW0gbWFuYWdlZEluc3RhbmNlc1xuICAgICAgICAgICAgICogQHBhcmFtIHBhcmVudFN0b3JlXG4gICAgICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gUmVzb3VyY2VTdG9yZSAocmVzb3VyY2UsIG1hbmFnZWRJbnN0YW5jZXMsIHBhcmVudFN0b3JlKSB7XG4gICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBOYW1lIG9mIHRoZSByZXNvdXJjZSBzZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZU5hbWUgPSByZXNvdXJjZS5nZXRSZXNvdXJjZU5hbWUoKSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogSW5kaWNhdG9yIGZvciBydW5uaW5nIGV4ZWN1dGlvbiAoc3RvcHMgYW5vdGhlciBleGVjdXRpb24gZnJvbSBiZWluZyBpc3N1ZWQpXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uUnVubmluZyA9IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDb250YWlucyByZWxhdGlvbnMgdG8gb3RoZXIgc3RvcmVzIChmb3IgdXBkYXRpbmcgcmVmZXJlbmNlcylcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5PFJlc291cmNlU3RvcmVSZWxhdGlvbj59XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogU3RvcmVzIHJlc291cmNlIGl0ZW1zIHRoYXQgYXJlIHZpc2libGUgZm9yIHRoZSB1c2VyIChub3QgcXVldWVkIGZvciByZW1vdmUpXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGVRdWV1ZSA9IFtdLFxuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBTdG9yZXMgcmVzb3VyY2UgaXRlbXMgcXVldWVkIGZvciBwZXJzaXN0aW5nIChzYXZlIG9yIHVwZGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFF1ZXVlID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFN0b3JlcyByZXNvdXJjZSBpdGVtcyBxdWV1ZWQgZm9yIGRlbGV0aW5nXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVF1ZXVlID0gW10sXG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENhbGxiYWNrcyBleGVjdXRlZCBiZWZvcmUgZWFjaCBpdGVtIHBlcnNpc3RzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbGJhY2tzIGV4ZWN1dGVkIGFmdGVyIGVhY2ggaXRlbSBwZXJzaXN0c1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBhZnRlclBlcnNpc3RMaXN0ZW5lcnMgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbGJhY2tzIGV4ZWN1dGVkIGJlZm9yZSBlYWNoIGl0ZW0gcmVtb3Zlc1xuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBiZWZvcmVSZW1vdmVMaXN0ZW5lcnMgPSBbXSxcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2FsbGJhY2tzIGV4ZWN1dGVkIGFmdGVyIGVhY2ggaXRlbSByZW1vdmVzXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGFmdGVyUmVtb3ZlTGlzdGVuZXJzID0gW107XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBNYW5hZ2UgZ2l2ZW4gaW5zdGFuY2VzLiBUaGUgbmV3IGluc3RhbmNlcyBvYmplY3QgbWF5IGJlIGEgbmctcmVzb3VyY2UgcmVzdWx0LFxuICAgICAgICAgICAgICAgICAqIGEgcHJvbWlzZSwgYSBsaXN0IG9mIGluc3RhbmNlcyBvciBhIHNpbmdsZSBpbnN0YW5jZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG5ld0luc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYubWFuYWdlID0gZnVuY3Rpb24gKG5ld0luc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvTWFuYWdlID0gZnVuY3Rpb24gKG5ld0luc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzb3VyY2VTdG9yZTogTWFuYWdlIGdpdmVuICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZXMuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBmb3Igc2luZ2xlIGluc3RhbmNlcyBieSBjb252ZXJ0aW5nIGl0IHRvIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzQXJyYXkobmV3SW5zdGFuY2VzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZXMgPSBbbmV3SW5zdGFuY2VzXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5ld0luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbmNlID0gbmV3SW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZSBpcyBub3QgbWFuYWdlZCB5ZXQsIG1hbmFnZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld0luc3RhbmNlLiRzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFrZSB0aGUgc3RvcmUgYXZhaWxhYmxlIG9uIHRoZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFuY2UuJHN0b3JlID0gc2VsZjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBpbnN0YW5jZSB0byB0aGUgbGlzdCBvZiBtYW5hZ2VkIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkUmVzb3VyY2VJbnN0YW5jZShtYW5hZ2VkSW5zdGFuY2VzLCBuZXdJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRSZXNvdXJjZUluc3RhbmNlKHZpc2libGVRdWV1ZSwgbmV3SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnN0YW5jZXMgaXMgYWxyZWFkeSBtYW5hZ2VkIGJ5IGFub3RoZXIgc3RvcmUsIHByaW50IGFuIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5ld0luc3RhbmNlLiRzdG9yZSAhPT0gc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBhbHJlYWR5IG1hbmFnZWQgYnkgYW5vdGhlciBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc3RhbmNlIGlzIGFscmVhZHkgbWFuYWdlZCBieSB0aGlzIHN0b3JlLCBkbyBub3RoaW5nIGJ1dCBsb2dnaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgYWxyZWFkeSBtYW5hZ2VkIGJ5IHRoZSBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgbmctcmVzb3VyY2Ugb2JqZWN0cyBhbmQgcHJvbWlzZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUHJvbWlzZUxpa2UobmV3SW5zdGFuY2VzKSB8fCBpc1Byb21pc2VMaWtlKG5ld0luc3RhbmNlcy4kcHJvbWlzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSBpc1Byb21pc2VMaWtlKG5ld0luc3RhbmNlcykgPyBuZXdJbnN0YW5jZXMgOiBuZXdJbnN0YW5jZXMuJHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZG9NYW5hZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKG5ld0luc3RhbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFN5bmNocm9ub3VzIGlmIHdlIGhhdmUgbm8gcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvTWFuYWdlKG5ld0luc3RhbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShuZXdJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEZvcmdldCAodW4tbWFuYWdlKSBnaXZlbiBpbnN0YW5jZXMuIFRoZSBpbnN0YW5jZXMgb2JqZWN0IG1heSBiZSBhIG5nLXJlc291cmNlIHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgKiBhIHByb21pc2UsIGEgbGlzdCBvZiBpbnN0YW5jZXMgb3IgYSBzaW5nbGUgaW5zdGFuY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBvbGRJbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmZvcmdldCA9IGZ1bmN0aW9uIChvbGRJbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb0ZvcmdldCA9IGZ1bmN0aW9uIChvbGRJbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6IEZvcmdldCBnaXZlbiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2VzLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgZm9yIHNpbmdsZSBpbnN0YW5jZXMgYnkgY29udmVydGluZyBpdCB0byBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KG9sZEluc3RhbmNlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkSW5zdGFuY2VzID0gW29sZEluc3RhbmNlc107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvbGRJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRJbnN0YW5jZSA9IG9sZEluc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQgeWV0LCBtYW5hZ2UgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEluc3RhbmNlLiRzdG9yZSA9PT0gc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzdG9yZSBhdHRyaWJ1dGUgZnJvbSB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvbGRJbnN0YW5jZS4kc3RvcmU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgaW5zdGFuY2UgZnJvbSB0aGUgbGlzdCBvZiBtYW5hZ2VkIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZShtYW5hZ2VkSW5zdGFuY2VzLCBvbGRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHZpc2libGVRdWV1ZSwgb2xkSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZShwZXJzaXN0UXVldWUsIG9sZEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVJlc291cmNlSW5zdGFuY2UocmVtb3ZlUXVldWUsIG9sZEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2VzIGlzIGFscmVhZHkgbWFuYWdlZCBieSBhbm90aGVyIHN0b3JlLCBwcmludCBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChvbGRJbnN0YW5jZS4kc3RvcmUgIT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgbWFuYWdlZCBieSBhbm90aGVyIHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zdGFuY2UgaXMgYWxyZWFkeSBtYW5hZ2VkIGJ5IHRoaXMgc3RvcmUsIGRvIG5vdGhpbmcgYnV0IGxvZ2dpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmU6ICdcIiArIHJlc291cmNlTmFtZSArIFwiJyBpbnN0YW5jZSBpcyBub3QgbWFuYWdlZC5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgbmctcmVzb3VyY2Ugb2JqZWN0cyBhbmQgcHJvbWlzZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUHJvbWlzZUxpa2Uob2xkSW5zdGFuY2VzKSB8fCBpc1Byb21pc2VMaWtlKG9sZEluc3RhbmNlcy4kcHJvbWlzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSBpc1Byb21pc2VMaWtlKG9sZEluc3RhbmNlcykgPyBvbGRJbnN0YW5jZXMgOiBvbGRJbnN0YW5jZXMuJHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZG9Gb3JnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKG9sZEluc3RhbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFN5bmNocm9ub3VzIGlmIHdlIGhhdmUgbm8gcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvRm9yZ2V0KG9sZEluc3RhbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShvbGRJbnN0YW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJldHVybnMgYSBuZXcgaW5zdGFuY2UgbWFuYWdlZCBieSB0aGUgc3RvcmUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYubmV3ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbmNlID0gcmVzb3VyY2UubmV3KHBhcmFtcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5tYW5hZ2UobmV3SW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUXVldWVzIGdpdmVuIGluc3RhbmNlIGZvciBwZXJzaXN0ZW5jZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucGVyc2lzdCA9IGZ1bmN0aW9uIChpbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBRdWV1ZSAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2VzIGZvciBwZXJzaXN0LlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShpbnN0YW5jZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMgPSBbaW5zdGFuY2VzXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGluc3RhbmNlc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluc3RhbmNlLiRzdG9yZSA9PT0gc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UocGVyc2lzdFF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkUmVzb3VyY2VJbnN0YW5jZSh2aXNpYmxlUXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHJlbW92ZVF1ZXVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVzb3VyY2VTdG9yZTogJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGlzIG5vdCBtYW5hZ2VkIGJ5IHRoaXMgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFF1ZXVlcyBnaXZlbiBpbnN0YW5jZSBmb3IgZGVsZXRpb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZSA9IGZ1bmN0aW9uIChpbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBRdWV1ZSAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2VzIGZvciByZW1vdmUuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KGluc3RhbmNlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcyA9IFtpbnN0YW5jZXNdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlID0gaW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5zdGFuY2UuJHN0b3JlID09PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZShwZXJzaXN0UXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVSZXNvdXJjZUluc3RhbmNlKHZpc2libGVRdWV1ZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc291cmNlSW5zdGFuY2UocmVtb3ZlUXVldWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXNvdXJjZVN0b3JlOiAnXCIgKyByZXNvdXJjZU5hbWUgKyBcIicgaW5zdGFuY2UgaXMgbm90IG1hbmFnZWQgYnkgdGhpcyBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ29tbWl0cyBjaGFuZ2VzIHRvIHRoZSBwYXJlbnQgc3RvcmVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5jb21taXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGEgcGFyZW50IHN0b3JlIGZpcnN0LiBXZSBjYW5ub3QgY29tbWl0IHRvIGEgcGFyZW50IHN0b3JlXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHBhcmVudCBzdG9yZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRTdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlc291cmNlU3RvcmU6IENhbm5vdCBjb21taXQgJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlcyBhcyB0aGVyZSBpcyBubyBwYXJlbnQgc3RvcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBDb21taXQgJ1wiICsgcmVzb3VyY2VOYW1lICsgXCInIGluc3RhbmNlIGNoYW5nZXMgdG8gcGFyZW50IHN0b3JlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDb21taXQgdGhlIHBlcnNpc3QgcXVldWUgdG8gdGhlIHBhcmVudCBzdG9yZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBlcnNpc3RRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRQZXJzaXN0SW5zdGFuY2UgPSBjb3B5KHBlcnNpc3RRdWV1ZVtpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UGVyc2lzdEluc3RhbmNlID0gcGFyZW50U3RvcmUuZ2V0QnlJbnN0YW5jZShjaGlsZFBlcnNpc3RJbnN0YW5jZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjaGlsZFBlcnNpc3RJbnN0YW5jZS4kc3RvcmU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50UGVyc2lzdEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UGVyc2lzdEluc3RhbmNlID0gY29weShjaGlsZFBlcnNpc3RJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50U3RvcmUubWFuYWdlKHBhcmVudFBlcnNpc3RJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShwYXJlbnRQZXJzaXN0SW5zdGFuY2UsIGNoaWxkUGVyc2lzdEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50U3RvcmUucGVyc2lzdChwYXJlbnRQZXJzaXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tbWl0IHRoZSByZW1vdmUgcXVldWUgdG8gdGhlIHBhcmVudCBzdG9yZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlbW92ZVF1ZXVlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFJlbW92ZUluc3RhbmNlID0gY29weShyZW1vdmVRdWV1ZVtpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UmVtb3ZlSW5zdGFuY2UgPSBwYXJlbnRTdG9yZS5nZXRCeUluc3RhbmNlKGNoaWxkUmVtb3ZlSW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2hpbGRSZW1vdmVJbnN0YW5jZS4kc3RvcmU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50UmVtb3ZlSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRSZW1vdmVJbnN0YW5jZSA9IGNvcHkoY2hpbGRSZW1vdmVJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50U3RvcmUubWFuYWdlKHBhcmVudFJlbW92ZUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHBhcmVudFJlbW92ZUluc3RhbmNlLCBjaGlsZFJlbW92ZUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50U3RvcmUucmVtb3ZlKHBhcmVudFJlbW92ZUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBFeGVjdXRlcyB0aGUgY2hhbmdlIHF1ZXVlIG9uIHRoaXMgYW4gYWxsIHJlbGF0ZWQgc3RvcmVzIGFuZCBjbGVhcnMgdGhlIGNoYW5nZSBxdWV1ZSBpZiBjbGVhckFmdGVyIGlzXG4gICAgICAgICAgICAgICAgICogc2V0IHRvIHRydWUgKGRlZmF1bHQpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2NsZWFyQWZ0ZXJdXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmV4ZWN1dGVBbGwgPSBmdW5jdGlvbiAoY2xlYXJBZnRlcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBgY2xlYXJBZnRlcmAgc2hvdWxkIGRlZmF1bHQgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjbGVhckFmdGVyID0gYW5ndWxhci5pc1VuZGVmaW5lZChjbGVhckFmdGVyKSB8fCAhIWNsZWFyQWZ0ZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgdGhlIHJlbGF0ZWQgc3RvcmVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlUmVsYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb24gPSByZWxhdGlvbnNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGVkU3RvcmUgPSByZWxhdGlvbi5nZXRSZWxhdGVkU3RvcmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGV4ZWN1dGlvbiBvZiB0aGUgcmVsYXRlZCBzdG9yZSB0byB0aGUgbGlzdCBvZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwcm9taXNlcyB0byByZXNvbHZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2gocmVsYXRlZFN0b3JlLmV4ZWN1dGVBbGwoY2xlYXJBZnRlcikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBzdG9yZSBpdHNlbGYsIHRoZW4gZXhlY3V0ZSB0aGUgcmVsYXRlZCBzdG9yZXMuIElmIGV2ZXJ5dGhpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gd2VudCB3ZWxsLCByZXNvbHZlIHRoZSByZXR1cm5lZCBwcm9taXNlLCBlbHNlIHJlamVjdCBpdC5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5leGVjdXRlKGNsZWFyQWZ0ZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihleGVjdXRlUmVsYXRlZClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGRlZmVyLnJlc29sdmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZGVmZXIucmVqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRXhlY3V0ZSB0aGUgY2hhbmdlIHF1ZXVlIGFuZCBjbGVhcnMgdGhlIGNoYW5nZSBxdWV1ZSBpZiBjbGVhckFmdGVyIGlzIHNldCB0byB0cnVlIChkZWZhdWx0KS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIFtjbGVhckFmdGVyXVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5leGVjdXRlID0gZnVuY3Rpb24gKGNsZWFyQWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYGNsZWFyQWZ0ZXJgIHNob3VsZCBkZWZhdWx0IHRvIHRydWVcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJBZnRlciA9IGFuZ3VsYXIuaXNVbmRlZmluZWQoY2xlYXJBZnRlcikgfHwgISFjbGVhckFmdGVyO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENhbm5vdCBleGVjdXRlIHdoZW4gYWxyZWFkeSBleGVjdXRpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4ZWN1dGlvblJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoXCJBbm90aGVyIGV4ZWN1dGlvbiBpcyBhbHJlYWR5IHJ1bm5pbmcuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBwYXJlbnQgc3RvcmUgcmFpc2UgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIkV4ZWN1dGluZyB0aGUgc3RvcmUgaXMgb25seSBwb3NzaWJsZSBvbiB0aGUgdG9wbW9zdCBzdG9yZVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0aW9uIHN0YXJ0ZWRcbiAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uUnVubmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogU2V0cyB0aGUgcnVubmluZyBmbGFnIHRvIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcmVhc29uXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVFcnJvciA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRpb25SdW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIENhbGxzIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgd2l0aCBnaXZlbiBpdGVtIGFzIHBhcmFtZXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbExpc3RlbmVycyA9IGZ1bmN0aW9uIChpdGVtLCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0oaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zUmVtb3ZlID0gZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNbaV0uaGFuZGxlUmVtb3ZlKHBrVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1VwZGF0ZSA9IGZ1bmN0aW9uIChvbGRQa1ZhbHVlLCBuZXdQa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zW2ldLmhhbmRsZVVwZGF0ZShvbGRQa1ZhbHVlLCBuZXdQa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIGEgc2luZ2xlIFJFU1QgQVBJIGNhbGwgb24gdGhlIGdpdmVuIGl0ZW0gd2l0aCB0aGUgZ2l2ZW4gZnVuY3Rpb24uIENhbGxzIHRoZSBnaXZlblxuICAgICAgICAgICAgICAgICAgICAgICAgICogYmVmb3JlIGFuZCBhZnRlciBsaXN0ZW5lcnMgYW5kIHJlc29sdmVzIHRoZSBnaXZlbiBkZWZlciBhZnRlciBhbGwgdGhpcyBpcyBkb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBleGVjRm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBkZWZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGJlZm9yZUxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIGFmdGVyTGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaXNSZW1vdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVNpbmdsZSA9IGZ1bmN0aW9uIChpdGVtLCBleGVjRm4sIGJlZm9yZUxpc3RlbmVycywgYWZ0ZXJMaXN0ZW5lcnMsIGRlZmVyLCBpc1JlbW92ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIGJlZm9yZSBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsTGlzdGVuZXJzKGl0ZW0sIGJlZm9yZUxpc3RlbmVycyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBSRVNUIEFQSSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY0ZuKHt9LCBpdGVtKS4kcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmdldCByZWZlcmVuY2luZyBpbnN0YW5jZXMgb24gcmVsYXRlZCBzdG9yZXMgaWYgdGhpcyB3YXMgYSBzdWNjZXNzZnVsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgb24gdGhlIFJFU1QgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZW1vdmUgJiYgaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1JlbW92ZShpdGVtW3Jlc291cmNlLmdldFBrQXR0cigpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZXNwb25zZSBjb250YWlucyB0aGUgc2F2ZWQgb2JqZWN0ICh3aXRoIHRoZSBQSyBmcm9tIHRoZSBSRVNUIEFQSSkgdGhlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHRoZSBuZXcgUEsgb24gdGhlIGl0ZW0uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhW3Jlc291cmNlLmdldFBrQXR0cigpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRQa1ZhbHVlID0gaXRlbSA/IGl0ZW1bcmVzb3VyY2UuZ2V0UGtBdHRyKCldIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UGtWYWx1ZSA9IHJlc3BvbnNlLmRhdGEgPyByZXNwb25zZS5kYXRhW3Jlc291cmNlLmdldFBrQXR0cigpXSA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIEZLIHZhbHVlcyBvbiByZWZlcmVuY2luZyBpbnN0YW5jZXMgb24gcmVsYXRlZCBzdG9yZXMgaWYgdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhcyBhIHN1Y2Nlc3NmdWwgaW5zZXJ0IG9yIHVwZGF0ZSBvbiB0aGUgUkVTVCBBUElcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1VwZGF0ZShvbGRQa1ZhbHVlLCBuZXdQa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtW3Jlc291cmNlLmdldFBrQXR0cigpXSA9IG5ld1BrVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZW4gY2FsbCB0aGUgYWZ0ZXIgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsTGlzdGVuZXJzKGl0ZW0sIGFmdGVyTGlzdGVuZXJzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQW5kIHJlc29sdmUgdGhlIHByb21pc2Ugd2l0aCB0aGUgaXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGRlZmVyLnJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSByZW1vdmUgcXVldWUuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgYXMgc29vbiBhcyBhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFJFU1QgQVBJIGNhbGxzIGFyZSBkb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZVJlbW92ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlID0gc2VsZi5nZXRSZW1vdmVRdWV1ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gcXVldWVbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSBub24tcGhhbnRvbSBlbnRyaWVzIHNob3VsZCBiZSByZW1vdmVkIChwaGFudG9tcyBkb24ndCBleGlzdCBhbnl3YXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXRlbS4kaXNQaGFudG9tKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChkZWZlci5wcm9taXNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgc2luZ2xlIFJFU1QgQVBJIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVTaW5nbGUoaXRlbSwgcmVzb3VyY2UucmVtb3ZlLCBiZWZvcmVSZW1vdmVMaXN0ZW5lcnMsIGFmdGVyUmVtb3ZlTGlzdGVuZXJzLCBkZWZlciwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogRXhlY3V0ZXMgdGhlIHVwZGF0ZSBxdWV1ZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBhcyBzb29uIGFzIGFsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICogUkVTVCBBUEkgY2FsbHMgYXJlIGRvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlVXBkYXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUgPSBzZWxmLmdldFVwZGF0ZVF1ZXVlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIG92ZXIgdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBxdWV1ZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGRlZmVyLnByb21pc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIHNpbmdsZSBSRVNUIEFQSSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVTaW5nbGUoaXRlbSwgcmVzb3VyY2UudXBkYXRlLCBiZWZvcmVQZXJzaXN0TGlzdGVuZXJzLCBhZnRlclBlcnNpc3RMaXN0ZW5lcnMsIGRlZmVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEV4ZWN1dGVzIHRoZSBzYXZlIChpbnNlcnQpIHF1ZXVlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIGFzIHNvb24gYXMgYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBSRVNUIEFQSSBjYWxscyBhcmUgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVTYXZlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUgPSBzZWxmLmdldFNhdmVRdWV1ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gcXVldWVbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChkZWZlci5wcm9taXNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBzaW5nbGUgUkVTVCBBUEkgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlU2luZ2xlKGl0ZW0sIHJlc291cmNlLnNhdmUsIGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMsIGFmdGVyUGVyc2lzdExpc3RlbmVycywgZGVmZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogQ2xlYXJzIHRoZSBjaGFuZ2UgcXVldWVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xlYXJBZnRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJzaXN0UXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGVjdXRpb24gZmluaXNoZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRpb25SdW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIFJFU1QgQVBJIGNhbGwgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgJHEud2hlbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihleGVjdXRlUmVtb3ZlcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGV4ZWN1dGVVcGRhdGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXhlY3V0ZVNhdmVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY2xlYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihkZWZlci5yZXNvbHZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGhhbmRsZUVycm9yKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBjaGlsZCBzdG9yZSBmcm9tIHRoZSBjdXJyZW50IHN0b3JlLiBUaGlzIHN0b3JlIGNhbiBtYWtlIGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgKiB0byBpdCdzIG1hbmFnZWQgaW5zdGFuY2VzIGFuZCBpdCB3aWxsIG5vdCBhZmZlY3QgdGhlIGN1cnJlbnQgc3RvcmVzXG4gICAgICAgICAgICAgICAgICogaW5zdGFuY2VzIHVudGlsIHRoZSBjaGlsZCBzdG9yZSBjb21taXRzLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2luc3RhbmNlc11cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtSZXNvdXJjZVN0b3JlfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuY3JlYXRlQ2hpbGRTdG9yZSA9IGZ1bmN0aW9uIChpbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzID0gaW5zdGFuY2VzIHx8IG1hbmFnZWRJbnN0YW5jZXM7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFN0b3JlTWFuYWdlZEluc3RhbmNlcyA9IGNvcHkoaW5zdGFuY2VzKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc291cmNlU3RvcmUocmVzb3VyY2UsIGNoaWxkU3RvcmVNYW5hZ2VkSW5zdGFuY2VzLCBzZWxmKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQWRkcyBhIHJlbGF0aW9uIHRvIGFub3RoZXIgc3RvcmUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtSZXNvdXJjZVN0b3JlUmVsYXRpb259XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5jcmVhdGVSZWxhdGlvbiA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gYW5ndWxhci5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRlZFN0b3JlOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmtBdHRyOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25EZWxldGU6ICdmb3JnZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25VcGRhdGU6ICd1cGRhdGUnXG4gICAgICAgICAgICAgICAgICAgIH0sIGNvbmZpZyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbiA9IG5ldyBSZXNvdXJjZVN0b3JlUmVsYXRpb24oc2VsZiwgY29uZmlnLnJlbGF0ZWRTdG9yZSwgY29uZmlnLmZrQXR0ciwgY29uZmlnLm9uVXBkYXRlLCBjb25maWcub25EZWxldGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aW9ucy5wdXNoKHJlbGF0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVsYXRpb247XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSByZWxhdGlvbiBmcm9tIHRoZSBzdG9yZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHJlbGF0aW9uXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVSZWxhdGlvbiA9IGZ1bmN0aW9uIChyZWxhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uSW5kZXggPSByZWxhdGlvbnMuaW5kZXhPZihyZWxhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbkZvdW5kID0gcmVsYXRpb25JbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGF0aW9uRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9ucy5zcGxpY2UocmVsYXRpb25JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgbWFuYWdlZCBpbnN0YW5jZSBmcm9tIHRoZSBzdG9yZSB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuXG4gICAgICAgICAgICAgICAgICogUEsgYXR0cmlidXRlIHZhbHVlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdHx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRCeVBrID0gZnVuY3Rpb24gKHBrVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlLmdldEluc3RhbmNlQnlQayhtYW5hZ2VkSW5zdGFuY2VzLCBwa1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgbWFuYWdlZCBpbnN0YW5jZSBmcm9tIHRoZSBzdG9yZSB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuXG4gICAgICAgICAgICAgICAgICogaW5zdGFuY2UgKHdoaWNoIG1pZ2h0IGJ5IGFuIGNvcHkgdGhhdCBpcyBub3QgbWFuYWdlZCBvciBtYW5hZ2VkIGJ5XG4gICAgICAgICAgICAgICAgICogYW5vdGhlciBzdG9yZSkuIFRoZSBpbnN0YW5jZXMgYXJlIG1hdGNoZWQgYnkgdGhlaXIgUEsgYXR0cmlidXRlLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0QnlJbnN0YW5jZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBrVmFsdWUgPSBpbnN0YW5jZSA/IGluc3RhbmNlW3Jlc291cmNlLmdldFBrQXR0cigpXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5nZXRCeVBrKHBrVmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgdmlzaWJsZSBmb3IgdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0TWFuYWdlZEluc3RhbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hbmFnZWRJbnN0YW5jZXMuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyBhIGxpc3Qgb2YgaW5zdGFuY2VzIHZpc2libGUgZm9yIHRoZSB1c2VyLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFZpc2libGVRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpc2libGVRdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgbWFya2VkIGZvciBwZXJzaXN0LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFBlcnNpc3RRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBlcnNpc3RRdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgbWFya2VkIGZvciByZW1vdmUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0UmVtb3ZlUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVRdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIGEgbGlzdCBvZiBpbnN0YW5jZXMgbWFya2VkIGZvciBzYXZlIChpbnNlcnQpLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdldFNhdmVRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJQaGFudG9tID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRpc1BoYW50b20oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBlcnNpc3RRdWV1ZS5maWx0ZXIoZmlsdGVyUGhhbnRvbSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdldHMgYSBsaXN0IG9mIGluc3RhbmNlcyBtYXJrZWQgZm9yIHVwZGF0ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRVcGRhdGVRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJOb25QaGFudG9tID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFpbnN0YW5jZS4kaXNQaGFudG9tKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwZXJzaXN0UXVldWUuZmlsdGVyKGZpbHRlck5vblBoYW50b20pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBtYW5hZ2VkIHJlc291cmNlIHNlcnZpY2UuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRSZXNvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBZGRzIGEgYmVmb3JlLXBlcnNpc3QgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkQmVmb3JlUGVyc2lzdExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZm9yZVBlcnNpc3RMaXN0ZW5lcnMucHVzaChmbik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgYSBiZWZvcmUtcGVyc2lzdCBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVCZWZvcmVQZXJzaXN0TGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluZGV4ID0gYmVmb3JlUGVyc2lzdExpc3RlbmVycy5pbmRleE9mKGZuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuRm91bmQgPSBmbkluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZm5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVmb3JlUGVyc2lzdExpc3RlbmVycy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQWRkcyBhIGFmdGVyLXBlcnNpc3QgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkQWZ0ZXJQZXJzaXN0TGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJQZXJzaXN0TGlzdGVuZXJzLnB1c2goZm4pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmVzIGEgYWZ0ZXItcGVyc2lzdCBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBZnRlclBlcnNpc3RMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5kZXggPSBhZnRlclBlcnNpc3RMaXN0ZW5lcnMuaW5kZXhPZihmbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkZvdW5kID0gZm5JbmRleCAhPT0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyUGVyc2lzdExpc3RlbmVycy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhIGJlZm9yZS1yZW1vdmUgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlQmVmb3JlUmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluZGV4ID0gYmVmb3JlUmVtb3ZlTGlzdGVuZXJzLmluZGV4T2YoZm4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm5Gb3VuZCA9IGZuSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZWZvcmVSZW1vdmVMaXN0ZW5lcnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFkZHMgYSBhZnRlci1yZW1vdmUgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBmblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkQWZ0ZXJSZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICBhZnRlclJlbW92ZUxpc3RlbmVycy5wdXNoKGZuKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlcyBhIGFmdGVyLXJlbW92ZSBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGZuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVBZnRlclJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5JbmRleCA9IGFmdGVyUmVtb3ZlTGlzdGVuZXJzLmluZGV4T2YoZm4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm5Gb3VuZCA9IGZuSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZnRlclJlbW92ZUxpc3RlbmVycy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQWRkcyB0aGUgZ2l2ZW4gaW5zdGFuY2UgdG8gdGhlIGdpdmVuIGxpc3Qgb2YgaW5zdGFuY2VzLiBEb2VzIG5vdGhpbmcgaWYgdGhlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogaXMgYWxyZWFkeSBpbiB0aGUgbGlzdCBvZiBpbnN0YW5jZXMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBhZGRSZXNvdXJjZUluc3RhbmNlIChpbnN0YW5jZXMsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZXMgPSByZXNvdXJjZS5maWx0ZXJJbnN0YW5jZXNCeUF0dHIoaW5zdGFuY2VzLCByZXNvdXJjZS5nZXRQa0F0dHIoKSwgaW5zdGFuY2VbcmVzb3VyY2UuZ2V0UGtBdHRyKCldKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoISFtYXRjaGluZ0luc3RhbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0Y2hpbmdJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZUluZGV4ID0gaW5zdGFuY2VzLmluZGV4T2YobWF0Y2hpbmdJbnN0YW5jZXNbaV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0luc3RhbmNlRm91bmQgPSBtYXRjaGluZ0luc3RhbmNlSW5kZXggIT09IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nSW5zdGFuY2VGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMuc3BsaWNlKG1hdGNoaW5nSW5zdGFuY2VJbmRleCwgMSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJlbW92ZXMgdGhlIGdpdmVuIGluc3RhbmNlIGZyb20gdGhlIGdpdmVuIGxpc3Qgb2YgaW5zdGFuY2VzLiBEb2VzIG5vdGhpbmcgaWYgdGhlIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogaXMgbm90IGluIHRoZSBsaXN0IG9mIGluc3RhbmNlcy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlUmVzb3VyY2VJbnN0YW5jZSAoaW5zdGFuY2VzLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VzID0gcmVzb3VyY2UuZmlsdGVySW5zdGFuY2VzQnlBdHRyKGluc3RhbmNlcywgcmVzb3VyY2UuZ2V0UGtBdHRyKCksIGluc3RhbmNlW3Jlc291cmNlLmdldFBrQXR0cigpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhbWF0Y2hpbmdJbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoaW5nSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nSW5zdGFuY2VJbmRleCA9IGluc3RhbmNlcy5pbmRleE9mKG1hdGNoaW5nSW5zdGFuY2VzW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdJbnN0YW5jZUZvdW5kID0gbWF0Y2hpbmdJbnN0YW5jZUluZGV4ICE9PSAtMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZ0luc3RhbmNlRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzLnNwbGljZShtYXRjaGluZ0luc3RhbmNlSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgY2FuIGJlIHRyZWF0ZWQgYXMgYW4gcHJvbWlzZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gb2JqXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Knxib29sZWFufVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzUHJvbWlzZUxpa2UgKG9iaikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihvYmoudGhlbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUG9wdWxhdGVzIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QgYGRzdGAgYnkgY29weWluZyB0aGUgbm9uLXByaXZhdGUgZGF0YSBmcm9tIGBzcmNgIG9iamVjdC4gVGhlIGRhdGFcbiAgICAgICAgICAgICAgICAgKiBvbiB0aGUgYGRzdGAgb2JqZWN0IHdpbGwgYmUgYSBkZWVwIGNvcHkgb2YgdGhlIGRhdGEgb24gdGhlIGBzcmNgLiBUaGlzIGZ1bmN0aW9uIHdpbGwgbm90IGNvcHlcbiAgICAgICAgICAgICAgICAgKiBhdHRyaWJ1dGVzIG9mIHRoZSBgc3JjYCB3aG9zZSBuYW1lcyBzdGFydCB3aXRoIFwiJFwiLiBUaGVzZSBhdHRyaWJ1dGVzIGFyZSBjb25zaWRlcmVkIHByaXZhdGUuIFRoZVxuICAgICAgICAgICAgICAgICAqIG1ldGhvZCB3aWxsIGFsc28ga2VlcCB0aGUgcHJpdmF0ZSBhdHRyaWJ1dGVzIG9mIHRoZSBgZHN0YC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlXG4gICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gZHN0IHtVbmRlZmluZWR8T2JqZWN0fEFycmF5fSBEZXN0aW5hdGlvbiBvYmplY3RcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gc3JjIHtPYmplY3R8QXJyYXl9IFNvdXJjZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gW2tlZXBNaXNzaW5nXSBib29sZWFuIEtlZXAgYXR0cmlidXRlcyBvbiBkc3QgdGhhdCBhcmUgbm90IHByZXNlbnQgb24gc3JjXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBwb3B1bGF0ZSAoZHN0LCBzcmMsIGtlZXBNaXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGtlZXBNaXNzaW5nIGRlZmF1bHRzIHRvIHRydWVcbiAgICAgICAgICAgICAgICAgICAga2VlcE1pc3NpbmcgPSBhbmd1bGFyLmlzVW5kZWZpbmVkKGtlZXBNaXNzaW5nKSA/IHRydWUgOiAhIWtlZXBNaXNzaW5nO1xuICAgICAgICAgICAgICAgICAgICBkc3QgPSBkc3QgfHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlc2VydmUgPSAhIWRzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXNlcnZlZE9iamVjdHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgKiBBcyB3ZSBkbyByZW1vdmUgYWxsIFwicHJpdmF0ZVwiIHByb3BlcnRpZXMgZnJvbSB0aGUgc291cmNlLCBzbyB0aGV5IGFyZSBub3QgY29waWVkXG4gICAgICAgICAgICAgICAgICAgICAqIHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QsIHdlIG1ha2UgYSBjb3B5IG9mIHRoZSBzb3VyY2UgZmlyc3QuIFdlIGRvIG5vdCB3YW50IHRvXG4gICAgICAgICAgICAgICAgICAgICAqIG1vZGlmeSB0aGUgYWN0dWFsIHNvdXJjZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBzcmMgPSBhbmd1bGFyLmNvcHkoc3JjKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkgJiYga2V5WzBdID09PSAnJCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc3JjW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgKiBPbmx5IHByZXNlcnZlIGlmIHdlIGdvdCBhIGRlc3RpbmF0aW9uIG9iamVjdC4gU2F2ZSBcInByaXZhdGVcIiBvYmplY3Qga2V5cyBvZiBkZXN0aW5hdGlvbiBiZWZvcmVcbiAgICAgICAgICAgICAgICAgICAgICogY29weWluZyB0aGUgc291cmNlIG9iamVjdCBvdmVyIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuIFdlIHJlc3RvcmUgdGhlc2UgcHJvcGVydGllcyBhZnRlcndhcmRzLlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXNlcnZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBkc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8ga2VlcCBwcml2YXRlIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleVswXSA9PT0gJyQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZWRPYmplY3RzW2tleV0gPSBkc3Rba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIGF0dHJpYnV0ZSBpZiBub3QgcHJlc2VudCBvbiBzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoa2VlcE1pc3NpbmcgJiYgIXNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZWRPYmplY3RzW2tleV0gPSBkc3Rba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGRvIHRoZSBhY3R1YWwgY29weVxuICAgICAgICAgICAgICAgICAgICBkc3QgPSBhbmd1bGFyLmNvcHkoc3JjLCBkc3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAqIE5vdyB3ZSBjYW4gcmVzdG9yZSB0aGUgcHJlc2VydmVkIGRhdGEgb24gdGhlIGRlc3RpbmF0aW9uIG9iamVjdCBhZ2Fpbi5cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmVzZXJ2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gcHJlc2VydmVkT2JqZWN0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmVzZXJ2ZWRPYmplY3RzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHN0W2tleV0gPSBwcmVzZXJ2ZWRPYmplY3RzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDb3BpZXMgdGhlIHNvdXJjZSBvYmplY3QgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdCAob3IgYXJyYXkpLiBLZWVwcyBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogYXR0cmlidXRlcyBvbiB0aGUgYGRzdGAgb2JqZWN0IChhdHRyaWJ1dGVzIHN0YXJ0aW5nIHdpdGggJCBhcmUgcHJpdmF0ZSkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHNyY1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbZHN0XVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gY29weSAoc3JjLCBkc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgYXJlIHdvcmtpbmcgb24gYW4gYXJyYXksIGNvcHkgZWFjaCBpbnN0YW5jZSBvZiB0aGUgYXJyYXkgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGRzdC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShzcmMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QgPSBhbmd1bGFyLmlzQXJyYXkoZHN0KSA/IGRzdCA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0Lmxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHN0LnB1c2gocG9wdWxhdGUobnVsbCwgc3JjW2ldLCBmYWxzZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGVsc2Ugd2UgY2FuIGp1c3QgY29weSB0aGUgc3JjIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QgPSBwb3B1bGF0ZShkc3QsIHNyYywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBNZXJnZXMgdGhlIHNvdXJjZSBvYmplY3QgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdCAob3IgYXJyYXkpLiBLZWVwcyBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogYXR0cmlidXRlcyBvbiB0aGUgYGRzdGAgb2JqZWN0IChhdHRyaWJ1dGVzIHN0YXJ0aW5nIHdpdGggJCBhcmUgcHJpdmF0ZSkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgUmVzb3VyY2VTdG9yZVxuICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHNyY1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBbZHN0XVxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gbWVyZ2UgKHNyYywgZHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGFyZSB3b3JraW5nIG9uIGFuIGFycmF5LCBjb3B5IGVhY2ggaW5zdGFuY2Ugb2YgdGhlIGFycmF5IHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBkc3QuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoc3JjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHN0ID0gYW5ndWxhci5pc0FycmF5KGRzdCkgPyBkc3QgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRzdC5sZW5ndGggPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNyYy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdC5wdXNoKHBvcHVsYXRlKG51bGwsIHNyY1tpXSwgdHJ1ZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGVsc2Ugd2UgY2FuIGp1c3QgY29weSB0aGUgc3JjIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkc3QgPSBwb3B1bGF0ZShkc3QsIHNyYywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHN0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEluaXRpYWxpemVzIHRoZSBzdG9yZSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVcbiAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkSW5zdGFuY2VzID0gbWFuYWdlZEluc3RhbmNlcyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50U3RvcmUgPSBwYXJlbnRTdG9yZSB8fCBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFuYWdlZCA9IHNlbGYubWFuYWdlKG1hbmFnZWRJbnN0YW5jZXMpLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIE1hcHMgaW5zdGFuY2VzIHRvIGEgbGlzdCBvZiBQS3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICogQHJldHVybiB7Knx1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcFBrID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlID8gU3RyaW5nKGluc3RhbmNlW3Jlc291cmNlLmdldFBrQXR0cigpXSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIEZpbHRlcnMgaW5zdGFuY2VzIHRvIGdpdmVuIGxpc3Qgb2YgUEtzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGtzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyUGtzID0gZnVuY3Rpb24gKHBrcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlID8gcGtzLmluZGV4T2YoU3RyaW5nKGluc3RhbmNlW3Jlc291cmNlLmdldFBrQXR0cigpXSkpICE9PSAtMSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBxdWV1ZXMgd2l0aCB0aGUgc3RhdGUgb2YgdGhlIHBhcmVudCBzdG9yZSwgaWYgdGhlcmUgaXMgYSBwYXJlbnQgc3RvcmUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRTdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFuYWdlZC50aGVuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlOiBDb3B5IHN0YXRlIGZyb20gcGFyZW50IHN0b3JlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFZpc2libGVRdWV1ZVBrcyA9IHBhcmVudFN0b3JlLmdldFZpc2libGVRdWV1ZSgpLm1hcChtYXBQayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRQZXJzaXN0UXVldWVQa3MgPSBwYXJlbnRTdG9yZS5nZXRQZXJzaXN0UXVldWUoKS5tYXAobWFwUGspLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UmVtb3ZlUXVldWVQa3MgPSBwYXJlbnRTdG9yZS5nZXRSZW1vdmVRdWV1ZSgpLm1hcChtYXBQayk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgdmlzaWJsZSwgcGVyc2lzdCBhbmQgcmVtb3ZlIHF1ZXVlIHdpdGggdGhlIHN0YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZyb20gdGhlIHBhcmVudCBzdG9yZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZVF1ZXVlID0gbWFuYWdlZEluc3RhbmNlcy5maWx0ZXIoZmlsdGVyUGtzKHBhcmVudFZpc2libGVRdWV1ZVBrcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJzaXN0UXVldWUgPSBtYW5hZ2VkSW5zdGFuY2VzLmZpbHRlcihmaWx0ZXJQa3MocGFyZW50UGVyc2lzdFF1ZXVlUGtzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVF1ZXVlID0gbWFuYWdlZEluc3RhbmNlcy5maWx0ZXIoZmlsdGVyUGtzKHBhcmVudFJlbW92ZVF1ZXVlUGtzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHN0b3JlXG4gICAgICAgICAgICAgICAgaW5pdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENvbnN0cnVjdG9yIGNsYXNzIGZvciBhIHJlbGF0aW9uIGJldHdlZW4gdHdvIHN0b3Jlcy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbmFtZSBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAqIEBuZ2RvYyBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICogQHBhcmFtIHN0b3JlXG4gICAgICAgICAgICAgKiBAcGFyYW0gcmVsYXRlZFN0b3JlXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmtBdHRyXG4gICAgICAgICAgICAgKiBAcGFyYW0gb25VcGRhdGVcbiAgICAgICAgICAgICAqIEBwYXJhbSBvblJlbW92ZVxuICAgICAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIFJlc291cmNlU3RvcmVSZWxhdGlvbiAoc3RvcmUsIHJlbGF0ZWRTdG9yZSwgZmtBdHRyLCBvblVwZGF0ZSwgb25SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEltcGxlbWVudGF0aW9uIG9mIHByZS1kZWZpbmVkIHVwZGF0ZSBiZWhhdmlvdXJzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvblVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd1cGRhdGUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgb25VcGRhdGUgPSBmdW5jdGlvbiAocmVmZXJlbmNpbmdTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgb2xkUmVmZXJlbmNlZEluc3RhbmNlUGssIG5ld1JlZmVyZW5jZWRJbnN0YW5jZVBrLCBma0F0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmVSZWxhdGlvbjogU2V0IHJlZmVyZW5jZSB0byAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBpbnN0YW5jZSBmcm9tICdcIiArIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrICsgXCInIHRvICdcIiArIG5ld1JlZmVyZW5jZWRJbnN0YW5jZVBrICsgXCInLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2VbZmtBdHRyXSA9IG5ld1JlZmVyZW5jZWRJbnN0YW5jZVBrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdudWxsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlID0gZnVuY3Rpb24gKHJlZmVyZW5jaW5nU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrLCBuZXdSZWZlcmVuY2VkSW5zdGFuY2VQaywgZmtBdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNvdXJjZVN0b3JlUmVsYXRpb246IFNldCByZWZlcmVuY2UgdG8gJ1wiICsgcmVsYXRlZFN0b3JlLmdldFJlc291cmNlKCkuZ2V0UmVzb3VyY2VOYW1lKCkgKyBcIicgaW5zdGFuY2UgZnJvbSAnXCIgKyBvbGRSZWZlcmVuY2VkSW5zdGFuY2VQayArIFwiJyB0byBudWxsLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2VbZmtBdHRyXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiBwcmUtZGVmaW5lZCByZW1vdmUgYmVoYXZpb3Vyc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHN3aXRjaCAob25SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZm9yZ2V0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVtb3ZlID0gZnVuY3Rpb24gKHJlZmVyZW5jaW5nU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrLCBma0F0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmVSZWxhdGlvbjogRm9yZ2V0ICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIGluc3RhbmNlICdcIiArIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrICsgXCInIHJlZmVyZW5jaW5nIGluc3RhbmNlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nU3RvcmUuZm9yZ2V0KHJlZmVyZW5jaW5nSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdudWxsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVtb3ZlID0gZnVuY3Rpb24gKHJlZmVyZW5jaW5nU3RvcmUsIHJlZmVyZW5jaW5nSW5zdGFuY2UsIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrLCBma0F0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmVSZWxhdGlvbjogU2V0IHJlZmVyZW5jZSB0byAnXCIgKyByZWxhdGVkU3RvcmUuZ2V0UmVzb3VyY2UoKS5nZXRSZXNvdXJjZU5hbWUoKSArIFwiJyBpbnN0YW5jZSBmcm9tICdcIiArIG9sZFJlZmVyZW5jZWRJbnN0YW5jZVBrICsgXCInIHRvIG51bGwuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNpbmdJbnN0YW5jZVtma0F0dHJdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBzdG9yZSB0aGUgcmVsYXRpb24gaXMgY29uZmlndXJlZCBvbi5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0U3RvcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogR2V0cyB0aGUgc3RvcmUgdGhlIGNvbmZpZ3VyZWQgc3RvcmUgaXMgcmVsYXRlZCBvbi5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuZ2V0UmVsYXRlZFN0b3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVsYXRlZFN0b3JlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBHZXRzIHRoZSBGSyBhdHRyaWJ1dGUgbmFtZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRGa0F0dHIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBma0F0dHI7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFVwZGF0ZXMgdGhlIHJlZmVyZW5jaW5nIGluc3RhbmNlcyB3aGVyZSB0aGUgZmtBdHRyIGhhcyB0aGUgZ2l2ZW4gb2xkXG4gICAgICAgICAgICAgICAgICogdmFsdWUgdG8gdGhlIGdpdmVuIG5ldyB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVN0b3JlUmVsYXRpb25cbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gb2xkUGtWYWx1ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBuZXdQa1ZhbHVlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5oYW5kbGVVcGRhdGUgPSBmdW5jdGlvbiAob2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmVSZWxhdGlvbjogSGFuZGxlIHVwZGF0ZSBvZiByZWZlcmVuY2VkIGluc3RhbmNlIG9uICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIHN0b3JlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2VzID0gcmVsYXRlZFN0b3JlLmdldE1hbmFnZWRJbnN0YW5jZXMoKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZmVyZW5jaW5nSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlID0gcmVmZXJlbmNpbmdJbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWZlcmVuY2luZ0luc3RhbmNlICYmIHJlZmVyZW5jaW5nSW5zdGFuY2VbZmtBdHRyXSA9PSBvbGRQa1ZhbHVlICYmIG9sZFBrVmFsdWUgIT0gbmV3UGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlKHJlbGF0ZWRTdG9yZSwgcmVmZXJlbmNpbmdJbnN0YW5jZSwgb2xkUGtWYWx1ZSwgbmV3UGtWYWx1ZSwgZmtBdHRyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBMZXRzIHRoZSByZWxhdGVkIHN0b3JlIGZvcmdldCBzdGFsZSByZWZlcmVuY2luZyBpbnN0YW5jZXMsIGUuZy4gYmVjYXVzZSB0aGVcbiAgICAgICAgICAgICAgICAgKiByZWZlcmVuY2VkIGluc3RhbmNlIHdhcyBkZWxldGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQG1lbWJlck9mIFJlc291cmNlU3RvcmVSZWxhdGlvblxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwa1ZhbHVlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2VsZi5oYW5kbGVSZW1vdmUgPSBmdW5jdGlvbiAocGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc291cmNlU3RvcmVSZWxhdGlvbjogSGFuZGxlIHJlbW92ZSBvZiByZWZlcmVuY2VkIGluc3RhbmNlIG9uICdcIiArIHJlbGF0ZWRTdG9yZS5nZXRSZXNvdXJjZSgpLmdldFJlc291cmNlTmFtZSgpICsgXCInIHN0b3JlLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jaW5nSW5zdGFuY2VzID0gcmVsYXRlZFN0b3JlLmdldE1hbmFnZWRJbnN0YW5jZXMoKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZmVyZW5jaW5nSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2luZ0luc3RhbmNlID0gcmVmZXJlbmNpbmdJbnN0YW5jZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWZlcmVuY2luZ0luc3RhbmNlICYmIHJlZmVyZW5jaW5nSW5zdGFuY2VbZmtBdHRyXSA9PSBwa1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25SZW1vdmUocmVsYXRlZFN0b3JlLCByZWZlcmVuY2luZ0luc3RhbmNlLCBwa1ZhbHVlLCBma0F0dHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn0pKCk7XG4iLCIvKipcbiAqIEFuZ3VsYXIgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZVxuICogQ29weXJpZ2h0IDIwMTYgQW5kcmVhcyBTdG9ja2VyXG4gKiBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZFxuICogZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4gKiByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGVcbiAqIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEVcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuICogT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXJcbiAgICAgICAgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ25nUmVzb3VyY2VGYWN0b3J5Jyk7XG5cbiAgICAvKipcbiAgICAgKiBGYWN0b3J5IHNlcnZpY2UgdG8gZ2VuZXJhdGUgbmV3IHJlc291cmNlIHBoYW50b20gaWQgZ2VuZXJhdG9ycy5cbiAgICAgKlxuICAgICAqIEBuYW1lIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2VcbiAgICAgKiBAbmdkb2Mgc2VydmljZVxuICAgICAqL1xuICAgIG1vZHVsZS5zZXJ2aWNlKCdSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJ25nSW5qZWN0JztcblxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBwaGFudG9tIGlkIGdlbmVyYXRvciB3aXRoIHRoZSBnaXZlbiBjb25maWd1cmF0aW9uLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZW1iZXJPZiBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlXG4gICAgICAgICAgICAgKiBAcGFyYW0gY29uZmlnXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtSZXNvdXJjZVBoYW50b21JZEZhY3Rvcnl9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNlbGYuY3JlYXRlUGhhbnRvbUlkRmFjdG9yeSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBhbmd1bGFyLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICAgICAgICAgIGlzOiBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgICAgICB9LCBjb25maWcpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnkoY29uZmlnLmdlbmVyYXRlLCBjb25maWcuaXMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgYSBwaGFudG9tIGlkIGdlbmVyYXRlLiBUYWtlcyBhIGZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIHRoZSBQSywgYW5kIGFcbiAgICAgICAgICAgICAqIGZ1bmN0aW9ucyB0aGF0IGNoZWNrcyBpZiB0aGUgZ2l2ZW4gUEsgaXMgYSBwaGFudG9tIFBLLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBuYW1lIFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVxuICAgICAgICAgICAgICogQG5nZG9jIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgKiBAcGFyYW0gZ2VuZXJhdGVGblxuICAgICAgICAgICAgICogQHBhcmFtIGlzUGhhbnRvbUZuXG4gICAgICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5IChnZW5lcmF0ZUZuLCBpc1BoYW50b21Gbikge1xuICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEdlbmVyYXRlcyBhIG5ldyBwaGFudG9tIFBLIHZhbHVlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyb2YgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzZWxmLmdlbmVyYXRlID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUZuKGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBQSyB2YWx1ZSBvbiB0aGUgZ2l2ZW4gaW5zdGFuY2UgaXMgYSBwaGFudG9tIFBLIHZhbHVlXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyb2YgUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5XG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBrVmFsdWVcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNlbGYuaXNQaGFudG9tID0gZnVuY3Rpb24gKHBrVmFsdWUsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpc1BoYW50b21Gbihwa1ZhbHVlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvKipcbiAgICAgKiBSZXNvdXJjZSBwaGFudG9tIGlkIGdlbmVyYXRvciB0aGF0IGdlbmVyYXRlcyBuZWdhdGl2ZSBpbnRlZ2VyIElEc1xuICAgICAqXG4gICAgICogQG5hbWUgUmVzb3VyY2VQaGFudG9tSWROZWdhdGl2ZUludFxuICAgICAqIEBuZ2RvYyBmYWN0b3J5XG4gICAgICogQHBhcmFtIHtSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlfSBSZXNvdXJjZVBoYW50b21JZEZhY3RvcnlTZXJ2aWNlIFBoYW50b20gSUQgZmFjdG9yeSBzZXJ2aWNlXG4gICAgICovXG4gICAgbW9kdWxlLmZhY3RvcnkoJ1Jlc291cmNlUGhhbnRvbUlkTmVnYXRpdmVJbnQnLFxuICAgICAgICBmdW5jdGlvbiAoUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZSkge1xuICAgICAgICAgICAgJ25nSW5qZWN0JztcblxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgbGFzdFBrVmFsdWUgPSAwO1xuXG4gICAgICAgICAgICByZXR1cm4gUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZS5jcmVhdGVQaGFudG9tSWRGYWN0b3J5KHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLS1sYXN0UGtWYWx1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGlzOiBmdW5jdGlvbiAocGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGtWYWx1ZSA8IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLyoqXG4gICAgICogUmVzb3VyY2UgcGhhbnRvbSBpZCBnZW5lcmF0b3IgdGhhdCBnZW5lcmF0ZXMgbmVnYXRpdmUgaW50ZWdlciBJRHNcbiAgICAgKlxuICAgICAqIEBuYW1lIFJlc291cmNlUGhhbnRvbUlkVXVpZDRcbiAgICAgKiBAbmdkb2MgZmFjdG9yeVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZX0gUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZSBQaGFudG9tIElEIGZhY3Rvcnkgc2VydmljZVxuICAgICAqL1xuICAgIG1vZHVsZS5mYWN0b3J5KCdSZXNvdXJjZVBoYW50b21JZFV1aWQ0JyxcbiAgICAgICAgZnVuY3Rpb24gKFJlc291cmNlUGhhbnRvbUlkRmFjdG9yeVNlcnZpY2UpIHtcbiAgICAgICAgICAgICduZ0luamVjdCc7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIGdlbmVyYXRlZElkcyA9IFtdO1xuXG4gICAgICAgICAgICByZXR1cm4gUmVzb3VyY2VQaGFudG9tSWRGYWN0b3J5U2VydmljZS5jcmVhdGVQaGFudG9tSWRGYWN0b3J5KHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBrVmFsdWUgPSB1dWlkNCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlZElkcy5wdXNoKHBrVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGtWYWx1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGlzOiBmdW5jdGlvbiAocGtWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVkSWRzLmluZGV4T2YocGtWYWx1ZSkgIT09IC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiB1dWlkNCAoKSB7XG4gICAgICAgICAgICAgICAgJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgICAgICAgICAgciA9IE1hdGgucmFuZG9tKCkgKiAxNnwwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IGMgPT09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xufSkoKTtcbiJdfQ==
