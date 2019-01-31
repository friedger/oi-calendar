import moment from "moment";
import { uuid } from "./eventFN";

export const defaultEvents = [
  {
    id: 0,
    title: "Today!",
    allDay: true,
    start: new Date(moment()), // :Q: is moment really required here?
    end: new Date(moment()),
    hexColor: "#265985",
    notes: "Have a great day!"
  }
];

const uuids = [uuid(), uuid(), uuid()];

// :NOTE: in js, objects can be declared as const but their content changed,
// I prefer to use let when declaring objects or arrays to make it clear that
// content mutations will happen.
export let defaultCalendars = {};
defaultCalendars[uuids[0]] = {
  uid: uuids[0],
  type: "private",
  name: "default",
  data: { src: "default/AllEvents", events: defaultEvents }
};
defaultCalendars[uuids[1]] = {
  uid: uuids[1],
  type: "blockstack-user",
  name: "public@friedger.id",
  mode: "read-only",
  data: { user: "friedger.id", src: "public/AllEvents" }
};
defaultCalendars[uuids[2]] = {
  uid: uuids[2],
  type: "ics",
  name: "holidays",
  mode: "read-only",
  data: {
    src:
      "https://calendar.google.com/calendar/ical/de.be%23holiday%40group.v.calendar.google.com/public/basic.ics"
  },
  hexColor: "#b8004f"
};
