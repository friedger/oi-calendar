import React, { Component } from "react";

import Calendars from "../Calendars";
import Contacts from "../Contacts";
import Settings from "../Settings";

class Scenario extends Component {
  constructor(props) {
    super(props);
    this.state = {
      calendars: [
        {
          type: "private",
          name: "default",
          active: true,
          data: { src: "default/AllEvents" }
        },
        {
          type: "blockstack-user",
          name: "public@friedger.id",
          mode: "read-only",
          active: false,
          hexColor: "#FF0000",
          data: { user: "friedger.id", src: "public/AllEvents" }
        }
      ],
      contacts: {
        "friedger.id": { roomId: "!oTPxgFhouwHiEGwIpQ:openintents.modular.im" },
        "pipppapp.id.blockstack": {
          roomId: "!vqrdwZGrwdDkQdGgnH:openintents.modular.im"
        }
      }
    };
    this.lookupContacts = this.lookupContacts.bind(this);
    this.addCalendar = this.addCalendar.bind(this);
  }

  lookupContacts(query) {
    console.log("query", query);
    return Promise.resolve(["friedger.id", "pipppapp.id.blockstack"]);
  }

  addCalendar(calendar) {
    const { calendars } = this.state;
    calendars.push(calendar);
    this.setState({ calendars });
  }

  render() {
    const { calendars, contacts } = this.state;
    return (
      <div>
        <Calendars calendars={calendars} addCalendar={this.addCalendar} />
        <Contacts contacts={contacts} lookupContacts={this.lookupContacts} />
        <Settings show={true} />
      </div>
    );
  }
}

export default Scenario;
