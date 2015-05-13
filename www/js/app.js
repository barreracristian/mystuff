// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'mystuff.controllers', 'mystuff.services'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }

        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: "/tab",
                abstract: true,
                templateUrl: "templates/tabs.html"
            })

            // Each tab has its own nav history stack:

            /* ----------------- CAJAS ----------------- */

            .state('tab.cajas', {
                url: '/cajas',
                views: {
                    'tab-cajas': {
                        templateUrl: 'templates/tab-cajas.html',
                        controller: 'CajasCtrl'
                    }
                }
            })

            .state('tab.caja', {
                url: '/cajas/:cajaId',
                views: {
                    'tab-cajas': {
                        templateUrl: 'templates/caja.html',
                        controller: 'CajaCtrl'
                    }
                }
            })

            .state('tab.caja-cosa', {
                url: '/cajas/:cajaId/:cosaId',
                views: {
                    'tab-cajas': {
                        templateUrl: 'templates/cosa.html',
                        controller: 'CosaCtrl'
                    }
                }
            })

            .state('tab.caja-cosa-tags', {
                url: '/cajas/:cosaId/detail/tags',
                views: {
                    'tab-cajas': {
                        templateUrl: 'templates/cosa-tags.html',
                        controller: 'CosaTagsCtrl'
                    }
                }
            })

            /* ----------------- BUSQUEDA ----------------- */

            .state('tab.busqueda', {
                url: '/busqueda',
                views: {
                    'tab-busqueda': {
                        templateUrl: 'templates/tab-busqueda.html',
                        controller: 'BusquedaCtrl'
                    }
                }
            })

            .state('tab.busqueda-cosa', {
                url: '/busqueda/:busqueda/:cosaId',
                views: {
                    'tab-busqueda': {
                        templateUrl: 'templates/cosa.html',
                        controller: 'CosaCtrl'
                    }
                }
            })

            .state('tab.busqueda-cosa-tags', {
                url: '/busqueda/:cosaId/detail/tags',
                views: {
                    'tab-busqueda': {
                        templateUrl: 'templates/cosa-tags.html',
                        controller: 'CosaTagsCtrl'
                    }
                }
            })

            /* ----------------- TAGS ----------------- */

            .state('tab.tags', {
                url: '/tags',
                views: {
                    'tab-tags': {
                        templateUrl: 'templates/tab-tags.html',
                        controller: 'TagsCtrl'
                    }
                }
            })

            .state('tab.tag-bulk', {
                url: '/tags/bulk/:tag',
                views: {
                    'tab-tags': {
                        templateUrl: 'templates/tag-bulk.html',
                        controller: 'TagBulkCtrl'
                    }
                }
            })

            .state('tab.tag-list', {
                url: '/tags/:tag',
                views: {
                    'tab-tags': {
                        templateUrl: 'templates/tag-list.html',
                        controller: 'TagListCtrl'
                    }
                }
            })

            .state('tab.tag-cosa', {
                url: '/tags/:tag/:cosaId',
                views: {
                    'tab-tags': {
                        templateUrl: 'templates/cosa.html',
                        controller: 'CosaCtrl'
                    }
                }
            })

            .state('tab.tag-cosa-tags', {
                url: '/tags/:cosaId/detail/tags',
                views: {
                    'tab-tags': {
                        templateUrl: 'templates/cosa-tags.html',
                        controller: 'CosaTagsCtrl'
                    }
                }
            })

            /* ----------------- LOG ----------------- */

            .state('tab.log', {
                url: '/log',
                views: {
                    'tab-log': {
                        templateUrl: 'templates/tab-log.html',
                        controller: 'LogCtrl'
                    }
                }
            })

        ;

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/cajas');

    });
