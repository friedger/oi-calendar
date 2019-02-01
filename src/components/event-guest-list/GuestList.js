import React, { Component } from "react";
import { ProgressBar } from "react-bootstrap";

const GUEST_BASE = "https://debutapp.social/";

function renderGuestList(guests) {
  var list = [];
  for (var property in guests) {
    if (guests.hasOwnProperty(property)) {
      var guest = guests[property];
      list.push(<Guest key={property} guest={guest} username={property} />);
    }
  }
  return list;
}

export const Guest = ({ guest, username }) => {
  console.log("UI guest", guest);
  const guestUrl = GUEST_BASE + username;
  var avatarUrl;
  if (guest.image && guest.image.length > 0 && guest.image[0].contentUrl) {
    avatarUrl = guest.image[0].contentUrl;
  } else {
    avatarUrl = "/images/avatar.png";
  }
  var name = guest.name;
  if (!name) {
    name = guest.username;
  }
  return (
    <div>
      <img src={avatarUrl} height="16px" alt="avatar" />
      <a href={guestUrl}>{name}</a>
    </div>
  );
};

class GuestList extends Component {
  render() {
    const guests = this.props.guests;
    const numberOfGuests = this.props.guestsCount || 1;
    const numberOfGuestsLoaded = this.props.guestsLoaded || 0;
    let guestView;

    if (guests) {
      guestView = renderGuestList(guests);
    } else if (numberOfGuests > 0) {
      guestView = (
        <div>
          loading guests' details..
          <br />
          <ProgressBar
            active
            now={((numberOfGuestsLoaded + 1) * 100) / (numberOfGuests + 1)}
          />
        </div>
      );
    } else {
      guestView = <div>There is nobody on the guest list..</div>;
    }
    return <section>{guestView}</section>;
  }

  componentWillReceiveProps(nextProps) {
    /*
    const { showInvitesModal, sending } = this.state;
    this.setState({
      showInvitesModal:
        showInvitesModal &&
        !(!!nextProps.inviteSuccess || !!nextProps.inviteError),
      sending:
        sending && !(!!nextProps.inviteSuccess || !!nextProps.inviteError)
    });
    */

    console.log("GuestList.didMount");
    // console.log("[ConnectedGuestList]", state);

    /*
    console.log("[popInvitesModal]", eventDetail);
    const { loadGuestList, updateCurrentEvent } = this.props;

    // updateCurrentEvent(eventDetail);
    let { guests } = eventDetail;
    if (typeof guests !== "string") {
      guests = "";
    }
    const guestList = guests.toLowerCase().split(/[,\s]+/g);
    console.log("dispatch load guest list", guestList, eventDetail);
    loadGuestList(guestList, ({ profiles, contacts }) => {
      console.log("profiles", profiles);
      this.setState({ guestListLoaded: true });
      // dispatch(setGuestList);
      // dispatch(asAction_setGuests(profiles, eventInfo));
    });
    */
  }
}

export default GuestList;
