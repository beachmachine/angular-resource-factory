describe("ResourceCacheService",
    function () {
        'use strict';

        var
            $httpBackend,
            $rootScope;

        // Load the angular module before each test
        beforeEach(module('ngResourceFactory'));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get('$httpBackend');
            $rootScope = $injector.get('$rootScope');
        }));

        it("Does cache query calls without data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    queryFilters = {
                        filter: 1
                    },
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: null
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1}, {pk: 2}], {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, [{pk: 1}, {pk: 2}], {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        // query data
                        return service.query(queryFilters).$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        // get data from cache
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        // get data from cache
                        return service.query(queryFilters).$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does cache query calls with data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    queryFilters = {
                        filter: 1
                    },
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        useDataAttrForList: true,
                        useDataAttrForDetail: false
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1}, {pk: 2}]}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, {data: [{pk: 1}, {pk: 2}]}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        // query data
                        return service.query(queryFilters).$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        // get data from cache
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        // get data from cache
                        return service.query(queryFilters).$promise
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does cache detail calls without data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    queryFilters = {
                        filter: 1
                    },
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: null
                    });

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1, toCheck: 'ok-1'}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/?filter=1').respond(200, {pk: 1, toCheck: 'ok-1'}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(function () {
                        // query data
                        return service.get(angular.extend({pk: 1}, queryFilters)).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}, queryFilters).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does cache detail calls with data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    queryFilters = {
                        filter: 1
                    },
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        useDataAttrForList: false,
                        useDataAttrForDetail: true
                    });

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {data: {pk: 1, toCheck: 'ok-1'}}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/?filter=1').respond(200, {data: {pk: 1, toCheck: 'ok-1'}}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(function () {
                        // query data
                        return service.get(angular.extend({pk: 1}, queryFilters)).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}, queryFilters).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does refresh list cache without data attribute with detail object without data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: null,
                        urlAttr: 'url'
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1, url: 'http://test/1/', toCheck: 'old'}, {pk: 2, url: 'http://test/2/', toCheck: 'old'}], {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/?c=1').respond(200, {pk: 1, url: 'http://test/1/', toCheck: 'new'}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('old');
                    })
                    .then(function () {
                        // query data
                        return service.get({pk: 1, c: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('new');
                    })
                    .then(function () {
                        // get data from cache
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('new');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does refresh list cache with data attribute with detail object without data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        urlAttr: 'url',
                        useDataAttrForList: true,
                        useDataAttrForDetail: false
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1, url: 'http://test/1/', toCheck: 'old'}, {pk: 2, url: 'http://test/2/', toCheck: 'old'}]}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/?c=1').respond(200, {pk: 1, url: 'http://test/1/', toCheck: 'new'}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('old');
                    })
                    .then(function () {
                        // query data
                        return service.get({pk: 1, c: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('new');
                    })
                    .then(function () {
                        // get data from cache
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('new');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does refresh list cache without data attribute with detail object with data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        urlAttr: 'url',
                        useDataAttrForList: false,
                        useDataAttrForDetail: true
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1, url: 'http://test/1/', toCheck: 'old'}, {pk: 2, url: 'http://test/2/', toCheck: 'old'}], {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/?c=1').respond(200, {data: {pk: 1, url: 'http://test/1/', toCheck: 'new'}}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('old');
                    })
                    .then(function () {
                        // query data
                        return service.get({pk: 1, c: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('new');
                    })
                    .then(function () {
                        // get data from cache
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('new');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does refresh list cache with data attribute with detail object with data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        urlAttr: 'url',
                        useDataAttrForList: true,
                        useDataAttrForDetail: true
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1, url: 'http://test/1/', toCheck: 'old'}, {pk: 2, url: 'http://test/2/', toCheck: 'old'}]}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/?c=1').respond(200, {data: {pk: 1, url: 'http://test/1/', toCheck: 'new'}}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('old');
                    })
                    .then(function () {
                        // query data
                        return service.get({pk: 1, c: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('new');
                    })
                    .then(function () {
                        // get data from cache
                        return service.query().$promise
                    })
                    .then(function (result) {
                        expect(result[0].toCheck).toBe('new');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does populate detail cache without data attribute from list cache without data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: null,
                        urlAttr: 'url'
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1, url: 'http://test/1/', toCheck: 'ok-1'}, {pk: 2, url: 'http://test/2/', toCheck: 'ok-2'}], {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does populate detail cache with data attribute from list cache without data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        urlAttr: 'url',
                        useDataAttrForList: false,
                        useDataAttrForDetail: true
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1, url: 'http://test/1/', toCheck: 'ok-1'}, {pk: 2, url: 'http://test/2/', toCheck: 'ok-2'}], {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does populate detail cache without data attribute from list cache with data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        urlAttr: 'url',
                        useDataAttrForList: true,
                        useDataAttrForDetail: false
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1, url: 'http://test/1/', toCheck: 'ok-1'}, {pk: 2, url: 'http://test/2/', toCheck: 'ok-2'}]}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does populate detail cache with data attribute from list cache with data attribute using url attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        urlAttr: 'url',
                        useDataAttrForList: true,
                        useDataAttrForDetail: true
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1, url: 'http://test/1/', toCheck: 'ok-1'}, {pk: 2, url: 'http://test/2/', toCheck: 'ok-2'}]}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        // query data
                        return service.query().$promise
                    })
                    .then(function () {
                        // get data from cache
                        return service.get({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    }
);
