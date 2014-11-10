App.service('ThreadFactoryService', ['$sce', 'RedditService', 'RedditConfig', function ($sce, RedditService, RedditConfig) {
    var me = this;

    function sortThreads() {
        _.each(me.threads, function (thread) {
            thread.messages = _.sortBy(thread.messages, function (msg) { return msg.createDate.unix() * -1; });
        });

        me.threads = _.sortBy(me.threads, function (thread) {
            return thread.messages[0].createDate.unix() * -1;
        });
    }

    _.extend(me, {
        threads: [],
        getThreads: function () {
            return me.threads;
        },
        addMessage: function (message) {
            var bodyHtml = $('<textarea/>').html(message.body_html).text(),
                msg = {
                    id: message.name,
                    author: message.author,
                    body: $sce.trustAsHtml(bodyHtml),
                    createDate: moment(message.created_utc* 1000),
                    isUnread: message.new,
                    isReceived: message.dest === RedditConfig.username
                },
                thread = _.find(me.threads, function (thread) {
                    return !!message.first_message_name ? thread.threadID === message.first_message_name : thread.threadID === message.name;
                });

            if (!thread) {
                thread = {
                    threadID: message.first_message_name || message.name,
                    subject: message.subject,
                    dest: message.author === RedditConfig.username ? message.dest : message.author,
                    messages: [],
                    unreadCount: 0
                };
                me.threads.unshift(thread);
            }

            if (!_.some(thread.messages, function (value) { return value.id === msg.id; })) {
                thread.unreadCount += (msg.isUnread) ? 1 : 0;
                thread.messages.unshift(msg);
            }
        },
        updateThreads: function () {
            return $.when(
                RedditService.getInboxMessages(100),
                RedditService.getSentMessages(100)
            ).then(function (inbox, sent) {
                var messages = [];

                _.each(_.pluck(inbox.children.concat(sent.children), 'data'), function (value) {
                    me.addMessage(value);
                });

                sortThreads();

                return me.getThreads();
            });
        },
        checkUnreadMessages: function () {
            return RedditService.getUnreadMessages()
                .then(function (data) {
                    _.each(_.pluck(data.children, 'data'), function (value) {
                        me.addMessage(value);
                    });

                    return data.children.length;
                });
        }
    });
}]);