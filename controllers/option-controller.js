App.controller('OptionController', ['$scope', function ($scope) {
    _.extend($scope, {
        refreshInterval: 30,
        checkInterval: 5
    });
}]);