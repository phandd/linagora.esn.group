'use strict';

const { MODEL_NAME } = require('../../../lib/constants');

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const domainMW = dependencies('domainMW');
  const helperMW = dependencies('helperMW');
  const controller = require('./controller')(dependencies, lib);
  const middleware = require('./middleware')(dependencies, lib);

  router.post('/groups',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    middleware.canCreate,
    middleware.validateGroupCreation,
    controller.create
  );

  router.get('/groups',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    middleware.canList,
    controller.list
  );

  router.get('/groups/:id',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    helperMW.checkIdInParams('id', MODEL_NAME),
    middleware.load,
    middleware.canGet,
    controller.get
  );

  router.post('/groups/:id',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    helperMW.checkIdInParams('id', MODEL_NAME),
    middleware.load,
    middleware.canUpdate,
    middleware.validateGroupUpdate,
    controller.update
  );

  router.delete('/groups/:id',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    helperMW.checkIdInParams('id', MODEL_NAME),
    middleware.load,
    middleware.canDelete,
    controller.deleteGroup
  );

  router.get('/groups/:id/members',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    helperMW.checkIdInParams('id', MODEL_NAME),
    middleware.load,
    middleware.canGetMembers,
    controller.getMembers
  );

  router.post('/groups/:id/members',
    authorizationMW.requiresAPILogin,
    domainMW.loadSessionDomain,
    helperMW.checkIdInParams('id', MODEL_NAME),
    helperMW.requireInQuery('action'),
    helperMW.requireBodyAsArray,
    middleware.validateMembers,
    middleware.load,
    middleware.canUpdateMembers,
    controller.updateMembers
  );
};
