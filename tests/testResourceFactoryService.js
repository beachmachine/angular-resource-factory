describe("ResourceFactoryService",
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

        it("Does have all static REST methods", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                expect(service.restore).toBeDefined();
                expect(service.get).toBeDefined();
                expect(service.getNoCache).toBeDefined();
                expect(service.query).toBeDefined();
                expect(service.queryNoCache).toBeDefined();
                expect(service.save).toBeDefined();
                expect(service.update).toBeDefined();
                expect(service.remove).toBeDefined();
            });
        });

        it("Does have all instance REST methods", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                expect(instance.$restore).toBeDefined();
                expect(instance.$get).toBeDefined();
                expect(instance.$getNoCache).toBeDefined();
                expect(instance.$query).toBeDefined();
                expect(instance.$queryNoCache).toBeDefined();
                expect(instance.$save).toBeDefined();
                expect(instance.$update).toBeDefined();
                expect(instance.$remove).toBeDefined();
            });
        });

        it("Does have all static background REST methods", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                // Test class methods
                expect(service.restoreBg).toBeDefined();
                expect(service.getBg).toBeDefined();
                expect(service.getNoCacheBg).toBeDefined();
                expect(service.queryBg).toBeDefined();
                expect(service.queryNoCacheBg).toBeDefined();
                expect(service.saveBg).toBeDefined();
                expect(service.updateBg).toBeDefined();
                expect(service.removeBg).toBeDefined();
            });
        });

        it("Does have all instance background REST methods", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                expect(instance.$restoreBg).toBeDefined();
                expect(instance.$getBg).toBeDefined();
                expect(instance.$getNoCacheBg).toBeDefined();
                expect(instance.$queryBg).toBeDefined();
                expect(instance.$queryNoCacheBg).toBeDefined();
                expect(instance.$saveBg).toBeDefined();
                expect(instance.$updateBg).toBeDefined();
                expect(instance.$removeBg).toBeDefined();
            });
        });

        it("Does generate extra static background REST method", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraMethods: {
                            extra: {
                                method: 'GET',
                                isArray: false
                            }
                        }
                    });

                expect(service.extraBg).toBeDefined();
            });
        });

        it("Does generate extra instance background REST method", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraMethods: {
                            extra: {
                                method: 'GET',
                                isArray: false
                            }
                        }
                    }),
                    instance = service.new();

                expect(instance.$extraBg).toBeDefined();
            });
        });

        it("Does generate extra instance functions", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraFunctions: {
                            extra: function () { }
                        }
                    }),
                    instance = service.new();

                expect(instance.extra).toBeDefined();
            });
        });

        it("Does query without query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1}, {pk: 2}, {pk:3}]);

                service.query().$promise
                    .then(function (result) {
                        expect(result.length).toBe(3);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does query with query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, [{pk: 1}, {pk: 2}]);

                service.query({filter: 1}).$promise
                    .then(function (result) {
                        expect(result.length).toBe(2);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does get without query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});

                service.get({pk: 1}).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does get with query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/1/?filter=1').respond(200, {pk: 1});

                service.get({pk: 1, filter: 1}).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does save without query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});

                service.save(instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does save with query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('POST', 'http://test/?filter=1').respond(201, {pk: 1});

                service.save({filter: 1}, instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does update without query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('PATCH', 'http://test/1/').respond(201, {pk: 2});

                // Make the instance concrete
                instance.pk = 1;

                service.update(instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(2);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does update with query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('PATCH', 'http://test/1/?filter=1').respond(201, {pk: 2});

                // Make the instance concrete
                instance.pk = 1;

                service.update({filter: 1}, instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(2);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does remove without query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('DELETE', 'http://test/1/').respond(201, {pk: 2});

                // Make the instance concrete
                instance.pk = 1;

                service.remove(instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(2);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does remove with query params", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('DELETE', 'http://test/1/?filter=1').respond(201, {pk: 2});

                // Make the instance concrete
                instance.pk = 1;

                service.remove({filter: 1}, instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(2);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does post-process from RESTful API", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        toInternal: function (obj) {
                            obj.processed = true;
                            return obj;
                        }
                    });

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});

                service.get({pk: 1}).$promise
                    .then(function (result) {
                        expect(result.processed).toBe(true);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does post-process to RESTful API", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        fromInternal: function (obj) {
                            obj.processed = true;
                            return obj;
                        }
                    }),
                    instance = service.new();

                $httpBackend.expect('POST', 'http://test/', {pk: -1, processed: true}).respond(201, {pk: 1});

                service.save(instance).$promise
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does strip trailing slashes if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        stripTrailingSlashes: true
                    });

                $httpBackend.expect('GET', 'http://test').respond(200, [{pk: 1}, {pk: 2}]);
                $httpBackend.expect('GET', 'http://test/1').respond(200, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                    })
                    .then(done);

                $httpBackend.flush();
            });
        });

        it("Does not generate phantom IDs if configured so", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        generatePhantomIds: false
                    }),
                    instance = service.new();

                expect(instance.pk).not.toBeDefined();
            });
        });

        it("Does generate extra static REST method", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraMethods: {
                            extra: {
                                method: 'GET',
                                isArray: false
                            }
                        }
                    });

                expect(service.extra).toBeDefined();
            });
        });

        it("Does generate extra instance REST method", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraMethods: {
                            extra: {
                                method: 'GET',
                                isArray: false
                            }
                        }
                    }),
                    instance = service.new();

                expect(instance.$extra).toBeDefined();
            });
        });

        it("Does use 'id' as primary key attribute if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:id/', {
                        pkAttr: 'id'
                    }),
                    instance = service.new();

                $httpBackend.expect('GET', 'http://test/').respond(200, [{id: 1}, {id: 2}]);
                $httpBackend.expect('PATCH', 'http://test/1/', {id: 1}).respond(200, {id: 1});
                $httpBackend.expect('POST', 'http://test/', {id: -1}).respond(201, {id: 3});

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function (result) {
                        return service.update(service.getInstanceByPk(result, 1)).$promise;
                    })
                    .then(function () {
                        return service.save(instance).$promise;
                    })
                    .then(done);

                $httpBackend.flush();
            });
        });

        it("Does use 'data' as query data attribute if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        queryDataAttr: 'data'
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1}, {pk: 2}]});
                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function (result) {
                        expect(result.length).toBe(2);
                    })
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                    })
                    .then(done);

                $httpBackend.flush();
            });
        });

        it("Does use 'count' as query total attribute if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        queryDataAttr: 'data',
                        queryTotalAttr: 'count'
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {count: 50, data: [{pk: 1}, {pk: 2}]});

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function (result) {
                        expect(result.total).toBe(50);
                    })
                    .then(done);

                $httpBackend.flush();
            });
        });

        it("Does use shared filter object", function (done) {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        queryFilter: {
                            filter: 1
                        }
                    });

                $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, [{pk: 1}, {pk: 2}]);

                service.filter().$promise
                    .then(function (result) {
                        expect(result.length).toBe(2);
                        done();
                    });

                $httpBackend.flush();
            });
        });

        it("Does use custom cache class if configured so", function () {
            inject(function (ResourceFactoryService, ResourceCacheService) {
                var
                    cacheInstantiated = false,
                    cache = function () {
                        ResourceCacheService.bind(this, arguments);
                        cacheInstantiated = true;
                    },
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        cacheClass: cache
                    });

                expect(cacheInstantiated).toBe(true);
            });
        });

    }
);
