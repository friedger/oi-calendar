import { parse, Component, Event } from "ical.js";
import { createEvents } from "ics";

function eventFromIcal(d) {
  var vevent = new Event(d);
  return {
    title: vevent.summary,
    start: vevent.startDate.toJSDate().toISOString(),
    end: vevent.endDate.toJSDate().toISOString(),
    uid: vevent.uid
  };
}

export function iCalParseEvents(icsContent, formatEvent) {
  try {
    var jCal = parse(icsContent);
    var comp = new Component(jCal);
    var vevents = comp.getAllSubcomponents("vevent");
    return vevents.map(eventFromIcal);
  } catch (e) {
    console.log("ics error", e);
    return;
  }
}

export function eventAsIcs(event) {
  let { title, description, start, end, allDay, uid } = event;
  start = dateToArray(allDay, new Date(start));
  end = dateToArray(allDay, new Date(end));
  return { title, description, start, end, uid };
}

export function icsFromEvents(events) {
  try {
    var { error, value } = createEvents(Object.values(events).map(eventAsIcs));
    if (error) {
      console.log("error creating ics", error);
    } else {
      return value;
    }
  } catch (e) {
    console.log("failed to format events", e);
  }
}

function dateToArray(allDay, date) {
  let base = [date.getFullYear(), date.getMonth() + 1, date.getDay()];
  if (allDay) {
    return base;
  } else {
    return base.concat([date.getHours(), date.getMinutes(), date.getSeconds()]);
  }
}
