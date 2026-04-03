import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type RecordType = "income" | "expense";

export interface IRecord extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  description?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema = new Schema<IRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Type is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

RecordSchema.index({ userId: 1 });
RecordSchema.index({ date: -1 });
RecordSchema.index({ userId: 1, date: -1 });
RecordSchema.index({ isDeleted: 1 });

const Record: Model<IRecord> =
  mongoose.models.Record ?? mongoose.model<IRecord>("Record", RecordSchema);

export default Record;
