// check https://github.com/benoror/blockstack-create-react-app/blob/master/README.md

import { SET_EVENTS } from "../src/flow/store/ActionTypes";
import { uuid } from "../src/flow/io/eventFN";
import { putFile } from "blockstack";
import { JSDOM } from "jsdom";

// :NOTE: Blockstack is causing issues due to some localstorage warning.
// Here are different known approaches to deal with that problem.
// None of them seem to work.

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000/"
});

const localStorageMock = {
  getItem: () => {},
  setItem: () => {},
  clear: () => {}
};
global.localStorage = localStorageMock;

function asAction_setEvents(allEvents) {
  return { type: SET_EVENTS, allEvents: allEvents };
}

function putOnBlockstack(src, text, config) {
  if (text && typeof text !== "string") {
    text = JSON.stringify(text);
  }
  // :WARN:  SecurityError: localStorage is not available for opaque origins
  // return putFile(src, text, config);
}

export function saveEvents(calendarName, allEvents) {
  const calendarEvents = Object.keys(allEvents)
    .filter(key => allEvents[key].calendarName === calendarName)
    .reduce((res, key) => {
      res[key] = allEvents[key];
      return res;
    }, {});

  return putOnBlockstack(calendarName + "/AllEvents", calendarEvents);
}

export function saveAllEvents(allEvents, type = "default") {
  return (dispatch, getState) => {
    saveEvents("default", allEvents);
    dispatch(asAction_setEvents(allEvents));
  };
}

export function addEvent(event) {
  return (dispatch, getState) => {
    let state = getState();
    let { allEvents } = state.events;
    event.calendarName = "default";
    event.uid = uuid();
    allEvents[event.uid] = event;
    dispatch(saveAllEvents(allEvents));
    if (event.public) {
      // publishEvents(event, updatePublicEvent));
    }
    // window.history.pushState({}, "OI Calendar", "/");
  };
}
