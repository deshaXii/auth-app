import { Schema, model } from "mongoose";
import paginator from "mongoose-paginate-v2";

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    postImage: {
      type: String,
      required: false,
    },
    slug: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    likes: {
      count: { type: Number, default: 0 },
      users: [
        {
          type: Schema.Types.ObjectId,
          ref: "users",
        },
      ],
    },
    comments: [
      {
        text: {
          type: String,
          required: true,
        },
        user: {
          type: Schema.Types.ObjectId,
          ref: "users",
        },
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);

PostSchema.plugin(paginator);

const Post = model("posts", PostSchema);
export default Post;
