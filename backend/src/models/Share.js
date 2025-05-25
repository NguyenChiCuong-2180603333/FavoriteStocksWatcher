import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema(
  {
    sharer: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    // recipientEmail: {
    //   type: String,
    //   required: true,
    //   trim: true,
    //   lowercase: true,
    // },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    sharedStocks: { 
      type: [String],
      required: true, 
      validate: [list => list.length > 0, 'Danh sách cổ phiếu chia sẻ không được rỗng.']
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
   
  },
  {
    timestamps: true, 
  }
);

shareSchema.index({ sharer: 1, recipientUser: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: { status: 'active' }
});

const Share = mongoose.model('Share', shareSchema);

export default Share;
