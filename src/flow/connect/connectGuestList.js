import { connect } from "react-redux";

export default connect((state, redux) => {
  // console.log("[ConnectedGuestList]", state);
  return {
    guests: state.events.currentGuests
  };
});
