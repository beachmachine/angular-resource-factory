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
     * @see ResourcePhantomIdNegativeInt
     * @see ResourcePhantomIdUuid4
     * @class
     * @example
     * // ResourcePhantomIdFactory that creates negative IDs as phantom IDs (NOTE: this is already a build-in
     * // phantom ID factory, so you do not have to implement this - @see ResourcePhantomIdNegativeInt)
     * inject(function (ResourceFactoryService, ResourcePhantomIdFactoryService) {
     *     var
     *         lastPkValue = 0,
     *         generator = ResourcePhantomIdFactoryService.createPhantomIdFactory({
     *             generate: function () {
     *                 return --lastPkValue;
     *             },
     *             is: function (pkValue) {
     *                 return pkValue < 0;
     *             }
     *         }),
     *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
     *             phantomIdGenerator: generator
     *         }),
     *         phantomInstance1 = service.new(),
     *         phantomInstance2 = service.new();
     *
     *     expect(phantomInstance1.$isPhantom()).toBe(true);
     *     expect(phantomInstance2.$isPhantom()).toBe(true);
     *
     *     // Change IDs to non-negative numbers
     *     phantomInstance1.pk = 1;
     *     phantomInstance2.pk = 2;
     *
     *     expect(phantomInstance1.$isPhantom()).toBe(false);
     *     expect(phantomInstance2.$isPhantom()).toBe(false);
     * });
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
             * @function createPhantomIdFactory
             * @param {{generate: Function, is: Function}} config Configuration object for new phantom ID factory
             * @return {ResourcePhantomIdFactory} New phantom ID factory instance
             * @static
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
             * @param {Function} generateFn Function that returns a new, phantom ID. Gets the instance as the first parameter
             * @param {Function} isPhantomFn Function that checks if the first given parameter is a phantom ID. Gets the instance as the second parameter
             * @see ResourcePhantomIdNegativeInt
             * @see ResourcePhantomIdUuid4
             * @class
             * @example
             * // ResourcePhantomIdFactory that creates negative IDs as phantom IDs (NOTE: this is already a build-in
             * // phantom ID factory, so you do not have to implement this)
             * inject(function (ResourceFactoryService, ResourcePhantomIdFactoryService) {
             *     var
             *         lastPkValue = 0,
             *         generator = ResourcePhantomIdFactoryService.createPhantomIdFactory({
             *             generate: function () {
             *                 return --lastPkValue;
             *             },
             *             is: function (pkValue) {
             *                 return pkValue < 0;
             *             }
             *         }),
             *         service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
             *             phantomIdGenerator: generator
             *         }),
             *         phantomInstance1 = service.new(),
             *         phantomInstance2 = service.new();
             *
             *     expect(phantomInstance1.$isPhantom()).toBe(true);
             *     expect(phantomInstance2.$isPhantom()).toBe(true);
             *
             *     // Change IDs to non-negative numbers
             *     phantomInstance1.pk = 1;
             *     phantomInstance2.pk = 2;
             *
             *     expect(phantomInstance1.$isPhantom()).toBe(false);
             *     expect(phantomInstance2.$isPhantom()).toBe(false);
             * });
             */
            function ResourcePhantomIdFactory (generateFn, isPhantomFn) {
                var
                    self = this;

                /**
                 * Generates a new phantom PK value
                 *
                 * @memberof ResourcePhantomIdFactory
                 * @function generate
                 * @param {ResourceInstance} instance Instance to generate the phantom ID for
                 * @return {String|int}
                 * @instance
                 */
                self.generate = function (instance) {
                    return generateFn(instance);
                };

                /**
                 * Checks if the given PK value on the given instance is a phantom PK value
                 *
                 * @memberof ResourcePhantomIdFactory
                 * @function isPhantom
                 * @param {String|int} pkValue ID value to check
                 * @param {ResourceInstance} instance Instance to work on
                 * @return {*}
                 * @instance
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
     * @ngdoc object
     * @param {ResourcePhantomIdFactoryService} ResourcePhantomIdFactoryService Phantom ID factory service
     */
    module.factory('ResourcePhantomIdNegativeInt',
        function (ResourcePhantomIdFactoryService) {
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
        }
    );

    /**
     * Resource phantom id generator that generates UUID4 IDs
     *
     * @name ResourcePhantomIdUuid4
     * @ngdoc object
     * @param {ResourcePhantomIdFactoryService} ResourcePhantomIdFactoryService Phantom ID factory service
     */
    module.factory('ResourcePhantomIdUuid4',
        function (ResourcePhantomIdFactoryService) {
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
        }
    );
})();
