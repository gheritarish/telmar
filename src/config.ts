import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://blog.telmar.dev/",
  author: "Telmar",
  desc: "A blog on code and TTRPG by telmar.",
  title: "Telmar",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 7,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/gheritarish",
    linkTitle: `My personal GitHub account`,
    active: true,
  },
];
