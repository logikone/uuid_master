'use strict';

/* Controllers */

var uuidControllers = angular.module('uuidMaster.controllers', []);

uuidControllers.controller('uuidsCtrl', [ '$scope', 'Uuid', function($scope, Uuid) {
    var uuidReq = Uuid.findAll();
    $scope.uuids = uuidReq; 
    $scope.headers = [
        {
            name :'Hostname',
            value: 'host_name'
        },
        {
            name: 'UUID',
            value: 'id'
        },
        {
            name: 'Host UUID',
            value: 'host_uuid'
        },
        {
            name: 'Last Request',
            value: 'last_request'
        },
        {
            name: 'State',
            value: 'state'
        },
        {
            name: '',
            value: ''
        }
    ];
    $scope.filterCriteria = {
        pageNumber: 1,
        sortDir: 1,
        sortedBy: 'host_name'
    }
}]);
