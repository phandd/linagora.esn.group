'use strict';

module.exports = {
  OBJECT_TYPE: 'group',
  MODEL_NAME: 'Group',
  MEMBER_TYPES: {
    USER: 'user',
    EMAIL: 'email'
  },
  EVENTS: {
    CREATED: 'group:created',
    DELETED: 'group:deleted',
    UPDATED: 'group:updated'
  },
  SEARCH: {
    TYPE_NAME: 'groups',
    INDEX_NAME: 'groups.idx'
  },
  DEFAULT_OFFSET: 0,
  DEFAULT_LIMIT: 50
};
