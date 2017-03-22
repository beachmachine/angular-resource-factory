# Angular ResourceFactory

Angular ResourceFactory is an AngularJS library that extends the capabilities of ngResource in various ways. The main 
features include a resource store for holding changes on resource instances and related resource instances to commit
them at once, and an advanced resource caching.

**Note:** This library is for AngularJS 1.x only!


## Dependencies

Angular ResourceFactory depends on AngularJS 1.x.


## Installation

* Via `npm`: `npm install --save angular-resource-factory`
* Via `git`: `git clone git@github.com:beachmachine/angular-resource-factory.git`


## Examples

### RESTful service definition

In the following example we assume a RESTful endpoint that gives us the total of results via the `count` attribute
and the actual data in the `results` attribute in the list call. Each object has an ID on the `pk` attribute, holds
its own URL on the `url` attribute and also has some dates as `creation_date` and `last_modification_date` that we
want to handle as Moment.js objects.

To make things a bit clearer, this is the list call result of the RESTful API endpoint:
````json
{
  "count": 2,
  "results": [
    {
      "pk": 1,
      "url": "http://example.api/member/1/",
      "creation_date": "2017-01-11T06:00:00Z",
      "last_modification_date": "2017-01-12T08:00:00Z",
      "name": "Example Member 1"
    },
    {
      "pk": 2,
      "url": "http://example.api/member/2/",
      "creation_date": "2017-01-11T06:00:00Z",
      "last_modification_date": "2017-01-12T08:00:00Z",
      "name": "Example Member 2"
    }
  ]
}
````

Whereas this is the result of a detail call:
````json
{
  "pk": 2,
  "url": "http://example.api/member/2/",
  "creation_date": "2017-01-11T06:00:00Z",
  "last_modification_date": "2017-01-12T08:00:00Z",
  "name": "Example Member 2"
}
````

Our service definition may look like this:
````javascript
var module = angular.module('services');

module.factory('MemberResourceService',
    function (ResourceFactoryService) {
        return ResourceFactoryService('MemberResourceService', 'http://example.api/member/:pk/', {
            queryDataAttr: 'results',
            queryTotalAttr: 'count',
            pkAttr: 'pk',
            urlAttr: 'url',

            /**
             * Converts the dates to moment objects.
             * @param obj
             * @return {*}
             */
            toInternal: function (obj) {
                // no transformation needed if given object is false
                if (!obj) {
                    return obj;
                }

                obj.creation_date = obj.creation_date ? moment(obj.creation_date) : null;
                obj.last_modification_date = obj.last_modification_date ? moment(obj.last_modification_date) : null;

                return obj;
            },

            /**
             * Converts the moment dates to strings.
             * @param obj
             * @return {*}
             */
            fromInternal: function (obj) {
                // no transformation needed if given object is false
                if (!obj) {
                    return obj;
                }

                obj.creation_date = obj.creation_date ? moment(obj.creation_date).toJSON() : null;
                obj.last_modification_date = obj.last_modification_date ? moment(obj.last_modification_date).toJSON() : null;

                return obj;
            }
        });
    }
);
````


## Contributions

* Andreas Stocker <andreas@stocker.co.it>, Main developer


## License

Angular ResourceFactory
Copyright 2016 Andreas Stocker
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
