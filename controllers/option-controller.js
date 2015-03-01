App.controller('OptionController', ['$scope', 'StorageService', function ($scope, StorageService) {
    _.extend($scope, {
        forms: {},
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
            if (_.every(_.values($scope.forms), function (form) { return form.$valid; })) {
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
        },
        showModal: function () {
            $('#optionsModal').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
        },
        hideModal: function () {
            if (_.every(_.values($scope.forms), function (form) { return form.$valid; })) {
                $('#optionsModal').modal('hide');
            }
        }
    });

    StorageService.loadConfigs().then(function (config) {
        $scope.refresh = _.extend($scope.refresh, config.option.refresh);
        $scope.unread = _.extend($scope.unread, config.option.unread);
    });

    $scope.$on('openOptionModal', function () {
        $scope.showModal();
    });

    $scope.$watch('$unreadForm', function () {
        console.log(arguments);
    });
}]);