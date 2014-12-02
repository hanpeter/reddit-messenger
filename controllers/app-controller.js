App.controller('AppController', ['$scope', 'RedditService', 'RedditConfig', 'ThreadFactoryService', 'NotificationService', 
    function ($scope, RedditService, RedditConfig, ThreadFactoryService, NotificationService) {
        function checkUnreadMessages() {
            $scope.sync(function () {
                ThreadFactoryService.checkUnreadMessages()
                    .done(NotificationService.update);
            });
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
                $scope.updateMessages()
                setInterval(checkUnreadMessages, 5000);
            });
    }]);