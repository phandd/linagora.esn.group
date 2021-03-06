(function(angular) {
  'use strict';

  angular.module('linagora.esn.group')

  .config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.when('/group', '/group/list');
    $stateProvider
      .state('group', {
        url: '/group',
        templateUrl: '/group/app/app.html',
        resolve: {
          isAdmin: function($location, session) {
            return session.ready.then(function() {
              if (!session.userIsDomainAdministrator()) { $location.path('/'); }
            });
          }
        }
      })
      .state('group.list', {
        url: '/list',
        views: {
          'root@group': {
            template: '<group-list />'
          }
        }
      })
      .state('group.display', {
        url: '/:groupId',
        views: {
          'root@group': {
            template: '<group-display />'
          }
        }
      });
  });
})(angular);
