'use strict';


// Declare app level module which depends on filters, and services
angular.module('uuidMaster', [
  'ngRoute',
  'uuidMaster.filters',
  'uuidMaster.services',
  'uuidMaster.directives',
  'uuidMaster.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/uuids', {templateUrl: 'partials/uuids.html', controller: 'uuidsCtrl'});
  $routeProvider.otherwise({redirectTo: '/uuids'});
}]);
