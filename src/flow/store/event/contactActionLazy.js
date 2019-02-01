import { SET_CONTACTS } from "../ActionTypes";

import { fetchContactData, publishContacts } from "../../io/event";

function asAction_setContacts(contacts) {
  return { type: SET_CONTACTS, payload: { contacts } };
}

// ################
// When initializing app
// ################

export function initializeContactData() {
  return async (dispatch, getState) => {
    fetchContactData().then(contacts => {
      dispatch(asAction_setContacts(contacts));
    });
  };
}

// ################
// In Settings
// ################
export function addContact(contact) {
  return async (dispatch, getState) => {
    fetchContactData().then(contacts => {
      // TODO check for duplicates
      contacts.push(contact);
      publishContacts(contacts);
      dispatch(asAction_setContacts(contacts));
    });
  };
}

export function deleteContacts(deleteList) {
  return async (dispatch, getState) => {
    fetchContactData().then(contacts => {
      const uids = deleteList.map(d => d.uid);

      contacts = contacts.filter(d => {
        return !uids.includes(d.uid);
      });
      publishContacts(contacts);
      dispatch(asAction_setContacts(contacts));
    });
  };
}
