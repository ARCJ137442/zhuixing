'use strict';
const E=require('../../../app/recursive-engine/engine.cjs');
const rows=require('../../../app/recursive-ids.rows.json');
module.exports=E.create(rows);
