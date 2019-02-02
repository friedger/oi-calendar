var assert = require("assert");
var storeManager = require("../src/flow/store/storeManager");
// var { addEvent } = require("../src/flow/store/event/eventActionLazy");
var { addEvent } = require("./promise-test");
import { SET_EVENTS } from "../src/flow/store/ActionTypes";

const store = storeManager.createInitialStore({});

// :NOTE:  testing the redux store requires a slightly different strategy where
// you need to store.subscribe and then check the state of the store.

// :NOTE: it is best to have two different sets of tests. One to test the services.
// One to test the information flux as managed by redux

// Node.js is much stricter on Promises than the browser.
// So you might get tests to fail due to Promises not having an explicit reject

describe("CRUD Events", () => {
  describe("add private event", function() {
    this.timeout(150000);
    it("should store a new private event", done => {
      store.subscribe(() => {
        const state = store.getState();
        const allEvents = state.events.allEvents;
        assert.equal(
          allEvents.length,
          2,
          "Should contain default event and new event"
        );
        done();
      });
      store.dispatch({ type: SET_EVENTS, allEvents: [1, 2] });
      // store.dispatch(addEvent({ title: "ABC" })).catch(() => {});
    });
  });
  describe("add public event", () => {
    it("should publish the event", () => {});
  });
  describe("update event", () => {
    it("should store the updated event", () => {});
  });
  describe("delete event", () => {
    it("should remove the event", () => {});
  });
});
