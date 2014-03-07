'use strict';

/* Controllers */

var uuidControllers = angular.module('uuidMaster.controllers', []);

uuidControllers.controller('uuidsCtrl', [ '$scope', 'Uuid', function($scope, Uuid) {
    var uuidReq = Uuid.findAll();
    $scope.uuids = uuidReq; 
    $scope.headers = [ 'Hostname', 'UUID', 'Host UUID', 'Last Request', 'State' ];
}]);
