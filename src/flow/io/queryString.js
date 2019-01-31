export function parseQueryString(query) {
  return (query.replace(/^\?/, "").split("&") || []).reduce((acc, d) => {
    const [k, v] = d.split("=");
    if (k) {
      acc[k] = v;
    }
    return acc;
  }, {});
}

export function encodeQueryString(obj) {
  const q = Object.keys(obj).map(k => {
    return [k, obj[k]].join("=");
  });

  if (q && q.length) {
    return "?" + q.join("&");
  } else {
    return "";
  }
}
