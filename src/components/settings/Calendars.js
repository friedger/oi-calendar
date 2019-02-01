import React, { Component } from "react";
import { Button } from "react-bootstrap";
const Calendar = props => {
  const { calendar, handleDataChange } = props;
  //const privateCalendar = calendar.type === "private";
  return (
    <div>
      <input
        type="checkbox"
        checked={calendar.active}
        value={calendar.active}
      />
      <input
        type="color"
        value={calendar.hexColor || ""}
        onChange={e => handleDataChange(e, "hexColor")}
        style={{ marginRight: "20px", marginLeft: "5px" }}
      />
      <label>{calendar.name}</label>
      {/* TODO implement editCalendar
      {privateCalendar && (
        <Button variant="light">
          <span className="glyphicon glyphicon-pencil" />
        </Button>
      )}
      */}
    </div>
  );
};

export default class Calendars extends Component {
  constructor(props) {
    super(props);
    this.state = { calendarToAdd: props.addCalendarUrl };
    this.bound = [
      "handleDataChange",
      "addCalendar",
      "handleCalendarChange",
      "renderCalendars"
    ].reduce((acc, d) => {
      acc[d] = this[d].bind(this);
      return acc;
    }, {});
  }

  handleCalendarChange(calendar) {
    return (event, ref) => {
      calendar[ref] = event.target.value;
      // TODO store calendars on close
    };
  }

  renderCalendars(calendars) {
    const list = [];
    for (var i in calendars) {
      var calendar = calendars[i];
      list.push(
        <Calendar
          key={i}
          calendar={calendar}
          handleDataChange={this.handleCalendarChange(calendar)}
        />
      );
    }
    return list;
  }

  addCalendar() {
    const { calendarToAdd } = this.state;
    const { addCalendar } = this.props;
    if (calendarToAdd) {
      if (calendarToAdd.startsWith("http")) {
        addCalendar({
          name: "",
          type: "ics",
          mode: "read-only",
          data: { src: calendarToAdd }
        });
      } else {
        const parts = calendarToAdd.split("@");
        if (parts.length === 2) {
          const parts = calendarToAdd.split("@");
          const user = parts[1];
          const src = parts[0] + "/AllEvents";
          addCalendar({
            name: calendarToAdd,
            mode: "read-only",
            type: "blockstack-user",
            data: { user, src }
          });
        } else {
          this.setState({ error: "Invalid calendar " });
        }
      }
    }
  }

  handleDataChange(e, ref) {
    const val = e.target.value;
    const stateUpdates = {};
    stateUpdates[ref] = val;
    this.setState(stateUpdates);
  }

  render() {
    const { calendars, addCalendarUrl } = this.props;
    const view = this.renderCalendars(calendars);
    return (
      <div className="settings">
        <input
          placeholder="e.g. public@user.id or https://calendar.google..../basic.ics"
          type="text"
          value={addCalendarUrl}
          onChange={e => this.bound.handleDataChange(e, "calendarToAdd")}
        />
        <Button onClick={() => this.bound.addCalendar()}>Add</Button>
        {view}
      </div>
    );
  }
}
