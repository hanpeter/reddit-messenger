App.controller('ComposeController', ['$scope', 'RedditService', function ($scope, RedditService) {
    _.extend($scope, {
        to: '',
        subject: '',
        message: '',
        captchaSrc: null,
        captcha: '',
        captchaIden: null
    });

    $scope.$watch('isComposing', function (value) {
        if (!value) {
            return;
        }

        $scope.captchaSrc = null;
        RedditService.getCaptcha().done(function (data) {
            $scope.sync(function () {
                $scope.captchaIden = data.iden;
                $scope.captchaSrc = data.imgSrc;
            });
        });
    });
}]);