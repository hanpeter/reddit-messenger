App.service('NotificationService', ['$timeout', '$q', '$sce', 'StorageService', function ($timeout, $q, $sce, StorageService) {
    var me = this;
    var notificationIDs = [];
    var ignoreList = [];
    var notificationRefreshTime = moment();
    var notificationTemplate = {
            type: 'basic',
            iconUrl: '/assets/icon_128.png',
            isClickable: true
        };
    var notificationAudio = new Audio('/assets/notification.mp3');

    chrome.notifications.onClicked.addListener(function (nID) {
        StorageService.loadConfigs()
            .then(function (config) {
                if (nID === me.notificationID) {
                    notificationRefreshTime = moment().add(config.option.notification.snooze, 's');
                }
            });
    });

    function clearNotificaton(notificationID) {
        var deferred = $q.defer();

        chrome.notifications.clear(notificationID, function (wasCleared) {
            if (wasCleared) {
                deferred.resolve();
            }
            else {
                deferred.reject();
            }
        });

        return deferred.promise;
    }

    function createNotification(msg) {
        var deferred = $q.defer();
        var config = _.extend(notificationTemplate, {
                title: 'Unread message from ' + msg.author,
                message: msg.bodyText
            });

        chrome.notifications.create(msg.id, config, function (notificationID) {
            deferred.resolve(notificationID);
        });

        return deferred.promise;
    }

    function timeout() {
        var deferred = $q.defer();

        $timeout(function () {
            deferred.resolve();
        });

        return deferred.promise;
    }

    _.extend(me, {
        clear: function () {
            return $q.all(
                _.map(notificationIDs, function (notificationID) { return clearNotificaton(notificationID); })
            );
        },
        update: function (msgs) {
            if (moment().diff(notificationRefreshTime, 'seconds') >= 0) {
                me.clear()
                    .then(timeout)
                    .then(StorageService.loadConfigs)
                    .then(function (c) {
                        $q.all(
                            _.map(msgs, function (msg) { return createNotification(msg); })
                        ).then(function (ids) {
                            notificationIDs = ids;

                            if (notificationIDs.length > 0) {
                                notificationAudio.play();
                                me.notificationRefreshTime = moment().add(c.option.notification.interval, 's');
                            }
                        });
                    });
            }
        }
    });
}]);