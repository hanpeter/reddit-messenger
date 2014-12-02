App.controller('OptionController', ['$scope', 'StorageService', function ($scope, StorageService) {
    _.extend($scope, {
        refreshInterval: undefined,
        checkInterval: undefined,
        isUpdating: false,
        updateConfig: function () {
            StorageService.saveConfigs({
                refreshInterval: $scope.refreshInterval,
                checkInterval: $scope.checkInterval
            }).done(function () {
                $scope.sync(function () {
                    $scope.isUpdating = true;
                });
                setTimeout(function () { 
                    $scope.sync(function () {
                        $scope.isUpdating = false;
                    });
                }, 5000);
            });
        }
    });

    StorageService.loadConfigs().done(function (config) {
        $scope.refreshInterval = config.refreshInterval;
        $scope.checkInterval = config.checkInterval;
    });
}]);