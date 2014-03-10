'use strict';

/* Controllers */

var uuidControllers = angular.module('uuidMaster.controllers', []);

uuidControllers.controller('uuidsCtrl', [ '$scope', 'Uuid', function($scope, Uuid) {
    $scope.uuids = Uuid.findAll();
    $scope.actions = [ 'CONFIRM', 'DENY', 'REVOKE', 'DELETE' ];
    $scope.states = [ 'PENDING', 'CONFIRMED', 'DENIED', 'REVOKED' ];
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
    $scope.updateCriteria = {};
    $scope.filterCriteria = {
        page: 1,
        limit: 20
    };
    $scope.selectPage = function (page) {
        $scope.filterCriteria.page = page;
        $scope.uuids = Uuid.findAll($scope.filterCriteria);
    };
}]);
