window.App = angular
    .module('App', [])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.headers.common['Content-type'] = 'application/x-www-form-urlencoded';
    }]);
