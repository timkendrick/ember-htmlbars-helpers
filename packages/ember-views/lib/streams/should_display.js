export default function shouldDisplay(predicate) {
  var type = typeof predicate;

  if (type === 'boolean') { return predicate; }

  if (Array.isArray(predicate)) {
    return predicate.length !== 0;
  } else {
    return !!predicate;
  }
}
