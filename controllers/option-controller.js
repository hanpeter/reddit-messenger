App.controller('OptionController', ['$scope', 'AppConfig', 'StorageService', function ($scope, AppConfig, StorageService) {
    StorageService.loadConfigs().done(function () {
        $scope.refreshInterval = AppConfig.refreshInterval;
        $scope.checkInterval = AppConfig.checkInterval;
    });
    _.extend($scope, {
        refreshInterval: AppConfig.refreshInterval,
        checkInterval: AppConfig.checkInterval,
        isUpdating: false,
        updateConfig: function () {
            AppConfig.refreshInterval = $scope.refreshInterval;
            AppConfig.checkInterval = $scope.checkInterval;
            StorageService.saveConfigs().done(function () {
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
}]);