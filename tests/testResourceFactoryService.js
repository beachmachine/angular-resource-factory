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
                expect(service.patch).toBeDefined();
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
                expect(instance.$patch).toBeDefined();
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
                expect(service.patchBg).toBeDefined();
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
                expect(instance.$patchBg).toBeDefined();
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

        it("Does generate working extra static REST method", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraMethods: {
                            extra: {
                                method: 'GET',
                                isArray: false
                            }
                        }
                    });

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1, toCheck: 'ok-1'});

                $q.when()
                    .then(function () {
                        return service.extra({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does generate working extra instance REST method", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        extraMethods: {
                            extra: {
                                method: 'GET',
                                isArray: false
                            }
                        }
                    }),
                    instance = service.new({pk: 1});

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1, toCheck: 'ok-1'});

                $q.when()
                    .then(function () {
                        return instance.$extra()
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does generate working customised pre-defined static REST method", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        useDataAttrForDetail: true,
                        extraMethods: {
                            update: {
                                method: 'POST' // default is 'PATCH'
                            }
                        }
                    });

                $httpBackend.expect('POST', 'http://test/1/').respond(200, {data: {pk: 1, toCheck: 'ok-1'}});

                $q.when()
                    .then(function () {
                        return service.update({pk: 1}).$promise
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does generate working customised pre-defined instance REST method", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        useDataAttrForDetail: true,
                        extraMethods: {
                            update: {
                                method: 'POST' // default is 'PATCH'
                            }
                        }
                    }),
                    instance = service.new({pk: 1});

                $httpBackend.expect('POST', 'http://test/1/').respond(200, {data: {pk: 1, toCheck: 'ok-1'}});

                $q.when()
                    .then(function () {
                        return instance.$update()
                    })
                    .then(function (result) {
                        expect(result.toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
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
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('Test1ResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1}, {pk: 2}]);

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does query with query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('Test2ResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, [{pk: 1}, {pk: 2}]);

                $q.when()
                    .then(function () {
                        return service.query({filter: 1}).$promise;
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does get without query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});
                $httpBackend.expect('GET', 'http://test/2/').respond(200, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function (result) {
                        result.pk = 2;
                        return result.$get();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does get with query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/1/?filter=1').respond(200, {pk: 1});
                $httpBackend.expect('GET', 'http://test/1/?filter=2').respond(200, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.get({pk: 1, filter: 1}).$promise;
                    })
                    .then(function (result) {
                        return result.$get({filter: 2});
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does save without query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.save(instance).$promise;
                    })
                    .then(function () {
                        return instance.$save();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does save with query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('POST', 'http://test/?filter=1').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/?filter=1').respond(201, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.save({filter: 1}, instance).$promise;
                    })
                    .then(function () {
                        return instance.$save({filter: 1});
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does update without query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('PATCH', 'http://test/1/').respond(201, {pk: 2});
                $httpBackend.expect('PATCH', 'http://test/1/').respond(201, {pk: 2});

                // Make the instance concrete
                instance.pk = 1;

                $q.when()
                    .then(function () {
                        return service.update(instance).$promise;
                    })
                    .then(function () {
                        return instance.$update();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does update with query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('PATCH', 'http://test/1/?filter=1').respond(201, {pk: 2});
                $httpBackend.expect('PATCH', 'http://test/1/?filter=1').respond(201, {pk: 2});

                // Make the instance concrete
                instance.pk = 1;

                $q.when()
                    .then(function () {
                        return service.update({filter: 1}, instance).$promise;
                    })
                    .then(function () {
                        return instance.$update({filter: 1});
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does remove without query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('DELETE', 'http://test/1/').respond(204, '');
                $httpBackend.expect('DELETE', 'http://test/1/').respond(204, '');

                // Make the instance concrete
                instance.pk = 1;

                $q.when()
                    .then(function () {
                        return service.remove(instance).$promise;
                    })
                    .then(function () {
                        return instance.$remove();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does remove with query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                $httpBackend.expect('DELETE', 'http://test/1/?filter=1').respond(204, '');
                $httpBackend.expect('DELETE', 'http://test/1/?filter=1').respond(204, '');

                // Make the instance concrete
                instance.pk = 1;

                $q.when()
                    .then(function () {
                        return service.remove({filter: 1}, instance).$promise;
                    })
                    .then(function () {
                        return instance.$remove({filter: 1});
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does persist without query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instanceToInsert = service.new(),
                    instanceToUpdate = service.new();

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});
                $httpBackend.expect('PATCH', 'http://test/1/').respond(200, {pk: 1});
                $httpBackend.expect('PATCH', 'http://test/1/').respond(200, {pk: 1});

                // Make the instance concrete
                instanceToUpdate.pk = 1;

                $q.when()
                    .then(function () {
                        return service.persist(instanceToInsert).$promise
                    })
                    .then(function () {
                        return instanceToInsert.$persist();
                    })
                    .then(function () {
                        return service.persist(instanceToUpdate).$promise
                    })
                    .then(function () {
                        return instanceToUpdate.$persist();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does persist with query params", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instanceToInsert = service.new(),
                    instanceToUpdate = service.new();

                $httpBackend.expect('POST', 'http://test/?filter=1').respond(201, {pk: 2});
                $httpBackend.expect('POST', 'http://test/?filter=1').respond(201, {pk: 2});
                $httpBackend.expect('PATCH', 'http://test/1/?filter=1').respond(200, {pk: 1});
                $httpBackend.expect('PATCH', 'http://test/1/?filter=1').respond(200, {pk: 1});

                // Make the instance concrete
                instanceToUpdate.pk = 1;

                $q.when()
                    .then(function () {
                        return service.persist({filter: 1}, instanceToInsert).$promise
                    })
                    .then(function () {
                        return instanceToInsert.$persist({filter: 1});
                    })
                    .then(function () {
                        return service.persist({filter: 1}, instanceToUpdate).$promise
                    })
                    .then(function () {
                        return instanceToUpdate.$persist({filter: 1});
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does post-process from RESTful API", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        toInternal: function (obj) {
                            obj.processed = true;
                            return obj;
                        }
                    });

                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function (result) {
                        expect(result.processed).toBe(true);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does post-process to RESTful API", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        fromInternal: function (obj) {
                            obj.processed = true;
                            return obj;
                        }
                    }),
                    instance = service.new();

                $httpBackend.expect('POST', 'http://test/', {pk: -1, processed: true}).respond(201, {pk: 1});

                $q.when()
                    .then(function () {
                        return service.save(instance).$promise;
                    })
                    .then(function (result) {
                        expect(result.pk).toBe(1);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
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
                $httpBackend.verifyNoOutstandingRequest();
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

                expect(service.getPkAttr()).toBe('id');

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
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does use 'data' as data attribute on query if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        useDataAttrForList: true,
                        useDataAttrForDetail: false,
                        dataAttr: 'data'
                    });

                expect(service.getDataAttr()).toBe('data');

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
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does use 'data' as data attribute on detail if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        useDataAttrForList: false,
                        useDataAttrForDetail: true,
                        dataAttr: 'data'
                    });

                expect(service.getDataAttr()).toBe('data');

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1}, {pk: 2}]);
                $httpBackend.expect('GET', 'http://test/1/').respond(200, {data: {pk: 1}});

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
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does use 'count' as query total attribute if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        queryTotalAttr: 'count'
                    });

                expect(service.getQueryTotalAttr()).toBe('count');

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
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does use shared filter object", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    queryFilters = {
                        filter: 1
                    },
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        queryFilter: queryFilters
                    });

                expect(service.getQueryFilters()).toBe(queryFilters);

                $httpBackend.expect('GET', 'http://test/?filter=1').respond(200, [{pk: 1}, {pk: 2}]);

                $q.when()
                    .then(function () {
                        return service.filter().$promise
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
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

                expect(service.getCacheClass()).toBe(cache);
                expect(cacheInstantiated).toBe(true);
            });
        });

        it("Does filter instances by attribute", function () {
            inject(function (ResourceFactoryService) {
                var
                    instances = [{pk: 1, data: true}, {pk: 2, data: true}, {pk: 3, data: false}],
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                expect(service.filterInstancesByAttr(instances, 'data', true).length).toBe(2);
            });
        });

        it("Does get instance by attribute", function () {
            inject(function (ResourceFactoryService) {
                var
                    instances = [{pk: 1, data: true}, {pk: 2, data: true}, {pk: 3, data: false}],
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                expect(service.getInstanceByAttr(instances, 'data', false).pk).toBe(3);
            });
        });

        it("Does get instance by primary key attribute", function () {
            inject(function (ResourceFactoryService) {
                var
                    instances = [{pk: 1, data: true}, {pk: 2, data: true}, {pk: 3, data: false}],
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                expect(service.getInstanceByPk(instances, 1).pk).toBe(1);
            });
        });

        it("Does get resource name", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                expect(service.getResourceName()).toBe('TestResourceService');
            });
        });

        it("Does map extra param defaults with same name on instance", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:attr1/:attr2/:pk/', {
                        extraParamDefaults: {
                            attr1: '@attr1',
                            attr2: '@attr2'
                        }
                    }),
                    instance = service.new({
                        pk: 1,
                        attr1: 2,
                        attr2: 'three'
                    });

                $httpBackend.expect('POST', 'http://test/2/three/').respond(200, {pk: 1, attr1: 2, attr2: 'three'});
                $httpBackend.expect('PATCH', 'http://test/2/three/1/').respond(200, {pk: 1, attr1: 2, attr2: 'three'});

                $q.when()
                    .then(function () {
                        return instance.$save();
                    })
                    .then(function () {
                        return instance.$update();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does map extra param defaults with different name on instance", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:attr1/:attr2/:pk/', {
                        extraParamDefaults: {
                            attr1: '@prop1',
                            attr2: '@prop2'
                        }
                    }),
                    instance = service.new({
                        pk: 1,
                        prop1: 2,
                        prop2: 'three'
                    });

                $httpBackend.expect('POST', 'http://test/2/three/').respond(200, {pk: 1, prop1: 2, prop2: 'three'});
                $httpBackend.expect('PATCH', 'http://test/2/three/1/').respond(200, {pk: 1, prop1: 2, prop2: 'three'});

                $q.when()
                    .then(function () {
                        return instance.$save();
                    })
                    .then(function () {
                        return instance.$update();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does find first instance from cache by primary key attribute without data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1, toCheck: 'ok-1'}, {pk: 2, toCheck: 'ok-2'}], {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1, toCheck: 'ok-1'}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function () {
                        expect(service.firstFromCacheByPk(1).toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does find all instances from cache by primary key attribute without data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/');

                $httpBackend.expect('GET', 'http://test/').respond(200, [{pk: 1, toCheck: 'ok-1'}, {pk: 2, toCheck: 'ok-2'}], {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/').respond(200, {pk: 1, toCheck: 'ok-1'}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function () {
                        var
                            result = service.findFromCacheByPk(1);

                        expect(result.length).toBe(2);
                        expect(result[0].toCheck).toBe('ok-1');
                        expect(result[1].toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does find first instance from cache by primary key attribute with data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        useDataAttrForDetail: true,
                        useDataAttrForList: true
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1, toCheck: 'ok-1'}, {pk: 2, toCheck: 'ok-2'}]}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/').respond(200, {data: {pk: 1, toCheck: 'ok-1'}}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function () {
                        expect(service.firstFromCacheByPk(1).toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does find all instances from cache by primary key attribute with data attribute", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        dataAttr: 'data',
                        useDataAttrForDetail: true,
                        useDataAttrForList: true
                    });

                $httpBackend.expect('GET', 'http://test/').respond(200, {data: [{pk: 1, toCheck: 'ok-1'}, {pk: 2, toCheck: 'ok-2'}]}, {
                    'content-type': 'application/json'
                });
                $httpBackend.expect('GET', 'http://test/1/').respond(200, {data: {pk: 1, toCheck: 'ok-1'}}, {
                    'content-type': 'application/json'
                });

                $q.when()
                    .then(function () {
                        return service.query().$promise;
                    })
                    .then(function () {
                        return service.get({pk: 1}).$promise;
                    })
                    .then(function () {
                        var
                            result = service.findFromCacheByPk(1);

                        expect(result.length).toBe(2);
                        expect(result[0].toCheck).toBe('ok-1');
                        expect(result[1].toCheck).toBe('ok-1');
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    }
);
