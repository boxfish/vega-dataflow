import Aggregate from './Aggregate';
import {rederive} from '../../Tuple';
import {inherits} from 'vega-util';

/**
 * Extend input tuples with aggregate values.
 * Calcuates aggregate values and joins them with the input stream.
 * @constructor
 */
export default function JoinAggregate(params) {
  Aggregate.call(this, params);
}

var prototype = inherits(JoinAggregate, Aggregate);

prototype.transform = function(_, pulse) {
  var aggr = this,
      mod = _.modified(),
      cells;

  // process all input tuples to calculate aggregates
  if (aggr.value && (mod || pulse.modified(aggr._inputs))) {
    cells = aggr.value = mod ? aggr.init(_) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    cells = aggr.value = aggr.value || this.init(_);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // update aggregation cells
  aggr.changes();

  // write aggregate values to input tuples
  pulse.visit(pulse.SOURCE, function(t) {
    rederive(cells[aggr.cellkey(t)].tuple, t);
  });

  return pulse.reflow(mod).modifies(this._outputs);
};

prototype.changes = function() {
  var adds = this._adds,
      mods = this._mods,
      i, n;

  for (i=0, n=this._alen; i<n; ++i) {
    this.celltuple(adds[i]);
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    this.celltuple(mods[i]);
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
};
