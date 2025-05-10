import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema(
  {
    sharer: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
   
  },
  {
    timestamps: true, 
  }
);

shareSchema.index({ sharer: 1, recipientEmail: 1 }, { unique: true });

const Share = mongoose.model('Share', shareSchema);

export default Share;
