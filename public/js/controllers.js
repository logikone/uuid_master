'use strict';

/* Controllers */

var uuidControllers = angular.module('uuidMaster.controllers', []);

uuidControllers.controller('uuidsCtrl', [ '$scope', 'Uuid', function($scope, Uuid) {
    $scope.updateCriteria = {};
    $scope.filterCriteria = {
        limit: 20,
        page: 1
    };
    $scope.uuids = Uuid.get($scope.filterCriteria);
    $scope.actions = [
        {
            name: 'CONFIRM',
            value: 'CONFIRMED'
        },
        {
            name: 'DENY',
            value: 'DENIED'
        },
        {
            name: 'REVOKE',
            value: 'REVOKED'
        },
        {
            name: 'DELETE',
            value: 'DELETED'
        }
    ];
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
    $scope.onCheckedChange = function(checked) {
        angular.forEach($scope.uuids.uuids, function(uuid) {
            uuid.checked = checked;
        });
    };
    $scope.submit = function() {

        var uuids  = $scope.uuids.uuids;
        var action = $scope.updateCriteria.action;

        angular.forEach(uuids, function(uuid, key) {
            if (uuid.checked)  {

                if (action.name === 'DELETE') {
                    Uuid.delete({ id: uuid.id});
                }
                else {
                    Uuid.update({ id: uuid.id }, { state: action.value }, function(res) {
                        uuid.state = res.uuid.state;
                    });
                }
            }
        });

        $scope.uuids = Uuid.get($scope.filterCriteria);
    };
    $scope.selectPage = function (page) {
        if (!page) {
            page = $scope.filterCriteria.page;
        }
        else {
            $scope.filterCriteria.page = page;
        }

        console.log($scope.filterCriteria);
        $scope.uuids = Uuid.get($scope.filterCriteria);
    };
}]);
