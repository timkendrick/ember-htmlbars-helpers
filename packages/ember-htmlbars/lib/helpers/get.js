/**
@module ember
@submodule ember-templates
*/

import { assert } from 'ember-metal/debug';
import get from 'ember-metal/property_get';

/**
  Dynamically look up a property on an object. The second argument to `{{get}}`
  should have a string value, although it can be bound.
  For example, these two usages are equivalent:
  ```handlebars
  {{person.height}}
  {{get person "height"}}
  ```
  If there were several facts about a person, the `{{get}}` helper can dynamically
  pick one:
  ```handlebars
  {{get person factName}}
  ```
  @public
  @method get
  @for Ember.Templates.helpers
*/
export default function getHelper(params, hash, blocks) {
  assert('{{get}} requires at least two arguments', params.length > 1);
  assert('The second argument to {{get}} must be a string', params.slice(1).every(param => typeof param === 'string'));
  var obj = params[0];
  var keyName = params.slice(1).join('.');
  return get(obj, keyName);
}
