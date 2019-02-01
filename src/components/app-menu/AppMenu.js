import React, { Component } from "react";
import { DropdownButton, MenuItem } from "react-bootstrap";

export default class AppMenu extends Component {
  constructor(props) {
    super(props);
    this.bound = ["onSelect"].reduce((acc, d) => {
      acc[d] = this[d].bind(this);
      return acc;
    }, {});
  }

  onSelect(eventKey) {
    switch (eventKey) {
      case "settings":
        this.props.showSettings();
        break;
      case "publicCalendar":
        this.props.viewMyPublicCalendar("public@" + this.props.username);
        break;
      default:
        console.warn("invalid menu item ", eventKey);
        break;
    }
  }
  render() {
    const { onSelect } = this.bound;
    const { username } = this.props;
    return (
      username && (
        <DropdownButton
          drop="down"
          bsStyle="default"
          title="Menu"
          id="dropdown-menu"
          pullRight
          onSelect={onSelect}
        >
          <MenuItem eventKey="settings">Settings</MenuItem>
          <MenuItem eventKey="publicCalendar">View public calendar</MenuItem>
        </DropdownButton>
      )
    );
  }
}
