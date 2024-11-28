import { obCurrentTab } from "./tabs";

console.log("background is running");

obCurrentTab.observe((tab) => {
  console.log("URL:", tab?.url);
  console.log("Title:", tab?.title);
});

type BrowseSession = {
  tabId: number;
  url: string;
  title: string;
};

