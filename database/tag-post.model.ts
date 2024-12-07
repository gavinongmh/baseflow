import { model, models, Schema, Types } from "mongoose";

export interface ITagPost {
  tag: Types.ObjectId;
  post: Types.ObjectId;
}

const TagPostSchema = new Schema<ITagPost>(
  {
    tag: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

const TagPost = models?.TagPost || model<ITagPost>("TagPost", TagPostSchema);

export default TagPost;