describe("ResourceStore",
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

        it("Does manage instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                expect(instance1.$store).toBe(store);
                expect(instance2.$store).toBe(store);
                expect(store.getManagedInstances().length).toBe(2);
            });
        });

        it("Does add to visible queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does add to remove queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.remove(instance1);
                store.remove(instance2);

                expect(store.getVisibleQueue().length).toBe(0);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(2);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does add to save queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.persist(instance1);
                store.persist(instance2);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(2);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(2);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does add to update queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                instance1.pk = 1;
                instance2.pk = 2;

                store.persist(instance1);
                store.persist(instance2);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(2);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(2);
            });
        });

        it("Does move from save queue to remove queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.persist(instance1);
                store.persist(instance2);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(2);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(2);
                expect(store.getUpdateQueue().length).toBe(0);

                store.remove(instance1);
                store.remove(instance2);

                expect(store.getVisibleQueue().length).toBe(0);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(2);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does move from update queue to remove queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                instance1.pk = 1;
                instance2.pk = 2;

                store.persist(instance1);
                store.persist(instance2);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(2);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(2);

                store.remove(instance1);
                store.remove(instance2);

                expect(store.getVisibleQueue().length).toBe(0);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(2);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does move from remove queue to save queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.remove(instance1);
                store.remove(instance2);

                expect(store.getVisibleQueue().length).toBe(0);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(2);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);

                store.persist(instance1);
                store.persist(instance2);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(2);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(2);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does move from remove queue to update queue", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                instance1.pk = 1;
                instance2.pk = 2;

                store.remove(instance1);
                store.remove(instance2);

                expect(store.getVisibleQueue().length).toBe(0);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(2);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);

                store.persist(instance1);
                store.persist(instance2);

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(2);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(2);
            });
        });

        it("Does create child store", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]),
                    childStore = store.createChildStore();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].$store).toBe(store);
                    expect(childStore.getManagedInstances()[i].$store).toBe(childStore);
                }
            });
        });

        it("Does copy public attributes to child store instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store,
                    childStore;

                instance1.publicAttr = 'value';
                instance2.publicAttr = 'value';

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].publicAttr).toBe('value');
                    expect(childStore.getManagedInstances()[i].publicAttr).toBe('value');
                }
            });
        });

        it("Does not copy private attributes to child store instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store,
                    childStore;

                instance1.$privateAttr = 'value';
                instance2.$privateAttr = 'value';

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].$privateAttr).toBe('value');
                    expect(childStore.getManagedInstances()[i].$privateAttr).not.toBeDefined();
                }
            });
        });

        it("Does commit public attributes to parent store instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    childInstance1,
                    childInstance2,
                    store,
                    childStore;

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                childInstance1 = childStore.getManagedInstances()[0];
                childInstance2 = childStore.getManagedInstances()[1];

                childInstance1.publicAttr = 'value';
                childInstance2.publicAttr = 'value';

                childStore.persist(childInstance1);
                childStore.persist(childInstance2);
                childStore.commit();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].publicAttr).toBe('value');
                    expect(childStore.getManagedInstances()[i].publicAttr).toBe('value');
                }
            });
        });

        it("Does not commit private attributes to parent store instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    childInstance1,
                    childInstance2,
                    store,
                    childStore;

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                childInstance1 = childStore.getManagedInstances()[0];
                childInstance2 = childStore.getManagedInstances()[1];

                childInstance1.$privateAttr = 'value';
                childInstance2.$privateAttr = 'value';

                childStore.persist(childInstance1);
                childStore.persist(childInstance2);
                childStore.commit();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].$privateAttr).not.toBeDefined();
                    expect(childStore.getManagedInstances()[i].$privateAttr).toBe('value');
                }
            });
        });

        it("Does overwrite conflicting public attributes on parent store instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    childInstance1,
                    childInstance2,
                    store,
                    childStore;

                instance1.publicAttr = 'value';
                instance2.publicAttr = 'value';

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                childInstance1 = childStore.getManagedInstances()[0];
                childInstance2 = childStore.getManagedInstances()[1];

                childInstance1.publicAttr = 'changed value';
                childInstance2.publicAttr = 'changed value';

                childStore.persist(childInstance1);
                childStore.persist(childInstance2);
                childStore.commit();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].publicAttr).toBe('changed value');
                    expect(childStore.getManagedInstances()[i].publicAttr).toBe('changed value');
                }
            });
        });

        it("Does keep conflicting private attributes on parent store instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    childInstance1,
                    childInstance2,
                    store,
                    childStore;

                instance1.$privateAttr = 'value';
                instance2.$privateAttr = 'value';

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                childInstance1 = childStore.getManagedInstances()[0];
                childInstance2 = childStore.getManagedInstances()[1];

                childInstance1.$privateAttr = 'changed value';
                childInstance2.$privateAttr = 'changed value';

                childStore.persist(childInstance1);
                childStore.persist(childInstance2);
                childStore.commit();

                for (var i = 0; i < 2; i++) {
                    expect(store.getManagedInstances()[i].$privateAttr).toBe('value');
                    expect(childStore.getManagedInstances()[i].$privateAttr).toBe('changed value');
                }
            });
        });

        it("Does commit add queue from child store to parent store", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    addChildInstance,
                    store,
                    childStore;

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();
                addChildInstance = childStore.new();

                childStore.persist(addChildInstance);
                childStore.commit();

                expect(store.getVisibleQueue().length).toBe(3);
                expect(store.getPersistQueue().length).toBe(1);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(1);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does commit update queue from child store to parent store", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    updateChildInstance,
                    store,
                    childStore;

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();
                updateChildInstance = childStore.new();

                updateChildInstance.pk = 1;

                childStore.persist(updateChildInstance);
                childStore.commit();

                expect(store.getVisibleQueue().length).toBe(3);
                expect(store.getPersistQueue().length).toBe(1);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(1);
            });
        });

        it("Does commit remove queue from child store to parent store", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    removeChildInstance,
                    store,
                    childStore;

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();
                removeChildInstance = childStore.new();

                childStore.remove(removeChildInstance);
                childStore.commit();

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(1);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does not commit instances from child store to parent store not marked for change", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    childInstance1,
                    childInstance2,
                    store,
                    childStore;

                instance1.$privateAttr = 'value';
                instance2.$privateAttr = 'value';

                store = service.createStore([instance1, instance2]);
                childStore = store.createChildStore();

                childInstance1 = childStore.getManagedInstances()[0];
                childInstance2 = childStore.getManagedInstances()[1];

                childInstance1.$privateAttr = 'changed value';
                childInstance2.$privateAttr = 'changed value';

                childStore.commit();

                expect(store.getVisibleQueue().length).toBe(2);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does forget managed instance", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.forget(instance1);

                expect(instance1.$store).not.toBeDefined();
                expect(store.getVisibleQueue().length).toBe(1);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does forget managed instances", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.forget([instance1]);

                expect(instance1.$store).not.toBeDefined();
                expect(store.getVisibleQueue().length).toBe(1);
                expect(store.getPersistQueue().length).toBe(0);
                expect(store.getRemoveQueue().length).toBe(0);
                expect(store.getSaveQueue().length).toBe(0);
                expect(store.getUpdateQueue().length).toBe(0);
            });
        });

        it("Does get instance by primary key attribute", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                expect(store.getByPk(instance1.pk)).toBe(instance1);
            });
        });

        it("Does get instance by instance copy", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                expect(store.getByInstance(angular.copy(instance1))).toBe(instance1);
            });
        });

        it("Does execute multiple saves", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});

                store.persist(instance1);
                store.persist(instance2);

                $q.when()
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does execute multiple updates", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                $httpBackend.expect('PATCH', 'http://test/1/').respond(200, {pk: 1});
                $httpBackend.expect('PATCH', 'http://test/2/').respond(200, {pk: 2});

                instance1.pk = 1;
                instance2.pk = 2;

                store.persist(instance1);
                store.persist(instance2);

                $q.when()
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does execute multiple removes", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                $httpBackend.expect('DELETE', 'http://test/1/').respond(204, '');
                $httpBackend.expect('DELETE', 'http://test/2/').respond(204, '');

                instance1.pk = 1;
                instance2.pk = 2;

                store.remove(instance1);
                store.remove(instance2);

                $q.when()
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does not execute remove for phantom instances", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                store.remove(instance1);
                store.remove(instance2);

                $q.when()
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(done);

                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does execute remove, update and save in that order", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    instance3 = service.new(),
                    store = service.createStore([instance1, instance2, instance3]);

                $httpBackend.expect('DELETE', 'http://test/2/').respond(204, '');
                $httpBackend.expect('PATCH', 'http://test/1/').respond(200, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});

                instance1.pk = 1;
                instance2.pk = 2;

                store.remove(instance2);
                store.persist(instance1);
                store.persist(instance3);

                $q.when()
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        it("Does set primary key attribute after save", function (done) {
            inject(function (ResourceFactoryService, $q) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    instance1 = service.new(),
                    instance2 = service.new(),
                    store = service.createStore([instance1, instance2]);

                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 1});
                $httpBackend.expect('POST', 'http://test/').respond(201, {pk: 2});

                store.persist(instance1);
                store.persist(instance2);

                $q.when()
                    .then(function () {
                        return store.executeAll();
                    })
                    .then(function () {
                        expect(instance1.pk).toBe(1);
                        expect(instance2.pk).toBe(2);
                    })
                    .then(done);

                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    }
);
