App.controller('ListController', ['$scope', '$sce', 'RedditService', function ($scope, $sce, RedditService) {
    function addMessage(messages, message) {
        var msg = {
                id: message.id,
                author: message.author,
                body: $sce.trustAsHtml('<p>' + message.body.replace(/\n\n/g, '</p><p>') + '</p>'),
                createDate: new Date(message.created_utc* 1000),
                isUnread: message.new,
                isSent: message.dest === RedditService.userName
            },
            thread = _.find(messages, function (m) { return m.threadID === message.first_message; });

        if (!thread) {
            thread = {
                threadID: message.first_message,
                subject: message.subject,
                dest: message.author === RedditService.userName ? message.dest : message.author,
                messages: [],
                unreadCount: 0
            };
            messages.push(thread);
        }

        thread.unreadCount += (msg.isUnread) ? 1 : 0;
        thread.messages.push(msg);
    }

    function sortMessages(messages) {
        _.each(messages, function (thread) {
            thread.messages = _.sortBy(thread.messages, function (msg) { return msg.createDate.getTime() * -1; });
        });

        return _.sortBy(messages, function (thread) {
            return thread.messages[0].createDate.getTime() * -1;
        });
    }

    _.extend($scope, {
        messages: [],
        activeThread: null,
        setActiveThread: function (thread) {
            $scope.activeThread = thread;
        }
    });

    RedditService.getToken()
        .done(function (data) {
            $.when(
                RedditService.getInboxMessages(),
                RedditService.getSentMessages()
            ).done(function (inbox, sent) {
                var messages = [];

                _.each(_.pluck(inbox.children.concat(sent.children), 'data'), function (value) {
                    addMessage(messages, value);
                });

                messages = sortMessages(messages);
                $scope.sync(function () {
                    $scope.messages = messages;
                });
            });

            setInterval(function () {
                RedditService.getUnreadMessages()
                    .done(function (data) {
                        if (data.children.length > 0) {
                            chrome.notifications.create('', {
                                type: "basic",
                                iconUrl: "/assets/icon_128.png",
                                title: "Unread Message",
                                message: "There is " + data.children.length + " unread messages."
                            }, $.noop);
                        }
                    });
            }, 5000);
        });
}]);