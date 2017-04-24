describe("ResourcePhantomIdFactoryService",
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

        it("Does generate phantom IDs with default phantom ID generator", function () {
            inject(function (ResourceFactoryService) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/'),
                    phantomInstance1 = service.new(),
                    phantomInstance2 = service.new();

                // Test if IDs are negative
                expect(phantomInstance1.pk).toBe(-1);
                expect(phantomInstance2.pk).toBe(-2);

                // Test if instances are marked as phantom
                expect(phantomInstance1.$isPhantom()).toBe(true);
                expect(phantomInstance2.$isPhantom()).toBe(true);

                // Change IDs
                phantomInstance1.pk = 1;
                phantomInstance2.pk = 2;

                // Test if instances are marked as concrete for positive IDs
                expect(phantomInstance1.$isPhantom()).toBe(false);
                expect(phantomInstance2.$isPhantom()).toBe(false);
            });
        });

        it("Does generate phantom IDs with negative integer phantom ID generator", function () {
            inject(function (ResourceFactoryService, ResourcePhantomIdNegativeInt) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        phantomIdGenerator: ResourcePhantomIdNegativeInt
                    }),
                    phantomInstance1 = service.new(),
                    phantomInstance2 = service.new();

                // Test if IDs are negative
                expect(phantomInstance1.pk).toBe(-1);
                expect(phantomInstance2.pk).toBe(-2);

                // Test if instances are marked as phantom
                expect(phantomInstance1.$isPhantom()).toBe(true);
                expect(phantomInstance2.$isPhantom()).toBe(true);

                // Change IDs
                phantomInstance1.pk = 1;
                phantomInstance2.pk = 2;

                // Test if instances are marked as concrete for positive IDs
                expect(phantomInstance1.$isPhantom()).toBe(false);
                expect(phantomInstance2.$isPhantom()).toBe(false);
            });
        });

        it("Does generate phantom IDs with UUID4 phantom ID generator", function () {
            inject(function (ResourceFactoryService, ResourcePhantomIdUuid4) {
                var
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        phantomIdGenerator: ResourcePhantomIdUuid4
                    }),
                    phantomInstance1 = service.new(),
                    phantomInstance2 = service.new();

                // Test if IDs are valid UUID4s
                expect(phantomInstance1.pk).toMatch(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}/i);
                expect(phantomInstance2.pk).toMatch(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}/i);

                // Test if instances are marked as phantom as long as UUID4s match one of the generated
                expect(phantomInstance1.$isPhantom()).toBe(true);
                expect(phantomInstance2.$isPhantom()).toBe(true);

                // Change IDs
                phantomInstance1.pk = '00000000-0000-0000-0000-000000000000';
                phantomInstance2.pk = '11111111-1111-1111-1111-111111111111';

                // Test if instances are marked as concrete for not generated UUID4s
                expect(phantomInstance1.$isPhantom()).toBe(false);
                expect(phantomInstance2.$isPhantom()).toBe(false);
            });
        });

        it("Does generate phantom IDs with custom phantom ID generator", function () {
            inject(function (ResourceFactoryService, ResourcePhantomIdFactoryService) {
                var
                    generator = ResourcePhantomIdFactoryService.createPhantomIdFactory({
                        generate: function () {
                            return -99;
                        },
                        is: function (pkValue) {
                            return pkValue === -99;
                        }
                    }),
                    service = ResourceFactoryService('TestResourceService', 'http://test/:pk/', {
                        phantomIdGenerator: generator
                    }),
                    phantomInstance1 = service.new(),
                    phantomInstance2 = service.new();

                // Test if IDs are -99
                expect(phantomInstance1.pk).toBe(-99);
                expect(phantomInstance2.pk).toBe(-99);

                // Test if instances are marked as phantom
                expect(phantomInstance1.$isPhantom()).toBe(true);
                expect(phantomInstance2.$isPhantom()).toBe(true);

                // Change IDs
                phantomInstance1.pk = -88;
                phantomInstance2.pk = -88;

                // Test if instances are marked as concrete for IDs not -99
                expect(phantomInstance1.$isPhantom()).toBe(false);
                expect(phantomInstance2.$isPhantom()).toBe(false);
            });
        });

    }
);
