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
        messageCount: 100,
        updateConfig: function () {
            StorageService.saveConfigs({
                refreshInterval: $scope.refreshInterval,
                checkInterval: $scope.checkInterval,
                messageCount: $scope.messageCount
            }).then(function () {
                $scope.sync(function () {
                    $scope.resetTimeout();
                });
            });
        }
    });

    StorageService.loadConfigs().then(function (config) {
        $scope.refreshInterval = config.refreshInterval;
        $scope.checkInterval = config.checkInterval;
        $scope.messageCount = config.messageCount;
    });
}]);