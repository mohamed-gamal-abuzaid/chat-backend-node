import{users} from '../db/models/users';
import {groups}from '../db/models/groups';
import {groupMembers}from '../db/models/groupMembers';
import {messages}from '../db/models/messages';
import {notifications}from '../db/models/notifications';

export const schema = {
  users,
  groups,
  groupMembers,
  messages,
  notifications,
};