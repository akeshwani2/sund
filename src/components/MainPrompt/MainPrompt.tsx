"use client";

import React, { useEffect, useState } from "react";
import Image, { StaticImageData } from "next/image";
import styles from "./MainPrompt.module.css";
import Auth from "../Auth/Auth";
import SpinnerWhite from "../SpinnerWhite/SpinnerWhite";
import toast from "react-hot-toast";
import Sheet from "react-modal-sheet";
import { cutString } from "../../utils/utils";
import { focusOptions } from "../../utils/data";
import { FileInfo, Mode, Chat } from "@/utils/types";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@nextui-org/modal";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/popover";
import { createChatThread } from "../../store/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectUserDetailsState, selectAuthState } from "@/store/authSlice";
import { db } from "../../../firebaseConfig";
import { storage } from "../../../firebaseConfig";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TypeAnimation } from "react-type-animation";


import Arrow from "../../../public/svgs/Arrow.svg";
import Filter from "../../../public/svgs/Filter.svg";
import FileActive from "../../../public/svgs/FileActive.svg";
import Clip from "../../../public/svgs/Clip.svg";
import Check from "../../../public/svgs/Check.svg";
import CrossRed from "../../../public/svgs/CrossRed.svg";
import Web from "../../../public/svgs/options/Web.svg";

const MainPrompt = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const authState = useSelector(selectAuthState);
  const userDetails = useSelector(selectUserDetailsState);
  const userId = userDetails.uid;

  const [text, setText] = useState("");
  const [width, setWidth] = useState(0);
  const [modal, setModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("");
  const [buttonText, setButtonText] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState({
    website: "Web",
    icon: Web,
    query: "",
  });

  const sentences = [
    "Welcome to Sunday!",
    "What's on your mind?",
    "Feel free to ask anything!",
  ];

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    let currentText = "";
    const currentSentence = sentences[currentSentenceIndex];

    const type = (index: number) => {
      if (index < currentSentence.length) {
        currentText += currentSentence.charAt(index);
        setDisplayedText(currentText);
        typingTimeout = setTimeout(() => type(index + 1), 50); // Adjust typing speed here
      } else {
        setTimeout(() => {
          setCurrentSentenceIndex(
            (prevIndex) => (prevIndex + 1) % sentences.length
          );
          setDisplayedText(""); // Clear text for next sentence
        }, 2000); // Pause before starting the next sentence
      }
    };

    type(0);

    return () => clearTimeout(typingTimeout); // Cleanup on unmount
  }, [currentSentenceIndex]);

  const handleFocusChange = (
    website: string,
    query: string,
    icon: StaticImageData
  ) => {
    if (website === "Gmail") {
      setMode("gmail");
    } else if (website === "Focus") {
      setMode("");
    } else if (website === "Writing") {
      setMode("chat");
    } else {
      setMode("search");
    }
    setFocus({ website, icon, query });
    setOpen(false);
  };

  const handleSend = async () => {
    if (text.trim() !== "") {
      const id = nanoid(10);
      const currentMode = fileInfo ? "image" : mode;
      const chatObject: Chat = {
        mode: currentMode,
        question: text.trim(),
        answer: "",
        query: focus.query,
        ...(fileInfo && { fileInfo }),
      };
      console.log("Chat Mode: ", currentMode);

      if (userId) {
        try {
          console.log("Adding document...", userId);
          const batch = writeBatch(db);
          const historyRef = doc(db, "users", userId, "history", id);
          const indexRef = doc(db, "index", id);
          batch.set(historyRef, {
            chats: [chatObject],
            messages: [],
            createdAt: new Date(),
          });
          batch.set(indexRef, { userId });
          await batch.commit();
          console.log("File added successfully.");
        } catch (error) {
          console.error("Error adding document: ", error);
          toast.error("Something went wrong", {
            position: "top-center",
            style: {
              padding: "6px 18px",
              color: "#fff",
              background: "#FF4B4B",
            },
          });
        }
      }

      dispatch(createChatThread({ id, chat: chatObject }));
      router.push(`/chat/${id}`);
    } else return;
  };

  const handleEnter = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey && text.trim() !== "") {
      event.preventDefault();
      handleSend();
    } else if (event.key === "Enter" && event.shiftKey) {
    }
  };

  const handleInput = (e: any) => {
    const target = e.target;
    setText(target.value);
    target.style.height = "auto";
    const maxHeight = 512;
    target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
  };

  const handleFile = async () => {
    if (!authState) {
      setModal("auth");
      onOpen();
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/jpg";
    fileInput.addEventListener("change", async () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (
          !file ||
          !(
            file.type === "image/png" ||
            file.type === "image/jpeg" ||
            file.type === "image/jpg"
          )
        ) {
          toast.error("Please select an image file (PNG, JPG, JPEG).", {
            position: "top-center",
            style: {
              padding: "6px 18px",
              color: "#fff",
              background: "#FF4B4B",
            },
          });
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size should not exceed 5MB.", {
            position: "top-center",
            style: {
              padding: "6px 18px",
              color: "#fff",
              background: "#FF4B4B",
            },
          });
          return;
        }
        setLoading(true);
        setButtonText("Processing");
        try {
          if (userId) {
            const libraryId = nanoid(10);
            const storageRef = ref(
              storage,
              `users/${userId}/library/${libraryId}`
            );
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            const newFileInfo: FileInfo = {
              url: url,
              name: file.name,
              size: file.size,
              date: new Date().toLocaleDateString("en-GB"),
            };

            const libraryRef = collection(db, "users", userId, "library");
            await setDoc(doc(libraryRef, libraryId), newFileInfo);

            setFileInfo(newFileInfo);
            setButtonText(file.name);
          } else {
            throw new Error("User not authenticated");
          }
        } catch (error) {
          console.error("Error during the process: ", error);
          toast.error("Something went wrong, try again", {
            position: "top-center",
            style: {
              padding: "6px 18px",
              color: "#fff",
              background: "#FF4B4B",
            },
          });
          setButtonText("Attach");
        } finally {
          setLoading(false);
        }
      } else {
        setButtonText("Attach");
      }
    });

    fileInput.click();
  };

  const handleModal = () => {
    if (authState) {
      handleFile();
    } else {
      setModal("auth");
      onOpen();
    }
  };

  return (
    <div className={styles.container}>
      <TypeAnimation
        sequence={[
          "Welcome to Sunday!",
          2000,
          "What's on your mind?",
          2000,
          "Feel free to ask anything!",
          2000,
        ]}
        speed={50}
        repeat={Infinity}
        className="text-[36px] text-center justify-center items-center text-white font-medium tracking-tighter pb-2"
      />
      <div className={styles.promptContainer}>
        <textarea
          placeholder="What's up, Sunday?"
          className={styles.promptText}
          value={text}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
        <div className={styles.mainRow}>
          <div className={styles.sectionRow}>
            <div className={styles.button} onClick={handleModal}>
              {loading ? (
                <div className={styles.spinner} style={{ marginTop: -3 }}>
                  <SpinnerWhite />
                </div>
              ) : fileInfo?.url ? (
                <Image src={FileActive} alt="FileActive" width={24} height={24} />
              ) : (
                <Image src={Clip} alt="Clip" width={24} height={24} />
              )}
              <p
                className={styles.buttonText}
                style={{ color: fileInfo?.url ? "#35A7FF" : "#ffffff" }}
              >
                {cutString(buttonText, 15)}
              </p>
              {fileInfo?.url && (
                <Image
                  src={CrossRed}
                  alt="CrossRed"
                  className={styles.cross}
                  onClick={(event) => {
                    event.stopPropagation();
                    setButtonText("Attach");
                    setFileInfo(null);
                  }}
                />
              )}
            </div>
          </div>
          <div className={styles.sendButton}>
            <Image
              src={Arrow}
              alt="Arrow"
              width={24}
              height={24}
              onClick={handleSend}
            />
          </div>
        </div>
      </div>
      
      {/* New Focus Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 max-w-[700px] mx-auto">
        {focusOptions.map((option, index) => (
          <div
            key={index}
            className={`bg-[#232323] rounded-lg py-2 px-3 cursor-pointer transition-all duration-200 ${
              focus.website === option.website
                ? 'border-2 border-[#ffffff] bg-[#2a2a2a]'
                : 'border-2 border-transparent hover:bg-[#2a2a2a]'
            }`}
            onClick={() =>
              option.website === "Web"
                ? handleFocusChange("Web", "", Web)
                : handleFocusChange(option.website, option.query, option.icon)
            }
          >
            <div className="flex items-center gap-2">
              <Image 
                src={option.icon} 
                alt={option.website} 
                width={24} 
                height={24}
                className={focus.website === option.website ? "opacity-100" : "opacity-70"}
              />
              <p className={`${
                focus.website === option.website 
                  ? "text-[#ffffff] font-medium" 
                  : "text-white"
              }`}>
                {option.website}
              </p>
            </div>
            <p className="text-gray-400 text-sm mt-1">{option.description}</p>
          </div>
        ))}
      </div>

      {modal === "auth" && <Auth isOpen={isOpen} onClose={onClose} />}
      <div className="text-gray-500 text-xs mt-4">
        <p>Sunday can be wrong sometimes, please verify the information.</p>
      </div>
    </div>
  );
};

export default MainPrompt;
