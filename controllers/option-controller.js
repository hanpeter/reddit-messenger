App.controller('OptionController', ['$scope', 'StorageService', function ($scope, StorageService) {
    _.extend($scope, {
        unread: {
            isEnabled: true,
            interval: 5,
            modifyEnabled: function (value) {
                if (!value) {
                    $scope.unread.interval = 5;
                }
                $scope.unread.isEnabled = value;
                $scope.updateConfig();
            }
        },
        refresh: {
            isEnabled: true,
            interval: 30,
            messageCount: 100,
            modifyEnabled: function (value) {
                if (!value) {
                    $scope.refresh.interval = 30;
                    $scope.refresh.messageCount = 100;
                }
                $scope.refresh.isEnabled = value;
                $scope.updateConfig();
            }
        },
        updateConfig: function () {
            StorageService.saveConfigs({
                option: {
                    unread: {
                        isEnabled: $scope.unread.isEnabled,
                        interval: $scope.unread.interval
                    },
                    refresh: {
                        isEnabled: $scope.refresh.isEnabled,
                        interval: $scope.refresh.interval,
                        messageCount: $scope.refresh.messageCount
                    }
                }
            }).then(function () {
                $scope.sync(function () {
                    $scope.resetTimeout();
                });
            });
        }
    });

    StorageService.loadConfigs().then(function (config) {
        $scope.refresh = _.extend($scope.refresh, config.option.refresh);
        $scope.unread = _.extend($scope.unread, config.option.unread);
    });
}]);