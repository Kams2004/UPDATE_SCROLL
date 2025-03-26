// constants.js
export const DEFAULT_IMAGES = {
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

export const API_ENDPOINTS = {
  COMICS:
    "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/comics",
  TOME: (comicId) =>
    `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/tome/${comicId}`,
  CHAPTERS: (tomeId) =>
    `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapters/${tomeId}`,
};
