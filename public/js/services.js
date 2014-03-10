'use strict';

/* Services */
var uuidServices = angular.module('uuidMaster.services', ['ngResource']).
  value('version', '0.1');

uuidServices.factory('Uuid', ['$resource',
    function($resource) {
        return $resource('api/v1/uuids/:id', {}, {
            update: {
                method: 'PUT'
            }
        });
    }
]);
