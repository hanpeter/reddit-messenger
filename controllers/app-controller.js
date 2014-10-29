App.controller('AppController', ['$scope', 'RedditService', 'RedditConfig', 'ThreadFactoryService', function ($scope, RedditService, RedditConfig, ThreadFactoryService) {
    var notificationID = '',
        NOTIFICATION_BUFFER = 15000;

    function updateMessages() {
        var activeThreadID = $scope.activeThread ? $scope.activeThread.threadID : undefined;
        
        ThreadFactoryService.updateThreads().done(function (threads) {
            $scope.sync(function () {
                $scope.activeThread = _.find(threads, function (thread) { return thread.threadID === activeThreadID; });
            });
        });
    }

    function checkUnreadMessages() {
        var notiConfig = {
            type: "basic",
            iconUrl: "/assets/icon_128.png",
            title: "Unread message(s) for " + RedditConfig.username
        };

        ThreadFactoryService.checkUnreadMessages()
            .done(function (count) {
                if (count > 0) {
                    _.extend(notiConfig, {
                        message: "There is " + count + " unread messages."
                    });

                    if (!notificationID) {
                        chrome.notifications.create('', notiConfig, function (nID) {
                            notificationID = nID;

                            setTimeout(function () {
                                chrome.notifications.clear(notificationID, function () {
                                    notificationID = '';
                                });
                            }, NOTIFICATION_BUFFER);
                        });
                    }
                    else {
                        chrome.notifications.update(notificationID, notiConfig, $.noop);
                    }
                }
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
        }
    });

    RedditService.getToken()
        .done(function () {
            updateMessages()
            setInterval(updateMessages, 30000);

            setInterval(checkUnreadMessages, 5000);
        });
}]);