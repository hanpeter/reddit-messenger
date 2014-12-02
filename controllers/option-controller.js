App.controller('OptionController', ['$scope', 'StorageService', function ($scope, StorageService) {
    _.extend($scope, {
        refreshInterval: undefined,
        toggleRefreshInterval: function () {
            if ($scope.refreshInterval > 0) {
                $scope.refreshInterval = 0;
            }
            else {
                $scope.refreshInterval = 30;
            }
            $scope.updateConfig();
        },
        checkInterval: undefined,
        toggleCheckInterval: function () {
            if ($scope.checkInterval > 0) {
                $scope.checkInterval = 0;
            }
            else {
                $scope.checkInterval = 5;
            }
            $scope.updateConfig();
        },
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
                $scope.resetTimeout();
            });
        }
    });

    StorageService.loadConfigs().done(function (config) {
        $scope.refreshInterval = config.refreshInterval;
        $scope.checkInterval = config.checkInterval;
    });
}]);