// @ts-nocheck
"use client";
import {
  getUserInfo,
  getCurrentSessions,
  getWritingInfo,
  putWriting,
  startWriting,
  submitWriting,
  temporarySaveWriting,
} from "@/api/api";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import nookies from "nookies";
import { Redirection, getCookie } from ".";
import "./globals.css";
import { day } from "@/lib/dayjs";
import Image from "next/image";
import {
  ModalProps,
  WritingData,
  UserInfo,
  PostingInfo,
} from "../../interface";
import { formatDate } from "../../public/utils/utils";
import { useAtom } from "jotai";
import { loginAtom, userInfoAtom, writingDataAtom } from "./atoms";

// 새로 등록하는 모달
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  writingData,
  remainingTime,
  textColor,
  mini,
  id,
  remainingSecond,
  remainingTime2,
  postedWriting,
  setPostedWriting,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const accessToken = getCookie("access_token");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const disabled = !title || !content;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isOpen) {
      intervalId = setInterval(async () => {
        try {
          await temporarySaveWriting(writingData?.data?.id, accessToken, {
            title,
            content,
          });
          console.log("임시 저장 성공");
        } catch (error) {
          console.error("임시 저장 실패:", error);
        }
      }, 30000); // 30초마다 호출
    }

    // 컴포넌트 언마운트 or 모달이 닫힐 경우 clear interval하도록 설정
    return () => clearInterval(intervalId);
  }, [isOpen, title, content]);

  const handleCancelPost = () => {
    setIsConfirmationModalOpen(false);
  };

  const handleTitleChange = (e) => {
    const inputText = e.target.value;

    // 최대 길이를 40으로 설정
    if (inputText.length <= 40) {
      // 40자 이내일 때만 setTitle 호출하여 상태 업데이트, 초과하면 무시
      setTitle(inputText);
    }
  };

  const handlePost = async () => {
    // 모달 열기 전에 확인 모달을 띄우도록 수정
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmPost = async () => {
    const writingData = {
      title: title || null, // 만약 title이 빈 문자열이면 null로 설정
      content: content || null, // 만약 content가 빈 문자열이면 null로 설정
    };
    try {
      const response = await submitWriting(writingData, id, accessToken);
      console.log(response, "정상 제출?");
      console.log(postedWriting.data, "posted?");
      setPostedWriting(response.data);

      const currentURL = window.location.href;
      const newURL = `${currentURL}?access_token=${accessToken}`;
      window.history.replaceState({}, document.title, newURL);

      mini(true);
    } catch (error) {
      console.error("Error saving writing:", error);
    }

    onClose();
    setIsConfirmationModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div
        className="absolute w-full h-full bg-gray-800 opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative flex flex-col bg-white w-[800px] h-[550px] rounded-lg z-50">
        <div className="p-8">
          <div className="text-[16px]">
            {writingData?.data?.writings?.length + 1}번째 글
          </div>
          <div
            className="mb-[10px] font-bold text-[22px]"
            style={{ color: "#646464" }}
          >
            {writingData?.data?.subject}
          </div>
          <textarea
            className="text-[40px] w-full mb-[10px] h-[50px]"
            placeholder="제목을 입력해주세요."
            value={title}
            onChange={handleTitleChange}
            maxLength={40}
          />

          <hr
            className="w-full bg-[#7C766C] h-[1px] my-[17px]"
            style={{ color: "#7C766C", borderColor: "#7C766C" }}
          />
          <textarea
            className="mt-[20px] w-full h-[220px] overflow-y-auto"
            placeholder="내용을 입력해주세요."
            value={content}
            onChange={(e) => {
              const inputValue = e.target.value;
              // 최대 입력 글자수 - 4000자로 제한
              if (inputValue.length <= 4000) {
                setContent(inputValue);
              }
            }}
          />
          <div className="text-[14px] text-gray-500 items-end justify-end flex">{`${content.length}/4000`}</div>
        </div>
        <div className="flex flex-col w-full rounded-md">
          <div
            className="h-[100px] flex justify-between  p-8 items-center rounded-md w-full"
            style={{ backgroundColor: "#F1F1F1" }}
          >
            <a
              className={`items-start justify-start flex ${
                textColor ? "text-orange-500" : "text-black"
              }`}
            >
              남은 시간 {remainingTime2}
            </a>
            <button
              className={`w-[152px] h-[53px] cursor-pointer rounded-md ${
                disabled
                  ? "bg-zinc-400 text-gray-100"
                  : "bg-orange-500 text-black"
              }`}
              disabled={disabled}
              onClick={handlePost}
            >
              저장
            </button>
          </div>
        </div>
      </div>
      {isConfirmationModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
          <div
            className="absolute w-full h-full bg-gray-800 opacity-50"
            onClick={onClose}
          ></div>
          <div className="flex flex-col bg-white w-[300px] h-[155px] text-center justify-center items-center rounded-lg z-50">
            <div className="p-8 ">
              <div className="text-[16px] mb-[30px]">
                해당 내용으로 발행하시겠습니까?
              </div>
              <div className="flex justify-center gap-x-[10px]">
                <button
                  className="w-[120px] text-[14px] cursor-pointer h-[40px] rounded-md"
                  style={{ backgroundColor: "#D9D9D9" }}
                  onClick={handleCancelPost}
                >
                  취소
                </button>
                <button
                  className="w-[120px] text-[14px] cursor-pointer h-[40px] rounded-md"
                  style={{ backgroundColor: "#FF8126" }}
                  onClick={handleConfirmPost}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 수정용 모달로 사용
const EditModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  data,
  id,
  writingData,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const accessToken = router.query.access_token as string;
  const [isConfirmationModal2Open, setIsConfirmationModal2Open] =
    useState(false);
  const disabled = !title || !content;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isOpen) {
      intervalId = setInterval(async () => {
        try {
          await temporarySaveWriting(id, accessToken, { title, content });
          console.log("임시 저장 성공");
        } catch (error) {
          console.error("임시 저장 실패:", error);
        }
      }, 30000); // 30초마다 호출
    }

    // 컴포넌트 언마운트 or 모달 닫힐 경우 clear interval하도록 설정
    return () => clearInterval(intervalId);
  }, [isOpen, title, content]);

  const handleTitleChange = (e) => {
    const inputText = e.target.value;

    // 최대 길이를 40으로 설정
    if (inputText.length <= 40) {
      // 40자 이내일 때만 setTitle 호출하여 상태 업데이트
      setTitle(inputText);
    }
    // 만약 40자를 초과하면 무시
  };

  const handleCancelPost = () => {
    setIsConfirmationModal2Open(false);
  };

  const handleEditPost = async () => {
    console.log("EDIT");
    // 모달 열기 전에 확인 모달을 띄우도록 수정
    setIsConfirmationModal2Open(true);
  };

  const handleConfirmPost = async () => {
    // 작성한 글을 서버에 저장
    const editData = {
      title: title || writingData?.title || null,
      content: content || writingData?.content || null,
    };

    try {
      // 기존 글 수정
      const editedContent = await putWriting(id, editData, accessToken);

      // 페이지 새로 고침 없이 현재 URL에 토큰을 포함하여 다시 로드
      const currentURL = window.location.href;
      const newURL = `${currentURL}?access_token=${accessToken}`;
      window.history.replaceState({}, document.title, newURL);
    } catch (error) {
      console.error("Error saving writing:", error);
      alert(error);
    }

    onClose();
    setIsConfirmationModal2Open(false);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div
        className="absolute w-full h-full bg-gray-800 opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative flex flex-col bg-white w-[800px] h-[550px] rounded-lg z-50">
        <div className="p-8">
          <div className="text-[16px]">
            {writingData?.data?.step + "번째 글"}
          </div>
          <div
            className="mb-[10px] font-bold text-[22px]"
            style={{ color: "#646464" }}
          >
            {data?.setting?.subject}
          </div>
          <textarea
            className="text-[40px] w-full mb-[10px] h-[50px]"
            placeholder="제목을 입력해주세요."
            value={title || writingData?.data?.title}
            onChange={handleTitleChange}
          />

          <hr
            className="w-full bg-[#7C766C] h-[1px] my-[17px]"
            style={{ color: "#7C766C", borderColor: "#7C766C" }}
          />
          <textarea
            className="mt-[20px] w-full h-[220px] overflow-y-auto"
            placeholder="내용을 입력해주세요."
            value={content || writingData?.data?.content}
            onChange={(e) => {
              const inputValue = e.target.value;
              // 최대 입력 글자수 - 4000자로 제한
              if (inputValue.length <= 4000) {
                setContent(inputValue);
              }
            }}
          />
          <div className="text-[14px] text-gray-500 items-end justify-end flex">{`${content.length}/4000`}</div>
        </div>
        <div className="flex flex-col w-full rounded-md">
          <div
            className="h-[100px] flex p-8  justify-end items-center rounded-md w-full"
            style={{ backgroundColor: "#F1F1F1" }}
          >
            <button
              className="w-[152px] h-[53px] cursor-pointer rounded-md bg-orange-500 text-black"
              // disabled={disabled}
              onClick={handleEditPost}
            >
              수정
            </button>
          </div>
        </div>
      </div>
      {isConfirmationModal2Open && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
          <div
            className="absolute w-full h-full bg-gray-800 opacity-50"
            onClick={onClose}
          ></div>
          <div className="flex flex-col bg-white w-[300px] h-[155px] text-center justify-center items-center rounded-lg z-50">
            <div className="p-8 ">
              <div className="text-[16px] mb-[30px]">
                해당 내용으로 수정하시겠습니까?
              </div>
              <div className="flex justify-center gap-x-[10px]">
                <button
                  className="w-[120px] text-[14px] cursor-pointer h-[40px] rounded-md"
                  style={{ backgroundColor: "#D9D9D9" }}
                  onClick={handleCancelPost}
                >
                  취소
                </button>
                <button
                  className="w-[120px] text-[14px] cursor-pointer h-[40px] rounded-md"
                  style={{ backgroundColor: "#FF8126" }}
                  onClick={handleConfirmPost}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Writer() {
  const router = useRouter();
  const [loginState, setLoginState] = useAtom(loginAtom);
  const [isWriterModalOpen, setIsWriterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);
  const [writingData, setWritingData] = useAtom(writingDataAtom);
  // const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [selectedWritingId, setSelectedWritingId] = useState("");
  // const [writingData, setWritingData] = useState<any>({});
  const [remainingTime, setRemainingTime] = useState<string>();
  const [remainingTime2, setRemainingTime2] = useState<string>();
  const [buttonActivated, setButtonActivated] = useState<boolean>(false);
  const [textColor, setTextColor] = useState<boolean>(false);
  const [remainingSecond, setRemainingSecond] = useState<number>();
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [isSubmissionSuccessful, setIsSubmissionSuccessful] = useState(false);
  const [writingId, setWritingId] = useState<number | null>(null);
  const [currentWritingsData, setCurrentWritingsData] = useState<WritingData>(
    {}
  );
  const [isEndTime, setIsEndTime] = useState(false);
  const isFirst = router.query.isFirst === "true";
  const [showBadge, setShowBadge] = useState(false);
  const [postedWriting, setPostedWriting] = useState<PostingInfo>({});
  const badgeCount = postedWriting?.newBadges?.length || 0;

  useEffect(() => {
    if (badgeCount > 0) {
      setShowBadge(true);
    } else {
      setShowBadge(false);
    }
  }, [postedWriting?.newBadges?.length]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserInfo(accessToken);
        setUserInfo(userData);
        console.log("유저 데이터: ", userData);

        const currentWritings = await getCurrentSessions(accessToken);
        console.log("현재 글쓰기 데이터 정보: ", currentWritings);
        setCurrentWritingsData(currentWritings);

        setLoginState({
          username: "",
          isLoggedIn: true,
          accessToken: accessToken,
        });

        if (isFirst == true) {
          setIsFirstModalOpen(true);
        }
        const finishedString = currentWritings?.data?.nearestFinishDate;
        const finishTime = new Date(finishedString);
        const newStartString = currentWritings?.data?.nearestStartDate;
        const newStartTime = new Date(newStartString);

        // 타이머
        const newIntervalId = setInterval(() => {
          const currentTime = new Date();
          const timeDiff = newStartTime?.getTime() - currentTime?.getTime();
          const seconds = Math.floor(timeDiff / 1000);
          const updatedHours = Math.floor(seconds / 3600);
          const updatedMinutes = Math.floor((seconds % 3600) / 60);
          const updatedRemainingSeconds = seconds % 60;

          const timeDiff2 = finishTime?.getTime() - currentTime?.getTime();
          const seconds2 = Math.floor(timeDiff2 / 1000);
          const updatedHours2 = Math.floor(seconds2 / 3600);
          const updatedMinutes2 = Math.floor((seconds2 % 3600) / 60);
          const updatedRemainingSeconds2 = seconds2 % 60;

          if (!buttonActivated) {
            const updatedTime = `${
              updatedHours < 10
                ? updatedHours < 0
                  ? updatedHours + 23
                  : "0" + updatedHours
                : updatedHours
            }:${
              updatedMinutes < 10
                ? updatedMinutes < 0
                  ? updatedMinutes + 59
                  : "0" + updatedMinutes
                : updatedMinutes
            }:${
              updatedRemainingSeconds < 0
                ? updatedRemainingSeconds + 59
                : updatedRemainingSeconds < 10
                ? "0" + updatedRemainingSeconds
                : updatedRemainingSeconds
            }`;

            setRemainingTime(updatedTime);
          } else {
            const updatedTime2 = `${
              updatedHours2 < 10
                ? updatedHours2 < 0
                  ? updatedHours2 + 23
                  : "0" + updatedHours2
                : updatedHours2
            }:${
              updatedMinutes2 < 10
                ? updatedMinutes2 < 0
                  ? updatedMinutes2 + 59
                  : "0" + updatedMinutes2
                : updatedMinutes2
            }:${
              updatedRemainingSeconds2 < 0
                ? updatedRemainingSeconds2 + 59
                : updatedRemainingSeconds2 < 10
                ? "0" + updatedRemainingSeconds2
                : updatedRemainingSeconds2
            }`;

            setRemainingTime2(updatedTime2);
          }

          if (seconds <= 0 && !buttonActivated) {
            setButtonActivated(true);
            clearInterval(newIntervalId);
          }
        }, 1000);

        setIntervalId(newIntervalId);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    };
  }, [buttonActivated]);

  useEffect(() => {
    // currentWritings?.data?.isActivated 값이 true이면 버튼 활성화, false이면 비활성화
    if (currentWritingsData?.data?.isActivated === true) {
      setButtonActivated(true);
    } else {
      setButtonActivated(false);
    }
  }, [currentWritingsData?.data?.isActivated]);

  const isActivated = currentWritingsData?.data?.isActivated;
  const nearestStartDate = currentWritingsData?.data?.nearestStartDate;
  const nearestFinishDate = currentWritingsData?.data?.nearestFinishDate;

  const now = day();
  const seconds = day(isActivated ? nearestFinishDate : nearestStartDate).diff(
    now,
    "second"
  );

  const [timer, setTimer] = useState<number>(seconds);
  useEffect(() => {
    if (timer === 0) {
      return setIsEndTime(true);
    }

    const updateTimer = () => {
      setTimer((prevTimer) => Math.max(prevTimer - 1, 0));
    };
    const intervalId = setInterval(updateTimer, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [timer]);

  const handleOpenWriterModal = async () => {
    try {
      const response = await startWriting(
        currentWritingsData?.data?.id,
        accessToken
      );
      console.log(response, "시작 ???");
      setWritingId(response?.data?.writing?.id);
    } catch (error) {
      console.error("Error start writing:", error);
    }
    setIsWriterModalOpen(true);
  };

  //여기부터
  useEffect(() => {
    if (isSubmissionSuccessful) {
      setIsMiniModalOpen(true);
      setIsSubmissionSuccessful(false);
    }
  }, [isSubmissionSuccessful]);

  const handleCloseWriterModal = async () => {
    try {
      router.push({
        pathname: "/glooing",
        query: { access_token: accessToken },
      });
    } catch (error) {
      console.error("Error redirecting after closing writer modal:", error);
    }
    setIsWriterModalOpen(false);
    if (isMiniModalOpen == true) setIsSubmissionSuccessful(true);
  };
  //여기까지 수정한 거 동작 확인 필요 !

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    window.location.reload();
  };

  const handleCloseMiniModal = () => {
    setIsMiniModalOpen(false);
    setButtonActivated(false);
    window.location.reload();
  };

  const handleCloseFirstModal = () => {
    setIsFirstModalOpen(false);
  };

  // 수정할 글 클릭했을 때
  const handleEditClick = async (writingId: string) => {
    try {
      const writingData = await getWritingInfo(writingId, accessToken);
      setWritingData(writingData);
      setSelectedWritingId(writingId);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching writing data:", error);
    }
  };

  const handleLogIn = () => {
    if (loginState.isLoggedIn === true) {
      setLoginState({
        username: "",
        isLoggedIn: false,
        accessToken: null,
      });
      nookies.destroy(null, "access_token");
      router.push("/");
    }
  };

  function getCookie(name: string) {
    return nookies.get(null)[name];
  }

  const completion_percentage = currentWritingsData?.data?.progressPercentage;
  const accessToken = getCookie("access_token");

  useEffect(() => {
    const accessToken = getCookie("access_token");

    // 페이지에 변동사항이 있을 때 리다이렉트
    if (accessToken) {
      router.push({
        pathname: router.pathname,
        query: { access_token: accessToken },
      });
    }
  }, [userInfo]);

  const startDateString = currentWritingsData?.data?.startDate;
  const finishDateString = currentWritingsData?.data?.finishDate;

  const formattedStartDate = formatDate(startDateString);
  const formattedFinishDate = formatDate(finishDateString);

  const startDate = new Date(startDateString);
  const finishDate = new Date(finishDateString);
  const timeDiff = finishDate - startDate;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  const result = `D-${daysDiff}`;

  const formattedDateRange = `${formattedStartDate} - ${formattedFinishDate}`;

  return (
    <div className="flex flex-col my-[50px] w-full overflow-hidden">
      <style>{`body { background: #F2EBDD; margin: 0; height: 100%; }`}</style>
      <div className="flex flex-row mx-auto w-full">
        <div className="flex flex-col w-full mx-[120px]">
          <div className="flex flex-row justify-between sm:max-w-[682px] lg:max-w-none lg:w-full">
            <Image
              className="cursor-pointer lg:mb-[20px] mb-0 w-[74px] lg:w-[105px] h-[24px] lg:h-[35px]"
              src="https://gloo-image-bucket.s3.amazonaws.com/archive/logo.svg"
              width="105"
              height="35"
              alt="Logo"
            />
            <Image
              className="lg:hidden block h-[18px] w-[18px]"
              src="https://gloo-image-bucket.s3.amazonaws.com/archive/Group 57.png"
              width={18}
              height={18}
              alt="menu"
            />
            <div className="hidden lg:block flex-row">
              <a
                className="lg:pr-10 cursor-pointer font-bold"
                onClick={() =>
                  router.push({
                    pathname: "/glooing",
                    query: { access_token: accessToken },
                  })
                }
              >
                글루ING
              </a>
              <a
                className="lg:pr-10 cursor-pointer"
                onClick={() =>
                  router.push({
                    pathname: "/mypage/badgeList",
                    query: { access_token: accessToken },
                  })
                }
              >
                나의 보관함
              </a>
              <a className="cursor-pointer" onClick={handleLogIn}>
                {loginState.isLoggedIn === false ? "로그인" : "로그아웃"}
              </a>
            </div>
          </div>
          <hr
            className="lg:block hidden w-full bg-[#7C766C] h-[1px] sm:my-[17px] lg:my-0"
            style={{ color: "#7C766C", borderColor: "#7C766C" }}
          />
          <div className="w-full flex mt-[20px]  lg:flex-row flex-col">
            <div className="w-full bg-black rounded-sm flex flex-row lg:flex-col lg:max-w-[400px] mb-[20px] lg:mb-0 max-w-[682px] lg:h-[600px] h-[272px]">
              <div className="flex flex-col sm:mx-[30px] lg:mx-[20px]">
                <div className="text-white mt-[34px] w-full h-[120px] text-[36px]">
                  <a>{userInfo?.data?.nickname}</a>님의
                  <br />
                  글쓰기 시간
                </div>
                <div className="flex flex-row gap-x-[8px] lg:mt-[8px]">
                  <div
                    className="flex text-[20px] lgtext-[26px]"
                    style={{ color: "#CEB292" }}
                  >
                    <a>
                      {currentWritingsData?.data?.startAt?.hour}:
                      {currentWritingsData?.data?.startAt?.minute === 0
                        ? "00"
                        : currentWritingsData?.data?.startAt?.minute}
                    </a>
                  </div>

                  {/* <button className='flex text-white w-[106px] rounded-lg' style={{ backgroundColor: '#3F3F3F' }}><a className="w-full text-[14px] my-auto" style={{ color: '#8E887B' }}>변경하기 <a>{glooingInfo?.setting?.change_num}</a>/<a>{glooingInfo?.max_change_num}</a></a></button> */}
                </div>
              </div>
              <div className="flex flex-col ml-[200px] lg:mx-[20px] mt-[40px] lg:mt-[76px]">
                <div className="ml-2 lg:ml-0" style={{ color: "#BAB1A0" }}>
                  {buttonActivated === true ? "남은 시간" : "글쓰기 시간까지"}
                </div>
                <div
                  className="flex w-full justify-start lg:text-[72px] text-[48px]"
                  style={{ color: "#F2EBDD" }}
                >
                  {buttonActivated === true ? remainingTime2 : remainingTime}
                </div>
                <div className="flex justify-center items-center mt-[50px] lg:mt-[100px] relative">
                  <button
                    className={`rounded-lg text-[14px] lg:text-[16px] lg:rounded-xl w-[210px] lg:w-[333px] h-[40px] lg:h-[62px] ${
                      buttonActivated === true
                        ? "bg-orange-500 text-black"
                        : "bg-zinc-700  text-white"
                    }`}
                    disabled={!buttonActivated}
                    onClick={handleOpenWriterModal}
                    // onClick={() => {
                    // 데이터 객체를 JSON 문자열로 직렬화
                    // const dataString = encodeURIComponent(
                    //   JSON.stringify(currentWritingData.data)
                    // );

                    // router.push를 사용하여 페이지 이동과 함께 데이터 전달
                    // router.push({
                    //   pathname: "/newPost/posting",
                    //   query: { access_token: accessToken },
                    //   // , data: dataString
                    // });
                    // }}
                  >
                    글 작성하기
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      top: "5%",
                      left: "68%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 0,
                    }}
                  >
                    {buttonActivated === false && (
                      <Image
                        src="https://gloo-image-bucket.s3.amazonaws.com/archive/soon2.png"
                        width={120}
                        height={42}
                        alt="soon2"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="w-[682px] h-[550px] lg:h-[817px] lg:w-full rounded-sm flex flex-row px-2 py-2 lg:px-5 lg:py-5 lg:ml-10"
              style={{ border: "1px solid black", backgroundColor: "#E0D5BF" }}
            >
              <div className="w-full my-3 mx-3 sm:mx-5">
                <div className="bg-black text-white w-12 text-center">
                  <a>{result}</a>
                </div>
                <div className="w-full flex flex-row items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-black mt-2 text-3xl lg:text-4xl">
                      <a>{currentWritingsData?.data?.subject}</a>
                    </div>
                    <div
                      className="text-sm lg:text-base"
                      style={{ color: "#706B61" }}
                    >
                      {formattedDateRange}
                    </div>
                  </div>
                  <div className="flex items-center text-3xl lg:text-4xl justify-end">
                    <a className="text-black">
                      {currentWritingsData?.data?.writings.length}
                    </a>
                    /
                    <a style={{ color: "#706B61" }}>
                      {currentWritingsData?.data?.page}
                    </a>
                  </div>
                </div>
                <hr
                  className="w-full bg-[#7C766C] h-[1px] my-[17px]"
                  style={{ color: "#7C766C", borderColor: "#7C766C" }}
                />
                {currentWritingsData?.data?.writings.length === 0 && (
                  <div
                    className="flex items-center justify-center lg:text-lg"
                    style={{ color: "#706B61" }}
                  >
                    나만의 기록으로 채워보아요!
                  </div>
                )}
                {currentWritingsData?.data?.writings.length !== 0 && (
                  <div
                    className="w-full h-5 flex items-center"
                    style={{
                      backgroundColor: "#F2EBDD",
                      border: "1px solid black",
                      borderColor: "black",
                    }}
                  >
                    <div
                      className="w-full mx-1 h-3"
                      style={{
                        width: `${completion_percentage || 0}%`,
                        backgroundColor: "#FF8126",
                        transition: "width 0.5s ease",
                      }}
                    ></div>
                  </div>
                )}
                {currentWritingsData?.data?.writings !== null && (
                  <div className="flex flex-col lg:max-h-[560px] gap-y-2 lg:gap-y-4 max-h-[340px] my-5 overflow-y-scroll rounded-xl">
                    {currentWritingsData?.data?.writings?.map(
                      (writing, index) => (
                        <div
                          key={index}
                          className="flex cursor-pointer px-5 py-5 flex-row w-full h-52 rounded-xl"
                          style={{ backgroundColor: "#F4EDE0" }}
                          onClick={() => handleEditClick(writing.id)}
                        >
                          <div className="my-3 mx-3">
                            <div className="w-full h-10 text-xl">
                              {writing?.title}
                            </div>
                            <div
                              className="mt-3 max-w-full truncate text-base"
                              style={{ color: "#C5BCAB" }}
                            >
                              {writing?.content}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isFirstModalOpen && (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
              <div
                className="absolute w-full h-full bg-gray-800 opacity-50"
                onClick={handleCloseFirstModal}
              ></div>
              <div className="flex flex-col bg-white w-[328px] h-[171px] text-center justify-center items-center rounded-lg z-50">
                <div className="text-center items-center flex flex-col">
                  <div className="text-[15px] mb-[6px]">
                    앞으로 매일
                    {currentWritingsData?.data?.startAt?.hour}:
                    {currentWritingsData?.data?.startAt?.minute}시에 만나요!
                  </div>
                  <div
                    className="text-[13px] mb-[10px]"
                    style={{ color: "#7F7F7F" }}
                  >
                    휴대폰 알림에 글쓰기 시간을 등록하면
                    <br />
                    글쓰기를 잊지 않을 수 있어요!
                  </div>
                  <div className="flex justify-center">
                    <button
                      className="w-[120px] text-[15px] font-bold cursor-pointer h-[40px] rounded-md"
                      style={{ backgroundColor: "#FF8126" }}
                      onClick={handleCloseFirstModal}
                    >
                      확인
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isMiniModalOpen && (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
              <div
                className="absolute w-full h-full bg-gray-800 opacity-50"
                onClick={handleCloseMiniModal}
              ></div>
              <div className="flex flex-col bg-white w-[264px] max-w-[328px] min-h-[171px] max-h-[400px] text-center justify-center items-center rounded-lg z-50">
                <div className="text-center items-center flex flex-col">
                  <div className="text-[15px] font-bold mb-[2px]">
                    {currentWritingsData?.data?.writings.length + 1}번째
                  </div>
                  <div className="text-[15px] mb-[6px]">
                    글 등록을 완료했어요!
                  </div>
                  <div
                    className="text-[13px] mb-[10px]"
                    style={{ color: "#7F7F7F" }}
                  >
                    다음{" "}
                    <a>
                      {currentWritingsData?.data?.startAt?.hour}:
                      {currentWritingsData?.data?.startAt?.minute === 0
                        ? "00"
                        : currentWritingsData?.data?.startAt?.minute}
                    </a>
                    에 꼭 다시 만나요!
                  </div>
                  {showBadge && (
                    <div className="w-[140px] h-[148px] mb-[18px]">
                      <Image
                        src={
                          postedWriting?.newBadges[badgeCount - 1]?.badge
                            ?.imageUrl
                        }
                        width={152}
                        height={153}
                        alt={
                          postedWriting?.newBadges[badgeCount - 1]?.badge?.name
                        }
                      />
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button
                      className="w-[120px] text-[15px] font-bold cursor-pointer h-[40px] rounded-md"
                      style={{ backgroundColor: "#FF8126" }}
                      onClick={handleCloseMiniModal}
                    >
                      확인
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isWriterModalOpen}
        onClose={handleCloseWriterModal}
        id={writingId}
        writingData={currentWritingsData}
        mini={setIsMiniModalOpen}
        remainingTime={remainingTime}
        textColor={textColor}
        remainingSecond={remainingSecond}
        remainingTime2={remainingTime2}
        postedWriting={postedWriting}
        setPostedWriting={setPostedWriting}
      />
      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        id={selectedWritingId}
        writingData={writingData}
      />
    </div>
  );
}
