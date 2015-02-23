App.controller('AppController', ['$scope', '$q', 'RedditService', 'ThreadFactoryService', 'NotificationService', 'StorageService',
    function ($scope, $q, RedditService, ThreadFactoryService, NotificationService, StorageService) {
        var config = null;
        var checkTimeoutID = null;
        var refreshTimeoutID = null;

        function checkUnreadMessages() {
            $scope.sync(function () {
                ThreadFactoryService.checkUnreadMessages()
                    .then(NotificationService.update);
            });

            if (config.checkInterval > 0) {
                clearTimeout(checkTimeoutID);
                checkTimeoutID = setTimeout(checkUnreadMessages, config.checkInterval * 1000);
            }
        }

        function autoRefreshMessages() {
            $scope.updateMessages();

            if (config.refreshInterval > 0) {
                clearTimeout(refreshTimeoutID);
                refreshTimeoutID = setTimeout(autoRefreshMessages, config.refreshInterval * 1000);
            }
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
                if (config.checkInterval > 0) {
                    clearTimeout(checkTimeoutID);
                    checkTimeoutID = setTimeout(checkUnreadMessages, config.checkInterval * 1000);
                }
                if (config.refreshInterval > 0) {
                    clearTimeout(refreshTimeoutID);
                    refreshTimeoutID = setTimeout(autoRefreshMessages, config.refreshInterval * 1000);
                }
            }
        });

        $q.all([
            StorageService.loadConfigs(),
            RedditService.getUserInfo()
        ]).then(function (resps) {
            config = resps[0];

            autoRefreshMessages();
            checkUnreadMessages();
        });
    }]);