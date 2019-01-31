import React, { Component } from "react";

import App from "../App";
// import ReudxApp from "../redux-app";
// import ConnectedEventCalendar from "../redux-event-calendar";
// import ConnectedEventDetails from "../redux-event-details";
// import ConnectedUserProfile from "../redux-user-profile";
// import ConnectedGuestList from "../redux-guest-list";

// import EventDetails from "../../components/event-details/EventDetails";
// import { LoadGuestList, SendInvites } from "../../store/event/eventActionLazy";

// import moment from "moment";
// import * as blockstack from "blockstack";
// import * as ics from "ics";
// import * as ICAL from "ical.js";

let loaded = false;
const doNothing = () => {};

let EventCalendar = props => {
  return <div>EventCalendar</div>;
};
let UserProfile = props => {
  return <div>UserProfile</div>;
};

let whenAppLoaded = forceUpdate => {
  console.log("whenAppLoaded");
  import("../../components/event-calendar/EventCalendar").then(
    ({ default: EventCalendarBase }) => {
      EventCalendar = props => {
        return (
          <EventCalendarBase
            getInitialEvents={doNothing}
            views={{ EventDetails: doNothing }}
            events={{ allEvents: {} }}
          />
        );
      };
      console.log("EventCalendarLoaded");
      forceUpdate();
    }
  );

  import("../../components/auth-user-profile/UserProfile").then(
    ({ default: UserProfileBase }) => {
      UserProfile = props => {
        return (
          <UserProfileBase
            isSignedIn={true}
            isConnecting={true}
            userSignOut={doNothing}
            userSignIn={doNothing}
          />
        );
      };
      console.log("EventCalendarLoaded");
      // forceUpdate();
    }
  );
};

let dynamicApp;

class DynamicApp extends Component {
  render() {
    return <App views={{ EventCalendar, UserProfile }} />;
  }
  doSomething() {}
  componentDidMount() {
    whenAppLoaded(() => {
      console.log("DONE");
      this.forceUpdate();
    });
  }
}

const Scenario = () => {
  dynamicApp = <DynamicApp />;
  return dynamicApp;
};

export default Scenario;
