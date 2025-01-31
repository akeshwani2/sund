import Web from "../../public/svgs/options/Web.svg";
import Academic from "../../public/svgs/options/Academic.svg";
import Writing from "../../public/svgs/options/Writing.svg";
import Youtube from "../../public/svgs/options/Youtube.svg";
import Reddit from "../../public/svgs/options/Reddit.svg";
import Stackoverflow from "../../public/svgs/options/Stackoverflow.svg";
import Gmail from "../../public/svgs/options/Gmail.svg";
import Filter from "../../public/svgs/Filter.svg";

export const focusOptions = [
  {
    website: "Web",
    icon: Web,
    query: "",
    description: "Explore the vastness of the internet with Sunday!",
  },
  {
    website: "Academic",
    icon: Academic,
    query: "site:arxiv.org",
    description: "Discover insights in published academic research.",
  },
  {
    website: "Writing",
    icon: Writing,
    query: "",
    description: "Looking for writing assistance? Sunday is here to help!",
  },
  {
    website: "Youtube",
    icon: Youtube,
    query: "site:youtube.com",
    description: "Stay updated with the latest videos on any topic from YouTube.",
  },
  {
    website: "Reddit",
    icon: Reddit,
    query: "site:reddit.com",
    description: "Catch up on the latest discussions and news on Reddit.",
  },
  {
    website: "Stackoverflow",
    icon: Stackoverflow,
    query: "site:stackoverflow.com",
    description: "Got programming questions? Stackoverflow has the answers!",
  },
  // {
  //   website: "Gmail",
  //   icon: Gmail,
  //   query: "",
  //   description: "Access and manage your email inbox",
  // },
];

export const MODELS = [
  { label: "gpt-4o-mini", value: "gpt-4o-mini" },
  { label: "gpt-4o", value: "gpt-4o" },
  // { label: "gpt-4-turbo-2024-04-09", value: "gpt-4-turbo-2024-04-09" },
  // { label: "gpt-4-turbo-preview", value: "gpt-4-turbo-preview" },
  // { label: "gpt-4-1106-review", value: "gpt-4-1106-review" },
  // { label: "gpt-4-0613", value: "gpt-4-0613" },
  // { label: "gpt-4-0125-preview", value: "gpt-4-0125-preview" },
  { label: "gpt-4", value: "gpt-4" },
  // { label: "gpt-3.5-turbo-16k-0613", value: "gpt-3.5-turbo-16k-0613" },
  // { label: "gpt-3.5-turbo-16k", value: "gpt-3.5-turbo-16k" },
  // { label: "gpt-3.5-turbo-1106", value: "gpt-3.5-turbo-1106" },
  // { label: "gpt-3.5-turbo-0613", value: "gpt-3.5-turbo-0613" },
  // { label: "gpt-3.5-turbo-0301", value: "gpt-3.5-turbo-0301" },
  // { label: "gpt-3.5-turbo-0125", value: "gpt-3.5-turbo-0125" },
  { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
];

export const PLUGINS = [
  {
    tag: "Built In",
    name: "Stocks",
    comingSoon: false,
    url: "/plugins/stocks",
    description: "Check stock prices",
  },
  {
    tag: "Built In",
    name: "Weather",
    comingSoon: false,
    url: "/plugins/weather",
    description: "Weather forecast",
  },
  {
    tag: "Built In",
    name: "Dictionary",
    comingSoon: false,
    url: "/plugins/dictionary",
    description: "Look up word definitions",
  },
];
