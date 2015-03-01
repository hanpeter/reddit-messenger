App.controller('AppController', ['$scope', '$q', 'RedditService', 'ThreadFactoryService', 'NotificationService', 'StorageService',
    function ($scope, $q, RedditService, ThreadFactoryService, NotificationService, StorageService) {
        var checkTimeoutID = null;
        var refreshTimeoutID = null;

        function checkUnreadMessages() {
            StorageService.loadConfigs()
                .then(function (config) {
                    clearTimeout(checkTimeoutID);

                    if (config.option.unread.isEnabled) {
                        $scope.sync(function () {
                            ThreadFactoryService.checkUnreadMessages()
                                .then(NotificationService.update);
                        });

                        checkTimeoutID = setTimeout(checkUnreadMessages, config.option.unread.interval * 1000);
                    }
                });
        }

        function autoRefreshMessages() {
            StorageService.loadConfigs()
                .then(function (config) {
                    clearTimeout(refreshTimeoutID);

                    if (config.option.refresh.isEnabled) {
                        $scope.updateMessages();

                        refreshTimeoutID = setTimeout(autoRefreshMessages, config.option.refresh.interval * 1000);
                    }
                });
        }

        _.extend($scope, {
            messages: ThreadFactoryService.getThreads(),
            activeThread: null,
            isComposing: false,
            sync: function (callback) {
                if ($scope.$$phase) {
                    callback();
                }
                else {
                    $scope.$apply(callback);
                }
            },
            setActiveThread: function (thread) {
                $scope.activeThread = thread;
                $scope.isComposing = false;
            },
            startNewThread: function () {
                $scope.setActiveThread(null);
                $scope.isComposing = true;
            },
            updateMessages: function () {
                ThreadFactoryService.updateThreads();
            },
            moreMessages: function () {
                ThreadFactoryService.getMoreMessages();
            },
            resetTimeout: function () {
                StorageService.loadConfigs()
                    .then(function (config) {
                        clearTimeout(checkTimeoutID);
                        clearTimeout(refreshTimeoutID);

                        if (config.option.unread.isEnabled) {
                            checkTimeoutID = setTimeout(checkUnreadMessages, config.option.unread.interval * 1000);
                        }
                        if (config.option.refresh.isEnabled) {
                            refreshTimeoutID = setTimeout(autoRefreshMessages, config.option.refresh.interval * 1000);
                        }
                    });
            },
            openOptionModal: function () {
                $('#optionsModal').modal();
            }
        });

        RedditService.getUserInfo()
            .then(function () {
                autoRefreshMessages();
                checkUnreadMessages();
            });
    }]);