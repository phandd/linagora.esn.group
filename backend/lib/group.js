'use strict';

const q = require('q');
const { DEFAULT_OFFSET, DEFAULT_LIMIT, EVENTS, OBJECT_TYPE, MEMBER_TYPES } = require('./constants');

module.exports = dependencies => {
  const { Event } = dependencies('core-models');
  const pubsub = dependencies('pubsub').local;
  const coreCollaboration = dependencies('collaboration');
  const mongoose = dependencies('db').mongo.mongoose;
  const coreUser = dependencies('user');
  const Group = mongoose.model('Group');

  return {
    addMembers,
    create,
    deleteById,
    getById,
    getByEmail,
    getMemberEmail,
    getAllMembers,
    list,
    removeMembers,
    resolveMember,
    updateById,
    isEmailAvailableToUse
  };

  function addMembers(group, members) {
    return q.denodeify(coreCollaboration.member.addMembers)(group, members)
      .then(data => {
        publish(EVENTS.MEMBERS_ADDED, {
          id: group.id,
          payload: { group, members }
        });

        return data;
      });
  }

  function create(group) {
    return Group.create(group).then(group => {
      publish(EVENTS.CREATED, { id: String(group._id), payload: group });

      return group;
    });
  }

  function list(options = {}) {
    const query = {};

    if (options.email) {
      query.email = String(options.email).toLowerCase();
    }

    if (options.domainId) {
      query.domain_ids = options.domainId;
    }

    return Group
      .find(query)
      .skip(+options.offset || DEFAULT_OFFSET)
      .limit(+options.limit || DEFAULT_LIMIT)
      .sort({ _id: -1 })
      .exec();
  }

  function deleteById(groupId) {
    return Group.findByIdAndRemove(groupId)
      .exec()
      .then(group => {
        publish(EVENTS.DELETED, { id: groupId, payload: group });

        return group;
      });
  }

  function removeMembers(group, members) {
    return q.denodeify(coreCollaboration.member.removeMembers)(group, members)
      .then(data => {
        publish(EVENTS.MEMBERS_REMOVED, {
          id: group.id,
          payload: { group, members }
        });

        return data;
      });
  }

  function resolveMember(memberTuple) {
    return coreCollaboration.memberResolver.resolve(memberTuple)
      .then(member => ({
        id: memberTuple.id,
        objectType: memberTuple.objectType,
        member
      }));
  }

  function updateById(groupId, modified) {
    return Group.findOneAndUpdate({ _id: groupId }, { $set: modified })
      .exec()
      .then(oldGroup =>
        getById(groupId).then(newGroup => {
          publish(EVENTS.UPDATED, {
            id: groupId,
            payload: { old: oldGroup, new: newGroup }
          });

          return newGroup;
        })
      );
  }

  function getById(id) {
    return Group.findOne({ _id: id });
  }

  function getByEmail(email) {
    return Group.findOne({ email: email.toLowerCase() });
  }

  function getMemberEmail(member) {
    if (member.objectType === MEMBER_TYPES.USER) {
      return member.member.preferredEmail;
    } else if (member.objectType === MEMBER_TYPES.EMAIL) {
      return member.member;
    }

    return null;
  }

  function getAllMembers(group) {
    const query = { limit: group.members.length };

    return q.denodeify(coreCollaboration.member.getMembers)(group, OBJECT_TYPE, query);
  }

  function publish(topicName, { id, payload }) {
    if (id && payload) {
      pubsub.topic(topicName).publish(new Event(null, topicName, OBJECT_TYPE, String(id), payload));
    }
  }

  function isEmailAvailableToUse(email, whiteListGroup = []) {
    return list({ email })
      .then(groups => {
        const noGroupConflict = !groups[0] || whiteListGroup.some(group => groups[0].id === group.id);

        if (noGroupConflict) {
          return q.ninvoke(coreUser, 'findByEmail', email)
            .then(user => !user);
        }
      });
  }
};
