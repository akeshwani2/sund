"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import History from "../History/History";
import Library from "../Library/Library";
import Plugins from "../Plugins/Plugins";
import Profile from "../Profile/Profile";
import Settings from "../Settings/Settings";
import Auth from "../Auth/Auth";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/authSlice";
import { useDisclosure } from "@nextui-org/modal";

import Logo from "../../../public/Logo.svg";
import Menu from "../../../public/svgs/Menu.svg";
import Pen from "../../../public/svgs/Pen.svg";
import Folder from "../../../public/svgs/sidebar/Folder_Active.svg";
import FolderInactive from "../../../public/svgs/sidebar/Folder_Inactive.svg";
import Setting from "../../../public/svgs/sidebar/Setting_Active.svg";
import SettingInactive from "../../../public/svgs/sidebar/Setting_Inactive.svg";
import Chat from "../../../public/svgs/sidebar/Chat_Active.svg";
import ChatInactive from "../../../public/svgs/sidebar/Chat_Inactive.svg";
// import Plugin from "../../../public/svgs/sidebar/Plugin_Active.svg";
// import PluginInactive from "../../../public/svgs/sidebar/Plugin_Inactive.svg";
import User from "../../../public/svgs/sidebar/User.svg";
import Collapse from "../../../public/svgs/sidebar/Collapse.svg";
import ChatBubble from "../../../public/svgs/ChatBubble.svg";
import File from "../../../public/svgs/File.svg";
const Sidebar = () => {
  const router = useRouter();
  const authState = useSelector(selectAuthState);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState("history");

  const [width, setWidth] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(width >= 512);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar();
      }
    };

    if (width <= 512) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarRef, width, setIsSidebarOpen]);

  useEffect(() => {
    if (!authState) {
      setSelected("history");
    }
  }, [authState]);

  const closeSidebar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const toggleSidebar = () => {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      setIsSidebarOpen(true);
      setIsClosing(false);
    }
  };

  const handleProfileClick = () => {
    if (authState) {
      setSelected("profile");
    } else {
      closeSidebar();
      onOpen();
    }
  };

  const handleNewChat = () => {
    router.push("/");
  };

  return (
    <>
      <div className="fixed w-full h-auto p-[6px_12px] flex flex-row justify-between items-start z-[2]">
        <div onClick={toggleSidebar} className="flex mt-1.5 cursor-pointer flex-row items-center hover:scale-105 transition-all duration-250">
          <Image priority={true} src={Logo} alt="Menu" width={36} height={36} />
          <span className="text-[26px] leading-6 font-medium text-[#e8e8e6] ml-2 tracking-tighter">
            Sunday
          </span>
        </div>
        <div
          className={`m-2 px-3 py-1.5 rounded-lg flex flex-row justify-center items-center cursor-pointer bg-[#1a1a1a] transition-all duration-250 hover:bg-white/8 ${
            isSidebarOpen ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleNewChat}
        >
          <Image
            priority={true}
            src={Pen}
            alt="Pen"
            width={20}
            height={20}
            className="mr-2"
          />
          <p className="text-sm leading-5 tracking-[-0.008em] font-medium text-white">
            New Chat
          </p>
        </div>
      </div>
      {isSidebarOpen && (
        <>
          <div
            ref={sidebarRef}
            className={`fixed h-screen w-[326px] top-0 left-0 bg-[#1a1a1a] flex flex-row z-10 transition-all duration-1000 
              ${isSidebarOpen && !isClosing ? "animate-slideInFromLeft" : ""} 
              ${isClosing ? "animate-slideOutToLeft" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-[70px] h-full p-2 flex flex-col justify-start items-center bg-[#000000]">
              <a href="/" className="hover:scale-105 transition-all duration-250">
              <Image 
                src={Logo} 
                alt="Logo" 
                className="w-9 h-9 mt-2 mb-6" 
              />
              </a>
              <div className="flex-1 flex flex-col justify-between items-center">
                <div>
                  {selected === "history" ? (
                    <Image
                      src={Chat}
                      alt="History"
                      className="w-11 h-11 p-1 mb-2 rounded-md bg-white/8 cursor-pointer transition-all duration-250 filter invert"
                    />
                  ) : (
                    <Image
                      src={ChatInactive}
                      alt="History"
                      className="w-10 h-10 p-1 mb-2 cursor-pointer hover:scale-110 hover:bg-white/6 hover:rounded-md transition-all duration-250"
                      onClick={() => setSelected("history")}
                    />
                  )}
                  {selected === "library" ? (
                    <Image
                      src={Folder}
                      alt="Library"
                      className="w-11 h-11 p-1 mb-2 rounded-md bg-white/8 cursor-pointer transition-all duration-250"
                    />
                  ) : (
                    <Image
                      src={FolderInactive}
                      alt="Library"
                      className="w-9 h-9 pl-2 mb-2 cursor-pointer hover:scale-110 hover:bg-white/6 hover:rounded-md transition-all duration-250"
                      onClick={() => setSelected("library")}
                    />
                  )}
                  {selected === "settings" ? (
                    <Image
                      src={Setting}
                      alt="Settings"
                      className="w-12 h-12 p-1 mb-2 rounded-md bg-white/8 cursor-pointer transition-all duration-250"
                    />
                  ) : (
                    <Image
                      src={SettingInactive}
                      alt="Settings"
                      className="w-11 h-11 p-1 mb-2 cursor-pointer hover:scale-110 hover:bg-white/6 hover:rounded-md transition-all duration-250"
                      onClick={() => setSelected("settings")}
                    />
                  )}
                  {/* {selected === "plugins" ? (
                    <Image
                      src={Plugin}
                      alt="Plugins"
                      className={styles.iconActive}
                    />
                  ) : (
                    <Image
                      src={PluginInactive}
                      alt="Plugins"
                      className={styles.icon}
                      onClick={() => setSelected("plugins")}
                    />
                  )} */}
                </div>
                <div>
                  <Image
                    src={Collapse}
                    alt="Collapse"
                    className="w-10 h-10 p-1 mb-2 cursor-pointer hover:bg-white/6 hover:rounded-md transition-all duration-250"
                    onClick={closeSidebar}
                  />
                  <Image
                    src={User}
                    alt="Profile"
                    className={`w-10 h-10 p-1 cursor-pointer transition-all duration-250 ${
                      selected === "profile"
                        ? "w-11 h-11 rounded-md bg-white/8"
                        : "hover:bg-white/6 hover:rounded-md"
                    }`}
                    onClick={handleProfileClick}
                  />
                </div>
              </div>
            </div>
            <div className="w-64 h-full p-2 bg-[#1a1a1a]">
              {selected === "history" ? (
                <History />
              ) : selected === "library" ? (
                <Library />
              ) : selected === "settings" ? (
                <Settings />
              ) : selected === "plugins" ? (
                <Plugins />
              ) : (
                <Profile close={closeSidebar} />
              )}
            </div>
          </div>
          {width <= 512 && (
            <div
              className={`fixed top-0 right-0 w-full h-full z-[2] bg-black/25 transition-all duration-1000
                ${isClosing ? 'animate-fadeOutToNone' : 'animate-fadeInFromNone'}`}
            />
          )}
        </>
      )}
      <Auth isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default Sidebar;
