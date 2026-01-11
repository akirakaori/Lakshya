const mongoose = require('mongoose');
const schema = mongoose.Schema;

const auditLogSchema = new schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetType: {
    type: String,
    enum: ['User', 'Post'],
    required: true
  },
  actionType: {
    type: String,
    enum: ['edit_user', 'delete_user', 'edit_post', 'delete_post', 'suspend_user', 'activate_user'],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  changes: {
    type: Object // Store before/after values
  }
}, { timestamps: true });

const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLogModel;
