var guid = 0;
var guids = new Map();

export function guidFor(item) {
  if (guids.has(item)) { return guids.get(item); }
  var itemGuid = guid++;
  guids.set(item, itemGuid);
  return itemGuid;
}
