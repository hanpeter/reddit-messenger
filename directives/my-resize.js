App.directive('myResize', ['$window', 'StorageService', function ($window, StorageService) {
    return {
        link: function (scope, elem, attrs) {
            angular.element($window).bind('resize', function () {
                StorageService.saveConfigs({
                    winWidth: $window.innerWidth,
                    winHeight: $window.innerHeight
                });
            });
        }
    }
}]);