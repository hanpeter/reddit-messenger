App.controller('ListController', ['$scope', '$sce', 'RedditService', 'RedditConfig', function ($scope, $sce, RedditService, RedditConfig) {
    var notificationID = '',
        NOTIFICATION_BUFFER = 15000;

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
        replyMsg: '',
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
        markAsRead: function (message) {
            if (!message.isReceived) {
                return;
            }

            if (message.isUnread) {
                RedditService.markMessageAsRead(message.id);
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

            if (!replyTo) {
                return;
            }

            RedditService.postReplyMessage(replyTo.id, $scope.replyMsg)
                .done(function (messages) {
                    $scope.sync(function () {
                        $scope.replyMsg = '';

                        _.each(_.pluck(messages, 'data'), function (value) {
                            addMessage($scope.messages, value);
                        });

                        $scope.messages = sortMessages($scope.messages);
                    });
                });
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

    function checkUnreadMessages() {
        var notiConfig = {
            type: "basic",
            iconUrl: "/assets/icon_128.png",
            title: "Unread message(s) for " + RedditConfig.username
        };

        RedditService.getUnreadMessages()
            .done(function (data) {
                if (data.children.length > 0) {
                    _.extend(notiConfig, {
                        message: "There is " + data.children.length + " unread messages."
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

                    $scope.sync(function () {
                        _.each(_.pluck(data.children, 'data'), function (value) {
                            addMessage($scope.messages, value);
                        });

                        $scope.messages = sortMessages($scope.messages);
                    });
                }
            });
    }

    RedditService.getToken()
        .done(function (data) {
            updateMessages()
            setInterval(updateMessages, 30000);

            setInterval(checkUnreadMessages, 5000);
        });
}]);