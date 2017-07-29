describe("ResourceStoreRelation",
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

        it("Does get store", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    store = service.createStore(),
                    relatedStore = relatedService.createStore(),
                    relation = store.createRelation({
                        relatedStore: relatedStore,
                        fkAttr: 'fk'
                    });

                expect(relation.getStore()).toBe(store);
            });
        });

        it("Does get related store", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    store = service.createStore(),
                    relatedStore = relatedService.createStore(),
                    relation = store.createRelation({
                        relatedStore: relatedStore,
                        fkAttr: 'fk'
                    });

                expect(relation.getRelatedStore()).toBe(relatedStore);
            });
        });

        it("Does get foreign key attribute", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    store = service.createStore(),
                    relatedStore = relatedService.createStore(),
                    relation = store.createRelation({
                        relatedStore: relatedStore,
                        fkAttr: 'fk'
                    });

                expect(relation.getFkAttr()).toBe('fk');
            });
        });

        it("Does update foreign key attribute on save if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new({fk: instance1.pk}),
                    relatedInstance2 = relatedService.new({fk: instance2.pk}),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]);

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk',
                    onUpdate: 'update'
                });

                $q.when()
                    .then(function () {
                        expect(relatedInstance1.fk).toBe(-1);
                        expect(relatedInstance2.fk).toBe(-2);
                    })
                    .then(function () {
                        store.persist(instance1);
                        store.persist(instance2);
                    })
                    .then(function () {
                        return store.execute();
                    })
                    .then(function () {
                        expect(relatedInstance1.fk).toBe(1);
                        expect(relatedInstance2.fk).toBe(2);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does set foreign key attribute to null on save if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new({fk: instance1.pk}),
                    relatedInstance2 = relatedService.new({fk: instance2.pk}),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]);

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk',
                    onUpdate: 'null'
                });

                $q.when()
                    .then(function () {
                        expect(relatedInstance1.fk).toBe(-1);
                        expect(relatedInstance2.fk).toBe(-2);
                    })
                    .then(function () {
                        store.persist(instance1);
                        store.persist(instance2);
                    })
                    .then(function () {
                        return store.execute();
                    })
                    .then(function () {
                        expect(relatedInstance1.fk).toBe(null);
                        expect(relatedInstance2.fk).toBe(null);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does call custom function on save if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new({fk: instance1.pk}),
                    relatedInstance2 = relatedService.new({fk: instance2.pk}),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]),
                    callCount = 0,
                    callback = function (store, instance, oldReferencedInstancePk, newReferencedInstancePk, fkAttr) {
                        expect(store).toBe(relatedStore);
                        expect(instance).toBe(relatedInstance1);
                        expect(oldReferencedInstancePk).toBe(-1);
                        expect(newReferencedInstancePk).toBe(1);
                        expect(fkAttr).toBe('fk');

                        callCount++;
                    };

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk',
                    onUpdate: callback
                });

                $q.when()
                    .then(function () {
                        store.persist(instance1);
                    })
                    .then(function () {
                        return store.execute();
                    })
                    .then(function () {
                        expect(callCount).toBe(1);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does forget related instance on remove if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new(),
                    relatedInstance2 = relatedService.new(),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]);

                $httpBackend.expect('DELETE', 'http://test/1/').respond(204, '');

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk',
                    onRemove: 'forget'
                });

                instance1.pk = 1;
                instance2.pk = 2;

                relatedInstance1.fk = 1;
                relatedInstance2.fk = 2;

                $q.when()
                    .then(function () {
                        expect(relatedStore.getManagedInstances().length).toBe(2);
                    })
                    .then(function () {
                        store.remove(instance1);
                    })
                    .then(function () {
                        return store.execute();
                    })
                    .then(function () {
                        expect(relatedStore.getManagedInstances().length).toBe(1);
                        expect(relatedStore.getManagedInstances()[0]).toBe(relatedInstance2);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does set foreign key attribute to null on remove if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new(),
                    relatedInstance2 = relatedService.new(),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]);

                $httpBackend.expect('DELETE', 'http://test/1/').respond(204, '');

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk',
                    onRemove: 'null'
                });

                instance1.pk = 1;
                instance2.pk = 2;

                relatedInstance1.fk = 1;
                relatedInstance2.fk = 2;

                $q.when()
                    .then(function () {
                        expect(relatedStore.getManagedInstances().length).toBe(2);
                    })
                    .then(function () {
                        store.remove(instance1);
                    })
                    .then(function () {
                        return store.execute();
                    })
                    .then(function () {
                        expect(relatedStore.getManagedInstances().length).toBe(2);
                        expect(relatedInstance1.fk).toBe(null);
                        expect(relatedInstance2.fk).toBe(2);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does call custom function on remove if configured so", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new({fk: instance1.pk}),
                    relatedInstance2 = relatedService.new({fk: instance2.pk}),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]),
                    callCount = 0,
                    callback = function (store, instance, oldReferencedInstancePk, fkAttr) {
                        expect(store).toBe(relatedStore);
                        expect(instance).toBe(relatedInstance1);
                        expect(oldReferencedInstancePk).toBe(1);
                        expect(fkAttr).toBe('fk');

                        callCount++;
                    };

                $httpBackend.expect('DELETE', 'http://test/1/').respond(204, '');

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk',
                    onRemove: callback
                });

                instance1.pk = 1;
                instance2.pk = 2;

                relatedInstance1.fk = 1;
                relatedInstance2.fk = 2;

                $q.when()
                    .then(function () {
                        store.remove(instance1);
                    })
                    .then(function () {
                        return store.execute();
                    })
                    .then(function () {
                        expect(callCount).toBe(1);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does execute store and related store in that order", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    relatedService = ResourceFactoryService('RelatedTestResourceService', 'http://relatedtest/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    relatedInstance1 = relatedService.new({fk: instance1.pk}),
                    relatedInstance2 = relatedService.new({fk: instance2.pk}),
                    store = service.createStore([instance1, instance2]),
                    relatedStore = relatedService.createStore([relatedInstance1, relatedInstance2]);

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});
                $httpBackend.expect('POST', 'http://relatedtest/').respond(201, {pk: 1, fk: 1});
                $httpBackend.expect('POST', 'http://relatedtest/').respond(201, {pk: 2, fk: 2});

                store.createRelation({
                    relatedStore: relatedStore,
                    fkAttr: 'fk'
                });

                $q.when()
                    .then(function () {
                        store.persist(instance1);
                        store.persist(instance2);
                        relatedStore.persist(relatedInstance1);
                        relatedStore.persist(relatedInstance2);
                    })
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    }
);
