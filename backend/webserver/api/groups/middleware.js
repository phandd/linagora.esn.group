'use strict';

const emailAddresses = require('email-addresses');
const composableMW = require('composable-middleware');

module.exports = (dependencies, lib) => {
  const authorizationMW = dependencies('authorizationMW');
  const coreTuple = dependencies('tuple');
  const {
    send400Error,
    send403Error,
    send404Error,
    send500Error
  } = require('../utils')(dependencies);

  return {
    canCreate,
    canDelete,
    canList,
    canGet,
    canUpdate,
    canRemoveMembers,
    load,
    validateGroupCreation,
    validateGroupUpdate,
    validateRemoveMembers
  };

  function load(req, res, next) {
    lib.group.getById(req.params.id)
      .then(group => {
        if (group) {
          req.group = group;
          next();
        } else {
          send404Error('Group not found', res);
        }
      })
      .catch(err => send500Error('Unable to load group', err, res));
  }

  function validateGroupUpdate(req, res, next) {
    const { name, email } = req.body;

    if (!name && !email) {
      return send400Error('body must contain at least one of these fields: email, name', res);
    }

    if (!email) {
      return next();
    }

    if (emailAddresses.parseOneAddress(email) === null) {
      return send400Error('email is not a valid email address', res);
    }

    lib.group.list({ email })
      .then(groups => {
        if (groups.length === 1 && groups[0].email === req.group.email || !groups.length) {
          return next();
        }

        send400Error('email is used by another group', res);
      })
      .catch(err => send500Error('Unable to validate email', err, res));
  }

  function validateGroupCreation(req, res, next) {
    const { name, email, members } = req.body;

    if (!name) {
      return send400Error('name is required', res);
    }

    if (!email) {
      return send400Error('email is required', res);
    }

    if (emailAddresses.parseOneAddress(email) === null) {
      return send400Error('email is not a valid email address', res);
    }

    if (members && !Array.isArray(members)) {
      return send400Error('members must be an array', res);
    }

    lib.group.list({ email })
      .then(groups => {
        if (groups.length) {
          return send400Error('email is used by another group', res);
        }
        req.body.members = [...new Set(members)].filter(member => emailAddresses.parseOneAddress(member) !== null);

        next();
      })
      .catch(err => send500Error('Unable to validate email', err, res));
  }

  function canCreate(req, res, next) {
    authorizationMW.requiresDomainManager(req, res, next);
  }

  function canDelete(req, res, next) {
    composableMW(
      ensureGroupBoundedToDomain,
      authorizationMW.requiresDomainManager
    )(req, res, next);
  }

  function canList(req, res, next) {
    authorizationMW.requiresDomainManager(req, res, next);
  }

  function canGet(req, res, next) {
    composableMW(
      ensureGroupBoundedToDomain,
      authorizationMW.requiresDomainManager
    )(req, res, next);
  }

  function canUpdate(req, res, next) {
    composableMW(
      ensureGroupBoundedToDomain,
      authorizationMW.requiresDomainManager
    )(req, res, next);
  }

  function canRemoveMembers(req, res, next) {
    return canUpdate(req, res, next);
  }

  function ensureGroupBoundedToDomain(req, res, next) {
    if (isGroupBoundedToDomain(req.group, req.domain)) {
      next();
    } else {
      send403Error(`You do not have permission to perfom action on this group: ${req.group.id}`, res);
    }
  }

  function validateRemoveMembers(req, res, next) {
    const hasInvalidTuple = req.body.some(tuple => {
      if (!tuple) {
        return true;
      }

      try {
        return !coreTuple.get(tuple.objectType, tuple.id);
      } catch (err) {
        return true;
      }
    });

    if (hasInvalidTuple) {
      return send400Error('body must be an array of valid member tuples {objectType, id}', res);
    }

    next();
  }
};

function isGroupBoundedToDomain(group, domain) {
  if (!group) {
    throw new Error('Group cannot be null');
  }

  if (!domain) {
    throw new Error('Domain cannot be null');
  }

  if (Array.isArray(group.domain_ids)) {
    return group.domain_ids.some(domainId => String(domainId) === domain.id);
  }

  return false;
}
