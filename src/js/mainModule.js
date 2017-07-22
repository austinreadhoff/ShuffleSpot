'use strict'
var mainModule = angular.module('main', []);

mainModule.controller('mainController', [
    '$scope',
    '$q',
    '$timeout', function ($scope) {
        mainController($scope);
    }
]);