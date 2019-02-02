var assert = require("assert");
var storeManager = require("../src/flow/store/storeManager");
// var { addEvent } = require("../src/flow/store/event/eventActionLazy");
var { addEvent } = require("./promise-test");

const store = storeManager.createInitialStore({});

// :NOTE: in this file, you should test function in io/event.js.
// testing the redux store requires a slightly different strategy where
// you need to store.subscribe and then check the state of the store.

// Node.js is much stricter on Promises than the browser.
// Every promise must have both endpoints (resolve, reject) dealt with.

describe("CRUD Events", () => {
  describe("add private event", function() {
    this.timeout(150000);
    it("should store a new private event", done => {
      store.subscribe(() => {
        console.log("[RESOLVE]");
        const state = store.getState();
        const allEvents = state.events.allEvents;
        console.log("[ALL]", JSON.stringify(state));
        assert.equal(
          allEvents.length,
          2,
          "Should contain default event and new event"
        );
        // done();
      });
      console.log("[DISPATCH]");
      store.dispatch(addEvent({ title: "ABC" })).catch(() => {});
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
