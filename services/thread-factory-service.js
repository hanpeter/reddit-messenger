App.service('ThreadFactoryService', ['$sce', '$q', 'RedditService', 'RedditConfig', 'StorageService', function ($sce, $q, RedditService, RedditConfig, StorageService) {
    var me = this,
        lastMessages = {
            inbox: undefined,
            sent: undefined
        };

    function compareMessages(msg1, msg2) {
        var createDate1 = msg1.createDate.unix();
        var createDate2 = msg2.createDate.unix();

        if (createDate1 < createDate2) {
            return 1;
        }
        else if (createDate2 < createDate1) {
            return -1;
        }
        else {
            return 0;
        }
    }

    function sortThreads() {
        _.each(me.threads, function (thread) {
            thread.messages.sort(compareMessages);
        });

        me.threads.sort(function (thread1, thread2) {
            return compareMessages(thread1.messages[0], thread2.messages[0]);
        });
    }

    function processMessages(resps) {
        var inbox = resps[0];
        var sent = resps[1];
        var messages = [];

        lastMessages.inbox = _.last(inbox.children).data.name;
        lastMessages.sent = _.last(sent.children).data.name;

        _.each(_.pluck(inbox.children.concat(sent.children), 'data'), function (value) {
            me.saveMessage(value);
        });

        sortThreads();

        return me.getThreads();
    }

    _.extend(me, {
        threads: [],
        getThreads: function () {
            return me.threads;
        },
        saveMessage: function (message) {
            var thread = _.find(me.threads, function (thread) {
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

            var msg = _.find(thread.messages, function (value) { return value.id === message.name; });
            if (msg) {
                if (msg.isUnread && !message.new) {
                    thread.unreadCount--;
                }
                else if (!msg.isUnread && message.new) {
                    thread.unreadCount++;
                }
                msg.isUnread = message.new;
            }
            else {
                // This message is new. Create it.
                msg = {
                    id: message.name,
                    author: message.author,
                    bodyHtml: $sce.trustAsHtml($('<textarea/>').html(message.body_html).text()),
                    bodyText: message.body,
                    createDate: moment(message.created_utc * 1000),
                    isUnread: message.new,
                    isReceived: message.dest === RedditConfig.username
                };
                thread.unreadCount += (msg.isUnread) ? 1 : 0;
                thread.messages.unshift(msg);
            }

            return msg;
        },
        updateThreads: function () {
            return StorageService.loadConfigs()
                .then(function (config) {
                    return  $q.all([
                        RedditService.getInboxMessages({ limit: config.option.refresh.messageCount }),
                        RedditService.getSentMessages({ limit: config.option.refresh.messageCount })
                    ]);
                })
                .then(processMessages);
        },
        checkUnreadMessages: function () {
            return RedditService.getUnreadMessages()
                .then(function (data) {
                    var msgs = [];
                    _.each(_.pluck(data.children, 'data'), function (value) {
                        msgs.push(me.saveMessage(value));
                    });

                    return msgs;
                });
        },
        getMoreMessages: function () {
            return StorageService.loadConfigs().then(function (config) {
                return $q.all([
                    RedditService.getInboxMessages({ limit: config.option.refresh.messageCount, after: lastMessages.inbox }),
                    RedditService.getSentMessages({ limit: config.option.refresh.messageCount, after: lastMessages.sent })
                ]);
            })
            .then(processMessages);
        }
    });
}]);