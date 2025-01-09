import { FilterQuery } from "mongoose";

import { Post, Tag } from "@/database";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { GetTagPostsSchema, PaginatedSearchParamsSchema } from "../validations";

export const getTags = async (
  params: PaginatedSearchParams
): Promise<ActionResponse<{ tags: Tag[]; isNext: boolean }>> => {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { page = 1, pageSize = 10, query, filter } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = Number(pageSize);

  const filterQuery: FilterQuery<typeof Tag> = {};

  if (query) {
    filterQuery.$or = [
      {
        name: {
          $regex: query,
          $options: "i",
        },
      },
    ];
  }

  let sortCriteria = {};

  switch (filter) {
    case "popular":
      sortCriteria = { posts: -1 };
      break;
    case "recent":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "name":
      sortCriteria = { name: -1 };
      break;
    default:
      sortCriteria = { posts: -1 };
      break;
  }

  try {
    const totalTags = await Tag.countDocuments(filterQuery);

    const tags = await Tag.find(filterQuery)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalTags > skip + tags.length;

    return {
      success: true,
      data: { tags: JSON.parse(JSON.stringify(tags)), isNext },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
};

export const getTagPosts = async (
  params: GetTagPostsParams
): Promise<ActionResponse<{ tag: Tag; posts: Post[]; isNext: boolean }>> => {
  const validationResult = await action({
    params,
    schema: GetTagPostsSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { tagId, page = 1, pageSize = 10, query } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = Number(pageSize);

  try {
    const tag = await Tag.findById(tagId);
    if (!tag) throw new Error("Tag not found");

    const filterQuery: FilterQuery<typeof Post> = { tags: { $in: [tagId] } };

    if (query) {
      filterQuery.title = [
        {
          $regex: query,
          $options: "i",
        },
      ];
    }
    const totalPosts = await Post.countDocuments(filterQuery);

    const posts = await Post.find(filterQuery)
      .select("_id title views comments upvotes downvotes author createdAt")
      .populate([
        { path: "author", select: "name image" },
        { path: "tags", select: "name" },
      ])
      .skip(skip)
      .limit(limit);

    const isNext = totalPosts > skip + posts.length;

    return {
      success: true,
      data: {
        tag: JSON.parse(JSON.stringify(tag)),
        posts: JSON.parse(JSON.stringify(posts)),
        isNext,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
};
