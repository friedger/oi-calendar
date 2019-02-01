import { connect } from "react-redux";

export default connect((state, redux) => {
  return {
    guests: state.events.currentGuests
  };
});
