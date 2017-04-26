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
    }
);
