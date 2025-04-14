// src/config/globals.js

export const globals = {
  // Google Tag Manager
  gtmId: "GTM-XXXXXX",

  base: import.meta.env.BASE_URL,

  // Social Media Accounts
  //socialMedia: {
  //  twitter: 'https://twitter.com/yourusername',
  //  facebook: 'https://facebook.com/yourpage',
  //  instagram: 'https://instagram.com/yourusername',
  //  linkedin: 'https://linkedin.com/in/yourusername',
  //  // Add more social media platforms as needed
  //},

  //// Other global variables
  //siteName: 'Your Site Name',
  //siteUrl: 'https://www.yoursite.com',

  //// You can add more sections as needed
  //contact: {
  //  email: 'contact@yoursite.com',
  //  phone: '+1 (123) 456-7890',
  //},
};

export const getGlobalValue = (key) => {
  return key.split(".").reduce((o, i) => o?.[i], globals);
};

export function getPath(path) {
  const base = import.meta.env.BASE_URL;
  const cleanPath = path.replace(/^\//, "");

  if (base && base !== "/") {
    return `${base}/${cleanPath}`;
  }
  return cleanPath;
}
