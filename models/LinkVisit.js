const { Schema, model } = require('mongoose');

const LinkVisitSchema = new Schema({
  linkId:   { type: Schema.Types.ObjectId, ref: 'Link', required: true }, 
  phone:    { type: String, required: true },                             
  userId:   { type: Schema.Types.Mixed, default: -1 },                    
  visitedAt: { type: Date, default: Date.now }                            
});

module.exports = model('LinkVisit', LinkVisitSchema);
