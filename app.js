window.App = angular.module('App', ['ngRoute']);

App.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', { templateUrl: '/templates/start.html', controller: 'StartController' })
}]);