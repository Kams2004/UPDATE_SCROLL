import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faDownload,
  faPlay,
  faPause,
} from "@fortawesome/free-solid-svg-icons";

const DEFAULT_IMAGES = {
  thumbnail: require("./../../../assets/scrollboxImg/06.png"),
  liked: require("../../../assets/scrollboxImg/like.png"),
  viewed: require("../../../assets/scrollboxImg/view.png"),
  large: require("./../../../assets/scrollboxImg/Img02.png"),
  basket: require("./../../../assets/scrollboxImg/15.png"),
  dropdown: require("./../../../assets/scrollboxImg/08.png"),
  logo: require("./../../../assets/scrollboxImg/14.png"),
  settings: require("./../../../assets/scrollboxImg/09.png"),
  background: require("./../../../assets/scrollboxImg/02.png"),
  comments: require("./../../../assets/scrollboxImg/11.png"),
  likes: require("./../../../assets/scrollboxImg/13.png"),
  views: require("./../../../assets/scrollboxImg/12.png"),
  inCart: require("./../../../assets/scrollboxImg/10.png"),
  purchased: require("./../../../assets/scrollboxImg/15.png"),
  download: require("./../../../assets/scrollboxImg/16.png"),
};

const ChapterCard = ({
  chapter,
  index,
  expandedIndex,
  toggleContentVisibility,
  toggleTextExpansion,
  downloadedChapters,
  currentlyDownloadingChapter,
  downloadStates,
  handleDownloadClick,
  handleLikeClick,
  handleViewClick,
  handleAddToBasket,
  setVisibleCommentForChapter,
  isPurchased,
  isFirstChapter,
  isDownloading,
  hasLiked,
  hasViewed,
  styles,
}) => {
  const isDownloaded = downloadedChapters.has(chapter.id);
  const isDownloadingThisChapter = currentlyDownloadingChapter === chapter.id;
  const chapterDownloadState = downloadStates[chapter.id] || {};
  const isPaused = chapterDownloadState.paused;
  const downloadProgress = chapterDownloadState.progress || 0;
  const chapterImage = isPurchased
    ? DEFAULT_IMAGES.purchased
    : chapter.isInCart
    ? DEFAULT_IMAGES.inCart
    : DEFAULT_IMAGES.logo;

  const getSafeImageSource = (imageUri, defaultImage) => {
    return imageUri && typeof imageUri === "object" && imageUri.uri
      ? imageUri
      : defaultImage;
  };

  const renderButtonContent = () => {
    if (isDownloadingThisChapter) {
      return (
        <View style={styles.downloadProgressContainer}>
          <TouchableOpacity
            onPress={() => handleDownloadClick(chapter.id)}
            style={styles.downloadControlButton}
          >
            <FontAwesomeIcon
              icon={isPaused ? faPlay : faPause}
              style={[styles.progressControlIcon, styles.largeIcon]}
              size={24}
            />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${downloadProgress}%` },
                ]}
              />
            </View>
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(downloadProgress)}%
          </Text>
        </View>
      );
    }

    if (isDownloaded) {
      return <Text style={styles.readButtonText}>Read</Text>;
    }

    if (isPurchased) {
      return (
        <FontAwesomeIcon
          icon={faDownload}
          style={[styles.buttonIcon, styles.largeIcon]}
          size={24}
        />
      );
    }

    return <Text style={styles.readButtonText}>Buy</Text>;
  };

  return (
    <View key={chapter.id} style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleContentVisibility(index)}
      >
        {expandedIndex === index ? (
          <View>
            <Image
              source={getSafeImageSource(
                chapter.largeImage,
                DEFAULT_IMAGES.large
              )}
              style={styles.topImage}
              defaultSource={DEFAULT_IMAGES.large}
            />
            <View style={styles.cardContent}>
              <Image
                source={getSafeImageSource(
                  chapter.image,
                  DEFAULT_IMAGES.thumbnail
                )}
                style={styles.cardImage}
                defaultSource={DEFAULT_IMAGES.thumbnail}
              />
              <View style={styles.textContainerRight}>
                <Text style={styles.synopsisTitle}>{chapter.title}</Text>
                <TouchableOpacity
                  onPress={() => toggleTextExpansion(chapter.id)}
                >
                  <Text style={styles.descriptionText}>
                    {chapter.description}
                  </Text>
                </TouchableOpacity>
                <View style={styles.statsContainer}>
                  {!isPurchased && !isFirstChapter && (
                    <Text style={styles.priceText}>
                      {chapter.price} {chapter.currency}
                    </Text>
                  )}
                </View>
                <View style={styles.iconsAndReadButtonContainer}>
                  <View style={styles.iconsRowOverlayContainer}>
                    <TouchableOpacity
                      onPress={() => setVisibleCommentForChapter(chapter.id)}
                      style={styles.iconContainer}
                    >
                      <Image
                        source={DEFAULT_IMAGES.comments}
                        style={styles.iconImage}
                      />
                      <Text style={styles.iconText}>
                        {chapter.commentNumber}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleLikeClick}
                      style={styles.iconContainer}
                    >
                      <Image
                        source={
                          hasLiked ? DEFAULT_IMAGES.liked : DEFAULT_IMAGES.likes
                        }
                        style={styles.iconImage}
                      />
                      <Text style={styles.iconText}>{chapter.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleViewClick}
                      style={styles.iconContainer}
                    >
                      <Image
                        source={
                          hasViewed
                            ? DEFAULT_IMAGES.viewed
                            : DEFAULT_IMAGES.views
                        }
                        style={styles.iconImage}
                      />
                      <Text style={styles.iconText}>{chapter.views}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.readButton,
                      isDownloaded
                        ? styles.freeChapterButton
                        : isPurchased || isFirstChapter
                        ? styles.downloadButton
                        : styles.paidChapterButton,
                      isDownloading &&
                        !isDownloadingThisChapter &&
                        styles.disabledButton,
                    ]}
                    onPress={() => {
                      if (isDownloaded) {
                        setSelectedChapterForReading(chapter.id);
                      } else {
                        handleDownloadClick(chapter.id);
                      }
                    }}
                    disabled={isDownloading && !isDownloadingThisChapter}
                  >
                    {renderButtonContent()}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cardContent}>
            <Image
              source={getSafeImageSource(
                chapter.image,
                DEFAULT_IMAGES.thumbnail
              )}
              style={styles.cardImage}
              defaultSource={DEFAULT_IMAGES.thumbnail}
            />
            <View style={styles.iconsRow}>
              <TouchableOpacity
                onPress={() => setVisibleCommentForChapter(chapter.id)}
                style={styles.iconContainer}
              >
                <Image
                  source={DEFAULT_IMAGES.comments}
                  style={styles.iconImage}
                />
                <Text style={styles.iconText}>{chapter.commentNumber}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLikeClick}
                style={styles.iconContainer}
              >
                <Image
                  source={
                    hasLiked ? DEFAULT_IMAGES.liked : DEFAULT_IMAGES.likes
                  }
                  style={styles.iconImage}
                />
                <Text style={styles.iconText}>{chapter.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleViewClick}
                style={styles.iconContainer}
              >
                <Image
                  source={
                    hasViewed ? DEFAULT_IMAGES.viewed : DEFAULT_IMAGES.views
                  }
                  style={styles.iconImage}
                />
                <Text style={styles.iconText}>{chapter.views}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.priceBasketContainer}>
              {!isPurchased && !isFirstChapter && (
                <Text style={styles.priceText}>
                  {chapter.price} {chapter.currency}
                </Text>
              )}
              <TouchableOpacity onPress={handleAddToBasket}>
                <Image source={chapterImage} style={styles.addToBasketIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ChapterCard;