var assert = require("assert");
var storeManager = require("../src/store/storeManager");
var eventAction = require("../src/store/event/eventAction");

const store = storeManager.createInitialStore({});

describe("CRUD Events", () => {
  describe("add private event", () => {
    it("should store a new private event", () => {
      store.dispatch(eventAction.addEvent({ title: "ABC" }));
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

/*
 assert.fail(actual, expected, message, operator)
Throws an exception that displays the values for actual and expected separated by the provided operator.

assert(value, message), assert.ok(value, [message])
Tests if value is truthy, it is equivalent to assert.equal(true, !!value, message);

assert.equal(actual, expected, [message])
Tests shallow, coercive equality with the equal comparison operator ( == ).

assert.notEqual(actual, expected, [message])
Tests shallow, coercive non-equality with the not equal comparison operator ( != ).

assert.deepEqual(actual, expected, [message])
Tests for deep equality.

assert.notDeepEqual(actual, expected, [message])
Tests for any deep inequality.

assert.strictEqual(actual, expected, [message])
Tests strict equality, as determined by the strict equality operator ( === )

assert.notStrictEqual(actual, expected, [message])
Tests strict non-equality, as determined by the strict not equal operator ( !== )

assert.throws(block, [error], [message])
*/
