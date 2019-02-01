// view
import React from "react";
import EventDetails from "../components/event-details/EventDetails";
import GuestList from "../components/event-guest-list/GuestList";
import UserProfile from "../components/auth-user-profile/UserProfile";
import { connectToStore } from "./_FN";
import { SET_LAZY_VIEW } from "../flow/store/ActionTypes";

// flow
import connectEventDetails from "../flow/connect/connectEventDetails";
import connectGuestList from "../flow/connect/connectGuestList";
import connectUserProfile from "../flow/connect/connectUserProfile";

import {
  initializeLazyActions,
  initializeChat
} from "../flow/store/event/eventActionLazy";

export function initializeLazy(store) {
  store.dispatch({
    type: SET_LAZY_VIEW,
    payload: {
      EventDetails: connectToStore(EventDetails, connectEventDetails, store),
      GuestList: connectToStore(GuestList, connectGuestList, store),
      UserProfile: connectToStore(UserProfile, connectUserProfile, store)
    }
  });
  store.dispatch(initializeLazyActions());
  store.dispatch(initializeChat());
}
