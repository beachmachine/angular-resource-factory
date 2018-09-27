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
     * Factory that gives a constructor function for creating a resource service. The resource service is used to make
     * calls to the REST-API via the "method" functions. These are the default method functions:
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
     * @name ResourceFactoryService
     * @ngdoc service
     * @param {String} name Name of the resource service
     * @param {String} url URL to the resource
     * @param {Object} options Options for the resource
     * @param {Boolean} options.stripTrailingSlashes Strip trailing slashes from request URLs. Defaults to `false`.
     * @param {Boolean} options.withCredentials Include credentials in CORS calls. Defaults to `true`.
     * @param {Boolean} options.ignoreLoadingBar Ignore the resource for automatic loading bars. Defaults to `false`.
     * @param {Boolean} options.generatePhantomIds Generate IDs for phantom records created via the `new` method. Defaults to `true`.
     * @param {ResourcePhantomIdFactoryService} options.phantomIdGenerator Phantom ID generator instance used for generating phantom IDs. Defaults to `{@link ResourcePhantomIdNegativeInt}`.
     * @param {String[]} options.dependent List of resource services to clean the cache for on modifying requests.
     * @param {Object} options.extraMethods Extra request methods to put on the resource service. Works the same way as `actions` known from `ng-resource`. Defaults to `{}`.
     * @param {Object} options.extraFunctions Extra functions to put on the resource service instance.
     * @param {Object} options.extraParamDefaults Extra default values for `url` parameters. Works the same way as `defaultParams` known from `ng-resource`. Defaults to `{}`.
     * @param {String} options.pkAttr Attribute name where to find the ID of objects. Defaults to `"pk"`.
     * @param {String} options.urlAttr Attribute name where to find the URL of objects. Defaults to `"url"`.
     * @param {String} options.dataAttr Attribute name where to find the data on call results. Defaults to `null`.
     * @param {String} options.useDataAttrForList Use the `dataAttr` for list calls (e.g. `query`). Defaults to `true`.
     * @param {String} options.useDataAttrForDetail Use the `dataAttr` for detail calls (e.g. `get`). Defaults to `false`.
     * @param {String} options.queryDataAttr Deprecated: Attribute name where to find the data on call results. Note that this option does the same as setting `dataAttr`. Defaults to `null`.
     * @param {String} options.queryTotalAttr Attribute name where to find the total amount of data on the query call (resource list calls). Defaults to `null`.
     * @param {String} options.cacheClass Resource cache class constructor function to use (see `{@link ResourceCacheService}`). Defaults to `{@link ResourceCacheService}`.
     * @param {Function} options.toInternal Function to post-process data coming from response. Gets `obj`, `headersGetter` and `status` and should return the processed `obj`.
     * @param {Function} options.fromInternal Function to post-process data that is going to be sent. Gets `obj` and `headersGetter` and should return the processed `obj`.
     * @class
     *
     * @example
     * // Basic GET calls
     * inject(function (ResourceFactoryService, $q) {
     *     var
     *         service = ResourceFactoryService('Test1ResourceService', 'http://test/:pk/');
     *
     *     $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1}, {pk: 2}]);
     *     $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});
     *     $httpBackend.expect('GET', 'http://test/2/').respond(200, {pk: 2});
     *
     *     $q.when()
     *         .then(function () {
     *             return service.query().$promise;
     *         })
     *         .then(function () {
     *             return service.get({pk: 1}).$promise;
     *         })
     *         .then(function () {
     *             return service.get({pk: 2}).$promise;
     *         })
     *         .then(done);
     *
     *     $httpBackend.flush();
     *     $httpBackend.verifyNoOutstandingRequest();
     * });
     *
     * @example
     * // GET calls with query parameters
     * inject(function (ResourceFactoryService, $q) {
     *     var
     *         service = ResourceFactoryService('Test2ResourceService', 'http://test/:pk/');
     *
     *     $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, [{pk: 1}, {pk: 2}]);
     *
     *     $q.when()
     *         .then(function () {
     *             return service.query({filter: 1}).$promise;
     *         })
     *        .then(done);
     *
     *     $httpBackend.flush();
     *     $httpBackend.verifyNoOutstandingRequest();
     * });
     *
     * @example
     * // Process list GET calls with data attribute
     * inject(function (ResourceFactoryService, $q) {
     *     var
     *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
     *             dataAttr: 'data'
     *         });
     *
     *     expect(service.getDataAttr()).toBe('data');
     *
     *     $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1}, {pk: 2}]});
     *     $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});
     *
     *     $q.when()
     *         .then(function () {
     *             return service.query().$promise;
     *         })
     *         .then(function (result) {
     *             expect(result.length).toBe(2);
     *         })
     *         .then(function () {
     *             return service.get({pk: 1}).$promise;
     *         })
     *         .then(function (result) {
     *             expect(result.pk).toBe(1);
     *         })
     *         .then(done);
     *
     *     $httpBackend.flush();
     *     $httpBackend.verifyNoOutstandingRequest();
     * });
     *
     * @example
     * // Access attributes outside the data attribute
     * inject(function (ResourceFactoryService, $q) {
     *     var
     *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
     *             dataAttr: 'data'
     *         });
     *
     *     $httpBackend.expect('GET', 'http://test/').respond(200, {prop1: 123, data: [{pk: 1}, {pk: 2}]});
     *
     *     $q.when()
     *         .then(function () {
     *             return service.query().$promise;
     *         })
     *         .then(function (result) {
     *             expect(result.$meta.prop1).toBe(123);
     *         })
     *         .then(done);
     *
     *     $httpBackend.flush();
     *     $httpBackend.verifyNoOutstandingRequest();
     * });
     *
     * @example
     * // Resource and instance level methods
     * inject(function (ResourceFactoryService) {
     *     var
     *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
     *         instance = service.new();
     *
     *     expect(service.restore).toBeDefined();
     *     expect(service.get).toBeDefined();
     *     expect(service.getNoCache).toBeDefined();
     *     expect(service.query).toBeDefined();
     *     expect(service.queryNoCache).toBeDefined();
     *     expect(service.save).toBeDefined();
     *     expect(service.update).toBeDefined();
     *     expect(service.patch).toBeDefined();
     *     expect(service.remove).toBeDefined();
     *
     *     expect(instance.$restore).toBeDefined();
     *     expect(instance.$get).toBeDefined();
     *     expect(instance.$getNoCache).toBeDefined();
     *     expect(instance.$query).toBeDefined();
     *     expect(instance.$queryNoCache).toBeDefined();
     *     expect(instance.$save).toBeDefined();
     *     expect(instance.$update).toBeDefined();
     *     expect(instance.$patch).toBeDefined();
     *     expect(instance.$remove).toBeDefined();
     * });
     */
    module.factory('ResourceFactoryService',
        function ($q,
                  $resource,
                  ResourceCacheService,
                  ResourcePhantomIdNegativeInt) {
            'ngInject';

            return function (name, url, options) {
                /**
                 * Options for the resource
                 * @type {Object}
                 */
                options = angular.extend({
                    /**
                     * Option to strip trailing slashes from request URLs
                     * @type {Boolean}
                     * @private
                     */
                    stripTrailingSlashes: false,

                    /**
                     * Option to ignore the resource for automatic loading bars
                     * @type {Boolean}
                     * @private
                     */
                    ignoreLoadingBar: false,

                    /**
                     * Include credentials in CORS calls
                     * @type {Boolean}
                     * @private
                     */
                    withCredentials: true,

                    /**
                     * Generate IDs for phantom records created via the `new`
                     * method on the resource service
                     * @type {Boolean}
                     * @private
                     */
                    generatePhantomIds: true,

                    /**
                     * Phantom ID generator instance to use
                     * @type {ResourcePhantomIdFactoryService}
                     * @private
                     */
                    phantomIdGenerator: ResourcePhantomIdNegativeInt,

                    /**
                     * List of resource services to clean the cache for, on modifying requests
                     * @type {Array<String>}
                     * @private
                     */
                    dependent: [],

                    /**
                     * Extra methods to put on the resource service
                     * @type {Object}
                     * @private
                     */
                    extraMethods: {},

                    /**
                     * Extra functions to put on the resource instances
                     * @type {Object}
                     * @private
                     */
                    extraFunctions: {},

                    /**
                     * Extra default values for `url` parameters
                     * @type {Object}
                     * @private
                     */
                    extraParamDefaults: {},

                    /**
                     * Attribute name where to find the ID of objects
                     * @type {String}
                     * @private
                     */
                    pkAttr: 'pk',

                    /**
                     * Attribute name where to find the URL of objects
                     * @type {String}
                     * @private
                     */
                    urlAttr: 'url',

                    /**
                     * Attribute name where to find the data on call results
                     * @type {String|null}
                     * @private
                     */
                    dataAttr: null,

                    /**
                     * Use the `dataAttr` for list calls (e.g. `query`)
                     * @type {Boolean}
                     * @private
                     */
                    useDataAttrForList: true,

                    /**
                     * Use the `dataAttr` for detail calls (e.g. `get`)
                     * @type {Boolean}
                     * @private
                     */
                    useDataAttrForDetail: false,

                    /**
                     * Deprecated: Attribute name where to find the data on the query call (Note that this option does the same as setting `dataAttr`)
                     * @type {String|null}
                     * @deprecated
                     * @private
                     */
                    queryDataAttr: null,

                    /**
                     * Attribute name where to find the total amount of data on the query call
                     * @type {String|null}
                     * @private
                     */
                    queryTotalAttr: null,

                    /**
                     * Storage for the query filters
                     * @type {Object}
                     * @private
                     */
                    queryFilter: {},

                    /**
                     * Resource cache class constructor function to use (see `{@link ResourceCacheService}`)
                     * @type {Function}
                     * @private
                     */
                    cacheClass: ResourceCacheService,

                    /**
                     * Function to post-process data coming from response
                     *
                     * @memberOf ResourceFactoryService
                     * @param obj
                     * @param headersGetter
                     * @param status
                     * @return {*}
                     * @private
                     */
                    toInternal: function (obj, headersGetter, status) {
                        return obj;
                    },

                    /**
                     * Function to post-process data that is going to be sent
                     *
                     * @memberOf ResourceFactoryService
                     * @param obj
                     * @param headersGetter
                     * @return {*}
                     * @private
                     */
                    fromInternal: function (obj, headersGetter) {
                        return obj;
                    }
                }, options || {});

                // TODO: remove `queryDataAttr` support
                // Support deprecated `queryDataAttr` option, but warn about it
                if (options.queryDataAttr) {
                    console.warn("ResourceFactoryService: The option 'queryDataAttr' is deprecated. Use 'dataAttr' instead.");

                    if (!options.dataAttr) {
                        options.dataAttr = options.queryDataAttr;
                    }
                }

                var
                    resource,

                    /**
                     * Error class for resource factory
                     * @type {*}
                     */
                    minError = angular.$$minErr('ngResourceFactory'),

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
                     * Parameter configuration for query. Used to
                     * disable the PK url template for query
                     * @type {{}}
                     */
                    queryParams = {},

                    /**
                     * The cache instance for the resource.
                     * @type {ResourceCacheService}
                     */
                    cache = new options.cacheClass(name, options.pkAttr, {
                        dataAttr: options.dataAttr,
                        wrapObjectsInDataAttr: !!(options.dataAttr && options.useDataAttrForDetail),
                        pkAttr: options.pkAttr,
                        urlAttr: options.urlAttr,
                        dependent: options.dependent,
                        ttl: 15 * 60
                    }),

                    /**
                     * Interceptor that puts the configured `queryTotalAttr` on the resulting array as attribute
                     * named `total`.
                     * @type {Object}
                     */
                    queryInterceptor = {
                        response: function (response) {
                            var
                                data = response.data,
                                instance = response.resource;

                            // `data` is the object that went through the transformation chain. It should already
                            // have the `total` and `$meta` attribute set via the `queryTransformResponseData`
                            // transformation method.
                            instance.total = data.total;
                            instance.$meta = data.$meta;

                            return instance;
                        }
                    },

                    /**
                     * Interceptor that puts the returned object on the cache an invalidates the
                     * dependent resource services caches.
                     * @type {Object}
                     */
                    insertingInterceptor = {
                        response: function (response) {
                            var
                                useDataAttr = options.useDataAttrForDetail && options.dataAttr,
                                instance = response.resource,
                                url = options.urlAttr ? instance[options.urlAttr] : null;

                            cache.removeAllRaw();
                            cache.removeAllLists();
                            cache.removeAllDependent();

                            /*
                             * Insert the cached object if we have an URL on the returned instance. Else we have
                             * to invalidate the whole object cache.
                             */
                            if (url) {
                                cache.insert(url, instance, useDataAttr);
                            }
                            else {
                                cache.removeAllObjects();
                            }

                            return instance;
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
                                useDataAttr = options.useDataAttrForDetail && options.dataAttr,
                                instance = response.resource,
                                url = options.urlAttr ? instance[options.urlAttr] : null;

                            cache.removeAllRaw();
                            cache.removeAllLists();
                            cache.removeAllDependent();

                            /*
                             * Update the cached object if we have an URL on the returned instance. Else we have
                             * to invalidate the whole object cache.
                             */
                            if (url) {
                                cache.insert(url, instance, useDataAttr);
                            }
                            else {
                                cache.removeAllObjects();
                            }

                            return instance;
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
                                instance = response.resource,
                                url = options.urlAttr ? instance[options.urlAttr] : null;

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

                            return instance;
                        }
                    },

                    /**
                     * Parses the response text as JSON and returns it as object.
                     *
                     * @memberOf ResourceFactoryService
                     * @param responseText
                     * @param headersGetter
                     * @param status
                     * @return {Object|Array|string|number}
                     * @private
                     */
                    transformResponseFromJson = function (responseText, headersGetter, status) {
                        console.log("ResourceFactoryService: Deserialize data.");

                        return responseText ? angular.fromJson(responseText) : null;
                    },

                    /**
                     * Calls the `toInternal` function on each object of the response array.
                     *
                     * @memberOf ResourceFactoryService
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @return {*}
                     * @private
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
                     *
                     * @memberOf ResourceFactoryService
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @return {*}
                     * @private
                     */
                    singleTransformResponseToInternal = function (responseData, headersGetter, status) {
                        console.log("ResourceFactoryService: Post-process data for internal use.");

                        return options.toInternal(responseData, headersGetter, status);
                    },

                    /**
                     * Transforms detail responses to get the actual data from the `dataAttr` option, if
                     * configured.
                     *
                     * @memberOf ResourceFactoryService
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @returns {Array|Object}
                     * @private
                     */
                    singleTransformResponseData = function (responseData, headersGetter, status) {
                        var
                            meta = null,
                            result = null;

                        // get data on success status from `dataAttr`, if configured
                        if (status >= 200 && status < 300) {
                            // get the data from the `dataAttr`, if configured
                            if (options.useDataAttrForDetail && options.dataAttr) {
                                console.log("ResourceFactoryService: Get data from '" + options.dataAttr + "' attribute.");

                                // get the data from the configured `dataAttr` only if we have a response object.
                                // else we just want the result to be the response data.
                                if (responseData) {
                                    meta = angular.copy(responseData);
                                    delete meta[options.dataAttr];

                                    result = responseData[options.dataAttr];
                                    result.$meta = meta;
                                }
                                else {
                                    result = responseData;
                                }
                            }
                            // if no data `dataAttr` is defined, use the response data directly
                            else {
                                result = responseData;
                            }
                        }
                        // on any other status just return the responded object
                        else {
                            result = responseData;
                        }

                        return result;
                    },

                    /**
                     * Transforms query responses to get the actual data from the `dataAttr` option, if
                     * configured. Also sets the `total` attribute on the list if `queryTotalAttr` is configured.
                     *
                     * @memberOf ResourceFactoryService
                     * @param responseData
                     * @param headersGetter
                     * @param status
                     * @returns {Array|Object}
                     * @private
                     */
                    queryTransformResponseData = function (responseData, headersGetter, status) {
                        var
                            meta = null,
                            result = null;

                        // get data on success status from `dataAttr`, if configured
                        if (status >= 200 && status < 300) {
                            // get the data from the `dataAttr`, if configured
                            if (options.useDataAttrForList && options.dataAttr) {
                                console.log("ResourceFactoryService: Get data from '" + options.dataAttr + "' attribute.");

                                // get the data from the configured `dataAttr` only if we have a response object.
                                // else we just want the result to be the response data.
                                if (responseData) {
                                    meta = angular.copy(responseData);
                                    delete meta[options.dataAttr];

                                    result = responseData[options.dataAttr];
                                    result.$meta = meta;
                                }
                                else {
                                    result = responseData;
                                }
                            }
                            // if no data `dataAttr` is defined, use the response data directly
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
                     *
                     * @memberOf ResourceFactoryService
                     * @param requestData
                     * @param headersGetter
                     * @return {string}
                     * @private
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
                     *
                     * @memberOf ResourceFactoryService
                     * @param requestData
                     * @param headersGetter
                     * @return {*}
                     * @private
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
                            withCredentials: options.withCredentials,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            cache: options.useDataAttrForDetail ? cache.withDataAttrNoTtl : cache.withoutDataAttrNoTtl,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
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
                            withCredentials: options.withCredentials,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            cache: options.useDataAttrForDetail ? cache.withDataAttr : cache.withoutDataAttr,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
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
                            withCredentials: options.withCredentials,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
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
                            withCredentials: options.withCredentials,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: queryInterceptor,
                            cache: options.useDataAttrForList ? cache.withDataAttr : cache.withoutDataAttr,
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
                            withCredentials: options.withCredentials,
                            cancellable: true,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: queryInterceptor,
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
                            withCredentials: options.withCredentials,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: insertingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
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
                            withCredentials: options.withCredentials,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: modifyingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        },
                        patch: {
                            method: 'PATCH',
                            isArray: false,
                            withCredentials: options.withCredentials,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: modifyingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
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
                            withCredentials: options.withCredentials,
                            cancellable: false,
                            ignoreLoadingBar: options.ignoreLoadingBar,
                            interceptor: deletingInterceptor,
                            transformResponse: [
                                transformResponseFromJson,
                                singleTransformResponseData,
                                singleTransformResponseToInternal
                            ],
                            transformRequest: [
                                singleTransformRequestFromInternal,
                                transformRequestToJson
                            ]
                        }
                    };

                // extend methods by the extra methods. when extra methods contain a pre-defined method
                // merge the properties with the pre-defined one.
                for (var extraMethodName in options.extraMethods) {
                    if (options.extraMethods.hasOwnProperty(extraMethodName)) {
                        // if the defined extra method matches a pre-defined one
                        if (methods.hasOwnProperty(extraMethodName)) {
                            angular.extend(methods[extraMethodName], options.extraMethods[extraMethodName])
                        }

                        // if the extra method is a new one
                        else {
                            methods[extraMethodName] = options.extraMethods[extraMethodName];
                        }
                    }
                }

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
                angular.extend(paramsDefaults, options.extraParamDefaults);

                // default params for save and query should be the same as the regular
                // default params, except that the PK should not be included in the URLs
                angular.extend(saveParams, paramsDefaults);
                angular.extend(queryParams, paramsDefaults);
                saveParams[options.pkAttr] = null;
                queryParams[options.pkAttr] = null;

                // save methods should not put PK in the URL
                methods.save.params = saveParams;
                methods.saveBg.params = saveParams;

                // query methods should not put PK in the URL
                methods.query.params = queryParams;
                methods.queryBg.params = queryParams;
                methods.queryNoCache.params = queryParams;
                methods.queryNoCacheBg.params = queryParams;

                // build the resource object
                resource = $resource(url, paramsDefaults, methods, {
                    stripTrailingSlashes: options.stripTrailingSlashes
                });

                /**
                 * Gets the PK attribute name
                 *
                 * @memberOf ResourceFactoryService
                 * @function getPkAttr
                 * @return {String|null} PK attribute name
                 * @instance
                 */
                resource.getPkAttr = function () {
                    return options.pkAttr;
                };

                /**
                 * Gets the data attribute name
                 *
                 * @memberOf ResourceFactoryService
                 * @function getDataAttr
                 * @return {String|null} Data attribute name
                 * @instance
                 */
                resource.getDataAttr = function () {
                    return options.dataAttr;
                };

                /**
                 * Gets the query data attribute name
                 *
                 * @memberOf ResourceFactoryService
                 * @function getQueryDataAttr
                 * @return {String|null} Data attribute name
                 * @instance
                 * @deprecated
                 */
                resource.getQueryDataAttr = function () {
                    return options.dataAttr; // set by a compatibility code to the value of `queryDataAttr`
                };

                /**
                 * Gets the total attribute name
                 *
                 * @memberOf ResourceFactoryService
                 * @function getQueryTotalAttr
                 * @return {String|null} Total attribute name
                 * @instance
                 */
                resource.getQueryTotalAttr = function () {
                    return options.queryTotalAttr;
                };

                /**
                 * Gets the cache class
                 *
                 * @memberOf ResourceFactoryService
                 * @function getCacheClass
                 * @return {Function} Cache class
                 * @instance
                 */
                resource.getCacheClass = function () {
                    return options.cacheClass;
                };

                /**
                 * Returns an object holding the filter data for query request
                 *
                 * @memberOf ResourceFactoryService
                 * @function getQueryFilters
                 * @returns {Object} Filter object
                 * @instance
                 */
                resource.getQueryFilters = function () {
                    return options.queryFilter;
                };

                /**
                 * Sets a clone of the given object as the object holding the filter data for query request
                 *
                 * @memberOf ResourceFactoryService
                 * @function setQueryFilters
                 * @param {Object} filters Object holding filter attributes
                 * @returns {Object} Filter object
                 * @instance
                 */
                resource.setQueryFilters = function (filters) {
                    return angular.copy(filters, options.queryFilter);
                };

                /**
                 * Sets the given filter options if the aren't already set on the filter object
                 *
                 * @memberOf ResourceFactoryService
                 * @function setDefaultQueryFilters
                 * @param {Object} defaultFilters Object holding filter attributes
                 * @returns {Object} Filter object
                 * @instance
                 */
                resource.setDefaultQueryFilters = function (defaultFilters) {
                    var
                        filters = angular.extend({}, defaultFilters, options.queryFilter);

                    return angular.copy(filters, options.queryFilter);
                };

                /**
                 * Gets the first item from cache that matches the given PK value. If there is no item on the
                 * cache that matches, this method returns `undefined`. Note that the cache TTL is ignored.
                 *
                 * @memberOf ResourceFactoryService
                 * @function firstFromCacheByPk
                 * @param {String|int} pkValue PK value to search for
                 * @returns {ResourceInstance|undefined} Search result data
                 * @instance
                 */
                resource.firstFromCacheByPk = function (pkValue) {
                    var
                        data = cache.firstByPk(pkValue);

                    if (data) {
                        return resource.new(data);
                    }
                    return data;
                };

                /**
                 * Gets all items from cache that match the given PK value. If there is no item on the
                 * cache that matches, this method returns an empty array. Note that the cache TTL is ignored.
                 *
                 * @memberOf ResourceFactoryService
                 * @function findFromCacheByPk
                 * @param {String|int} pkValue PK value to search for
                 * @returns {ResourceInstance[]} Search results data
                 * @instance
                 */
                resource.findFromCacheByPk = function (pkValue) {
                    var
                        cacheResult = cache.findByPk(pkValue),
                        result = [];

                    for (var i = 0; i < cacheResult.length; i++) {
                        result.push(resource.new(cacheResult[i]));
                    }
                    return result;
                };

                /**
                 * Queries the resource with the configured filters.
                 *
                 * @memberOf ResourceFactoryService
                 * @function filter
                 * @param {Object} [filters] Object holding filter attributes
                 * @returns {Object} Query result object
                 * @instance
                 */
                resource.filter = function (filters) {
                    filters = angular.extend({}, resource.getQueryFilters(), filters);
                    return resource.query(filters);
                };

                /**
                 * Queries the resource with the configured filters without using the cache.
                 *
                 * @memberOf ResourceFactoryService
                 * @function filterNoCache
                 * @param {Object} [filters] Object holding filter attributes
                 * @returns {Object} Query result object
                 * @instance
                 */
                resource.filterNoCache = function (filters) {
                    filters = angular.extend({}, resource.getQueryFilters(), filters);
                    return resource.queryNoCache(filters);
                };

                /**
                 * Creates a new instance for the resource
                 *
                 * @memberOf ResourceFactoryService
                 * @function new
                 * @param {Object} [params] Object holding attributes to set on the resource instance
                 * @return {ResourceInstance} Resource instance
                 * @instance
                 */
                resource.new = function (params) {
                    var
                        phantomInstance = new resource(params);

                    // Generate phantom ID if desired
                    if (options.pkAttr && options.generatePhantomIds && options.phantomIdGenerator && !phantomInstance[options.pkAttr]) {
                        phantomInstance[options.pkAttr] = options.phantomIdGenerator.generate(phantomInstance);
                    }

                    return phantomInstance;
                };

                /**
                 * Checks if the given instance is a phantom instance (instance not persisted to the REST API yet)
                 *
                 * @memberOf ResourceFactoryService
                 * @function isPhantom
                 * @param {ResourceInstance} instance Instance to check
                 * @return {Boolean|undefined} If is phantom or not
                 * @instance
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
                 * @memberOf ResourceFactoryService
                 * @function filterInstancesByAttr
                 * @param {ResourceInstance[]} instances List of instances to filter
                 * @param {String} attrName Attribute name to filter on
                 * @param {*} attrValue Value to filter for
                 * @return {ResourceInstance[]} Filtered list of instances
                 * @instance
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
                 * @memberOf ResourceFactoryService
                 * @function getInstanceByAttr
                 * @param {ResourceInstance[]} instances List of instances to filter
                 * @param {String} attrName Attribute name to filter on
                 * @param {*} attrValue Value to filter for
                 * @return {ResourceInstance|null} First instances matching the filter
                 * @instance
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
                 * @memberOf ResourceFactoryService
                 * @function getInstanceByPk
                 * @param {ResourceInstance[]} instances List of instances to filter
                 * @param {String|int} pkValue PK value to filter for
                 * @return {ResourceInstance|null} Instance with the given PK
                 * @instance
                 */
                resource.getInstanceByPk = function (instances, pkValue) {
                    return resource.getInstanceByAttr(instances, options.pkAttr, pkValue);
                };

                /**
                 * Gets the name of the resource.
                 *
                 * @memberOf ResourceFactoryService
                 * @function getResourceName
                 * @return {String} Resource name
                 * @instance
                 */
                resource.getResourceName = function () {
                    return name;
                };

                /**
                 * Gets the cache instance.
                 *
                 * @memberOf ResourceFactoryService
                 * @function getCache
                 * @return {ResourceCacheService} Cache class instance
                 * @instance
                 */
                resource.getCache = function () {
                    return cache;
                };

                /**
                 * Creates a new store for the resource
                 *
                 * @memberOf ResourceFactoryService
                 * @function createStore
                 * @param [instances] List of instances that should be managed by the new store
                 * @return {ResourceStore} New store instance
                 * @instance
                 */
                resource.createStore = function (instances) {
                    instances = instances || [];

                    // Support for single instances by converting it to an array
                    if (!angular.isArray(instances)) {
                        instances = [instances];
                    }

                    return new ResourceStore(resource, instances, null);
                };

                /**
                 * Saves the given resource instance to the REST API. Uses the `$save` method if instance
                 * is phantom, else the `$update` method.
                 *
                 * @memberOf ResourceFactoryService
                 * @function persist
                 * @param {Object} [a1] Query params
                 * @param {ResourceInstance} [a2] Instance
                 * @param {Function} [a3] Success callback
                 * @param {Function} [a4] Error callback
                 * @return {ResourceInstance} Resource instance
                 * @instance
                 */
                resource.persist = function (a1, a2, a3, a4) {
                    var
                        params = {},
                        instance,
                        successFn,
                        errorFn,
                        saveFn;

                    /*
                     * Mimic the wired $resource action method signature, where the method can be
                     * called as follows:
                     * - params, instance, successFn, errorFn
                     * - instance, successFn, errorFn
                     * - params, instance, successFn
                     * - instance, successFn
                     * - params, instance
                     * - instance
                     */
                    switch (arguments.length) {
                        // handle case: params, instance, successFn, errorFn
                        case 4:
                            params = a1;
                            instance = a2;
                            successFn = a3;
                            errorFn = a4;
                            break;

                        case 3:
                            // handle case: instance, successFn, errorFn
                            if (angular.isFunction(a2)) {
                                instance = a1;
                                successFn = a2;
                                errorFn = a3;
                            }

                            // handle case: params, instance, successFn
                            else {
                                params = a1;
                                instance = a2;
                                successFn = a3;
                            }
                            break;

                        case 2:
                            // handle case: instance, successFn
                            if (angular.isFunction(a2)) {
                                instance = a1;
                                successFn = a2;
                            }

                            // handle case: params, instance
                            else {
                                params = a1;
                                instance = a2;
                            }
                            break;

                        // handle case: instance
                        case 1:
                            instance = a1;
                            break;

                        // any other case is considered an error
                        default:
                            throw minError(
                                'badargs',
                                'Expected up to 4 arguments [params, instance, success, error], got {0} arguments',
                                arguments.length
                            );
                    }

                    saveFn = resource.isPhantom(instance) ? resource.save : resource.update;

                    return saveFn(params, instance, successFn, errorFn);
                };

                /*
                 * Add some of the resource methods as instance methods on the
                 * prototype of the resource.
                 */
                angular.extend(resource.prototype, {
                    /**
                     * Saves or updates the instance
                     * @param [a1] Query params
                     * @param [a2] Success callback
                     * @param [a3] Error callback
                     * @return {*}
                     * @private
                     */
                    $persist: function (a1, a2, a3) {
                        var
                            instance = this;

                        /*
                         * Mimic the wired $resource action method signature, where the method can be
                         * called as follows:
                         * - params, successFn, errorFn
                         * - params, successFn
                         * - successFn, errorFn
                         * - params
                         * - successFn
                         * - no parameters
                         */
                        if (angular.isFunction(a1)) {
                            a2 = a1;
                            a3 = a2;
                            a1 = {};
                        }

                        return resource.persist(a1, instance, a2, a3).$promise;
                    },

                    /**
                     * Checks if instance is a phantom record (not saved via the REST API yet)
                     * @return {*}
                     * @private
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
             * @param {ResourceFactoryService} resource Resource service instance
             * @param {ResourceInstance[]} managedInstances List of resource instances to manage
             * @param {ResourceStore|null} parentStore The store of which the new store is a sub-store of
             * @class
             *
             * @example
             * // Basic usage of a resource store
             * inject(function (ResourceFactoryService, $q) {
             *     var
             *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
             *         instance1 = service.new(),
             *         instance2 = service.new(),
             *         instance3 = service.new(),
             *         store = service.createStore([instance1, instance2, instance3]);
             *
             *     $httpBackend.expect('DELETE', 'http://test/2/').respond(204, '');
             *     $httpBackend.expect('PATCH', 'http://test/1/').respond(200, {pk: 1});
             *     $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});
             *
             *     instance1.pk = 1;
             *     instance2.pk = 2;
             *
             *     store.remove(instance2);
             *     store.persist(instance1);
             *     store.persist(instance3);
             *
             *     $q.when()
             *         .then(function () {
             *             return store.execute();
             *         })
             *         .then(done);
             *
             *     $httpBackend.flush();
             * });
             */
            function ResourceStore (resource, managedInstances, parentStore) {
                var
                    self = this,

                    /**
                     * Name of the resource service
                     * @type {String}
                     * @private
                     */
                    resourceName = resource.getResourceName(),

                    /**
                     * Indicator for running execution (stops another execution from being issued)
                     * @type {boolean}
                     * @private
                     */
                    executionRunning = false,

                    /**
                     * Contains relations to other stores (for updating references)
                     * @type {Array<ResourceStoreRelation>}
                     * @private
                     */
                    relations = [],

                    /**
                     * Stores resource items that are visible for the user (not queued for remove)
                     * @type {Array}
                     * @private
                     */
                    visibleQueue = [],

                    /**
                     * Stores resource items queued for persisting (save or update)
                     * @type {Array}
                     * @private
                     */
                    persistQueue = [],

                    /**
                     * Stores resource items queued for deleting
                     * @type {Array}
                     * @private
                     */
                    removeQueue = [],

                    /**
                     * Callbacks executed before each item persists
                     * @type {Array}
                     * @private
                     */
                    beforePersistListeners = [],

                    /**
                     * Callbacks executed after each item persists
                     * @type {Array}
                     * @private
                     */
                    afterPersistListeners = [],

                    /**
                     * Callbacks executed before each item removes
                     * @type {Array}
                     * @private
                     */
                    beforeRemoveListeners = [],

                    /**
                     * Callbacks executed after each item removes
                     * @type {Array}
                     * @private
                     */
                    afterRemoveListeners = [];

                /**
                 * Manage given instances. The new instances object may be a ng-resource result,
                 * a promise, a list of instances or a single instance.
                 *
                 * @memberOf ResourceStore
                 * @function manage
                 * @param {ResourceInstance|ResourceInstance[]} newInstances List of instances to manage
                 * @return {Promise} Promise that resolves if all given instances are resolved
                 * @instance
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
                 * @function forget
                 * @param {ResourceInstance|ResourceInstance[]} oldInstances Instances the store should forget
                 * @return {Promise} Promise that resolves if all given instances are resolved
                 * @instance
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
                                    oldInstance = oldInstances[i],
                                    oldInstancePkValue = oldInstance ? oldInstance[resource.getPkAttr()] : null;

                                // If the instance is not managed yet, manage it
                                if (oldInstance.$store === self) {
                                    // Remove the store attribute from the instance
                                    delete oldInstance.$store;

                                    // Call the dispose handler on all relations for the disposed instance
                                    for (var j = 0; j < relations.length; j++) {
                                        relations[j].handleDispose(oldInstancePkValue);
                                    }

                                    // Remove the instance from the list of managed instances
                                    removeResourceInstance(managedInstances, oldInstance);
                                    removeResourceInstance(visibleQueue, oldInstance);
                                    removeResourceInstance(persistQueue, oldInstance);
                                    removeResourceInstance(removeQueue, oldInstance);
                                }
                                // If the instances is already managed by another store, print an error
                                else if (!!oldInstance.$store && oldInstance.$store !== self) {
                                    console.error("ResourceStore: '" + resourceName + "' instance managed by another store.");
                                }
                                // If the instance is not managed by any store, print an error
                                else {
                                    console.error("ResourceStore: '" + resourceName + "' instance is not managed.");
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
                 * @function new
                 * @param {Object} [params] Object holding attributes to set on the resource instance
                 * @return {ResourceInstance} New resource instance that is managed by the store
                 * @instance
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
                 * @function persist
                 * @param {ResourceInstance|ResourceInstance[]} instances Instances that should be queued for persistence
                 * @instance
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
                 * @function remove
                 * @param {ResourceInstance|ResourceInstance[]} instances Instances that should be queued for removing
                 * @instance
                 */
                self.remove = function (instances) {
                    console.log("ResourceStore: Queue '" + resourceName + "' instances for remove.");

                    if (!angular.isArray(instances)) {
                        instances = [instances];
                    }

                    for (var i = 0; i < instances.length; i++) {
                        var
                            instance = instances[i],
                            instancePkValue = instance ? instance[resource.getPkAttr()] : null;

                        if (instance.$store === self) {
                            // Call the dispose handler on all relations for the disposed instance
                            for (var j = 0; j < relations.length; j++) {
                                relations[j].handleDispose(instancePkValue);
                            }

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
                 * @function commit
                 * @instance
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
                 * set to true.
                 *
                 * @memberOf ResourceStore
                 * @function executeAll
                 * @param [clearAfter] Clear change queue on all stores after executing (default: `true`)
                 * @return {Promise}
                 * @instance
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
                 * @function execute
                 * @param [clearAfter] Clear change queue on the store after executing (default: `true`)
                 * @return {Promise}
                 * @instance
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
                         * @private
                         */
                        handleError = function (reason) {
                            executionRunning = false;
                            defer.reject(reason);
                        },

                        /**
                         * Calls a list of listener functions with given item as parameter
                         * @param item
                         * @param listeners
                         * @private
                         */
                        callListeners = function (item, listeners) {
                            for (var i = 0; i < listeners.length; i++) {
                                listeners[i](item);
                            }
                        },

                        /**
                         * Calls the remove handler on the registered relations.
                         * @param pkValue
                         * @private
                         */
                        relationsRemove = function (pkValue) {
                            for (var i = 0; i < relations.length; i++) {
                                relations[i].handleRemove(pkValue);
                            }
                        },

                        /**
                         * Calls the update handler on the registered relations.
                         * @param oldPkValue
                         * @param newPkValue
                         * @private
                         */
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
                         * @private
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
                         * @private
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
                         * @private
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
                         * @private
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
                         * @private
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
                 * @function createChildStore
                 * @param {ResourceInstance|ResourceInstance[]} instances Instances to manage on the child store (default: all instances on the parent store)
                 * @return {ResourceStore} New child store
                 * @instance
                 */
                self.createChildStore = function (instances) {
                    instances = instances || managedInstances;

                    var
                        childStoreManagedInstances = copy(instances);

                    return new ResourceStore(resource, childStoreManagedInstances, self);
                };

                /**
                 * Adds a relation to another store. Relations do automatically update foreign key attributes on
                 * instances on a related store when certain events occur. These events include:
                 *  - `remove`: An instance was removed on the server (e.g. by a DELETE call)
                 *  - `dispose`: An instances was removed for forgot on the store (e.g. by `remove` or `forget` methods on the store)
                 *  - `update`: An instance got a new PK from the server after saving
                 *
                 * You can either use pre-defined behaviours for these events, or hook in custom functions. The pre-defined
                 * behaviours are:
                 *  - `"forget"`: Forget the referencing instance on the related store
                 *  - `"null"`: Set the foreign key attribute on the referencing instance to `null`
                 *  - `"update"`: Set the foreign key attribute on the referencing instance to the new PK
                 *  - `"ignore"`: Do nothing
                 *
                 * @memberOf ResourceStore
                 * @function createRelation
                 * @param {Object} config Configuration object
                 * @param {ResourceStore} config.relatedStore Store instance this store has a relation to
                 * @param {String} config.fkAttr Foreign key attribute on instances on the related store
                 * @param {Function|"forget"|"null"|"ignore"} config.onRemove What to do on the related instances if instances on this store are removed (default: `"forget"`)
                 * @param {Function|"forget"|"null"|"ignore"} config.onDispose What to do on the related instances if instances on this store are disposed (default: `"forget"`)
                 * @param {Function|"update"|"null"|"ignore"} config.onUpdate What to do on the related instances if instances on this store are updated (default: `"update"`)
                 * @return {ResourceStoreRelation} New relation
                 * @instance
                 */
                self.createRelation = function (config) {
                    config = angular.extend({
                        relatedStore: null,
                        fkAttr: null,
                        onRemove: 'forget',
                        onDispose: 'forget',
                        onUpdate: 'update'
                    }, config);

                    var
                        relation = new ResourceStoreRelation(self, config.relatedStore, config.fkAttr, config.onUpdate, config.onRemove, config.onDispose);

                    relations.push(relation);

                    return relation;
                };

                /**
                 * Removes a relation from the store.
                 *
                 * @memberOf ResourceStore
                 * @function removeRelation
                 * @param {ResourceStoreRelation} relation Relation instance to remove
                 * @instance
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
                 * @function getByPk
                 * @param {String|int} pkValue
                 * @return {ResourceInstance|undefined} Resource instance managed by the store with the given PK value
                 * @instance
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
                 * @function getByInstance
                 * @param {ResourceInstance} instance Instance to search for in the store
                 * @return {ResourceInstance|undefined} Resource instance managed by the store matching the given instance that might by not managed by the store
                 * @instance
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
                 * @function getManagedInstances
                 * @return {ResourceInstance[]} Instances managed by the store
                 * @instance
                 */
                self.getManagedInstances = function () {
                    return managedInstances.slice();
                };

                /**
                 * Gets a list of instances visible for the user (e.g. that are not marked for removal).
                 *
                 * @memberOf ResourceStore
                 * @function getVisibleQueue
                 * @return {ResourceInstance[]} Instances visible for the user
                 * @instance
                 */
                self.getVisibleQueue = function () {
                    return visibleQueue.slice();
                };

                /**
                 * Gets a list of instances marked for persist.
                 *
                 * @memberOf ResourceStore
                 * @function getPersistQueue
                 * @return {ResourceInstance[]} Instances marked for persistence
                 * @instance
                 */
                self.getPersistQueue = function () {
                    return persistQueue.slice();
                };

                /**
                 * Gets a list of instances marked for remove.
                 *
                 * @memberOf ResourceStore
                 * @function getRemoveQueue
                 * @return {ResourceInstance[]} Instances marked for removal
                 * @instance
                 */
                self.getRemoveQueue = function () {
                    return removeQueue.slice();
                };

                /**
                 * Gets a list of instances marked for save (e.g. insert).
                 *
                 * @memberOf ResourceStore
                 * @function getSaveQueue
                 * @return {ResourceInstance[]} Instances marked for save
                 * @instance
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
                 * @function getUpdateQueue
                 * @return {ResourceInstance[]} Instances marked for update
                 * @instance
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
                 * @function getResourceService
                 * @return {ResourceFactoryService} Resource service instance
                 * @instance
                 */
                self.getResourceService = function () {
                    return resource;
                };

                /**
                 * Adds a before-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @function addBeforePersistListener
                 * @param {Function} fn Callback function
                 * @instance
                 */
                self.addBeforePersistListener = function (fn) {
                    beforePersistListeners.push(fn);
                };

                /**
                 * Removes a before-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @function removeBeforePersistListener
                 * @param {Function} fn Callback function
                 * @instance
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
                 * @function addAfterPersistListener
                 * @param {Function} fn Callback function
                 * @instance
                 */
                self.addAfterPersistListener = function (fn) {
                    afterPersistListeners.push(fn);
                };

                /**
                 * Removes a after-persist listener.
                 *
                 * @memberOf ResourceStore
                 * @function removeAfterPersistListener
                 * @param {Function} fn Callback function
                 * @instance
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
                 * Adds a before-remove listener.
                 *
                 * @memberOf ResourceStore
                 * @function addBeforeRemoveListener
                 * @param {Function} fn Callback function
                 * @instance
                 */
                self.addBeforeRemoveListener = function (fn) {
                    beforeRemoveListeners.push(fn);
                };

                /**
                 * Removes a before-remove listener.
                 *
                 * @memberOf ResourceStore
                 * @function removeBeforeRemoveListener
                 * @param {Function} fn Callback function
                 * @instance
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
                 * @function addAfterRemoveListener
                 * @param {Function} fn Callback function
                 * @instance
                 */
                self.addAfterRemoveListener = function (fn) {
                    afterRemoveListeners.push(fn);
                };

                /**
                 * Removes a after-remove listener.
                 *
                 * @memberOf ResourceStore
                 * @function removeAfterRemoveListener
                 * @param {Function} fn Callback function
                 * @instance
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
                 * Adds the given instance to the given list of instances. Updates all occurrences of the instance
                 * if it is already in the list of instances.
                 *
                 * @memberOf ResourceStore
                 * @function addResourceInstance
                 * @param instances
                 * @param instance
                 * @private
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
                                // Removes the old instance and replaces it with the provided instance
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
                 * @param instances
                 * @param instance
                 * @private
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
                 * @param obj
                 * @return {*|boolean}
                 * @private
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
                 * @param dst {Undefined|Object|Array} Destination object
                 * @param src {Object|Array} Source object
                 * @param [keepMissing] boolean Keep attributes on dst that are not present on src
                 * @return {*}
                 * @private
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
                 * @param src
                 * @param [dst]
                 * @return {*}
                 * @private
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
                 * @param src
                 * @param [dst]
                 * @return {*}
                 * @private
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
                         * @private
                         */
                        mapPk = function (instance) {
                            return instance ? String(instance[resource.getPkAttr()]) : undefined;
                        },

                        /**
                         * Filters instances to given list of PKs
                         * @param pks
                         * @return {Function}
                         * @private
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
             * @param {ResourceStore} store Store to create the relation on
             * @param {ResourceStore} relatedStore Related store
             * @param {String} fkAttr Name of foreign key attribute on instances on related store
             * @param {Function|"update"|"null"|"ignore"} onUpdate What to do on the related instances if instances on the store are updated
             * @param {Function|"forget"|"null"|"ignore"} onRemove What to do on the related instances if instances on the store are removed
             * @param {Function|"forget"|"null"|"ignore"} onDispose What to do on the related instances if instances on the store are disposed
             * @class
             *
             * @example
             * // Basic usage of a ResourceStoreRelation
             * inject(function (ResourceFactoryService, $q) {
             *     var
             *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
             *         relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
             *         instance1 = service.new(),
             *         instance2 = service.new(),
             *         relatedInstance1 = relatedService.new({fk: instance1.pk}),
             *         relatedInstance2 = relatedService.new({fk: instance2.pk}),
             *         store = service.createStore([instance1, instance2]),
             *         relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]);
             *
             *     $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
             *     $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});
             *
             *     store.createRelation({
             *         relatedStore: relatedStore,
             *         fkAttr: 'fk'
             *     });
             *
             *     $q.when()
             *         .then(function () {
             *             expect(relatedInstance1.fk).toBe(-1);
             *             expect(relatedInstance2.fk).toBe(-2);
             *         })
             *         .then(function () {
             *             store.persist(instance1);
             *             store.persist(instance2);
             *         })
             *         .then(function () {
             *             return store.execute();
             *         })
             *         .then(function () {
             *             expect(relatedInstance1.fk).toBe(1);
             *             expect(relatedInstance2.fk).toBe(2);
             *         })
             *         .then(done);
             *
             *     $httpBackend.flush();
             * });
             */
            function ResourceStoreRelation (store, relatedStore, fkAttr, onUpdate, onRemove, onDispose) {
                var
                    self = this;

                /*
                 * Implementation of pre-defined update behaviours
                 */
                switch (onUpdate) {
                    case 'update':
                        onUpdate = function (referencingStore, referencingInstance, oldReferencedInstancePk, newReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResourceService().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to '" + newReferencedInstancePk + "'.");

                            referencingInstance[fkAttr] = newReferencedInstancePk;
                        };
                        break;
                    case 'null':
                        onUpdate = function (referencingStore, referencingInstance, oldReferencedInstancePk, newReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResourceService().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to null.");

                            referencingInstance[fkAttr] = null;
                        };
                        break;
                    case 'ignore':
                        onUpdate = function (referencingStore, referencingInstance, oldReferencedInstancePk, newReferencedInstancePk, fkAttr) { };
                        break;
                }

                /*
                 * Implementation of pre-defined remove behaviours
                 */
                switch (onRemove) {
                    case 'forget':
                        onRemove = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Forget '" + relatedStore.getResourceService().getResourceName() + "' instance '" + oldReferencedInstancePk + "' referencing instance.");

                            referencingStore.forget(referencingInstance);
                        };
                        break;
                    case 'null':
                        onRemove = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResourceService().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to null.");

                            referencingInstance[fkAttr] = null;
                        };
                        break;
                    case 'ignore':
                        onRemove = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) { };
                        break;
                }

                /*
                 * Implementation of pre-defined dispose behaviours
                 */
                switch (onDispose) {
                    case 'forget':
                        onDispose = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Forget '" + relatedStore.getResourceService().getResourceName() + "' instance '" + oldReferencedInstancePk + "' referencing instance.");

                            referencingStore.forget(referencingInstance);
                        };
                        break;
                    case 'null':
                        onDispose = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) {
                            console.log("ResourceStoreRelation: Set reference to '" + relatedStore.getResourceService().getResourceName() + "' instance from '" + oldReferencedInstancePk + "' to null.");

                            referencingInstance[fkAttr] = null;
                        };
                        break;
                    case 'ignore':
                        onDispose = function (referencingStore, referencingInstance, oldReferencedInstancePk, fkAttr) { };
                        break;
                }

                /**
                 * Gets the store the relation is configured on.
                 *
                 * @memberOf ResourceStoreRelation
                 * @function getStore
                 * @return {ResourceStore} Resource store to work on
                 * @instance
                 */
                self.getStore = function () {
                    return store;
                };

                /**
                 * Gets the store the configured store is related on.
                 *
                 * @memberOf ResourceStoreRelation
                 * @function getRelatedStore
                 * @return {ResourceStore} Related resource store
                 * @instance
                 */
                self.getRelatedStore = function () {
                    return relatedStore;
                };

                /**
                 * Gets the FK attribute name.
                 *
                 * @memberOf ResourceStoreRelation
                 * @function getFkAttr
                 * @return {String} Name of the foreign key attribute on related instances
                 * @instance
                 */
                self.getFkAttr = function () {
                    return fkAttr;
                };

                /**
                 * Starts the configured update behaviour on the referencing instances on the related store. This is
                 * called when an instance was saved / updated on the server and got a new PK.
                 *
                 * @memberOf ResourceStoreRelation
                 * @function handleUpdate
                 * @param {String|int} oldPkValue PK of the instance on the store before the update
                 * @param {String|int} newPkValue PK of the instance on the store after the update
                 * @instance
                 */
                self.handleUpdate = function (oldPkValue, newPkValue) {
                    console.log("ResourceStoreRelation: Handle update of referenced instance on '" + relatedStore.getResourceService().getResourceName() + "' store.");

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
                 * Starts the configured remove behaviour on the referencing instances on the related store. This is
                 * called when an instance was deleted on the server.
                 *
                 * @memberOf ResourceStoreRelation
                 * @function handleRemove
                 * @param {String|int} pkValue PK of the instance on the store
                 * @instance
                 */
                self.handleRemove = function (pkValue) {
                    console.log("ResourceStoreRelation: Handle remove of referenced instance on '" + relatedStore.getResourceService().getResourceName() + "' store.");

                    var
                        referencingInstances = relatedStore.getManagedInstances();

                    for (var i = 0; i < referencingInstances.length; i++) {
                        var
                            referencingInstance = referencingInstances[i];

                        if (referencingInstance && referencingInstance[fkAttr] == pkValue) {
                            onRemove(relatedStore, referencingInstance, pkValue, fkAttr);
                        }
                    }
                };

                /**
                 * Starts the configured dispose behaviour on the referencing instances on the related store. This is
                 * called when an instance was removed or forgot on the store.
                 *
                 * @memberOf ResourceStoreRelation
                 * @function handleDispose
                 * @param {String|int} pkValue PK of the instance on the store
                 * @instance
                 */
                self.handleDispose = function (pkValue) {
                    console.log("ResourceStoreRelation: Handle dispose of referenced instance on '" + relatedStore.getResourceService().getResourceName() + "' store.");

                    var
                        referencingInstances = relatedStore.getManagedInstances();

                    for (var i = 0; i < referencingInstances.length; i++) {
                        var
                            referencingInstance = referencingInstances[i];

                        if (referencingInstance && referencingInstance[fkAttr] == pkValue) {
                            onDispose(relatedStore, referencingInstance, pkValue, fkAttr);
                        }
                    }
                };
            }
        }
    );
})();
