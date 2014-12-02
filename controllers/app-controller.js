App.controller('AppController', ['$scope', 'RedditService', 'RedditConfig', 'ThreadFactoryService', 'NotificationService', 'AppConfig', 'StorageService',
    function ($scope, RedditService, RedditConfig, ThreadFactoryService, NotificationService, AppConfig, StorageService) {
        function checkUnreadMessages() {
            $scope.sync(function () {
                ThreadFactoryService.checkUnreadMessages()
                    .done(NotificationService.update);
            });

            setTimeout(checkUnreadMessages, AppConfig.checkInterval * 1000);
        }

        function autoRefreshMessages() {
            $scope.updateMessages();

            setTimeout(autoRefreshMessages, AppConfig.refreshInterval * 1000);
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

        RedditService.getToken()
            .done(function () {
                autoRefreshMessages();
                checkUnreadMessages();
            });
    }]);