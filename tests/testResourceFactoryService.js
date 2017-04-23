describe("Test ResourceFactoryService",
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

        it("Default RESTful methods existing", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                // Test class methods
                expect(service.restore).toBeDefined();
                expect(service.get).toBeDefined();
                expect(service.getNoCache).toBeDefined();
                expect(service.query).toBeDefined();
                expect(service.queryNoCache).toBeDefined();
                expect(service.save).toBeDefined();
                expect(service.update).toBeDefined();
                expect(service.remove).toBeDefined();

                // Test instance methods
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

        it("Background RESTful methods existing", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance = service.new();

                // Test class methods
                expect(service.restoreBg).toBeDefined();
                expect(service.getBg).toBeDefined();
                expect(service.getNoCacheBg).toBeDefined();
                expect(service.queryBg).toBeDefined();
                expect(service.queryNoCacheBg).toBeDefined();
                expect(service.saveBg).toBeDefined();
                expect(service.updateBg).toBeDefined();
                expect(service.removeBg).toBeDefined();

                // Test instance methods
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

        it("Query method without query params", function (done) {
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

        it("Query method with query params", function (done) {
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

        it("Get method without query params", function (done) {
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

        it("Get method with query params", function (done) {
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

        it("Save method without query params", function (done) {
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

        it("Save method with query params", function (done) {
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

        it("Update method without query params", function (done) {
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

        it("Update method with query params", function (done) {
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

        it("Remove method without query params", function (done) {
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

        it("Remove method with query params", function (done) {
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

        it("Post-process from RESTful API", function (done) {
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

        it("Post-process to RESTful API", function (done) {
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

    }
);
