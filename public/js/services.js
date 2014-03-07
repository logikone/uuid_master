'use strict';

/* Services */
var uuidServices = angular.module('uuidMaster.services', ['ngResource']).
  value('version', '0.1');

uuidServices.factory('Uuid', ['$resource',
    function($resource) {
        return $resource('api/v1/uuids', {}, {
            findAll: { 
                method: 'GET',
                params: {
                    limit: '20',
                    page: '1'
                }
            }
        });
    }
]);
