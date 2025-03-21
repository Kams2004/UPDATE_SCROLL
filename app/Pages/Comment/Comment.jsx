import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
  Modal,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../../Services/ApiService";
import PropTypes from "prop-types";

const { width, height } = Dimensions.get("window");

const formatCommentDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays > 7) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

const CommentItem = ({ comment, onReply, allComments, nestingLevel = 0 }) => {
  const [showMore, setShowMore] = useState(false);
  const displayName = comment.user.name || "Anonymous";

  const replies = allComments.filter((reply) => reply.parentId === comment.id);
  const displayedReplies = showMore ? replies : replies.slice(0, 2);

  const nestingWidth = Math.max(85, 100 - nestingLevel * 5);
  const fontSize = Math.max(11, 13 - nestingLevel * 0.5);
  const iconSize = Math.max(24, 32 - nestingLevel * 2);
  const padding = Math.max(6, 8 - nestingLevel);

  return (
    <View style={[styles.commentThread, { width: `${nestingWidth}%` }]}>
      <View style={[styles.commentItemContainer, { paddingVertical: padding }]}>
        <Image
          source={require("../../../assets/scrollboxImg/07.png")}
          style={[
            styles.commentUserIcon,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            },
          ]}
        />
        <View style={[styles.commentContent, { padding, flex: 1 }]}>
          <Text style={[styles.commentUserName, { fontSize }]}>
            {displayName}
          </Text>
          <Text style={[styles.commentText, { fontSize }]} numberOfLines={4}>
            {comment.content}
          </Text>
          <View style={styles.commentFooter}>
            <Text style={[styles.commentDate, { fontSize: fontSize - 2 }]}>
              {formatCommentDate(comment.timestamp)}
            </Text>
            <TouchableOpacity onPress={() => onReply(comment)}>
              <Text style={[styles.replyButton, { fontSize: fontSize - 1 }]}>
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {displayedReplies.length > 0 && (
        <View style={[styles.repliesList, { marginLeft: 15 }]}>
          {displayedReplies.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
              <CommentItem
                comment={reply}
                onReply={onReply}
                allComments={allComments}
                nestingLevel={nestingLevel + 1}
              />
            </View>
          ))}
          {replies.length > 2 && (
            <TouchableOpacity
              style={[styles.showMoreButton, { paddingLeft: padding }]}
              onPress={() => setShowMore(!showMore)}
            >
              <Text style={[styles.showMoreText, { fontSize: fontSize - 1 }]}>
                {showMore
                  ? "Show less"
                  : `Show ${replies.length - 2} more replies`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const CommentSection = ({
  chapterId,
  closeComments,
  onCommentCountChange = () => {},
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = await AsyncStorage.getItem("user");
        setIsAuthenticated(!!token);
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    checkAuthStatus();
    fetchComments();
  }, [chapterId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("token");

      const response = await ApiService.getCommentsByChapterId(
        chapterId,
        token
      );
      const transformedComments = response.map((comment) => ({
        id: comment._id,
        content: comment.content,
        user: {
          name: comment.userId?.name || comment.name || "Anonymous",
          avatar: comment.userId?.avatar,
        },
        parentId: comment.parentId?._id || comment.parentId,
        timestamp: comment.createdAt,
      }));

      // Sort comments by timestamp, newest first
      const sortedComments = transformedComments.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setComments(sortedComments);
      setCommentCount(transformedComments.length);
      onCommentCountChange(transformedComments.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    if (!isAuthenticated) {
      navigation.navigate("UserProfile", { screen: "LoginPage" });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem("token");

      const commentData = {
        content: newComment,
        chapterId,
        ...(replyingTo && { parentId: replyingTo.id }),
      };

      const response = await ApiService.createComment(commentData, token);

      const newCommentObj = {
        id: response.comment._id,
        content: response.comment.content,
        user: {
          name: currentUser?.name || "You",
          avatar: currentUser?.avatar,
        },
        parentId: replyingTo?.id || null,
        timestamp: response.comment.createdAt,
      };

      setComments((prevComments) => {
        // Add new comment at the beginning of the array for root comments
        const updatedComments = newCommentObj.parentId
          ? [...prevComments, newCommentObj] // Add replies normally
          : [newCommentObj, ...prevComments]; // Add new root comments at the top

        setCommentCount(updatedComments.length);
        onCommentCountChange(updatedComments.length);
        return updatedComments;
      });

      setNewComment("");
      setReplyingTo(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={closeComments}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity
              onPress={closeComments}
              style={styles.closeButton}
            >
              <Image
                source={require("../../../assets/scrollboxImg/09.png")}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EF7F1A" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchComments}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={comments.filter((comment) => !comment.parentId)}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  onReply={setReplyingTo}
                  allComments={comments}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No comments yet. Be the first to comment!
                </Text>
              }
            />
          )}

          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Replying to:{" "}
                <Text style={styles.replyingToName}>
                  {replyingTo.user.name}
                </Text>
              </Text>
              <Text style={styles.replyingToContent}>{replyingTo.content}</Text>
              <TouchableOpacity
                style={styles.cancelReplyButton}
                onPress={() => setReplyingTo(null)}
              >
                <Text style={styles.cancelReplyText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[
              styles.commentFormContainer,
              keyboardVisible && styles.commentFormContainerKeyboard,
            ]}
          >
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={
                replyingTo ? "Write a reply..." : "Write a comment..."
              }
              placeholderTextColor="#94A3B8"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                !newComment.trim() && styles.submitButtonDisabled,
              ]}
              onPress={addComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              <Image
                source={require("../../../assets/scrollboxImg/ev.png")}
                style={[
                  styles.submitIcon,
                  !newComment.trim() && styles.submitIconDisabled,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2B1409",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#EF7F1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  commentThread: {
    marginBottom: 6,
    paddingHorizontal: 8,
    alignSelf: "center",
  },
  commentItemContainer: {
    flexDirection: "row",
    paddingVertical: 4,
    alignItems: "flex-start",
  },
  commentUserIcon: {
    marginRight: 4,
    backgroundColor: "#2B1409",
  },
  commentContent: {
    flex: 1,
    backgroundColor: "#2B1409",
    borderRadius: 8,
    minWidth: "60%",
    maxWidth: "95%",
  },
  commentUserName: {
    color: "#EF7F1A",
    fontWeight: "600",
    marginBottom: 2,
  },
  commentText: {
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 18,
    flexWrap: "wrap",
  },
  commentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentDate: {
    color: "#94A3B8",
  },
  replyButton: {
    color: "#EF7F1A",
    fontWeight: "500",
  },
  repliesList: {
    marginTop: 2,
    marginLeft: 12,
    width: "95%",
  },
  replyItem: {
    marginBottom: 2,
  },
  showMoreButton: {
    paddingVertical: 4,
  },
  showMoreText: {
    color: "#EF7F1A",
    fontWeight: "500",
  },
  commentFormContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#2B1409",
    backgroundColor: "#000000",
  },
  commentFormContainerKeyboard: {
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#2B1409",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#FFFFFF",
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  submitButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2B1409",
    borderRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitIcon: {
    width: 24,
    height: 24,
    tintColor: "#EF7F1A",
  },
  submitIconDisabled: {
    tintColor: "#94A3B8",
  },
  replyingToContainer: {
    backgroundColor: "#2B1409",
    padding: 12,
    margin: 12,
    marginBottom: 0,
    borderRadius: 8,
  },
  replyingToText: {
    color: "#FFFFFF",
    marginBottom: 4,
    fontSize: 13,
  },
  replyingToName: {
    fontWeight: "bold",
    color: "#EF7F1A",
  },
  replyingToContent: {
    color: "#94A3B8",
    marginBottom: 8,
    fontSize: 12,
  },
  cancelReplyButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  cancelReplyText: {
    color: "#EF7F1A",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  commentsList: {
    paddingVertical: 12,
  },
});

CommentSection.propTypes = {
  chapterId: PropTypes.string.isRequired,
  closeComments: PropTypes.func.isRequired,
  onCommentCountChange: PropTypes.func,
};

export default CommentSection;
