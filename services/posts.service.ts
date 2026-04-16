const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// TYPES
// ==========================================

export type PostType = "ANNOUNCEMENT" | "POLL" | "CLASSIFIED" | "SOCIAL";
export type PostScope = "GLOBAL" | "COMPLEX";
export type PostAction =
  | "CENSOR_POST"
  | "UNCENSOR_POST"
  | "DELETE_POST"
  | "PIN_POST"
  | "UNPIN_POST";

export interface IPostAuthor {
  id: string;
  name: string;
}

export interface IPostMetrics {
  commentsCount: number;
  reactionsCount: number;
  reportsCount: number;
}

export interface IPost {
  id: string;
  postType: PostType;
  content: string;
  mediaUrls: string[];
  isPinned: boolean;
  isCensored: boolean;
  censorReason: string | null;
  censored_at: string | null;
  scope: PostScope;
  complexId: string;
  createdAt: string;
  author: IPostAuthor | null;
  metrics: IPostMetrics;
}

export interface IGetPostsResponse {
  data: IPost[];
  pagination: {
    currentPage: number;
    nextPage: number | null;
    hasMore: boolean;
  };
}

export interface IFetchPostsParams {
  token: string;
  complexId: string;
  page?: number;
  type?: PostType | "";
  scope?: PostScope | "";
  showCensored?: boolean;
  search?: string;
}

export interface IManagePostParams {
  token: string;
  action: PostAction;
  postId: string;
  complexId: string;
  reason?: string;
}

// ==========================================
// FETCH POSTS LIST
// ==========================================

export const fetchPostsList = async ({
  token,
  complexId,
  page = 0,
  type,
  scope,
  showCensored = true,
  search,
}: IFetchPostsParams): Promise<IGetPostsResponse> => {
  const params = new URLSearchParams({ complexId, page: String(page) });

  if (type) params.append("type", type);
  if (scope) params.append("scope", scope);
  if (showCensored) params.append("showCensored", "true");
  if (search) params.append("search", search);

  const response = await fetch(
    `${API_URL}/getPostsList?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al obtener los posts");
  }

  return response.json();
};

// ==========================================
// MANAGE POST (CENSOR, DELETE, PIN, etc.)
// ==========================================

export const managePost = async ({
  token,
  action,
  postId,
  complexId,
  reason,
}: IManagePostParams): Promise<{ message: string }> => {
  const body: Record<string, string> = { action, postId, complexId };
  if (reason) body.reason = reason;

  const response = await fetch(`${API_URL}/managePosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al gestionar el post");
  }

  return response.json();
};
