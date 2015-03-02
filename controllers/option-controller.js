App.controller('OptionController', ['$scope', 'StorageService', function ($scope, StorageService) {
    function reset() {
        StorageService.loadConfigs().then(function (config) {
            $scope.refresh = _.extend($scope.refresh, config.option.refresh);
            $scope.unread = _.extend($scope.unread, config.option.unread);
            $scope.notification = _.extend($scope.notification, config.option.notification);
        });
    }

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
            }
        },
        notification: {
            isContinuous: true,
            interval: 15,
            snooze: 300,
            modifyContinuous: function (value) {
                if (!value) {
                    $scope.notification.interval = 15;
                }
                $scope.notification.isContinuous = value;
            }
        },
        updateConfig: function () {
            if ($scope.isValid()) {
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
                        },
                        notification: {
                            isContinuous: $scope.notification.isContinuous,
                            interval: $scope.notification.interval,
                            snooze: $scope.notification.snooze
                        }
                    }
                }).then(function () {
                    $('#optionsModal').modal('hide');
                    $scope.displayAlert = false;
                    $scope.sync(function () {
                        $scope.resetTimeout();
                    });
                });
            }
            else {
                $scope.displayAlert = true;
            }
        },
        cancel: function () {
            $('#optionsModal').modal('hide');
        },
        displayAlert: false,
        isValid: function () {
            return _.every(_.values($scope.forms), function (form) { return form.$valid; });
        },
        showModal: function () {
            $('#optionsModal').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
            reset();
        }
    });

    $scope.$on('openOptionModal', function () {
        $scope.showModal();
    });
}]);