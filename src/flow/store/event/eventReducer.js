import {
  SET_EVENTS,
  USER,
  SET_CONTACTS,
  INVITES_SENT_OK,
  INVITES_SENT_FAIL,
  SET_CURRENT_GUESTS,
  SET_CURRENT_EVENT,
  UNSET_CURRENT_EVENT,
  INITIALIZE_CHAT
} from "../ActionTypes";

let initialState = {
  allEvents: [],
  contacts: {},
  user: ""
};

export default function reduce(state = initialState, action = {}) {
  // console.log("EventReducer", action);
  const { type, payload } = action;
  let newState = state;
  switch (type) {
    case INITIALIZE_CHAT:
      newState = { ...state, userSessionChat: payload };
      break;

    case USER:
      newState = { ...state, user: action.user };
      break;

    case SET_CONTACTS:
      // console.log('all contacts', payload.contacts);
      newState = { ...state, contacts: payload.contacts };
      break;

    case SET_EVENTS:
      newState = { ...state, allEvents: action.allEvents };
      break;

    case SET_CURRENT_EVENT:
      console.log("SET_CURRENT_EVENT", payload);
      newState = {
        ...state,
        currentEvent: payload.currentEvent,
        currentEventType: payload.currentEventType
      };
      break;

    case UNSET_CURRENT_EVENT:
      newState = {
        ...state,
        currentEvent: undefined,
        currentEventType: undefined,
        inviteSuccess: undefined,
        inviteError: undefined
      };
      break;

    case INVITES_SENT_OK:
      newState = {
        ...state,
        allEvents: payload.allEvents,
        currentEvent: undefined,
        currentEventType: undefined,
        inviteSuccess: true,
        inviteError: undefined
      };
      break;

    case INVITES_SENT_FAIL:
      newState = {
        ...state,
        inviteSuccess: false,
        inviteError: payload.error
      };
      break;

    case SET_CURRENT_GUESTS:
      newState = {
        ...state,
        currentGuests: payload.profiles,
        inviteSuccess: undefined,
        inviteError: undefined
      };
      break;

    default:
      newState = state;
      break;
  }

  return newState;
}
