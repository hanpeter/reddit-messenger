App.controller('AppController', ['$scope', 'RedditService', 'RedditConfig', 'ThreadFactoryService', 'NotificationService', 'StorageService',
    function ($scope, RedditService, RedditConfig, ThreadFactoryService, NotificationService, StorageService) {
        var config;

        function checkUnreadMessages() {
            $scope.sync(function () {
                ThreadFactoryService.checkUnreadMessages()
                    .done(NotificationService.update);
            });

            setTimeout(checkUnreadMessages, config.checkInterval * 1000);
        }

        function autoRefreshMessages() {
            $scope.updateMessages();

            setTimeout(autoRefreshMessages, config.refreshInterval * 1000);
        }

        _.extend($scope, {
            messages: ThreadFactoryService.getThreads(),
            activeThread: null,
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
            },
            updateMessages: function () {
                var activeThreadID = $scope.activeThread ? $scope.activeThread.threadID : undefined;

                ThreadFactoryService.updateThreads().done(function (threads) {
                    $scope.sync(function () {
                        $scope.messages = threads;
                        $scope.activeThread = _.find(threads, function (thread) { return thread.threadID === activeThreadID; });
                    });
                });
            }
        });

        $.when(
            StorageService.loadConfigs(),
            RedditService.getToken()
        ).done(function (c) {
            config = c;

            autoRefreshMessages();
            checkUnreadMessages();
        });
    }]);