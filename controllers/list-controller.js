App.controller('ListController', ['$scope', '$sce', 'RedditService', 'RedditConfig', function ($scope, $sce, RedditService, RedditConfig) {
    function addMessage(messages, message) {
        var msg = {
                id: message.name,
                author: message.author,
                body: $sce.trustAsHtml('<p>' + message.body.replace(/\n\n/g, '</p><p>') + '</p>'),
                createDate: moment(message.created_utc* 1000),
                isUnread: message.new,
                isReceived: message.dest === RedditConfig.username
            },
            thread = _.find(messages, function (m) { return m.threadID === message.first_message_name; });

        if (!thread) {
            thread = {
                threadID: message.first_message_name,
                subject: message.subject,
                dest: message.author === RedditConfig.username ? message.dest : message.author,
                messages: [],
                unreadCount: 0
            };
            messages.push(thread);
        }

        if (!_.some(thread.messages, function (value) { return value.id === msg.id; })) {
            thread.unreadCount += (msg.isUnread) ? 1 : 0;
            thread.messages.push(msg);
        }
    }

    function sortMessages(messages) {
        _.each(messages, function (thread) {
            thread.messages = _.sortBy(thread.messages, function (msg) { return msg.createDate.unix() * -1; });
        });

        return _.sortBy(messages, function (thread) {
            return thread.messages[0].createDate.unix() * -1;
        });
    }

    _.extend($scope, {
        messages: [],
        activeThread: null,
        notificationID: '',
        setActiveThread: function (thread) {
            $scope.activeThread = thread;
        },
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
        markAsRead: function (msg) {
            if (!msg.isReceived) {
                return;
            }

            if (msg.isUnread) {
                RedditService.markMessageAsRead(msg.id);
                msg.isUnread = false;

                if ($scope.activeThread.unreadCount > 0) {
                    $scope.activeThread.unreadCount--;
                }
            }
            else {
                RedditService.markMessageAsUnread(msg.id);
                msg.isUnread = true;

                $scope.activeThread.unreadCount++;
            }
        }
    });

    function updateMessages() {
        var activeThreadID = $scope.activeThread ? $scope.activeThread.threadID : undefined;
        $.when(
            RedditService.getInboxMessages(100),
            RedditService.getSentMessages(100)
        ).done(function (inbox, sent) {
            var messages = [];

            _.each(_.pluck(inbox.children.concat(sent.children), 'data'), function (value) {
                addMessage(messages, value);
            });

            messages = sortMessages(messages);
            $scope.sync(function () {
                $scope.messages = messages;
                $scope.activeThread = _.find($scope.messages, function (thread) { return thread.threadID === activeThreadID; });
            });
        });
    }

    RedditService.getToken()
        .done(function (data) {
            updateMessages()
            setInterval(updateMessages, 30000);

            setInterval(function () {
                RedditService.getUnreadMessages()
                    .done(function (data) {
                        if (data.children.length > 0) {
                            if (!!$scope.notificationID) {
                                chrome.notifications.clear($scope.notificationID, $.noop);
                            }

                            chrome.notifications.create('', {
                                type: "basic",
                                iconUrl: "/assets/icon_128.png",
                                title: "Unread Message for " + RedditConfig.username,
                                message: "There is " + data.children.length + " unread messages."
                            }, function (notificationID) {
                                $scope.sync(function () {
                                    $scope.notificationID = notificationID;
                                });
                            });

                            $scope.sync(function () {
                                _.each(_.pluck(data.children, 'data'), function (value) {
                                    addMessage($scope.messages, value);
                                });

                                $scope.messages = sortMessages($scope.messages);
                            });
                        }
                    });
            }, 5000);
        });
}]);