App.controller('MessageController', ['$scope', 'RedditService', 'ThreadFactoryService', 'NotificationService', function ($scope, RedditService, ThreadFactoryService, NotificationService) {
    _.extend($scope, {
        isReplying: false,
        displayDate: function (momentDate) {
            var currentTime = moment();

            if (currentTime.year() !== momentDate.year()) {
                return momentDate.format('YYYY-MM-DD HH:mm:ss');
            }
            else if (currentTime.dayOfYear() !== momentDate.dayOfYear()) {
                return momentDate.format('MM-DD HH:mm:ss');
            }
            else {
                return momentDate.format('HH:mm:ss');
            }
        },
        markAsRead: function (message) {
            if (!message.isReceived) {
                return;
            }

            if (message.isUnread) {
                RedditService.markMessageAsRead(message.id)
                    .then(function () {
                        NotificationService.clear(message.id);
                    });
                message.isUnread = false;

                if ($scope.activeThread.unreadCount > 0) {
                    $scope.activeThread.unreadCount--;
                }
            }
            else {
                RedditService.markMessageAsUnread(message.id);
                message.isUnread = true;

                $scope.activeThread.unreadCount++;
            }
        },
        reply: function () {
            var replyTo = _.find($scope.activeThread.messages, function (msg) { return msg.isReceived; });

            $scope.isReplying = true;

            if (!replyTo) {
                $scope.isReplying = false;
                return;
            }

            RedditService.postReplyMessage(replyTo.id, $scope.activeThread.replyMsg)
                .then(function (messages) {
                    $scope.activeThread.replyMsg = '';

                    _.each(_.pluck(messages, 'data'), function (value) {
                        ThreadFactoryService.saveMessage(value);
                    });

                    $scope.isReplying = false;
                });
        }
    });
}]);