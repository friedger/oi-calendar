import React from "react";

export function connectToStore(Comp, connectComp, store) {
  return props => {
    return React.createElement(connectComp(Comp), { store, ...props }, null);
  };
}

export function PlaceHolder(props) {
  return <div style={{ display: "none" }} />;
}
