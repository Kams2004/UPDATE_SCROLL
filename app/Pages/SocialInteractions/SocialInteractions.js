import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

class SocialInteractions {
  constructor(
    apiBaseUrl = "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api"
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.likedChapters = new Set();
    this.viewedChapters = new Set();
    this.commentCounts = {};
  }

  async initialize() {
    try {
      // Load persisted state
      const [likedChaptersData, viewedChaptersData, commentCountsData] =
        await Promise.all([
          AsyncStorage.getItem("likedChapters"),
          AsyncStorage.getItem("viewedChapters"),
          AsyncStorage.getItem("commentCounts"),
        ]);

      this.likedChapters = new Set(JSON.parse(likedChaptersData) || []);
      this.viewedChapters = new Set(JSON.parse(viewedChaptersData) || []);
      this.commentCounts = JSON.parse(commentCountsData) || {};

      return {
        likedChapters: this.likedChapters,
        viewedChapters: this.viewedChapters,
        commentCounts: this.commentCounts,
      };
    } catch (error) {
      console.error("Error initializing social interactions:", error.message);
      return {
        likedChapters: new Set(),
        viewedChapters: new Set(),
        commentCounts: {},
      };
    }
  }

  async toggleLike(chapterId, navigation, showMessage, t) {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("UserProfile", { screen: "LoginPage" });
        return { success: false, message: "Authentication required" };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/chapter/like/${chapterId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle like on the chapter.");
      }

      const resData = await response.json();
      const { hasLiked, likes } = resData;

      // Update local state
      if (hasLiked) {
        this.likedChapters.add(chapterId);
      } else {
        this.likedChapters.delete(chapterId);
      }

      // Persist state
      await AsyncStorage.setItem(
        "likedChapters",
        JSON.stringify([...this.likedChapters])
      );

      return {
        success: true,
        hasLiked,
        likes,
        message: hasLiked
          ? "Chapter liked successfully"
          : "Chapter unliked successfully",
      };
    } catch (error) {
      console.error("Error toggling like:", error.message);
      showMessage &&
        showMessage(
          t ? t("cart.toggle_like_error") : "Error toggling like",
          "error"
        );
      return { success: false, message: error.message };
    }
  }

  async viewChapter(chapterId, navigation, showMessage, t) {
    // Don't increment view if already viewed
    if (this.viewedChapters.has(chapterId)) {
      return { success: true, viewed: true, message: "Chapter already viewed" };
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("UserProfile", { screen: "LoginPage" });
        return { success: false, message: "Authentication required" };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/chapter/view/${chapterId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark chapter as viewed.");
      }

      const resData = await response.json();

      // Update local state
      this.viewedChapters.add(chapterId);

      // Persist state
      await AsyncStorage.setItem(
        "viewedChapters",
        JSON.stringify([...this.viewedChapters])
      );

      return {
        success: true,
        viewed: true,
        views: resData.views,
        message: "Chapter marked as viewed",
      };
    } catch (error) {
      console.error("Error marking chapter as viewed:", error.message);
      showMessage &&
        showMessage(
          t ? t("cart.mark_view_error") : "Error marking chapter as viewed",
          "error"
        );
      return { success: false, message: error.message };
    }
  }

  async getComments(chapterId, page = 1, limit = 10) {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.apiBaseUrl}/chapter/comments/${chapterId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments.");
      }

      const data = await response.json();
      return {
        success: true,
        comments: data.comments || [],
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      };
    } catch (error) {
      console.error("Error fetching comments:", error.message);
      return {
        success: false,
        comments: [],
        totalCount: 0,
        totalPages: 1,
        error: error.message,
      };
    }
  }

  async addComment(chapterId, commentText, navigation, showMessage, t) {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("UserProfile", { screen: "LoginPage" });
        return { success: false, message: "Authentication required" };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/chapter/comment/${chapterId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: commentText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add comment.");
      }

      const resData = await response.json();

      // Update comment count
      this.commentCounts[chapterId] = (this.commentCounts[chapterId] || 0) + 1;
      await AsyncStorage.setItem(
        "commentCounts",
        JSON.stringify(this.commentCounts)
      );

      return {
        success: true,
        comment: resData.comment,
        commentCount: resData.commentCount || this.commentCounts[chapterId],
        message: "Comment added successfully",
      };
    } catch (error) {
      console.error("Error adding comment:", error.message);
      showMessage &&
        showMessage(
          t ? t("cart.add_comment_error") : "Error adding comment",
          "error"
        );
      return { success: false, message: error.message };
    }
  }

  async deleteComment(commentId, chapterId, navigation, showMessage, t) {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("UserProfile", { screen: "LoginPage" });
        return { success: false, message: "Authentication required" };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/chapter/comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment.");
      }

      const resData = await response.json();

      // Update comment count
      if (this.commentCounts[chapterId] > 0) {
        this.commentCounts[chapterId] -= 1;
        await AsyncStorage.setItem(
          "commentCounts",
          JSON.stringify(this.commentCounts)
        );
      }

      return {
        success: true,
        commentCount: resData.commentCount || this.commentCounts[chapterId],
        message: "Comment deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      showMessage &&
        showMessage(
          t ? t("cart.delete_comment_error") : "Error deleting comment",
          "error"
        );
      return { success: false, message: error.message };
    }
  }

  async reportComment(commentId, reason, navigation, showMessage, t) {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("UserProfile", { screen: "LoginPage" });
        return { success: false, message: "Authentication required" };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/chapter/comment/report/${commentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to report comment.");
      }

      return {
        success: true,
        message: "Comment reported successfully",
      };
    } catch (error) {
      console.error("Error reporting comment:", error.message);
      showMessage &&
        showMessage(
          t ? t("cart.report_comment_error") : "Error reporting comment",
          "error"
        );
      return { success: false, message: error.message };
    }
  }

  // Process chapters to update social interaction states
  processChapters(chapters, userId) {
    return chapters.map((chapter) => {
      const hasLiked =
        chapter.likedBy?.includes(userId) || this.likedChapters.has(chapter.id);
      const hasViewed =
        chapter.viewedBy?.includes(userId) ||
        this.viewedChapters.has(chapter.id);
      const commentCount =
        chapter.commentNumber || this.commentCounts[chapter.id] || 0;

      return {
        ...chapter,
        hasLiked,
        hasViewed,
        commentNumber: commentCount,
      };
    });
  }

  // Get social interaction states for a specific chapter
  getChapterSocialState(chapterId) {
    return {
      hasLiked: this.likedChapters.has(chapterId),
      hasViewed: this.viewedChapters.has(chapterId),
      commentCount: this.commentCounts[chapterId] || 0,
    };
  }
}

export default SocialInteractions;
