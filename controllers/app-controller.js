App.controller('AppController', ['$scope', function ($scope) {
    _.extend($scope, {
        sync: function (callback) {
            if ($scope.$$phase) {
                callback();
            }
            else {
                $scope.$apply(callback);
            }
        }
    });
}]);