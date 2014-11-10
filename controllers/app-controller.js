App.controller('AppController', ['$scope', 'RedditService', 'RedditConfig', 'ThreadFactoryService', function ($scope, RedditService, RedditConfig, ThreadFactoryService) {
    var notificationID = '',
        NOTIFICATION_BUFFER = 15000,
        NOTIFICATION_SNOOZE = 30000,
        notificationRefreshTime = moment();

    function checkUnreadMessages() {
        var notiConfig = {
            type: "basic",
            iconUrl: "/assets/icon_128.png",
            title: "Unread message(s) for " + RedditConfig.username
        };

        $scope.sync(function () {
            ThreadFactoryService.checkUnreadMessages()
                .done(function (count) {
                    if (moment().isAfter(notificationRefreshTime)) {
                        chrome.notifications.clear(notificationID, $.noop);
                        notificationID = '';
                    }
                    
                    if (count > 0) {
                        _.extend(notiConfig, {
                            message: "There is " + count + " unread messages."
                        });

                        if (!notificationID) {
                            chrome.notifications.create('', notiConfig, function (nID) {
                                notificationID = nID;

                                new Audio('/assets/notification.mp3').play();

                                notificationRefreshTime = moment().add(NOTIFICATION_BUFFER, 'ms');
                            });
                        }
                        else {
                            chrome.notifications.update(notificationID, notiConfig, $.noop);
                        }
                    }

                    chrome.notifications.onClicked.addListener(function (nID) {
                        if (nID === notificationID) {
                            notificationRefreshTime = moment().add(NOTIFICATION_SNOOZE, 'ms');
                        }
                    });
                });
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