const { Schema, model } = require('mongoose');

const LinkSchema = new Schema({
  slug:      { type: String, required: true },
  phone:     { type: String, required: true },
  text:      { type: String, default: '' },
  userId:    { type: Schema.Types.Mixed, default: -1 }, 
  createdAt: { type: Date, default: Date.now }
});

LinkSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { userId: -1 } }
);

LinkSchema.index({ slug: 1, userId: 1 });

module.exports = model('Link', LinkSchema);
